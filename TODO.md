# Sonoma Sip — Engineering TODO

**Purpose:** Technical implementation tracker. Product intent & policies: **[`docs/PRD.md`](docs/PRD.md)**. Matching math: **[`docs/SCORING.md`](docs/SCORING.md)**.

> **UI WORK RULE:** Always invoke the `/ui` skill when building or modifying any page, component, or visual element.

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
- [ ] **Admin data accessor** — new helper (e.g. `getAllWineriesForAdmin` in `src/lib/data/wineries.ts`) that returns *all* wineries including drafts.
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

All 68 wineries currently show hours and ratings from the one-time editorial CSV import. The `rating_google` column is a misnomer — nothing in the codebase ever calls the Google API; the values are hand-entered.

**Hours — manual entry via scrape viewer:**
- [ ] Admin reads `winery_scrapes` markdown (shown in the scrape viewer panel of the edit form) and types hours into the winery row directly. No auto-extraction.

**Ratings — future `places` stage:**
- [ ] **Add `google_place_id` column** via migration (`supabase/migrations/`).
- [ ] **New stage: `scripts/places-sync.ts` + lib `src/lib/pipeline/places.ts`.** For each winery: resolve `place_id` via Places `findPlaceFromText` using `name + address_city` (cache to the new column), then fetch Place Details for `rating` + `user_ratings_total`. Write directly to `wineries.rating_google` / `wineries.review_count_total` — Google is authoritative, no draft staging needed.
- [ ] **Wire the new stage into `scripts/run-pipeline.ts`** so a single `pnpm pipeline:run` covers discover → crawl → places.
- [ ] **Stamp `last_verified_at`** on every winery the places stage touches so the UI can surface freshness.
- [ ] **Env + ToS:** add `GOOGLE_PLACES_API_KEY` to `.env.example` + Vercel envs; attribute "Google" in the UI near the star display; don't store raw review text; refresh no more than every ~30 days per winery.
- [ ] Either hide the star row in `src/app/wineries/[slug]/page.tsx:276-290` until the first places-sync run lands, or accept that the editorial values stand in until then. Decision point for before we share more widely.

### Supabase Development Environment

Set up a safe local/dev workflow so we can develop, create itineraries, tweak data, and experiment without touching production. Options to evaluate:

- [ ] **Option A — Separate Supabase project:** Create a second Supabase project (e.g. `sonoma-sip-dev`) with its own database, auth, and API keys. Seed it with production data via `pg_dump` / `pg_restore` or the import pipeline. Vercel preview deployments and local dev use the dev project's keys; production uses the prod project's keys.
- [ ] **Option B — Supabase branching:** Use [Supabase Branching](https://supabase.com/docs/guides/deployment/branching) (if available on the plan) to get ephemeral database branches tied to Git branches. Migrations and seed data apply automatically per branch.
- [ ] **Option C — Local Supabase (Docker):** Run `supabase start` locally for a fully local Postgres + Auth + API stack. No risk to production at all. Requires Docker. Good for schema iteration but won't test Supabase-hosted features (edge functions, storage CDN, etc.).

**Regardless of option chosen:**
- [ ] Document the chosen approach in this file and `CLAUDE.md`
- [ ] Update `.env.example` with dev vs. prod variable guidance
- [ ] Ensure `vercel env` has separate values for preview vs. production environments
- [ ] Add seed/import script that populates the dev database with representative data
- [ ] Verify local `pnpm dev` works against the dev database end-to-end (quiz → results → plan creation)

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

| Stage | Script | Library | What it does |
|-------|--------|---------|-------------|
| Discover | `scripts/discover-osm.ts` | `src/lib/pipeline/dedup.ts` | Query OSM Overpass API for wineries in Sonoma County. Writes minimal rows to `wineries` with `content_status='draft'`. |
| Crawl | `scripts/crawl-wineries.ts` | `src/lib/pipeline/crawl.ts` | Firecrawl scrapes up to 5 pages per winery website. Stores markdown in `winery_scrapes`. |
| Support | — | `src/lib/pipeline/tracking.ts` | Audit trail: records each pipeline run (stage, status, duration, errors) in `pipeline_runs`. |

All scripts support `--dry-run`, `--winery=slug`, `--tier=`, `--force` (where applicable).

### Pipeline Improvements

- [ ] **Maximize OSM coverage** — review the Overpass query to ensure we're catching all winery types (`amenity=winery`, `craft=winery`, `tourism=wine_cellar`, `shop=wine`). Goal: discover as many Sonoma County wineries as possible from this single source.
- [ ] **Scheduling** — set up Vercel cron or GitHub Actions: discovery monthly, crawl weekly for editorial tier, monthly for others
- [ ] **URL health checks** — weekly HEAD request to every `website_url` and `booking_url`, store in `url_health_checks` table (already exists in schema)

---

## Admin Panel

_The primary interface for managing winery data. This is where all the quality work happens — editing wineries, reading scrape markdown, publishing drafts to production._

### 1. Auth & Shell

- [ ] Password-protected `/admin/*` route group — env var `ADMIN_PASSWORD`, cookie-based session
- [ ] Login page at `/admin` — single password field, no user accounts needed
- [ ] Admin layout with sidebar nav: Dashboard, Wineries, Pipeline, Health

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
