# Quiz Results Verification Report

Date: 2026-04-04

## Overall Assessment

The matching engine produces generally sensible results across all 7 quiz profiles. Scores are well-distributed (57-81 range), filter relaxation works correctly for restrictive profiles, and the diversity pass ensures geographic spread in the wide-open case. The engine correctly prioritizes style match (40 pts) as the dominant signal, which is the right call for a vibe-driven recommendation system.

There are two areas of concern. First, the style-dimension mapping from the database (`style_classic` -> `styleRelaxed`, `style_sustainable` -> `styleEducational`, `style_luxury` -> `styleCelebratory`) introduces semantic drift that occasionally favors wineries that are "classic" or "luxury" rather than truly "relaxed" or "celebratory" in the way a user would expect. Second, the `casualCouple` profile requiring filter relaxation on both region and mustHaves is a warning sign that the Russian River Valley + views + outdoor seating combination is harder to satisfy than expected, suggesting either data gaps or that the "views" flag (`has_sunset_views`) is too narrowly defined.

## Profile: casualCouple

**Quiz input summary**: Pinot Noir, Relaxed & Scenic vibe, $$ budget, views + outdoor seating required, Russian River Valley, group of 2.

**Results**:
1. landmark-hop-kiln (75) — relaxed: region, mustHaves
2. sebastiani (72) — relaxed: region, mustHaves
3. iron-horse-vineyards (70) — relaxed: region, mustHaves

**Assessment**: All three results required relaxing both the region filter and the mustHaves filter. This means zero wineries in Russian River Valley satisfied the Pinot Noir + views + outdoor seating + budget <= $65 combination with all hard filters active. Landmark Hop Kiln is actually in Russian River Valley (so region relaxation was needed only because earlier relaxation rounds removed it along with other filters), but its `has_sunset_views` is TRUE per the experiences CSV, meaning the mustHaves relaxation is the binding constraint — likely `has_outdoor_seating` is FALSE in the DB. Sebastiani is in Sonoma Valley, not Russian River Valley, so it is genuinely out-of-region. Iron Horse is in Green Valley (secondary: Russian River Valley), but the matcher uses only `ava_primary`, so it fails the region filter.

Landmark Hop Kiln as #1 is reasonable — it is a historic, relaxed Pinot Noir producer in Russian River Valley with picnic grounds and views. Sebastiani at #2 is odd for a couple seeking a relaxed, scenic afternoon — it is a large, historic downtown Sonoma tasting room, not exactly the scenic vineyard experience implied. Iron Horse at #3 is a strong fit: outdoor tastings, vineyard views, sparkling + Pinot, though it is more sparkling-focused. Better candidates that might be missing: Gary Farrell (hilltop Russian River views, elegant Pinot, $60 entry) or Arista (Japanese garden, RRV Pinot) would seem like natural fits for a relaxed scenic couple, but they may not have outdoor seating flagged.

**Grade**: C+

**Issues**:
- Filter relaxation on both region and mustHaves is too aggressive for what seems like a mainstream profile. A couple wanting Pinot + views + outdoors in Russian River Valley is not unusual.
- The `has_outdoor_seating` field appears to be FALSE for many wineries that clearly have outdoor areas (per descriptions mentioning patios, terraces, gardens). This data quality issue forces unnecessary relaxation.
- Sebastiani as #2 is a poor fit for a "Relaxed & Scenic" seeking couple — it is a downtown tasting bar, not a scenic vineyard.
- Iron Horse (Green Valley, ava_secondary = russian-river-valley) is blocked by the region filter even though it is geographically within the Russian River appellation. The matcher should consider `ava_secondary`.

## Profile: luxuryGroup

**Quiz input summary**: Cabernet Sauvignon + Sparkling, Celebratory + Social & Lively vibes, $$$$ budget, food pairing required, all regions, group of 6, members-only included.

**Results**:
1. iron-horse-vineyards (81)
2. seghesio-family-vineyards (81)
3. rodney-strong (81)
4. kendall-jackson (80)

**Assessment**: The three-way tie at 81 is resolved by tiebreakers (quality score, Google rating). Iron Horse is the White House sparkling wine — a strong celebratory pick. However, it has a max group size of 12, which works for 6, but it is primarily known as rustic/outdoor rather than luxury. Its `style_luxury` is 3/5 and `style_social` is 4/5, which is decent but not top-tier luxury.

Seghesio at #2 has Cabernet and Zinfandel (not Sparkling), bocce courts (social), and food pairing available. A reasonable social pick but not strongly celebratory or luxury. Rodney Strong is a large winery with concerts and events — fits social well. Kendall-Jackson has food pairing and gardens — good for groups.

Missing wineries that seem like stronger luxury/celebratory fits: Jordan Winery (iconic luxury, food pairing, Cab) is conspicuously absent — it has a max group size of 6 which satisfies the requirement, but its `style_social` is only 2/5 which would hurt it since Social is weighted. Domaine Carneros (French chateau, sparkling, celebratory) also seems like a natural fit. Gloria Ferrer (sparkling, lively terrace) should rank highly. J Vineyards (Bubble Room, multi-course pairing) is another strong candidate.

The vibe weights for Celebratory + Social & Lively average to: styleRelaxed=0.05, styleAdventurous=0.1, styleEducational=0, styleCelebratory=0.65, styleSocial=0.65 (plus +0.1 for group 6). So the engine heavily weights celebratory and social dimensions, which are mapped to `style_luxury` and `style_social` in the DB. This explains why Iron Horse (social=4) and Seghesio (social=4) score well, but it underweights places like Domaine Carneros (social=3, luxury=5) or J Vineyards.

**Grade**: B

**Issues**:
- Three-way tie at 81 suggests the scoring doesn't differentiate enough among luxury/social wineries.
- Jordan Winery missing from results despite being the quintessential luxury Sonoma experience. Its low social score (2) penalizes it too heavily.
- Domaine Carneros (French chateau, sparkling, celebratory) seems like a natural top pick for this profile but is absent.
- Iron Horse as #1 luxury choice is debatable — it is wonderful but more rustic than luxury.

## Profile: familyTrip

**Quiz input summary**: No varietal preference, no vibe preference, $ budget, kid-friendly + dog-friendly required, Sonoma Valley + Carneros, group of 4.

**Results**:
1. gundlach-bundschu (72)
2. imagery-estate (71)

**Assessment**: Only 2 results returned (numStops = 2, so this hits the target). No filter relaxation needed, which means these two wineries satisfy all hard filters: budget <= $35, Sonoma Valley or Carneros region, kid-friendly, dog-friendly, not members-only.

Gundlach Bundschu is an excellent family pick — California's oldest family winery, casual, dog-friendly, kid-friendly, live music, min flight at $30. Imagery Estate is also good — artistic labels, kid gallery, dog-friendly, $35 tasting, biodynamic. Both are in Sonoma Valley.

The ordering is sensible. With no vibe selected, style weights are uniform (0.2 each), so differentiation comes from budget proximity, experience bonus, and ratings. Gundlach Bundschu edges out Imagery likely due to better budget proximity ($30 is closer to 70% of $35 = $24.50 sweet spot than $35 is) and similar ratings.

Only 2 results for a family trip is a bit thin, but given the combination of $ budget + kid-friendly + dog-friendly + Sonoma Valley/Carneros, the narrow result set is expected and honest. Cline Cellars (free tasting, kid-friendly with museum, dog-friendly, Carneros) seems like it should qualify — checking: it is dog-friendly and kid-friendly per the data, and its free tasting ($0) passes the $35 budget. It is in Carneros. It should be here. Its absence suggests a data issue or that `cline-cellars` (id) versus `cline-family-cellars` might cause confusion — there are two Cline entries in the data.

**Grade**: B+

**Issues**:
- Cline Cellars/Cline Family Cellars appears to satisfy all filters (free tasting, kid-friendly, dog-friendly, Carneros) but is missing from results. There are duplicate Cline entries in the data (`cline-cellars` and `cline-family-cellars`) which may cause confusion.
- Only 2 results is accurate given filters but might feel sparse to a user.

## Profile: veryRestrictive

**Quiz input summary**: Syrah, Educational vibe, $ budget, wheelchair accessible + views + food pairing required, Alexander Valley, group of 8.

**Results**:
1. rodney-strong (79) — relaxed: region
2. wilson-winery (76) — relaxed: region
3. francis-ford-coppola (68) — relaxed: region

**Assessment**: Only the region filter was relaxed, meaning all three wineries pass: Syrah varietal, budget <= $35, wheelchair accessible, views (`has_sunset_views`), food pairing, group size >= 8. This is impressively tight filtering.

Rodney Strong at #1 makes sense — it has Syrah, food pairing, is wheelchair accessible, has views, min flight at $30, and accommodates groups of 12. Its `style_sustainable` (mapped to Educational) is 4/5, which is strong. It is in Russian River Valley, not Alexander Valley, hence the region relaxation.

Wilson Winery at #2 has Syrah, food pairing, views, wheelchair accessible, and is in Dry Creek Valley. Its min flight is $30. Group size max is 12. Its `style_sustainable` is 3/5. Reasonable.

Francis Ford Coppola at #3 is in Alexander Valley. It has Syrah, food pairing, views, wheelchair accessible, min flight at $30, group size 20. However, its `style_sustainable` is only 2/5, which explains the lower score. Coppola is more entertainment-oriented than educational, so the lower rank makes sense.

The Educational vibe maps to weights: styleRelaxed=0.2, styleAdventurous=0.2, styleEducational=1.0, styleCelebratory=0, styleSocial=0 (plus +0.2 for group 8). The `styleEducational` = `style_sustainable` mapping means the engine looks for sustainability-focused wineries as a proxy for educational experiences. This is a reasonable but imperfect proxy — Benziger (biodynamic tram tour, style_sustainable=5) would be the ideal educational winery but lacks Syrah.

**Grade**: B+

**Issues**:
- Only region was relaxed (not mustHaves or budget), which is the right call since the non-region filters all pass.
- The style_sustainable-to-Educational mapping works acceptably here but misses the "winery tour" and "learning about winemaking" aspect that "Educational" implies to most users.
- Rodney Strong as #1 for an educational experience is acceptable but not ideal — it is more of a large production facility than an intimate learning experience.

## Profile: wideOpen

**Quiz input summary**: No varietals, Adventurous vibe, no budget limit, no must-haves, all regions, 5 stops, no group size.

**Results**:
1. fort-ross-vineyard (60)
2. bella-winery (57)
3. kunde-family (55)
4. gary-farrell-winery (54)
5. medlock-ames (54)

**Assessment**: No filter relaxation needed — as expected, with almost no filters active, many wineries pass. The Adventurous vibe maps to: styleRelaxed=0.1, styleAdventurous=1.0, styleEducational=0.2, styleCelebratory=0, styleSocial=0.1. This means `style_adventure` is the dominant scoring factor.

Fort Ross Vineyard at #1 is a perfect adventurous pick — remote coastal location, Pacific Ocean views, hiking through redwoods, the only estate tasting room in Fort Ross-Seaview AVA. Its `style_adventure` is 5/5, the highest possible. Excellent choice.

Bella Winery at #2 is a cave tasting experience with old-vine Zinfandel in Dry Creek Valley. `style_adventure` is 4/5. Cave tastings are indeed adventurous. Good fit.

Kunde Family at #3 has Mountain Top tastings, cave tours, hiking trails — `style_adventure` is 4/5. Another strong adventurous option in Sonoma Valley.

Gary Farrell at #4 is more "elegant, modern" than adventurous — `style_adventure` is 3/5. It has hilltop views but is more of a refined experience. This is the weakest fit.

Medlock Ames at #5 is an organic Bell Mountain estate with historic farm buildings — `style_adventure` is 4/5. Good fit for adventure seekers.

Geographic diversity: Fort Ross-Seaview, Dry Creek Valley, Sonoma Valley, Russian River Valley, Alexander Valley — 5 different regions across 5 picks. Excellent diversity.

The scores are moderate (54-60 range) because only the adventure dimension has high user weight, so the style match score is diluted. This is expected behavior.

**Grade**: A

**Issues**: Gary Farrell at #4 is slightly surprising for an adventurous profile — it is more refined than adventurous. But at 54 points it is a borderline inclusion, and the diversity pass ensures good regional spread. No significant problems.

## Profile: allDefaults

**Quiz input summary**: No preferences at all — no varietals, no vibes, no budget, no must-haves, no regions, 3 stops, no group size.

**Results**:
1. wilson-winery (57)
2. roth-estate (55)
3. sebastiani (55)

**Assessment**: With all weights at uniform 0.2, the scoring is driven almost entirely by experience bonus (amenities), rating blend, and budget proximity (neutral at 0.5 since no budget set). This means quality/popularity scores and whether the winery happens to have views/food/outdoor seating determine rankings.

Wilson Winery at #1 has quality_score=8, popularity_score=5, rating_google=4.8. It has food pairing and views (sunset_views=TRUE). The experience bonus for having views + food = 2/6 = 0.33.

Roth Estate at #2 has quality_score=7, popularity_score=6, rating_google=4.5. It has food pairing and views = 2/6 = 0.33.

Sebastiani at #3 has quality_score=7, popularity_score=7, rating_google=4.5. It has food pairing and views = 2/6 = 0.33.

With uniform style weights and no budget, the differentiation should come from ratings. Wilson Winery's higher quality_score (8 vs 7) and Google rating (4.8 vs 4.5) explain its lead.

However, these are not the wineries I would recommend to someone with zero preferences. For a no-preference visitor, you would typically recommend the most well-rounded, iconic, or highly-rated wineries. Wineries like Jordan (quality 9, popularity 9), Halleck (quality 10), or A. Rafanelli (quality 10) would be more obvious "best of Sonoma" picks. But Jordan is appointment_only (max group 6), Halleck is small (max 16), and A. Rafanelli is appointment_only (max 6). None of these are filtered out since group size is null and no budget cap. The issue is that their style scores may not favor them with uniform weights — and since members-only is excluded by default, Scribe is filtered out.

Actually, the real differentiator with uniform weights is likely the experience bonus. Wineries that happen to have views + food + outdoor seating get more points (3/6 vs 2/6 vs 1/6). Wilson Winery might edge out due to having both views and food pairing.

**Grade**: B-

**Issues**:
- The "default" recommendations feel generic rather than representing the best of Sonoma. Wilson Winery, Roth Estate, and Sebastiani are decent wineries but would not be on most people's "top 3 Sonoma wineries" lists.
- The scoring formula heavily weights style match (40 pts) even when style weights are uniform, which creates a "meh" score across the board. When no vibes are selected, the rating blend (15 pts) and experience bonus (20 pts) become the main differentiators, which is a small signal to work with.
- Higher-rated wineries like Jordan (quality 9), Halleck (quality 10), or Fort Ross (quality 9) should arguably surface for a default profile. The ratings weight of 15 points is too low relative to the 40-point style match to push genuinely exceptional wineries to the top when style is neutral.

## Profile: singleRegionBudget

**Quiz input summary**: Chardonnay, Relaxed & Scenic vibe, $ budget, no must-haves, Carneros, 3 stops, group of 2.

**Results**:
1. sebastiani (75) — relaxed: region
2. dry-creek-vineyard (71) — relaxed: region
3. landmark-hop-kiln (66) — relaxed: region

**Assessment**: Region was relaxed, meaning zero Carneros wineries with Chardonnay and min flight <= $35 could be found. This is somewhat surprising — Carneros is the premier Chardonnay region. Let me check: Gloria Ferrer has Chardonnay and $45 min flight (fails $ budget of $35). Schug Carneros has Chardonnay and a minimum flight... checking the flight data, schug-carneros does not have a flight listed in the CSV. Domaine Carneros has Chardonnay and $65 min. Cline Cellars has no Chardonnay. So the $ budget is the binding constraint in Carneros — sparkling houses and premium estates price above $35.

Sebastiani at #1 has Chardonnay, min flight $25, is in Sonoma Valley, `style_classic`=5 (maps to styleRelaxed). The Relaxed & Scenic vibe with group of 2 gives weights: styleRelaxed=1.1, styleAdventurous=0.1, styleEducational=0.1, styleCelebratory=0.1, styleSocial=0. Sebastiani's high classic score (5) gives it a strong style match. Budget: $25/$35 = 0.71, budgetScore = 1 - |0.71 - 0.7| = 0.99, nearly perfect. This explains the high score.

Dry Creek Vineyard at #2 has Chardonnay, $30 min, in Dry Creek Valley, `style_classic`=5. Budget: $30/$35 = 0.86, budgetScore = 1 - |0.86 - 0.7| = 0.84. Good.

Landmark Hop Kiln at #3 has Chardonnay, $35 min, in Russian River Valley, `style_classic`=5. Budget: $35/$35 = 1.0, budgetScore = 1 - |1.0 - 0.7| = 0.7. Lower budget score since it is at the ceiling.

The ordering makes sense from a scoring perspective. From a human perspective, though, none of these are in Carneros — the user wanted Carneros and got Sonoma Valley, Dry Creek, and Russian River. The region relaxation is the correct behavior when Carneros budget options are too expensive, but the results feel disconnected from the user's intent.

Wineries like Balletto Vineyards ($25, Chardonnay, Russian River, relaxed) or Pedroncelli ($15, Chardonnay, Dry Creek, casual) might also qualify. Balletto appears to not rank because its `style_classic` is 4 (not 5), giving it a slightly lower style match.

**Grade**: B

**Issues**:
- Region relaxation is correct but the user gets zero Carneros results, which is a poor UX outcome. The UI should clearly communicate that their region preference was relaxed.
- The $ budget ceiling of $35 eliminates all Carneros Chardonnay producers since they start at $45+. This is a realistic market constraint, not a scoring bug.
- Sebastiani as #1 for "Relaxed & Scenic" is debatable — it is a downtown tasting bar, not a scenic vineyard. The `style_classic` = 5 score drives it to the top, but "classic" and "relaxed & scenic" are not synonymous.

## Recommendations

- **Review the style_classic to styleRelaxed mapping.** "Classic" (traditional, timeless) is not the same as "Relaxed & Scenic" (calm, beautiful views, pastoral). Downtown historic tasting rooms like Sebastiani score as highly "relaxed" when they should not. Consider splitting or re-weighting the relaxed dimension to incorporate view/setting signals.

- **Add ava_secondary to region matching.** Iron Horse (primary: Green Valley, secondary: Russian River Valley) fails the Russian River region filter despite being geographically within the appellation. Matching on `ava_secondary` as a fallback would prevent unnecessary filter relaxation for wineries that are legitimately in the requested region.

- **Audit the has_outdoor_seating data.** The casualCouple profile requiring mustHaves relaxation suggests that many wineries with described outdoor areas (patios, terraces, gardens, decks) do not have `has_outdoor_seating = TRUE` in the database. Reviewing the experiences CSV: the column `has_outdoor_seating` shows FALSE for most wineries. Cross-reference with descriptions mentioning outdoor spaces.

- **Increase rating weight for no-vibe profiles.** When no vibes are selected, the 40-point style match produces uniform scores across all wineries, making the 15-point rating blend the tiebreaker. Consider boosting rating weight to 25 and reducing style to 30 when style weights are uniform, or add a "quality tier" bonus for top-rated wineries.

- **Investigate duplicate Cline entries.** `cline-cellars` and `cline-family-cellars` appear in the data with the same address and phone number but different IDs. This may cause one to be excluded or both to compete for the same slot.

- **Consider budget-adjusted relaxation for Carneros Chardonnay.** The $ budget + Carneros + Chardonnay combination is a natural request that returns zero results before relaxation. Consider showing the user "closest matches slightly above budget" rather than abandoning the region entirely.

- **Review the style_sustainable to Educational mapping.** "Sustainable" and "Educational" overlap for biodynamic/organic wineries but diverge for wineries that offer educational tours without a sustainability focus. Benziger's tram tour is the most educational experience in Sonoma but is valued primarily for its sustainability score, which happens to be correct (5/5) but for the wrong reason.
