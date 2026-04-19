# Sonoma Sip — Engineering TODO

**Purpose:** Technical implementation tracker. Product intent & policies: **[`docs/PRD.md`](docs/PRD.md)**. Matching math: **[`docs/SCORING.md`](docs/SCORING.md)**.

> **UI WORK RULE:** Always invoke the `/ui` skill when building or modifying any page, component, or visual element.

---

## Quiz Spec v1.0 — Archetype Redesign (source: `docs/sonoma-sip-quiz-spec.md`)

The quiz is being re-architected around **archetype (ranking) + hard filters (group / budget / must-haves / dealbreakers / region)**. The current quiz uses `Vibe` multi-select + `Varietal` multi-select, which is being replaced. Keep ranking signal and filtering signal cleanly separated in code so each can be tuned independently.

**Architectural guardrail:** archetype → ranking only. Must-haves / budget / dealbreakers / regions → filtering only. **Number of stops → output constraint only** (determines itinerary length; never affects filter or rank). Do not let these three categories bleed into each other — mirror the split in `src/lib/matching/filters.ts` (filtering), `src/lib/matching/score.ts` (ranking), and `src/lib/matching/orchestrator.ts` or a downstream itinerary builder (stop count).

**Existing hard filters to preserve:** `min_flight_price` (budget), `has_views`, `has_food_pairing`, `is_dog_friendly`, `has_outdoor_seating`, `reservation_type = walk_ins_welcome`, `ava_primary` / `ava_secondary`. The rewrite does not remove any of these — it only adds `group_capacity`, `kid_welcome`, `house_specialty`-based dealbreakers, and (new) a `picnic_friendly` field.

### 1. Data model additions (phone — migration + types)

New fields on `wineries` to back the rewritten matcher. Do this first — UI and matcher both depend on it.

- [x] **Migration: add `archetype_scores`** — `jsonb not null default '{}'::jsonb` on `wineries`. Shape `{ explorer, collector, student, socializer, romantic }` each 0-10. Matcher treats missing keys as 0. (`20260419000001_add_archetype_scores.sql`)
- [x] **Rename `max_group_size` → `group_capacity`** — kept existing `smallint` type (functionally identical to `integer` for group sizes; avoids table rewrite). Updated 13 app files. (`20260419000002_rename_max_group_size_to_group_capacity.sql`)
- [x] **Migration: add `house_specialty`** — `text[] not null default '{}'` (reusing the existing `text`-backed varietal convention from `winery_varietals`; no Postgres enum). 1-3 cap enforced in admin UI. (`20260419000003_add_house_specialty.sql`)
- [ ] **Admin UI hint — editorial rule for `house_specialty`** — surface this rule on the edit form next to the field so editors apply it consistently: _"A winery is a [varietal] house if that varietal is 40%+ of production OR is what they're regionally known for."_ Cap the field at 3 values in the UI. Without this, `house_specialty` will drift toward "every varietal they pour" and break the dealbreaker filter.
- [x] **Rename `is_kid_friendly` → `kid_welcome`** — flipped default to `true`. Existing 68 rows kept their prior `false` values; backfill script flipped all to `true`. Updated 15 app files (kept `mustHaves.kidFriendly` user-preference field untouched). (`20260419000004_rename_is_kid_friendly_to_kid_welcome.sql`)
- [x] **`winery_scale` — no migration needed.** The column already exists as `text` on `wineries` (original table). Added `WineryScale` union (`boutique | family_estate | destination`) in `types.ts`, mapped through `Winery` in `mappers.ts`.
- [x] **Regenerate types** — ran `pnpm db:gen-types`; `src/lib/database.types.ts` reflects all new columns. Mapper surfaces `archetype_scores` (read path TBD), `houseSpecialty`, `groupCapacity`, `kidWelcome`, `wineryScale` on `Winery` / `WineryForMatching` as appropriate.
- [x] **Backfill for the 68 editorial wineries** — `scripts/backfill-archetype-scores.ts` populates `archetype_scores` (heuristic from style_* / quality_score / is_members_only / settings), `house_specialty` (from `winery_varietals` signature rows, fallback to first 3), `kid_welcome` (true unless 21+ keywords in `tasting_room_vibe`/`accessibility_notes`), `winery_scale` (by `annual_cases` bands + Ridge Lytton Springs override → `family_estate`). Ran successfully against prod: 68/68 updated. Distribution: 5 boutique / 41 family_estate / 22 destination. Refine editorially via admin UI.

### 2. Quiz rewrite (mixed — phone for logic, desktop for `/ui` variants)

Replace the current 4-step flow. Step state lives in `src/app/quiz/page.tsx` and `src/hooks/use-session-storage.ts`; `QuizAnswers` lives in `src/lib/types.ts`.

- [x] **Rewrote `QuizAnswers`** — dropped `selectedVarietals`, `selectedVibes`, `mustHaves.wheelchairAccessible`, `includeMembersOnly`, `groupSize`; added `archetype`, `groupComposition`, `skipVarietals`. New enums live in `types.ts`. `MustHaves` gained `picnic` + `walkInsWelcome`, lost `wheelchairAccessible`.
- [x] **Step 1 — archetype** — 5-card single-select with Compass/BookOpen/GraduationCap/PartyPopper/Heart icons. Intro copy: _"This helps us match the experience to you."_
- [x] **Step 2 — group composition** — 4-card single-select with UserIcon/Users/UsersRound icons. Intro copy: _"So we can match group size, noise level, and vibe."_
- [x] **Step 3 — budget + must-haves + dealbreakers** — one screen, three sections. Budget 4 tiers; must-haves 7 options (added picnic via `has_picnic_area`, added walk-ins via `reservation_type='walk_ins_welcome'`); dealbreakers as inline chip list. Dealbreakers not collapsed-by-default — deferred as a minor UX polish.
- [x] **Step 4 — regions + stops** — kept 5-AVA list + stops. Expandable sub-AVA dropdown deferred (UX nice-to-have).
- [ ] **Expand `AvaRegion` enum + `AVA_TO_DISPLAY`** for sub-AVAs (Knights Valley, Moon Mountain District, Fountaingrove District, Pine Mountain-Cloverdale Peak, West Sonoma Coast) — deferred with the expandable dropdown above.

### 3. Matching engine rewrite (phone) ✅

`src/lib/matching/` now runs archetype-first ranking + explicit hard filter layer.

- [x] **`filters.ts`** — group composition filter (solo/couple/small/big → min capacities 0/2/5/6), new must-haves filter (adds picnic + walkInsWelcome, drops wheelchair), `passesDealbreakerFilter` reads `houseSpecialty` only (never `winery_varietals`), budget + region unchanged. Dropped `passesMembersOnlyFilter` — `includeMembersOnly` no longer exists.
- [x] **`score.ts`** — `scoreArchetype` = `archetypeScores[userArchetype] / 10`. Kept budget + experience + rating scoring; added `scoreGroupFit` (noise level preference: quiet for solo/couple, moderate for small, lively for big). Weights: 40 archetype / 20 budget / 20 experience / 15 rating / 5 groupFit. Removed `computeUserWeights` and vibe logic.
- [x] **`explain.ts`** — archetype-based reasons ("A Collector's pick — library releases + winemaker chats"). Added picnic + walk-ins reasons. Drop wheelchair + varietal-overlap reasons.
- [x] **Golden fixtures refresh** — `__fixtures__/quiz-profiles.ts` rewrites all 7 profiles to new shape. Snapshots regenerated (`pnpm test:golden -u`).
- [x] **Archetype differentiation test** — added to `matching/index.test.ts`: asserts Explorer picks `hidden-gem` (archetype_scores.explorer=10) while Student picks `classroom` (archetype_scores.student=10).

### 4. Winery detail page changes (mixed)

`src/app/wineries/[slug]/page.tsx`. Intent: only high-signal fields that help a user decide to visit. Cut filler, add trust signals.

- [x] **Remove parking** from the detail page. `parking` column stays on `Winery`, just unrendered.
- [x] **Remove noise level** from the detail page. Column stays in DB (matcher still reads it for group-fit tie-break).
- [x] **Remove "Tasting experiences" block** — dropped entirely (not even a menu-link replacement). Booking CTA at top of sidebar already covers "visit their site." Flights data stays in DB for future use.
- [x] **Remove "Nearby Wineries" section** + haversine computation + unused imports. `src/lib/geo.ts` kept for future itinerary map use.
- [x] **Remove Wheelchair accessible** amenity chip from the detail page.
- [ ] **Review source attribution — DEFERRED.** Star row + `aggregateRating` JSON-LD are hidden until Google Places sync ships (`rating_google` values are editorial, not live Google data — see Hours & Ratings section). Un-hide per the `[ ] Un-hide the star row` step in the Places setup guide.
- [ ] **Add per-winery map** (lower priority) — small Mapbox map on the detail page showing the winery's location in AVA context. Lift the existing `SonomaMap` into a reusable component or use a lighter static Mapbox image for the detail page. Defer if effort > a few hours.
- [x] **Kept** price range, group size, reservation policy, tagline, Book a Tasting CTA, disclaimer line.

### 6. Homepage copy update (phone)

`src/app/page.tsx:123`.

- [ ] **Replace subhead** "Curated wineries · Every Sonoma AVA region · Personalized matching · Always free" with **"Personalized itineraries · Maps & printable guides · Across Sonoma County · Independent & free"**. Rationale in spec §Homepage copy: leads with deliverable, surfaces print/share/email value, doesn't overclaim AVA coverage, reframes "free" as editorial integrity.
- [ ] **Fix copy inconsistency** — quiz Step 2 intro currently says "Choose the mood and set your budget" while cards say "Pick your vibe." Standardize on **"vibe"** throughout. (Will naturally land when the quiz rewrite above replaces that step anyway — but if the rewrite ships in phases, fix the string first.)

### 7. Deferred: Winery Scale (data only in v1)

Per spec §Deferred: don't add a fifth quiz question for this — 80% of users would answer "no preference." Handle as an algorithmic variety rule in v2 (or a card tag in v1.5), not a filter.

- [x] **Migration adds `winery_scale` column** — covered in §1 (column pre-existed as `text`, just typed as `WineryScale` union).
- [x] **Backfill all 68 wineries** — done in `scripts/backfill-archetype-scores.ts`. Distribution: 5 boutique / 41 family_estate / 22 destination. Ridge Lytton Springs explicitly overridden to `family_estate`.
- [x] **Path #1 — display as a tag** on winery cards, top-match, detail, results, plan. Added `formatScaleAndRegion()` helper + `WINERY_SCALE_LABEL` map in `types.ts`; `wineryScale` now surfaces on `WineryForDisplay` so both `Winery` and `WineryForDisplay` consumers can read it.
- [ ] **Revisit path #2 (opt-in toggle) or #3 (silent anti-redundancy rule) in v2** based on how users interact with the itinerary (do they swap stops? do they regenerate?).

### 8. Pre-launch testing (spec §Testing priorities)

- [ ] **Watch 3–5 real users take the quiz without coaching.** Note which archetype labels cause hesitation — that's where copy needs work.
- [ ] **Sanity-check archetype differentiation** — if Explorer and Student get the same top 5, archetype isn't doing real work. (Golden test covers this; also verify qualitatively.)
- [ ] **Dealbreaker edge case test** — user selects "skip Zinfandel" + "Dry Creek Valley" should still get results (just not Zin-specialist houses). Automate as a fixture test.
- [ ] **"No preference" on regions** — should return matches across all AVAs, ranked purely by archetype + must-haves fit.

### Rollout order (recommended)

1. Migration + type regen + mapper updates (§1) — unblocks everything else.
2. Backfill editorial data for the 68 wineries (§1).
3. Matcher rewrite (§3) behind a feature flag / alternate entrypoint so the current quiz keeps working.
4. Quiz UI rewrite (§2) + cut detail-page fields (§4) + homepage copy (§6) + accessibility note (§5) — ship together; they're interdependent copy-wise.
5. Winery scale tags (§7) — lowest priority; ship after everything else lands.
6. User testing (§8) before public launch.

---

## Next Up (quick wins — phone-friendly)

Pick these off one at a time. Each is scoped to 1-2 file touches and should be doable in under 15 minutes.

### 1. OG image for plan pages (est. 5 min) ✅

**Goal:** Make shared `/plan/[id]` URLs render a rich preview card instead of raw URL text.

**Status:** `src/app/plan/[id]/opengraph-image.tsx` already exists and uses Next.js's App Router convention — Next auto-picks it up as `og:image`. But the `generateMetadata` in `src/app/plan/[id]/page.tsx` explicitly sets `openGraph` **without** an `images` key, which **may override** the convention file.

**Plan:**

- [x] Open `src/app/plan/[id]/page.tsx` and find `generateMetadata` (around line 64).
- [x] Explicitly reference the convention image route (`/plan/${id}/opengraph-image`) in both `openGraph.images` and `twitter.images` so the image is guaranteed to be attached regardless of Next's auto-merge behavior.
- [x] Test: run `pnpm dev`, open a plan URL, paste into [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/). You should see the generated image.

### 2. Winery detail — left-align centered text on mobile (est. 5 min) ✅

**Goal:** Two `<p>` elements on the winery detail page are incorrectly centered. Should match the left-aligned content flow of the rest of the page.

**Files to edit:** `src/app/wineries/[slug]/page.tsx`

**Plan:**

- [x] Line 277: price-per-flight line — removed `text-center` so it defaults to left.
- [x] Line 280: disclaimer line — removed `text-center` so it defaults to left.
- [x] Chose left-aligned everywhere (not `sm:text-center`) to match the surrounding left-aligned sidebar content (name, tagline, star rating).
- [x] Verify in browser at 375px width.

### 3. Results page — bottom border-radius clipping on mobile (est. 10 min) ✅

**Goal:** The bottom corners of the results card/container render flat on mobile. Needs an `overflow` + `border-radius` fix.

**Plan:**

- [x] Traced the clipping to `src/components/map/map-section.tsx`: the mobile path wraps `SonomaMap` in a `motion.div` with `overflow-hidden` (for the height animation) but no `rounded-*`. `SonomaMap` has `rounded-2xl` on its root, so the parent's overflow-hidden was clipping the child's rounded corners to flat.
- [x] Added `rounded-2xl` to the `motion.div`'s className so the clipping shape matches the child's rounding.
- [x] Verify at 375px and 768px.

(Note: the results page itself has no rounded card — the visible "card" is the map, which is shared between `/results` and `/plan/[id]` via `MapSection`, so this also fixes the same issue on the shared plan page on mobile.)

---

## Phone vs. Desktop Work Split

Most development happens on phone. This section is an at-a-glance index so you don't open a task on mobile only to realize it needs a browser.

**Phone-friendly** = backend logic, SQL migrations, server actions, scripts, env/config, text content, metadata/SEO, API routes, type changes, docs, validation rules.

**Desktop-required** = anything needing visual verification in a browser: new components, responsive layouts, Mapbox styling, animations, ui.sh picker workflows, print/email HTML, snapshot diff viewers, PDF layout.

Tag convention on new items: `(phone)`, `(desktop)`, `(mixed — phone for X, desktop for Y)`.

### Phone-Friendly Backlog (do these on mobile)

- [ ] **Admin login server action + session middleware** (Admin Panel §1) — scrypt verify against `admin_users`, signed cookie, middleware gating `/admin/*`.
- [ ] **Publish server action** (Admin Panel §3) — validates required fields, snapshots, flips `content_status`. No UI decisions — just the action handler.
- [ ] **Delete cascade server action** (Admin Panel §3) — deletes from `wineries`, `flights`, `winery_varietals`, `winery_scrapes`, `winery_snapshots`.
- [ ] **URL health check script** (Data Integrity §3) — `scripts/url-health-check.ts` writes to `url_health_checks` + opens `data_health_checks` rows on failures.
- [ ] **Places sync script** (Hours & Ratings) — `scripts/places-sync.ts`, writes `rating_google` / `review_count_total` / `last_verified_at` directly.
- [ ] **Stale-winery report script** (Data Integrity §3) — queries rows with `last_verified_at < now() - 90 days`, emails admin a list.
- [ ] **Pipeline scheduling** (Data Pipeline) — Vercel cron config: discovery monthly, URL health weekly, places sync monthly per-winery.
- [ ] **Booking click tracking server action** (Enterprise §1) — new `booking_events` table + server action fired on winery website/reservation CTA clicks.
- [ ] **Email list capture backend** (Enterprise §2) — `newsletter_signups` table + server action on share flow + Resend/Mailchimp API call.
- [ ] **API v1 skeleton** (Enterprise §4) — `/api/v1/wineries`, `/api/v1/quiz` routes with API-key auth + per-key rate limits.
- [ ] **Field-change audit table** (Data Integrity §2) — migration for `field_changes` (winery_id, field_name, old/new, admin_id, changed_at, reason). Wire into publish action.
- [ ] **Premium tier gate in matching engine** (Enterprise §3) — accept `includeDiscoveredTier` flag; gate in `src/lib/matching/filters.ts`.
- [ ] **Supabase dev env provisioning docs + env scoping** (existing `## Supabase Development Environment` section).
- [ ] **Rate limiter: switch in-memory → Upstash Redis or Supabase-backed** — in-memory token bucket resets on every Vercel cold start, so the 10/hr and 5/hr limits don't hold in practice.
- [ ] **Sentry wiring** (Future) — `@sentry/nextjs` for app + instrumentation for pipeline scripts. All config, no UI.
- [ ] **Analytics events** (Analytics) — Plausible snippet + event hooks (quiz_started, share_created, booking_clicked).

### Desktop-Required Backlog (save for laptop)

- [ ] **Mobile navigation overhaul** (UI — Mobile Fixes) — ui.sh picker workflow, multiple variants, pick in-browser.
- [ ] **Admin winery editor form** (Admin Panel §3) — full-field form with grouping, validation UX, responsive layout. Use ui.sh.
- [ ] **Scrape viewer side panel** (Admin Panel §3) — markdown renderer in a resizable side panel. Visual layout + overflow handling.
- [ ] **Snapshot timeline + diff viewer** (Admin Panel §7) — visual diff of two JSONB snapshots with highlighting.
- [ ] **Admin dashboard layout** (Admin Panel §2) — stats cards, pipeline-run feed, coverage chart.
- [ ] **Pipeline runs UI** (Admin Panel §4) — table + drill-down + manual trigger buttons.
- [ ] **Data health UI** (Admin Panel §6) — tabbed views for missing fields / stale / broken URLs.
- [ ] **Email share template** (Future) — Resend HTML template; visual preview + mobile client testing.
- [ ] **Winery self-service dashboard** (Enterprise §5) — booking stats page for winery partners.
- [ ] **White-label tour-company view** (Enterprise §6) — themeable shell + bulk-itinerary UX.
- [ ] **Sponsored placement badge design** (Enterprise §7) — needs to read as transparent/trustworthy, not scammy.
- [ ] **PDF plan layout** (Future) — `@react-pdf/renderer` or print CSS; visual proofing required.

---

## Up Next

### Simplified Pipeline — Scrape → Manual Review → Publish

The pipeline no longer uses Claude for extraction or the `content_drafts` staging table. Admin curates everything manually after reading scraped markdown.

**Final shape:**

```
Discover (OSM)     → wineries (content_status='draft')
Crawl (Firecrawl)  → winery_scrapes (raw markdown)
Places (Google)    → direct write to wineries.rating_google / review_count_total (future)
Admin UI           → reads scrapes, edits winery row, flips content_status to 'published'
```

**Done (on branch `pipeline-dry-run`):**

- [x] Backfill: 74 existing `data_source='osm_auto'` rows flipped from `'published'` to `'draft'`. Pristine editorial set of 68 remains `'published'`.
- [x] `scripts/discover-osm.ts` now inserts new rows with `content_status: 'draft'`.
- [x] User-facing data accessors filter to `content_status='published'`: `getWineriesForMatching`, `getWineryBySlug`, `getAllWinerySlugs`, `getAllWineriesForBrowse`, `getWineryLookup`.
- [x] **Retired Claude extraction + content_drafts:** deleted `scripts/extract-wineries.ts`, `scripts/publish-wineries.ts`, `src/lib/pipeline/{extract,publish,publish.test,diff,diff.test}.ts`, removed `@anthropic-ai/sdk` dep, removed `extract`/`publish` stages from `run-pipeline.ts`, removed npm scripts (`pipeline:extract*`, `pipeline:publish*`), dropped `ANTHROPIC_API_KEY` from env schema.
- [x] **Migration `20260416000001_retire_content_drafts.sql`:** drops `content_drafts` table, drops `content_draft_status` enum, flips `wineries.content_status` default to `'draft'`.

**Still to do (admin UI work):**

- [x] **Admin data accessor** — `getAllWineriesForAdmin` in `src/lib/data/wineries.ts` returns all wineries (drafts first, then published, alphabetical within each group).
- [ ] **Admin winery editor** — `/admin/wineries/[id]/edit` with form for every winery field + side panel showing latest `winery_scrapes` markdown for reference.
- [ ] **Admin "publish" action** — server action that flips `content_status` from `'draft'` to `'published'`. Gate behind required-field checks (at minimum `ava_primary` not null).
- [ ] **Admin winery list** — surface `content_status` with a "Needs Review" filter; show discovery run log at top so admin can triage the newest batch.
- [ ] **Places stage (future)** — `scripts/places-sync.ts` fetches Google ratings and writes directly to `wineries.rating_google` / `review_count_total` (no draft staging; Google is authoritative).

**Pre-existing test failures (not caused by this cleanup):**

- 7 golden snapshot mismatches: snapshots last regenerated at commit `7502693`, broken by commit `03625d6` ("Fix 5 scoring/matching bugs"). Run `pnpm test:golden -u` to refresh when ready.
- 3 `src/lib/actions/quiz.test.ts` failures: `headers()` called outside a request scope — test infra issue with Next.js server actions in vitest.

### Pipeline Simplification — Discovery Writes Directly to Wineries

Move from "editorial CSV import + OSM shadow registry" to a single pipeline that dynamically discovers, crawls, enriches, and publishes — all writing directly to `wineries`. Admin UI handles delete + manual fill-in for fields OSM/Firecrawl/Places can't supply (flights, varietals, style scores, editorial content, AVA assignment).

**Scope decisions locked in:**

- Matching engine + all scoring columns stay. Mapper at `src/lib/mappers.ts:57-65` already defaults null `style_*` to 3, and `scoreRating` handles null quality/popularity/rating gracefully — so sparse discovery rows rank middle-of-the-pack until admin fills them in.
- **Keep the existing 68 wineries.** Discovery upserts new OSM rows alongside them; editorial data is preserved.
- **Make currently-NOT-NULL editorial columns nullable** so OSM can insert minimal rows. Admin assigns the rest via the editor.
- **No auto-extraction of flights or varietals.** Admin enters those manually for new discoveries; the 68 editorial rows keep their existing flight/varietal data.

**Schema changes:** (migration `20260415000001_pipeline_simplification.sql`)

- [x] Migration: drop `NOT NULL` on `wineries.ava_primary`, `wineries.reservation_type`. Mapper defaults null region to `''` and null reservation_type to `'walk_ins_welcome'` so the UI doesn't break on discovered-but-unreviewed rows.
- [x] Migration: drop `winery_registry` table + its indexes + `trg_winery_registry_updated_at` trigger.
- [x] Migration: add `osm_type` text + `osm_id` bigint to `wineries` with a partial unique index `uidx_wineries_osm_identity` (only constrains rows where both are set) — makes discovery upserts idempotent.
- [x] Migration: drop the `'editorial_excel'` default on `wineries.data_source`. Existing 68 rows keep their value; discovery sets `'osm_auto'` explicitly.
- [x] Apply the migration against the remote Supabase project (`supabase db push` or dashboard). Re-run `pnpm db:gen-types` after apply to refresh `src/lib/database.types.ts` from the real schema.

**Discovery rewrite (`scripts/discover-osm.ts`):** ✅

- [x] Replace `winery_registry.upsert` with direct writes to `wineries`. Three buckets per run: already-linked (update minimal fields), fuzzy-matched (stamp osm_type/osm_id onto existing editorial row), new (insert minimal row).
- [x] Populate from OSM tags: `name`, `slug` (kebab-case with collision suffix), `latitude`, `longitude`, `website_url`, `phone`, `address_street/city`, `osm_type`, `osm_id`. Leave editorial fields null.
- [x] Keep the dedup logic from `src/lib/pipeline/dedup.ts`.
- [x] Log per-bucket counts in dry-run output so you can see what a live run would do before pulling the trigger.

**CSV import retirement:**

- [x] Delete `scripts/import-wineries.ts`. (Also deleted the now-dead helpers in `scripts/lib/`: `parse-csv.ts`, `transforms.ts`, `validate.ts`.)
- [x] Delete `docs/csv/*.csv` (8 files) and `docs/sonoma-winery-database-complete.xlsx`.
- [x] Remove the `db:import` / `db:import:dry` npm scripts from `package.json`. Also removed `db:reset` since it chained into `db:import`.
- [x] The existing 68 `wineries` rows stay in the DB — no data wiped.

**Admin UI — manual fill-in layer:**

- [ ] **Delete action** on `/admin/wineries/[id]` — confirmation modal, cascades to `flights`, `winery_varietals`, `winery_scrapes`, `winery_snapshots`.
- [ ] **AVA assignment** — required dropdown on the edit form (primary + optional secondary). A discovered winery with null `ava_primary` should be flagged on the admin dashboard as "needs AVA."
- [ ] **Flights editor** — CRUD for `flights` rows per winery (name, price, duration, wines included, format, food pairing, description).
- [ ] **Varietals editor** — multi-select of varietal enum with per-row `is_signature` flag.
- [ ] **Style scores editor** — six sliders (1-5) for `style_*` columns, with a "not set" / null state distinct from "3."
- [ ] **Editorial content** — `tagline`, `description`, `unique_selling_point`, `best_for` text fields.
- [ ] **Data source badge** — surface `data_source` and `last_verified_at` prominently so admin can tell editorial vs. auto-discovered at a glance.
- [ ] **Scrape viewer** — side panel on the edit form showing the latest `winery_scrapes` markdown so admin can read source material while filling fields.
- [ ] **Publish action** — flips `content_status` from `'draft'` to `'published'`. Gate behind required-field checks (at minimum `ava_primary` not null). Creates a `winery_snapshots` row first for rollback.

### Hours & Ratings — Manual Entry from Scrape + Future Places Sync

> ⚠️ **Launch blocker for review attribution.** The star rating and review count
> on winery detail + card components are **currently hidden** (see §4) because
> the data is editorial-CSV values, not live Google ratings — displaying them
> with Google attribution would be inaccurate. Once the Places sync below runs,
> un-hide the star row and add attribution.

All 68 wineries' hours + `rating_google` + `review_count_total` came from the
one-time editorial CSV import. The `rating_google` column is a **misnomer** —
nothing in the codebase ever calls the Google API; the values are hand-entered.

**Hours — manual entry via scrape viewer:**

- [ ] Admin reads `winery_scrapes` markdown (shown in the scrape viewer panel of the edit form) and types hours into the winery row directly. No auto-extraction.

**Ratings — how to set up live Google Places sync (end-to-end):**

This is the critical path to showing accurate, attributable ratings on the site.
Do steps in order — each builds on the last.

1. **[x] `google_place_id` column** (already landed — `supabase/migrations/20260418000001_add_google_place_id.sql`). Nullable + partial unique index so we only resolve once per winery.

2. **[ ] Provision a Google Places API key.**
   - Enable the **Places API (New)** in Google Cloud Console on the project billing is attached to.
   - Restrict the key by API (Places only) and by IP/referrer in production.
   - Add `GOOGLE_PLACES_API_KEY` to `.env.example` (commented), `.env.local`, and Vercel envs (all three scopes: Production, Preview, Development).

3. **[ ] Build `src/lib/pipeline/places.ts`** with two exported functions:
   - `resolvePlaceId(winery)` — calls `findPlaceFromText` with `name + address_city + "winery"`. Cache the result on `wineries.google_place_id`. Skip wineries that already have a cached id. Handle ambiguous matches (>1 candidate with similar score) by logging + skipping — admin resolves manually.
   - `fetchPlaceDetails(place_id)` — calls Place Details API requesting fields `rating,userRatingCount` only (keeps cost low). Returns `{ rating, reviewCount }`.

4. **[ ] Build `scripts/places-sync.ts`** that orchestrates for each published winery:
   - Resolve `place_id` if missing.
   - Fetch details.
   - Update `wineries.rating_google`, `wineries.review_count_total`, `wineries.last_verified_at = now()`.
   - Stamp `last_places_sync_at` on the row (column already exists).
   - Skip wineries whose `last_places_sync_at` is within 30 days (rate-friendly + ToS-friendly).
   - `--dry-run` flag that prints proposed updates without writing.
   - `--force` flag to override the 30-day skip.

5. **[ ] Wire into `scripts/run-pipeline.ts`** as a new `places` stage so a single `pnpm pipeline:run` covers discover → crawl → places.

6. **[ ] Schedule as a Vercel cron** — monthly is enough given how slowly ratings drift.

7. **[ ] Un-hide the star row** in `src/app/wineries/[slug]/page.tsx` (and winery cards if we hid them there too). Render as **"4.7 (1,240 Google reviews)"** with the word "Google" visible so attribution is explicit. Pull from `rating_google` + `review_count_total`.

8. **[ ] Add a `last_verified_at` freshness badge** near the star row ("Verified Apr 2026") once ≥1 sync has run. Builds trust.

**ToS + cost notes:**
- Never store raw review text, only aggregate rating + count.
- Attribute "Google" in the UI anywhere these values surface.
- Place Details calls cost ~$17/1000 — at 68 wineries/month that's ~$1.16/month. Negligible.
- The 30-day refresh is conservative and keeps us safely within rate limits.

### Supabase Development Environment

**Decision: Option A — separate `sonoma-sip-dev` Supabase project.** Works from any machine (including mobile via Vercel), no Docker required, matches the existing hosted workflow, and keeps Vercel Preview deploys pointing at a non-prod DB automatically.

- [x] **Document the chosen approach** — see `CLAUDE.md` → "Supabase Environments".
- [ ] **Provision the dev project** in the Supabase dashboard (name `sonoma-sip-dev`, same region us-east-2).
- [ ] **Seed from prod** — `pg_dump` prod, `pg_restore` into dev. One-time operation; iterate freely after.
- [ ] **Apply migrations to dev first** — run `supabase db push` against the dev project ref. Prod migrations only after dev smoke-test.
- [ ] **Vercel env scoping** — set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` separately for `Production` (prod ref) vs `Preview` + `Development` (dev ref).
- [ ] **Verify end-to-end** — `pnpm dev` against dev credentials: quiz → results → plan creation all work.

### UI — Mobile Fixes

- [x] **Remove "Get Started" button from quiz page.** The user is already on the quiz — the CTA at the bottom is redundant. Remove or replace with something contextually useful.
- [x] **Results/Plan page — map overflow on mobile.** On both the results and shared plan pages, the map spills outside its container on iPhone-width screens. Fix: constrain the map to the container width, add proper `border-radius`, and ensure no horizontal overflow. Unified both pages to use a shared `MapSection` component.
- [x] **Results page — bottom border-radius clipping.** The bottom corners of the results card/container are being cut off on mobile. Fix the `overflow` / `border-radius` interaction so corners render fully.
- [ ] **Mobile navigation overhaul.** The current navbar/menu doesn't look good on mobile. Redesign using the `/ui` skill and ui.sh picker workflow — generate multiple variants (e.g. slide-out drawer, bottom sheet, hamburger menu) and pick the best one in-browser. Ensure the nav works well across all mobile pages (landing, quiz, results, plan).
- [x] **Winery detail page — text alignment on mobile.** Some text on the winery detail page is incorrectly centered on mobile viewports. Should be left-aligned to match the rest of the content flow.

### Winery Detail Page — Distance-Based Nearby Suggestions

The "Nearby Wineries" section on `/wineries/[slug]` currently filters by same AVA region and takes the first 3. We already have `latitude` and `longitude` for all 68 wineries — use them for real proximity.

**Heuristic:**

- **≤ 5 miles = "nearby."** In Sonoma, most AVAs are compact (Dry Creek Valley ~8 mi long, Russian River Valley ~12 mi). A 5-mile radius captures wineries along the same road/corridor — roughly a 10-minute drive on two-lane wine country roads. Beyond 5 miles you're typically crossing into a different area and it stops feeling close.
- **Fallback:** If fewer than 3 wineries fall within 5 miles, backfill with same-region wineries so the section is never empty.

**Implementation:**

- [x] **Add a `haversineDistance(lat1, lng1, lat2, lng2)` utility** in `src/lib/` that returns distance in miles between two coordinates. (`src/lib/geo.ts`)
- [x] **Update `/wineries/[slug]` page** to compute distance from the current winery to all others, filter to ≤ 5 mi, and sort closest-first. Fall back to same-region if fewer than 3 results. (Thresholds extracted to `NEARBY_RADIUS_MILES = 5` / `NEARBY_MIN_RESULTS = 3` consts at the top of the file so they're easy to tune.)
- [x] **Show distance in the UI** — display something like "2.3 mi away" on each nearby winery card so users can judge proximity at a glance.
- [x] **Consider the 5-mile threshold after real data review** — spot-checked wineries in dense areas (Healdsburg, Glen Ellen) and sparse areas; the 5-mile radius feels right. No adjustment needed.

### OG Image for Deep Links (Plan Sharing)

When sharing the home page, the OG preview looks good. But sharing a plan page (`/plan/[id]`) shows the raw URL as text instead of a rich preview. The plan page has OG `title` and `description` metadata but is **missing `og:image`**.

- [ ] **Add a default OG image for plan pages.** At minimum, set a static fallback `og:image` in the plan page's `generateMetadata` so every shared link gets a branded preview card instead of raw URL text. Use the same OG image as the home page as a starting point.
- [x] **Consider dynamic OG images (stretch).** Use Next.js `opengraph-image.tsx` (or Vercel OG / `@vercel/og`) to generate a dynamic image per plan — e.g. showing the plan title, number of stops, and winery names. This makes each shared link unique and more compelling. (`src/app/plan/[id]/opengraph-image.tsx` now fetches the real plan from Supabase via shared `getPlan` helper in `src/lib/plan.ts`; falls back to generic branding if the plan is missing.)
- [x] **Verify OG tags on all shareable routes.** Audit `/`, `/results`, `/plan/[id]`, and `/wineries/[slug]` to ensure every page that can be shared has proper `og:title`, `og:description`, `og:image`, and `og:url`. Test with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and [Twitter Card Validator](https://cards-dev.twitter.com/validator).
  - `/` — root layout defines `openGraph` + `twitter`, root `opengraph-image.tsx` convention auto-attaches. ✓
  - `/plan/[id]` — wired up in earlier commits (metadata reference + dynamic OG image). ✓
  - `/wineries/[slug]` — previously defined `openGraph`/`twitter` without `images`. Added `images` and `siteName` to both, and added `src/app/wineries/[slug]/opengraph-image.tsx` so each winery gets a dynamic OG image rendering name + region + city + tagline + price range + signature varietals. ✓
  - `/wineries` — previously inherited root OG verbatim. Now defines per-page `openGraph`/`twitter` with the browse-specific title/description + root OG image. ✓
  - `/results` — `robots: { index: false }` and shows session-local data, so shared links aren't meaningful anyway. Inherits root OG for the rare case someone does share. ✓
  - Manual validation with Facebook Sharing Debugger / Twitter Card Validator confirmed against the deployed URL. ✓

---

## Data Integrity & Content Updates

_A candid audit of how content flows from source → site today, and what's missing before we can trust this without babysitting it._

### Current Approach (what actually runs)

1. **Discover** (`scripts/discover-osm.ts`) — OSM Overpass query upserts into `wineries` with `content_status='draft'`. Dedup in `src/lib/pipeline/dedup.ts`. Idempotent via `uidx_wineries_osm_identity`.
2. **Crawl** (`scripts/crawl-wineries.ts`) — Firecrawl fetches up to 5 pages per winery, stores markdown in `winery_scrapes`. Honors `--skip-if-scraped-within-days=30` unless `--force`.
3. **Curate** (admin UI, not yet built) — admin reads scrape markdown in a side panel, types values into the edit form, clicks Publish.
4. **Publish** — server action (not yet built) snapshots current row into `winery_snapshots`, flips `content_status` to `'published'`, validates `ava_primary NOT NULL`.
5. **Read path** — every user-facing accessor in `src/lib/data/wineries.ts` filters to `content_status='published'` + `is_active=true`. Drafts are invisible to the public.

### What's Working

- **Draft/published separation is enforced at the data layer**, not in UI. Anon key + RLS means drafts can't leak even if a component forgets to filter. (`src/lib/data/wineries.ts:15-81`)
- **Snapshot table exists** (`winery_snapshots`, migration `20260406000001` line 155) — we can roll back any row to any past state.
- **Audit run history** — `pipeline_runs` records every discovery/crawl attempt with bucket counts, duration, errors.
- **Partial unique index on OSM identity** — rediscovery can't create duplicates even if dedup logic bugs out.

### Gaps — Why It Still Feels Iffy

| Gap | Evidence | Impact |
| --- | --- | --- |
| **Nothing writes to `url_health_checks`** | Table exists (migration `20260406000001:139`) but no script populates it. | Broken booking URLs go unnoticed until a user reports it (or doesn't). |
| **Nothing writes to `data_health_checks`** | Table + `check_type` enum exist (migration `20260404000007:4`) but no producer. | No centralized "things to fix" queue for admin. |
| **`field_overrides` is dead code** | Table exists (migration `20260404000007:20`) but no admin action writes to it. | When admin hand-edits a scraped field, we lose the "what did the scrape say vs. what did we type" trail. |
| **`last_verified_at` never updated automatically** | Column exists; only touched during initial CSV import. | A winery published April 2026 with the wrong hours will still say those hours in April 2027. |
| **Publish validation is minimal** | TODO gates on `ava_primary` only. | Nothing stops publishing a winery with no flights, no varietals, broken lat/lon, or an expired booking URL. |
| **No scheduled jobs** | All scripts run manually. | Drift accumulates. The longer between crawls, the more out-of-date the site. |
| **Editorial 68 never re-verified** | Seeded Oct 2025 from a CSV; no automatic freshness signal. | Hours and pricing on the site today are a year old. |
| **No change-log per winery** | Snapshots capture whole-row JSONB but nothing surfaces a "what changed and why" view. | Hard to answer "why does Ridge say different hours than last week?" |

### Proposed Improvements (ordered; mostly phone-friendly)

#### 1. Scheduled URL health (phone)

- [ ] **`scripts/url-health-check.ts`** — HEAD request against every `website_url` and `reservation_url`. Write status_code, redirect_url, response_time_ms into `url_health_checks`. Open a `data_health_checks` row (type `broken_url`) for 4xx/5xx/timeout.
- [ ] **Weekly Vercel cron** hitting the script via a signed internal route.
- [ ] **Admin alert** — the health dashboard (Admin Panel §6) reads open `data_health_checks`.

#### 2. Per-field change audit (phone)

- [ ] **Migration: `field_changes`** — `(id, winery_id, field_name, old_value_json, new_value_json, admin_user_id, reason, source_scrape_id, created_at)`. `source_scrape_id` nullable, lets us mark "typed from scrape X" vs "manual correction."
- [ ] **Wire into publish server action** — diff incoming payload against current row, write one `field_changes` row per changed field.
- [ ] **Repurpose `field_overrides`** — either drop it or redefine as "values the admin overrode that should stick across future pipeline overwrites." Today it's orphaned.
- [ ] **Admin winery history tab** (desktop) — chronological list of field changes for one winery.

#### 3. Publish-time validation gate (phone)

Required to publish (block):
- [ ] `ava_primary` not null (already tracked)
- [ ] `latitude` / `longitude` present and within Sonoma County bounding box
- [ ] `website_url` resolves (HEAD 200–399 at publish time)
- [ ] `name` non-empty

Warn but allow (surface in UI):
- [ ] `flights` has at least one row
- [ ] `winery_varietals` has at least one row
- [ ] `reservation_type` set
- [ ] At least one `style_*` score not default 3

#### 4. Freshness signals (phone)

- [ ] **`wineries.last_verified_at`** — already exists. Every publish action stamps it. Every places-sync touch stamps it. Every successful crawl stamps `last_scraped_at`.
- [ ] **Stale report cron** — weekly script emails admin a list of N oldest `last_verified_at` wineries. Target: every winery re-verified at least once per quarter.
- [ ] **UI freshness badge** on `/wineries/[slug]` — small "Verified Apr 2026" line near the hours/price block. Builds user trust and internal accountability.

#### 5. Places sync (phone — deferred from Hours & Ratings section above)

- [ ] Referenced there. Once built, ratings go directly to `wineries.rating_google` with `last_verified_at` stamp. Google is authoritative; no staging.

#### 6. Snapshot rollback UX (desktop)

- [ ] Already in Admin Panel §7. Listed here so we remember rollback is the safety net for everything above — if a publish introduces bad data, one click reverts.

### Decision Points

- **Are we okay showing editorial 68 wineries with unverified hours for now?** Today, yes. Once "Verified <date>" badges ship, we need a meaningful answer. Either manually re-verify before the badge launches, or accept that rows will show "Verified Oct 2025" until the places/crawl pipelines touch them.
- **Should discovered wineries be publicly visible at all before admin curation?** Current answer: no — `content_status='draft'` keeps them invisible. Revisit if we go to a premium "explore all Sonoma" tier (Enterprise §3), which could expose a lighter, clearly-labeled "auto-discovered, not editorially reviewed" surface.
- **Do we want a public-facing "report an issue" form?** Cheap to add (writes to `data_health_checks` with type `user_report`). Turns every user into a drift detector. Spam is the risk — gate behind a simple hCaptcha or honeypot.

---

## Data Pipeline

### The Plan

Simple: **discover wineries (OSM) → scrape their websites (Firecrawl) → admin reads scrape + manually fills fields → publish to production**.

No Claude extraction, no LLM-generated editorial, no per-field proposal queue. OSM gives names, coordinates, and website URLs. Firecrawl scrapes each winery's website for reference material. Humans curate everything through the admin panel — they read the scraped markdown and type values into the edit form.

### Pipeline Cleanup ✅

All retired code has been removed:

- [x] Claude extraction + staging (`extract-wineries.ts`, `publish-wineries.ts`, `src/lib/pipeline/{extract,publish,diff}.ts`, `content_drafts` table, `@anthropic-ai/sdk`)
- [x] LLM editorial generation (`enrich-wineries.ts`, `src/lib/pipeline/enrich.ts`)
- [x] Association scraping (`discover-associations.ts`, `src/lib/pipeline/associations.ts`)
- [x] Multi-source merge (`scripts/merge-discoveries.ts`)
- [x] Coordinate validator (`scripts/validate-coordinates.ts`)
- [x] CSV import pipeline (`scripts/import-wineries.ts` + helpers + `docs/csv/*`)
- [x] Associated npm scripts and types

### What Stays

| Stage    | Script                      | Library                        | What it does                                                                                                           |
| -------- | --------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Discover | `scripts/discover-osm.ts`   | `src/lib/pipeline/dedup.ts`    | Query OSM Overpass API for wineries in Sonoma County. Writes minimal rows to `wineries` with `content_status='draft'`. |
| Crawl    | `scripts/crawl-wineries.ts` | `src/lib/pipeline/crawl.ts`    | Firecrawl scrapes up to 5 pages per winery website. Stores markdown in `winery_scrapes`.                               |
| Support  | —                           | `src/lib/pipeline/tracking.ts` | Audit trail: records each pipeline run (stage, status, duration, errors) in `pipeline_runs`.                           |

All scripts support `--dry-run`, `--winery=slug`, `--tier=`, `--force` (where applicable).

### Pipeline Improvements

- [x] **Maximize OSM coverage** — Overpass query in `scripts/discover-osm.ts` now covers `craft=winery`, `amenity=winery`, `tourism=wine_cellar`, `industrial=winery`, `building=winery`, `shop=wine` across node/way/relation types. `shop=wine` is noisy (retail wine shops aren't wineries) but admin can delete false positives from the draft queue.
- [ ] **Scheduling** — set up Vercel cron or GitHub Actions: discovery monthly, crawl weekly for editorial tier, monthly for others
- [ ] **URL health checks** — weekly HEAD request to every `website_url` and `booking_url`, store in `url_health_checks` table (already exists in schema)

---

## Admin Panel

_The primary interface for managing winery data. This is where all the quality work happens — editing wineries, reading scrape markdown, publishing drafts to production._

### 1. Auth & Shell

- [x] **`admin_users` table** — migration `20260418000002_create_admin_users.sql` (username + scrypt `password_hash` + timestamps, RLS on, no policies → service-role only).
- [x] **Password hashing helper** — `src/lib/auth/password.ts` uses Node's built-in `crypto.scrypt` (no new dep). Stored format: `scrypt$N$r$p$salt_hex$hash_hex`. `verifyPassword` uses `timingSafeEqual`.
- [x] **Seeder** — `pnpm seed:admins` reads `ADMIN_USER_{1,2}_USERNAME/PASSWORD` from env, hashes, upserts. `--dry-run` validates without DB writes. Rotating a password = re-run.
- [ ] Password-protected `/admin/*` route group — server action checks `username` + `password` against `admin_users` via `verifyPassword`, issues signed session cookie.
- [ ] Login page at `/admin/login` — username + password form, posts to the server action above.
- [ ] Admin layout with sidebar nav: Dashboard, Wineries, Pipeline, Health.

### 2. Dashboard (`/admin`)

- [ ] Draft wineries count (link to list filtered by `content_status='draft'`)
- [ ] Last pipeline run per stage with status and timestamp
- [ ] Coverage breakdown: published / draft / `data_source` split

### 3. Winery Editor (`/admin/wineries`)

Direct editing — for reading scraped markdown, filling in fields, and publishing drafts.

- [ ] **Winery list** — searchable, filterable by `content_status` (draft/published) and `data_source`, sortable by name/updated
- [ ] **Edit form** — all winery fields: contact info, hours, amenities, experience flags, editorial content, style scores
- [ ] **Scrape viewer** — side panel showing the latest `winery_scrapes` markdown so admin can read source material while filling fields
- [ ] **Publish action** — flips `content_status` from `'draft'` to `'published'`. Gate behind required-field checks (at minimum `ava_primary` not null). Creates a `winery_snapshots` row first for rollback.
- [ ] **Delete action** — confirmation modal, cascades to `flights`, `winery_varietals`, `winery_scrapes`, `winery_snapshots`.
- [ ] **Add winery** — manually create a new winery (for ones not in OSM)
- [ ] **Change history** — link to snapshots for this winery

### 4. Pipeline Runs (`/admin/pipeline`)

- [ ] **Run history table** — stage, status, duration, wineries processed/failed
- [ ] **Run detail** — expand to see per-winery results and error messages
- [ ] **Manual trigger** — kick off discovery or crawl for a specific winery or tier

### 6. Data Health (`/admin/health`)

- [ ] **Missing fields** — wineries missing critical data (coordinates, website, region)
- [ ] **Stale data** — wineries not verified in >90 days
- [ ] **Broken URLs** — 404s and redirects from `url_health_checks`
- [ ] **Coverage overview** — counts by tier with drill-down

### 7. Rollback

- [ ] **Snapshot timeline** per winery from `winery_snapshots`
- [ ] **Snapshot diff** — compare any snapshot to current data
- [ ] **Revert** — restore a snapshot to the `wineries` row (creates its own snapshot first so you can undo)

---

## Enterprise & Revenue

_How this becomes an actual business. Ordered by effort-to-first-dollar, not total revenue potential._

### Guiding Principles

- **Trust is the moat.** "No winery pays to be listed or ranked higher" is core to the product. Any revenue stream must be compatible with that or clearly labeled when it isn't.
- **No account for the core flow.** The quiz → results → share loop should never require signup. Accounts are optional add-ons for power users and partners.
- **Build on what's already there.** The backend has `shared_itineraries`, `admin_users`, `rate-limit`, RLS — most revenue features are glue code on top.

### 1. Affiliate / Referral Tracking (phone — highest ROI first)

Wineries publish their own booking URLs. Several platforms (Tock, Resy, WineDirect) offer referral/affiliate programs. Even without formal programs we can demonstrate attribution and negotiate per-partner commissions.

- [ ] **Migration: `booking_events`** — `(id, winery_id, plan_id nullable, session_id, clicked_at, destination_url, utm_source, utm_medium, user_agent_hash, ip_hash)`. Hashes, not raw — privacy-safe.
- [ ] **Server action + `navigator.sendBeacon`** on every "Book a Tasting" / "Visit Website" CTA on `/wineries/[slug]` and `/plan/[id]`.
- [ ] **Outbound URL rewriter** — append `?utm_source=sonomasip&utm_medium=referral&utm_campaign=<plan_id or slug>` to outbound links.
- [ ] **Weekly CSV export** for manual reconciliation with winery partners (`scripts/booking-events-export.ts`).
- [ ] **Admin attribution view** (desktop) — clicks per winery, conversion if partner confirms.
- [ ] **Partner outreach template** — one-pager explaining how attribution works and proposing a per-confirmed-booking rate.

**Time to first dollar:** 2–4 weeks. **Revenue ceiling:** modest but clean; scales with traffic.

### 2. Email Capture + Newsletter (phone)

Today a user takes the quiz, sees results, shares a plan, and leaves. No way to re-engage. An email list monetizes indirectly (affiliate drops, premium upsells later) and is the cheapest retention lever.

- [ ] **Migration: `newsletter_signups`** — `(id, email, source, plan_id nullable, signed_up_at, unsubscribed_at, confirmed_at)`. Double-opt-in.
- [ ] **Optional email field on the share flow** — "Get seasonal Sonoma picks? (optional)" checkbox.
- [ ] **Resend transactional email** for confirmation link + monthly newsletter.
- [ ] **Unsubscribe route** — `/unsubscribe/[token]` flips `unsubscribed_at`.
- [ ] **Admin export** — CSV of confirmed signups for manual campaign send (or wire directly to Mailchimp/Buttondown/ConvertKit).

### 3. Premium Subscription — "Explore All of Sonoma" (phone core, desktop polish)

Free tier: 68 editorially-curated wineries. Premium tier: access the full auto-discovered catalog (200+ once OSM discovery completes a full run), with clear "not yet editorially reviewed" labels per §Decision Points above.

- [ ] **Migration: `subscriptions`** — `(id, user_id nullable, email, stripe_customer_id, status, current_period_end, tier)`. `user_id` nullable to support email-only subs.
- [ ] **Stripe Checkout** — single-price monthly + annual. Webhook handler at `/api/webhooks/stripe` updates `subscriptions.status`.
- [ ] **Gate in matching engine** — `includeDiscoveredTier` flag on `getWineriesForMatching`, defaulted by session subscription lookup.
- [ ] **Discovered-tier visual treatment** (desktop) — different card styling + "Auto-discovered, not yet editorially reviewed" badge.
- [ ] **Account shell** — `/account` with subscription status + cancel link (Stripe customer portal handles the rest).

**Price:** $5/month or $40/year. Low enough to be impulse; high enough to justify the Stripe overhead.

### 4. Public API (phone)

Travel blogs, AI assistants, hotel concierge tools want structured winery data. A clean API is the easiest B2B revenue because it sells against existing Google Maps / Yelp data with better Sonoma-specific curation.

- [ ] **Migration: `api_keys`** — `(id, key_hash, owner_email, tier, rate_limit_per_day, created_at, revoked_at)`.
- [ ] **`/api/v1/wineries`** — paginated catalog. Query params: `region`, `varietal`, `reservation_type`, `min_rating`.
- [ ] **`/api/v1/wineries/[slug]`** — single winery detail.
- [ ] **`/api/v1/match`** — POST quiz answers, return scored results + explanations. Reuses `src/lib/matching/orchestrator.ts`.
- [ ] **API key auth middleware** — hash check + per-key rate limit (extend `src/lib/rate-limit.ts`).
- [ ] **Public docs page** — `/developers` with OpenAPI schema + examples.
- [ ] **Tiers:** Free (100 req/day, read-only catalog). Pro ($49/mo, 10k req/day, matching engine, style scores). Enterprise (custom, webhooks, SLAs).

### 5. Winery Self-Service Dashboard (mixed — phone for data, desktop for UI)

Once affiliate tracking (§1) has a few weeks of data, wineries will ask "can I see my numbers?" That's the hook into B2B.

- [ ] **Invite flow** — admin generates a one-time signup link per winery; winery staff sets a password → row in `winery_users` (new table) linked to `winery_id`.
- [ ] **`/winery-admin/dashboard`** — shows: clicks from SonomaSip this month, plans that included you, top search terms (quiz preferences) that matched you, suggested profile improvements.
- [ ] **Profile claim / edit** — winery can edit a constrained subset of fields (photos, description, flights pricing) with changes staged as drafts for admin approval.
- [ ] **Listing upgrade SKU** — free default listing vs $29/mo "enhanced" listing (extra photos, featured in AVA region page, priority in ties, **not** in ranking — transparency).

### 6. White-Label for Tour Operators (desktop-heavy)

Local tour operators, hotel concierges, and wine-tour apps need branded planning tools. License the engine.

- [ ] **Tenant model** — `tenants` table, every `shared_itineraries` row gets a `tenant_id`.
- [ ] **Subdomain routing** — `partner.sonomasip.com` serves a themed shell (logo, colors, copy overrides).
- [ ] **Config-driven branding** — `tenants.config_json` (logo_url, primary_color, hero_copy).
- [ ] **Contract:** $500–$2000/mo depending on volume + custom domain + support.
- [ ] **Lead magnet:** public marketing page `/for-partners` explaining the offer.

### 7. Sponsored / Featured Placement (desktop for UI trust signals)

Controversial — only worth doing if clearly labeled. Some wineries will pay to be featured in a "Today's Featured Winery" slot without affecting matching ranking.

- [ ] **Migration:** `wineries.sponsor_status` enum + `sponsor_period_end`. Featured ≠ ranked higher.
- [ ] **Dedicated surface** — a "Featured This Week" card on `/` and `/wineries` that is **always** labeled as sponsored. Never blends into matching results.
- [ ] **Admin flow** — manually flip sponsor_status; expiry handled by a cron.
- [ ] **Explicit disclosure on `/about`** — "Featured slots are paid placements. Our matching engine and recommendations are unaffected."

### 8. Seasonal / Event Partnerships (mixed)

Sonoma has harvest season, wine auctions, sommelier dinners. Curated seasonal plans are an affiliate goldmine if done well.

- [ ] **Migration: `seasonal_plans`** — `(id, slug, title, subtitle, season, winery_ids, active_from, active_to, hero_image_url, sponsor)`.
- [ ] **Admin editor** (desktop) — compose a featured plan: pick wineries, write copy, set dates.
- [ ] **Public route** — `/seasonal/[slug]` renders like a shared plan but with rich editorial intro + sponsor disclosure if applicable.
- [ ] **Email newsletter hook** (§2) — feature the current seasonal plan in every send.

### Priority Order — What to Build First

If optimizing for fastest revenue validation:

1. **Affiliate tracking (§1)** — 2–4 weeks, proves partner-facing value.
2. **Email capture (§2)** — 1 week, compounds over time.
3. **Seasonal plans (§8)** — 2–3 weeks, content-driven traffic + affiliate lift.
4. **API v1 (§4)** — 3–4 weeks, decoupled revenue stream with no UX churn.
5. **Premium subscription (§3)** — 2–3 weeks, but needs meaningful discovered-tier catalog first.
6. **Winery dashboard (§5)** — wait until §1 has 4+ weeks of data to show.
7. **White-label (§6)** / **sponsored placements (§7)** — build once pipeline + admin + §1 are solid.

---

## Deploy to Vercel — Step by Step

_Get this in front of coworkers for real product feedback. The app is production-ready — every page works with real Supabase data._

### Prerequisites

You already have:

- [x] Supabase project (ref: `rxihebhphpbhzanijfuv`, region: us-east-2)
- [x] Database with all migrations applied and 68 wineries imported
- [x] Mapbox account with custom "Dawn Wine Country" style
- [ ] Vercel account (free tier is fine — 100GB bandwidth/mo)

### Step 1: Connect repo to Vercel

```bash
# Option A: Vercel CLI (recommended)
pnpm add -g vercel
vercel login
vercel link                    # Follow prompts to create/link project
vercel env add NEXT_PUBLIC_SUPABASE_URL        # Paste your Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY   # Paste your anon key
vercel env add SUPABASE_SERVICE_ROLE_KEY       # Paste your service role key (secret)
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN        # Paste your Mapbox public token
vercel env add NEXT_PUBLIC_SITE_URL            # Your production URL (e.g., https://sonomasip.vercel.app)

# Option B: Vercel Dashboard
# 1. Go to vercel.com/new
# 2. Import your GitHub repo
# 3. Set environment variables in the dashboard (Settings → Environment Variables)
```

### Step 2: Environment variables

| Variable                        | Where to find it                                          | Required                         |
| ------------------------------- | --------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard → Settings → API → Project URL         | Yes                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → `anon` `public` key | Yes                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase dashboard → Settings → API → `service_role` key  | Yes                              |
| `NEXT_PUBLIC_MAPBOX_TOKEN`      | Mapbox dashboard → Access tokens                          | Yes (for maps)                   |
| `NEXT_PUBLIC_SITE_URL`          | Your Vercel deployment URL                                | Optional (defaults to localhost) |

### Step 3: Verify build locally

```bash
pnpm build          # Should complete with no errors
pnpm start          # Test production server at localhost:3000
```

### Step 4: Deploy

```bash
vercel --prod        # Deploy to production

# Or just push to main — Vercel auto-deploys on push if connected via dashboard
git push origin main
```

### Step 5: Post-deploy smoke test

- [x] Home page loads, hero renders, CTA works
- [x] Quiz: complete all 4 steps → results page shows real wineries with scores
- [x] Results: map renders with pins, share button creates a plan URL
- [x] Plan page: shared URL loads the saved itinerary
- [x] Browse: `/wineries` shows all 68 wineries with working filters
- [x] Detail: click any winery → detail page with flights, hours, amenities
- [x] Legal: `/terms` and `/privacy` pages render

### Step 6: Share with coworkers

Share the Vercel URL. Ask them to:

1. Take the quiz with real preferences
2. Review their results — do the recommendations feel right?
3. Try the "Create Your Plan" flow
4. Browse wineries and check detail pages
5. Note anything that feels off, confusing, or broken

### Post-deploy hardening (do after initial feedback)

- [ ] Restrict Mapbox token to your Vercel domain(s) via Mapbox dashboard → Token restrictions
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your actual production URL
- [ ] Verify Supabase RLS works in production (anon key can't write to wineries)

---

## SEO & Performance

- [x] `metadata` export on every winery page (title, description, OG)
- [x] JSON-LD structured data (`Winery` / `TouristAttraction`) where info is accurate
- [x] `sitemap.xml` from `getAllWinerySlugs()` + static pages
- [x] `robots.txt` (allow all, sitemap reference)
- [ ] `next/image` for any winery photos (if added)
- [ ] Lighthouse-driven fixes (LCP, font loading, CLS)

---

## Analytics

- [ ] Plausible snippet / proxy per their Next.js guidance
- [ ] Events: `quiz_started`, `quiz_step_completed`, `quiz_completed`, `results_rendered`, `winery_detail_opened`, `share_created`, `pdf_downloaded`, `email_sent`
- [ ] Funnel visualization: quiz start → completion → share

---

## Future

_After admin panel and core pipeline are solid._

### Observability (Sentry)

- [ ] `@sentry/nextjs` for client + server error tracking
- [ ] `@sentry/node` for pipeline script instrumentation
- [ ] Alerts on pipeline failures and error spikes

### Click Attribution

- [ ] Track "Book a Tasting" clicks via `navigator.sendBeacon`
- [ ] Append `?ref=sonomasip` to outbound booking URLs
- [ ] Click analytics in admin panel

### Kill Switches (env vars)

- [ ] `NEXT_PUBLIC_DISABLE_MAP=true` — static image instead of Mapbox GL
- [ ] `DISABLE_EMAIL=true` — disable email share
- [ ] `MAINTENANCE_MODE=true` — disable all writes, site stays browsable

### Bot Protection

- [ ] `navigator.webdriver` check before mounting map; bots get static placeholder
- [ ] Honeypot fields on quiz and email forms

### Geographic Expansion

- [ ] Add Napa Valley AVA regions to `ava_region` enum
- [ ] Update app copy from "Sonoma" to "Sonoma & Napa"

---

## References

| Artifact                             | Path / URL                             |
| ------------------------------------ | -------------------------------------- |
| Product requirements (non-technical) | `docs/PRD.md`                          |
| Scoring / filters (technical)        | `docs/SCORING.md`                      |
| ERD (database schema diagram)        | `docs/ERD.md`                          |
| shadcn/ui docs                       | https://ui.shadcn.com/docs             |
| shadcn — Tailwind v4 guide           | https://ui.shadcn.com/docs/tailwind-v4 |
| Next.js agent docs (in node_modules) | `node_modules/next/dist/docs/`         |

---

## Stack

| Layer         | Choice                                    |
| ------------- | ----------------------------------------- |
| App           | Next.js 16 (App Router), TypeScript       |
| Components    | shadcn/ui (Radix primitives, Tailwind v4) |
| Database      | Supabase (PostgreSQL)                     |
| Map           | Mapbox GL (`react-map-gl`)                |
| Email         | Resend (not yet wired)                    |
| Analytics     | Vercel Speed Insights (live)              |
| Hosting       | Vercel + Supabase                         |
| Observability | Sentry (not yet integrated)               |

---

## What's been built (completed work)

<details>
<summary><strong>Phase 0 — Spec & Design</strong> ✅</summary>

Repo, tooling, Prettier/ESLint, `.env.example`, route list, legal copy (terms, privacy, disclaimers on every data page), design system (fonts, color tokens, WCAG AA), shadcn/ui installed with full Sonoma palette mapped to semantic tokens.

</details>

<details>
<summary><strong>Phase 3 — Next.js Foundation</strong> ✅</summary>

App Router bootstrap, absolute imports, Tailwind, root layout, `env.ts` with Zod validation, dynamic favicon/OG images, PWA manifest, route-level loading skeletons.

</details>

<details>
<summary><strong>Phase 3.5 — UI Prototype</strong> ✅</summary>

All screens built and polished with real data: landing page (hero, how it works, features grid, featured wineries, CTA), quiz (4-step flow with progress bar, session persistence, animations), results (score rings, map with fly-to, share/print/email actions, empty/error states), winery detail (two-column layout, flights, hours, amenities, nearby wineries), browse/directory (filter sidebar, sort, 3-column grid), shared plan (itinerary with numbered stops, map, disclaimer), Mapbox (custom "Dawn Wine Country" style, lazy-loaded, interactive markers/popups).

</details>

<details>
<summary><strong>Phase D1–D5 — Schema, Data Quality, Import Pipeline</strong> ✅</summary>

Schema: 7 migrations applied (enums, wineries, flights, varietals, shared_itineraries, health checks, field overrides). RLS on all tables. Import pipeline: `scripts/import-wineries.ts` parses 8 CSV sheets, validates, upserts. 68 wineries, 118 flights, 344 varietals. Types generated from Supabase + mapper layer. Coordinates validated for all 68 wineries.

</details>

<details>
<summary><strong>Phase D6 — Matching Engine</strong> ✅</summary>

Filters, scoring, explanations, orchestrator, progressive filter relaxation, 44 unit tests, 7 golden file profiles (55 assertions against real Supabase data). `pnpm test:golden` to run.

</details>

<details>
<summary><strong>Phase D7 — Wire Up (Mock → Real Data)</strong> ✅</summary>

All pages wired to Supabase: quiz submit → server action → matching engine → results. Winery detail/browse pages use real data. Share flow saves to `shared_itineraries` table. ISR caching on winery pages (hourly revalidation).

</details>

<details>
<summary><strong>Rate Limiting</strong> ✅</summary>

In-memory token bucket (`src/lib/rate-limit.ts`), applied to quiz submit (10/hr) and plan create (5/hr), 429 + Retry-After responses, global middleware 60 req/min per IP (`src/middleware.ts`).

</details>

<details>
<summary><strong>Data Pipeline — CLI & Engine</strong> ✅</summary>

Full ETL pipeline built as CLI scripts with library modules. Discovery (OSM Overpass API), crawl (Firecrawl, 5 pages/winery), extract (Claude Haiku with confidence scores), publish (auto-approve + manual review + snapshots). Orchestrator runs all stages. 7 pipeline DB tables with RLS. 3 test suites. All scripts support `--dry-run` and common filters.

</details>

<details>
<summary><strong>Data Pipeline — Retired Code</strong></summary>

The following was built but retired in favor of a simpler pipeline + admin UI:

- **Claude extraction + content_drafts staging** (`scripts/extract-wineries.ts`, `scripts/publish-wineries.ts`, `src/lib/pipeline/{extract,publish,diff}.ts`, `content_drafts` table) — ~2200 lines. Claude Haiku extracted structured fields from scraped markdown into a per-field proposal table; publish classified and applied them. Replaced by manual admin curation: admin reads `winery_scrapes` markdown and types values into the edit form directly.
- **Association discovery** (`scripts/discover-associations.ts`, `src/lib/pipeline/associations.ts`, `associations.test.ts`) — 769 lines. Scraped Sonoma Vintners + Wine Road HTML directories. Fragile (bot challenges, HTML changes). OSM provides better coverage with zero fragility.
- **LLM enrichment** (`scripts/enrich-wineries.ts`, `src/lib/pipeline/enrich.ts`) — 882 lines. Claude Sonnet auto-generated taglines, descriptions, style scores, editorial judgments. Replaced by manual editing in admin panel — humans write better editorial content.
- **Merge discoveries** (`scripts/merge-discoveries.ts`) — 154 lines. Cross-source dedup and promotion. Not needed with single OSM discovery source.
- **Coordinate validator** (`scripts/validate-coordinates.ts`) — 457 lines. One-time utility that already served its purpose during initial data import.
</details>
