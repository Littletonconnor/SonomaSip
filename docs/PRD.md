# Product Requirements Document: Sonoma Sip

**Product:** Sonoma County Winery Guide — personalized discovery and itinerary planning  
**Version:** 2.1 (product-focused PRD)  
**Status:** Active  
**Last updated:** April 2026 (v2.1)  

This document defines **what** we are building and **why**, for product, design, and content stakeholders. **Implementation** (stack, APIs, database design) lives in engineering artifacts (`TODO.md`, `SCORING.md`), not here.

---

## How this PRD is structured

This PRD follows common product practice: clear problem and users, explicit **in/out of scope**, prioritized capabilities, testable success metrics, and documented decisions—while leaving **how** engineers build it to the technical roadmap.

**Sources:** Curated research dataset (`sonoma-winery-database-complete.xlsx`), original working spec (`sonoma-winery-prd.docx`, archived in this folder), and stakeholder decisions through April 2026.

---

## 1. Executive summary

Sonoma Sip helps people **plan winery visits in Sonoma County** by answering a short questionnaire and receiving a **personalized, ranked list** of wineries that fit their wine preferences, budget, group needs, and desired atmosphere. The product competes on **depth and clarity of information**—not on being the largest directory—so visitors can trust recommendations and understand **why** a winery was suggested.

Version 1 focuses on **68 curated wineries**, an independent editorial stance (no required partnerships with venues), and tools to **browse**, **share**, **print**, and **email** a plan.

**Matching in V1** is **fully deterministic**: explicit rules and scores over curated data so results are **explainable and testable**. **Artificial intelligence** (e.g. large language models) is **not required** for launch; it is a **deliberate future direction** once the baseline product is stable—see **§14 Future directions**.

---

## 2. Problem statement

### 2.1 User pain

People planning wine-country trips face:

- **Overchoice:** Hundreds of wineries; marketing sites emphasize polish over fit.
- **Inconsistent information:** Hours, pricing, and policies change; third-party listings are often stale.
- **Poor fit:** Generic lists do not reflect **budget**, **who is in the group** (kids, dogs, accessibility), **wine style**, or **vibe** (quiet vs lively).

### 2.2 Market gap

Many tools are **directories** (breadth, ads) or **booking-only** (availability without rich context). Few combine **structured, comparable attributes** (experiences, accessibility, tasting formats, price bands) with **preference-aware recommendations** and plain-language explanations.

---

## 3. Product vision & goals

### 3.1 Vision

Become the most **trustworthy, pleasant-to-use** way to shortlist Sonoma County wineries for a real day or weekend—grounded in curated data and transparent matching.

### 3.2 Goals (V1)

| ID | Goal |
|----|------|
| G1 | Users complete a short questionnaire and receive a **ranked itinerary** they can act on (book, navigate, share). |
| G2 | Recommendations feel **personal** and **explainable** (“why this winery fits you”). |
| G3 | Users can **discover wineries** outside the quiz via a browsable catalog. |
| G4 | Users can **share**, **print/PDF**, and **email** their plan without creating an account. |
| G5 | The product clearly communicates **limits of accuracy** (pricing and hours change—verify before visiting). |

### 3.3 Non-goals (V1)

| ID | Non-goal |
|----|----------|
| NG1 | **Official partnerships** or co-marketing with listed wineries (listings are independent). |
| NG2 | **In-app booking** or guaranteed availability (link out to winery booking flows). |
| NG3 | **Coverage beyond** the agreed V1 set (**68 wineries**, **Sonoma County** product scope). |
| NG4 | **Drive-time–optimized routing** as the default output (ordered “best next stop” may come later). |
| NG5 | **User accounts** as a requirement to use the core flow (accounts may be future). |
| NG6 | **AI/LLM as the primary matching engine** in V1—recommendations must be reproducible from published rules and curated data. |

---

## 4. Target users

### 4.1 Primary audience

**Wine tourists and locals** planning one or more winery visits in Sonoma County: couples, friend groups, some families, mixed experience levels (casual tasters to collectors).

### 4.2 Needs they share

- Match **wine interests** (varietals, styles).
- Respect **budget** for tasting experiences.
- Accommodate **must-haves** (e.g. views, food offerings, dog/kid policies, accessibility).
- Understand **reservation expectations** (walk-in vs appointment).
- Get a **short, ordered list** they can take on the road.

### 4.3 “Matching styles” (product framing)

Recommendations reflect several **planning archetypes** (e.g. relaxed family-friendly days, luxury occasions, educational visits, social groups, value-conscious trips, scenery-forward days). Users are **not** asked to pick a label; the product **infers** emphasis from their answers.

---

## 5. Scope

### 5.1 In scope (V1)

- **Curated set:** 68 wineries within the Sonoma County product scope (see content policy for edge cases such as cross-AVA addresses).
- **Questionnaire:** Mobile-friendly, step-by-step; progress can be resumed within a session.
- **Results:** Ranked list + **map** of matching wineries; sync between list and map for usability.
- **Explanations:** Each suggested winery shows **brief reasons** (e.g. top factors) for the match.
- **Winery detail pages:** Rich context—story, hours, experiences, tasting options and indicative pricing, logistics, ratings summary where available.
- **Browse:** Full directory with sort/filter (e.g. by name, region).
- **Share:** Stable link to view a saved version of a plan; show **when the plan was generated**.
- **PDF / print:** A clean, printable itinerary (map imagery may be added after an initial text-first version).
- **Email:** Optional “email me this plan” **without** requiring email to see results first.
- **Legal/copy:** Accuracy disclaimer; privacy policy; clarity that booking happens on winery sites.

### 5.2 Out of scope (V1)

- Paid placement or **winery advertising** as a ranking factor.
- **Guaranteed** data freshness (operational process may include periodic review; see risks).
- **Multi-region** expansion (e.g. Napa) unless product scope is explicitly changed later.

---

## 6. User journeys & flows

### 6.1 Primary journey: questionnaire → itinerary

1. Land on the site; understand value proposition.
2. Start planning; answer questions (preferences, budget, must-haves, region/stop count, and policy toggles such as **members-only / allocation** venues—**off by default**).
3. Submit; view **ranked results** on a map and list.
4. Open a winery; read details; **book** via the winery’s own link.
5. Optionally: **share link**, **print/PDF**, **email** the plan.

**Acceptance criteria (happy path):**

- A first-time user can complete the flow on a phone without an account.
- Results explain **why** at least three factors or fewer in plain language per winery (as specified in design/engineering spec).
- If **no** wineries match, the product explains that clearly and suggests relaxing constraints.

### 6.2 Secondary journey: browse directory

1. Open the full winery list.
2. Sort/filter; open detail pages.

**Acceptance criteria:**

- All V1 wineries are discoverable without using the quiz.

### 6.3 Edge cases to support (UX)

- User **goes back** in the questionnaire without losing prior answers.
- User **refreshes** mid-quiz—answers persist for the session where technically feasible.
- **Members-only / allocation** wineries: excluded by default; when included, clearly **badged** and **deprioritized** vs similar matches.

---

## 7. Functional requirements

Priorities: **P0** = required for V1 launch; **P1** = shortly after or if low effort.

| ID | Priority | Requirement |
|----|----------|-------------|
| FR1 | P0 | **Questionnaire** captures varietal interest, vibe, budget band, must-have features, region/stop preferences, and **members-only include** toggle (default off). |
| FR2 | P0 | **Matching** applies **hard constraints** (e.g. must-haves, budget rules defined in scoring spec) then **ranks** remaining wineries. |
| FR3 | P0 | **Explanations** visible on results (and reflected in share/print/email where applicable). |
| FR4 | P0 | **Map + list**; selecting an item in one surface is reflected in the other. |
| FR5 | P0 | **Winery detail** with hours, tasting options, experiences, accessibility notes, and **single primary “book / check availability”** action opening the winery’s booking URL in a new context. |
| FR6 | P0 | **Disclaimer** in footer; repeated on printed/PDF and emailed content; link to fuller policy/legal text. |
| FR7 | P0 | **Browse** all V1 wineries with sort and basic filters. |
| FR8 | P0 | **Share** a read-only plan via URL; **no artificial expiry** for V1; show generation date on the shared view. |
| FR9 | P0 | **PDF/print** itinerary (text-first acceptable for first release). |
| FR10 | P0 | **Email** the plan only when the user requests it; do not block results on email collection; no marketing list without explicit future consent. |
| FR11 | P1 | **Analytics** that respect privacy (prefer lightweight, minimal-cookie approaches); **privacy policy** published regardless. |
| FR12 | P1 | Optional automation to refresh **select public signals** (e.g. ratings) on a schedule—subject to third-party terms and engineering feasibility. |

---

## 8. Content & data

### 8.1 Coverage

- **68 wineries** for V1, Sonoma County–focused editorial scope.
- **Rich attributes** across areas such as: identity & story, location, tasting logistics & hours, style scores, varietals, experiences (tours, food, dogs/kids, accessibility), logistics (groups, parking), ratings summaries, and **multiple tasting price points** per winery where applicable.

### 8.2 Human-editable source

- A **spreadsheet workbook** remains the primary editorial file for non-engineers (`sonoma-winery-database-complete.xlsx`). Engineering maintains a repeatable **import** into the live system.

### 8.3 Content quality expectations

- Remove known **closed** venues from the canonical list before public launch.
- Resolve **duplicate or ambiguous** entries (same brand, multiple rows) into a **single public profile** where appropriate.
- **Address honesty:** when a mailing city or AVA boundary is confusing, **display copy** and structured location should reflect reality (e.g. Carneros / county clarity).

### 8.4 Budget interpretation (product rule)

For **budget matching**, “entry-level tasting price” should ignore **extreme outlier** experiences (e.g. helicopter or ultra-luxury one-offs) so typical visitors see fair comparisons. **All** published tasting options may still appear on the winery detail page. *(Engineering encodes the exact threshold in `SCORING.md`.)*

---

## 9. Policies & product decisions

| Topic | Decision |
|-------|----------|
| **Independence** | Personal project; **no official winery partnerships**; listings are editorial. |
| **Booking** | **Deep link only** to each winery’s reservation/booking URL; copy states booking is completed on their site. |
| **Accuracy** | Prominent **disclaimer**: hours, prices, and policies change—users must verify before visiting. |
| **Members-only** | **Excluded** from results unless the user opts in; when shown, **badge** and **lower priority** vs similar matches. |
| **Browse** | **Required** for V1 (directory + detail pages). |
| **Share links** | **Persistent** for V1; show **generated-on date** on shared views. |
| **Email** | Collected **only** for the “email my plan” action; not required to view results. |
| **PDF** | First release may be **text-first**; enhanced layout or static map imagery later. |
| **Analytics** | Use **privacy-conscious** web measurement; **no intrusive cookie banner** in V1 if analytics remain cookie-light; still ship **privacy policy**. |
| **Success metric** | Primary: user receives **at least one** winery recommendation after a valid quiz completion (server-validated). Secondary: track quiz completion separately to diagnose drop-off. |

---

## 10. Success metrics

| Metric | V1 target (directional) | Notes |
|--------|-------------------------|--------|
| Questionnaire completions | Healthy month-over-month growth once in market | Personal project—set baseline after launch. |
| Successful itineraries | Majority of completed quizzes yield **≥1** result | Tune filters/copy if “empty result” rate is high. |
| Engagement | Share, PDF, and email actions used without confusion | Qualitative testing in first weeks. |
| Trust | Low bounce from results; users open detail and external booking | Proxy for usefulness. |

---

## 11. Risks & assumptions

| Risk | Mitigation |
|------|------------|
| Stale pricing / policies | Disclaimer; periodic **manual review** of high-visibility fields; optional semi-automated signals where allowed. |
| Data entry errors | Validation on import; spot audits; bug reports from users. |
| Over-filtering (empty results) | Clear empty state; suggest relaxing constraints; tune defaults. |
| Misinterpretation of “members-only” | Default **exclude**; strong badge when included. |

**Assumption:** Winery booking URLs remain the **system of record** for availability; we do not claim real-time inventory.

---

## 12. Glossary

| Term | Meaning |
|------|---------|
| **AVA** | American Viticultural Area—a designated grape-growing region. |
| **Flight** | A defined tasting offering (wines, duration, price band, format). |
| **Itinerary** | The ordered/ranked set of wineries proposed for the user’s trip constraints. |
| **Members-only / allocation** | Venues requiring membership or allocation before visiting. |

---

## 13. Appendix

### A. Reference files (this folder)

| File | Description |
|------|-------------|
| `sonoma-winery-database-complete.xlsx` | Curated winery data (multiple sheets). |
| `sonoma-winery-prd.docx` | Earlier working PRD (includes historical tooling notes—non-binding for product). |
| `sonoma-winery-website-architecture.xlsx` | Supplementary planning notes (non-binding). |

### B. Engineering cross-references

- **Implementation checklist:** `TODO.md` (repository root).  
- **Matching logic detail:** `docs/SCORING.md` (create/maintain with engineering).

---

## 14. Future directions (after deterministic V1)

Ship **transparent, rule-based matching first**. Once that foundation is live and trusted, selectively add **AI-assisted** capabilities that **ground outputs in the same structured data** (retrieval / tools), with human-visible citations or filters—not a black box that replaces the catalog.

**Illustrative directions (not commitments—prioritize after V1):**

| Idea | User value | Product guardrail |
|------|------------|-------------------|
| **Natural-language planning** | “Dog-friendly Pinot under $40 near Healdsburg” without filling every quiz chip | Retrieve matching wineries from structured fields; LLM formats answers; **no** inventing venues or policies |
| **Conversational refinement** | “Swap the third stop for something quieter” | Re-run filters/scores with new constraints; show **why** picks changed |
| **Itinerary narrative** | Short readable “day story” for PDF/email/share | Generated copy must **only** assert facts present in data + user choices |
| **Review / web signal assist** | Summarize public themes (with attribution) | Optional, subordinate to editorial data; clear **“not verified by us”** framing |

**Principles:** privacy policy updated for AI features; logging/evals for quality and hallucination rate; **fallback** to the existing quiz + deterministic flow if AI path fails.

---

## Document history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | Apr 2026 | Original working PRD (DOCX). |
| 2.0 | Apr 2026 | Product-only PRD; decisions consolidated; technical stack removed. |
| 2.1 | Apr 2026 | V1 deterministic matching explicit; §14 future AI directions; NG6. |
