# Matching & scoring specification

This document is **engineering-owned**: persona weights, filter rules, normalization, tie-breakers, and worked examples.

**Product context:** [`PRD.md`](./PRD.md) (Section 8.4 describes the budget/outlier rule in product terms).

**Implementation tracker:** [`TODO.md`](../TODO.md) Phase D3 (spec) + Phase D6 (code).

## Status

- [x] Initial spec drafted
- [ ] Weights and formulas implemented in code
- [ ] Golden tests passing

---

## 1. Budget band → dollar mapping

The quiz collects a `BudgetBand` (`$`, `$$`, `$$$`, `$$$$`). This maps to a **maximum acceptable entry-level flight price** per person. Only flights priced **≤ $200** are considered when computing a winery's `minFlightPrice` (the outlier rule from PRD §8.4).

| Band   | Label             | Price ceiling (`maxBudget`) | Typical range |
| ------ | ----------------- | --------------------------- | ------------- |
| `$`    | Budget-friendly   | $35                         | $15–$35       |
| `$$`   | Mid-range         | $65                         | $30–$65       |
| `$$$`  | Premium           | $100                        | $55–$100      |
| `$$$$` | Luxury / no limit | ∞ (no cap)                  | $80+          |

**Hard filter rule:** If `budgetBand` is set and is not `$$$$`, exclude any winery whose `minFlightPrice > maxBudget`.

**Soft scoring rule:** Closer to the user's budget ceiling scores higher (see §4).

**`null` budget:** If the user skips budget selection, no budget filter or scoring is applied.

---

## 2. Persona inference — quiz answers → weight vector

There is no explicit persona picker. The quiz answers implicitly define weights across scoring dimensions.

### Vibe → style dimension weights

Each selected vibe maps to a weight vector across the 5 style dimensions stored on each winery (1–5 scale). If the user selects multiple vibes, the vectors are averaged.

| Quiz vibe        | `styleRelaxed` | `styleAdventurous` | `styleEducational` | `styleCelebratory` | `styleSocial` |
| ---------------- | -------------- | ------------------ | ------------------ | ------------------ | ------------- |
| Relaxed & Scenic | 1.0            | 0.1                | 0.1                | 0.0                | 0.0           |
| Adventurous      | 0.1            | 1.0                | 0.2                | 0.0                | 0.1           |
| Educational      | 0.2            | 0.2                | 1.0                | 0.0                | 0.0           |
| Celebratory      | 0.1            | 0.1                | 0.0                | 1.0                | 0.3           |
| Social & Lively  | 0.0            | 0.1                | 0.0                | 0.3                | 1.0           |

**No vibes selected:** All style weights default to 0.2 (uniform — no preference).

### Group size → implicit weights

| Group size | Effect                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| null (any) | No adjustment                                                                            |
| 2          | +0.1 bonus to `styleRelaxed`, +0.1 to `styleCelebratory`                                 |
| 4          | No adjustment                                                                            |
| 6+         | +0.1 bonus to `styleSocial`; prioritize higher `groupCapacity`                            |
| 8+         | +0.2 bonus to `styleSocial`; hard-filter wineries where `groupCapacity < 8` (unless null) |

---

## 3. Hard filters

Hard filters **eliminate** wineries from consideration entirely. A winery must pass ALL active filters to be scored.

### 3.1 Varietal filter

- **Trigger:** `selectedVarietals.length > 0`
- **Rule:** Winery must have **at least one** of the selected varietals (OR logic, not AND).
- **Rationale:** AND would be too restrictive — a user who likes both Pinot and Chardonnay is happy at a winery with either.

### 3.2 Budget filter

- **Trigger:** `budgetBand` is set and is not `$$$$`
- **Rule:** `winery.minFlightPrice <= maxBudget` (see §1 table)
- **NULL handling:** If `winery.minFlightPrice` is null (no flight data), the winery **passes** the filter (benefit of the doubt).

### 3.3 Region filter

- **Trigger:** `preferredRegions.length > 0`
- **Rule:** `winery.region` is in `preferredRegions` (OR logic).
- **Empty selection:** No filter applied — all regions included.

### 3.4 Members-only filter

- **Default:** Exclude wineries where `isMembersOnly === true`.
- **Override:** If `includeMembersOnly === true`, include them but apply a **-10 point penalty** in soft scoring (deprioritized, not filtered).

### 3.5 Must-have filters

Each must-have flag in `QuizAnswers.mustHaves` is a hard filter when `true`:

| Must-have              | Winery field             |
| ---------------------- | ------------------------ |
| `views`                | `hasViews`               |
| `foodPairing`          | `hasFoodPairing`         |
| `outdoorSeating`       | `hasOutdoorSeating`      |
| `dogFriendly`          | `isDogFriendly`          |
| `kidFriendly`          | `kidWelcome`          |
| `wheelchairAccessible` | `isWheelchairAccessible` |

**NULL handling:** If the winery field is `null`, the winery **fails** the filter (assume not available).

### 3.6 Reservation type filter

The quiz does **not** have an explicit "walk-ins only" hard filter in the current UI. But the browse page does. Behavior:

| User selection     | Wineries that pass                                                    |
| ------------------ | --------------------------------------------------------------------- |
| "Walk-in friendly" | `reservationType` is `walk_ins_welcome` OR `reservations_recommended` |
| No selection       | All reservation types pass                                            |

**Note:** `reservations_recommended` means walk-ins are possible but not guaranteed — close enough to "walk-in friendly" for filtering purposes.

### 3.7 Group size filter

- **Trigger:** `groupSize >= 8`
- **Rule:** Exclude wineries where `groupCapacity` is not null AND `groupCapacity < groupSize`.
- **NULL handling:** If `groupCapacity` is null, the winery passes (assume no limit).

---

## 4. Soft scoring

After hard filtering, remaining wineries are scored on a **0–100 scale**. The score is a weighted sum of sub-scores, each normalized to 0–1 before weighting.

### Score components and weights

| Component            | Weight | Max contribution | Description                          |
| -------------------- | ------ | ---------------- | ------------------------------------ |
| Style match          | 40     | 40 pts           | Vibe alignment with style dimensions |
| Budget proximity     | 20     | 20 pts           | How close to budget sweet spot       |
| Experience bonus     | 20     | 20 pts           | Nice-to-have features the user wants |
| Rating blend         | 15     | 15 pts           | Editorial + Google quality signals   |
| Members-only penalty | -10    | -10 pts          | Only if included via override        |

**Total possible range:** 0 to 95 (100 minus members-only penalty floor).

### 4.1 Style match (0–1)

```
For each style dimension d ∈ {relaxed, adventurous, educational, celebratory, social}:
  diff_d = |userWeight_d - (winery.style_d / 5)|
  match_d = 1 - diff_d

styleScore = Σ(userWeight_d × match_d) / Σ(userWeight_d)
```

User weights come from the vibe→weight table in §2. Winery style scores are 1–5 integers, normalized to 0–1 by dividing by 5.

**No vibes selected:** `styleScore = 0.5` (neutral, doesn't help or hurt).

### 4.2 Budget proximity (0–1)

```
If budgetBand is null or $$$$:
  budgetScore = 0.5  (neutral)
Else:
  ratio = winery.minFlightPrice / maxBudget
  budgetScore = 1.0 - |ratio - 0.7|  // sweet spot at 70% of budget
  budgetScore = clamp(budgetScore, 0, 1)
```

The sweet spot at 70% of budget means a $45 flight scores highest for a $65 cap ($$), rewarding good value without being suspiciously cheap.

### 4.3 Experience bonus (0–1)

Count how many of the user's selected must-haves the winery offers (beyond the hard-filter ones, which are already guaranteed). Also count non-must-have amenities as smaller bonuses.

```
matchedMustHaves = count of user must-haves where winery has the feature
totalMustHaves = count of user must-haves that are true

If totalMustHaves > 0:
  experienceScore = matchedMustHaves / totalMustHaves
Else:
  bonusFeatures = count of {views, foodPairing, outdoorSeating} where winery has them
  experienceScore = bonusFeatures / 6  // small bonus for having amenities
```

### 4.4 Rating blend (0–1)

```
ratingScore = (
  0.4 × normalize(qualityScore, 1, 5) +
  0.3 × normalize(popularityScore, 1, 5) +
  0.3 × normalize(ratingGoogle, 1, 5)
)
```

Where `normalize(val, min, max) = (val - min) / (max - min)`, clamped to 0–1.

**NULL handling:** If any rating is null, redistribute its weight equally among non-null ratings. If all are null, `ratingScore = 0.5`.

### 4.5 Final score

```
rawScore = (styleScore × 40) + (budgetScore × 20) + (experienceScore × 20) + (ratingScore × 15)
penalty = isMembersOnly && includeMembersOnly ? -10 : 0
finalScore = clamp(round(rawScore + penalty), 0, 100)
```

---

## 5. Tie-breakers & diversity

When two wineries have the same `finalScore`, break ties in this order:

1. **Higher `qualityScore`** (editorial preference)
2. **Higher `ratingGoogle`** (crowd preference)
3. **Alphabetical by name** (deterministic, stable)

### Geographic diversity

After sorting by score, apply a diversity pass on the top N results:

- If 3+ wineries in the top 5 share the same `region`, demote the lowest-scored one to position 6 and pull up the next-best from a different region.
- Only apply once (don't cascade).
- Skip diversity if fewer than 3 regions are represented in the full candidate set.

---

## 6. Explanation templates

Each match result includes 2–5 human-readable reasons. Generate them by checking which scoring dimensions contributed most.

| Condition                                     | Template                                                  |
| --------------------------------------------- | --------------------------------------------------------- |
| styleRelaxed weight > 0.5 && winery score ≥ 4 | "Perfect for a relaxed, scenic afternoon"                 |
| styleEducational weight > 0.5 && score ≥ 4    | "Great if you love learning about the winemaking process" |
| styleCelebratory weight > 0.5 && score ≥ 4    | "A celebratory atmosphere for your special occasion"      |
| styleSocial weight > 0.5 && score ≥ 4         | "Lively social scene — great for groups"                  |
| styleAdventurous weight > 0.5 && score ≥ 4    | "An adventurous experience off the beaten path"           |
| budgetScore > 0.8                             | "Excellent value at {price} per tasting"                  |
| selectedVarietals matched                     | "Known for {varietal}, one of your favorites"             |
| isDogFriendly && mustHaves.dogFriendly        | "Dog-friendly — bring your four-legged friend"            |
| kidWelcome && mustHaves.kidFriendly        | "Family-friendly with activities for kids"                |
| hasViews && mustHaves.views                   | "Stunning views of {region}"                              |
| hasFoodPairing && mustHaves.foodPairing       | "Offers food pairings with tastings"                      |
| hasOutdoorSeating && mustHaves.outdoorSeating | "Beautiful outdoor seating area"                          |
| isWheelchairAccessible                        | "Wheelchair accessible facilities"                        |
| reservationType === 'walk_ins_welcome'        | "Walk-ins welcome — no reservation needed"                |
| ratingGoogle ≥ 4.5                            | "Highly rated by visitors ({rating}★)"                    |
| groupCapacity ≥ groupSize                      | "Accommodates groups of {groupSize}+"                     |

**Selection:** Pick the top 3–5 reasons by relevance (prioritize must-have matches, then style, then budget, then ratings).

---

## 7. Worked examples

_To be completed in Phase D3.6. Each example specifies quiz input → expected filtered set → scores → top 5 ranking + reasons. These become golden test files for Phase D6._

### Example 1: Casual couple, Pinot Noir, budget-friendly

```
Input:
  selectedVarietals: ["Pinot Noir"]
  selectedVibes: ["Relaxed & Scenic"]
  budgetBand: "$$"
  mustHaves: { views: true, outdoorSeating: true }
  preferredRegions: ["Russian River Valley"]
  numStops: 3
  includeMembersOnly: false
  groupSize: 2

Expected behavior:
  - Hard filters: must have Pinot Noir, minFlightPrice ≤ $65, Russian River Valley, not members-only, has views, has outdoor seating
  - Style weights: heavy on styleRelaxed (1.0)
  - Top results: [TBD after import — run against real data]
```

### Example 2: Luxury group celebration

```
Input:
  selectedVarietals: ["Cabernet Sauvignon", "Sparkling"]
  selectedVibes: ["Celebratory", "Social & Lively"]
  budgetBand: "$$$$"
  mustHaves: { foodPairing: true }
  preferredRegions: []  // all regions
  numStops: 4
  includeMembersOnly: true
  groupSize: 6

Expected behavior:
  - Hard filters: must have Cab or Sparkling, no budget cap, has food pairing
  - Style weights: celebratory (1.0) + social (1.0) averaged
  - Members-only wineries included but penalized -10
  - Top results: [TBD after import]
```

### Example 3: Family day trip, no preferences

```
Input:
  selectedVarietals: []
  selectedVibes: []
  budgetBand: "$"
  mustHaves: { kidFriendly: true, dogFriendly: true }
  preferredRegions: ["Sonoma Valley", "Carneros"]
  numStops: 2
  includeMembersOnly: false
  groupSize: 4

Expected behavior:
  - Hard filters: minFlightPrice ≤ $35, Sonoma Valley or Carneros, kid-friendly, dog-friendly
  - Style weights: uniform (0.2 each — no vibe preference)
  - Narrow results expected — family + dog + budget is restrictive
  - Top results: [TBD after import]
```

### Example 4: Very restrictive — may return few/no results

```
Input:
  selectedVarietals: ["Syrah"]
  selectedVibes: ["Educational"]
  budgetBand: "$"
  mustHaves: { wheelchairAccessible: true, views: true, foodPairing: true }
  preferredRegions: ["Alexander Valley"]
  numStops: 3
  includeMembersOnly: false
  groupSize: 8

Expected behavior:
  - Hard filters: Syrah + budget ≤$35 + Alexander Valley + wheelchair + views + food + group 8+
  - Likely 0–1 results (this is intentionally restrictive)
  - UI should show "Try relaxing some filters" message
```

### Example 5: Wide open — everything passes

```
Input:
  selectedVarietals: []
  selectedVibes: ["Adventurous"]
  budgetBand: null
  mustHaves: { all false }
  preferredRegions: []
  numStops: 5
  includeMembersOnly: false
  groupSize: null

Expected behavior:
  - No hard filters except members-only exclusion
  - All ~65 active wineries pass filtering
  - Style weights: heavy on styleAdventurous (1.0)
  - Diversity pass should spread results across regions
  - Top 5 should represent ≥3 different regions
```
