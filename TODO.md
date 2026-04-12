# Sonoma Sip — Engineering TODO

**Purpose:** Technical implementation tracker. Product intent & policies: **[`docs/PRD.md`](docs/PRD.md)**. Matching math: **[`docs/SCORING.md`](docs/SCORING.md)**.

> **UI WORK RULE:** Always invoke the `/ui` skill when building or modifying any page, component, or visual element.

---

## Up Next

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

- [ ] **Remove "Get Started" button from quiz page.** The user is already on the quiz — the CTA at the bottom is redundant. Remove or replace with something contextually useful.
- [ ] **Results page — map overflow on mobile.** After creating an itinerary, the map spills outside its container on iPhone-width screens. Fix: constrain the map to the container width, add proper `border-radius`, and ensure no horizontal overflow.
- [ ] **Results page — bottom border-radius clipping.** The bottom corners of the results card/container are being cut off on mobile. Fix the `overflow` / `border-radius` interaction so corners render fully.
- [ ] **Mobile navigation overhaul.** The current navbar/menu doesn't look good on mobile. Redesign using the `/ui` skill and ui.sh picker workflow — generate multiple variants (e.g. slide-out drawer, bottom sheet, hamburger menu) and pick the best one in-browser. Ensure the nav works well across all mobile pages (landing, quiz, results, plan).
- [ ] **Winery detail page — text alignment on mobile.** Some text on the winery detail page is incorrectly centered on mobile viewports. Should be left-aligned to match the rest of the content flow.

### Winery Detail Page — Distance-Based Nearby Suggestions

The "Nearby Wineries" section on `/wineries/[slug]` currently filters by same AVA region and takes the first 3. We already have `latitude` and `longitude` for all 68 wineries — use them for real proximity.

**Heuristic:**
- **≤ 5 miles = "nearby."** In Sonoma, most AVAs are compact (Dry Creek Valley ~8 mi long, Russian River Valley ~12 mi). A 5-mile radius captures wineries along the same road/corridor — roughly a 10-minute drive on two-lane wine country roads. Beyond 5 miles you're typically crossing into a different area and it stops feeling close.
- **Fallback:** If fewer than 3 wineries fall within 5 miles, backfill with same-region wineries so the section is never empty.

**Implementation:**
- [ ] **Add a `haversineDistance(lat1, lng1, lat2, lng2)` utility** in `src/lib/` that returns distance in miles between two coordinates.
- [ ] **Update `/wineries/[slug]` page** to compute distance from the current winery to all others, filter to ≤ 5 mi, and sort closest-first. Fall back to same-region if fewer than 3 results.
- [ ] **Show distance in the UI** — display something like "2.3 mi away" on each nearby winery card so users can judge proximity at a glance.
- [ ] **Consider the 5-mile threshold after real data review** — once wired up, spot-check a few wineries in dense areas (Healdsburg, Glen Ellen) and sparse areas to confirm the radius feels right. Adjust if needed.

### OG Image for Deep Links (Plan Sharing)

When sharing the home page, the OG preview looks good. But sharing a plan page (`/plan/[id]`) shows the raw URL as text instead of a rich preview. The plan page has OG `title` and `description` metadata but is **missing `og:image`**.

- [ ] **Add a default OG image for plan pages.** At minimum, set a static fallback `og:image` in the plan page's `generateMetadata` so every shared link gets a branded preview card instead of raw URL text. Use the same OG image as the home page as a starting point.
- [ ] **Consider dynamic OG images (stretch).** Use Next.js `opengraph-image.tsx` (or Vercel OG / `@vercel/og`) to generate a dynamic image per plan — e.g. showing the plan title, number of stops, and winery names. This makes each shared link unique and more compelling.
- [ ] **Verify OG tags on all shareable routes.** Audit `/`, `/results`, `/plan/[id]`, and `/wineries/[slug]` to ensure every page that can be shared has proper `og:title`, `og:description`, `og:image`, and `og:url`. Test with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and [Twitter Card Validator](https://cards-dev.twitter.com/validator).

---

## References

| Artifact                             | Path / URL                                  |
| ------------------------------------ | ------------------------------------------- |
| Product requirements (non-technical) | `docs/PRD.md`                               |
| Scoring / filters (technical)        | `docs/SCORING.md`                           |
| Seed / editorial data (Excel)        | `docs/sonoma-winery-database-complete.xlsx` |
| ERD (database schema diagram)        | `docs/ERD.md`                               |
| shadcn/ui docs                       | https://ui.shadcn.com/docs                  |
| shadcn — Tailwind v4 guide           | https://ui.shadcn.com/docs/tailwind-v4      |
| Next.js agent docs (in node_modules) | `node_modules/next/dist/docs/`              |

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

**Still open (non-blocking):**

- [ ] Imagery policy (avoid implying winery endorsement)
- [ ] Verify components render correctly with Sonoma palette (visual check)
</details>

<details>
<summary><strong>Phase 3 — Next.js Foundation</strong> ✅</summary>

App Router bootstrap, absolute imports, Tailwind, root layout, `env.ts` with Zod validation, dynamic favicon/OG images, PWA manifest, route-level loading skeletons.

</details>

<details>
<summary><strong>Phase 3.5 — UI Prototype</strong> ✅</summary>

All screens built and polished with real data:

- **Landing page** — hero, how it works, features grid, featured wineries, CTA
- **Quiz** — 4-step flow with progress bar, session persistence, animations
- **Results** — score rings, map with fly-to, share/print/email actions, empty/error states
- **Winery detail** — two-column layout, flights, hours, amenities, nearby wineries
- **Browse/directory** — filter sidebar, sort, 3-column grid
- **Shared plan** — itinerary with numbered stops, map, disclaimer
- **Mapbox** — custom "Dawn Wine Country" style, lazy-loaded, interactive markers/popups

**Still open (non-blocking):**

- [ ] Performance: Lighthouse audit on deployed build (CLS, FOUT, <3s load)
- [ ] Responsive QA: test at 375px, 768px, 1024px, 1440px
</details>

<details>
<summary><strong>Phase D1–D5 — Schema, Data Quality, Import Pipeline</strong> ✅</summary>

- **Schema:** 7 migrations applied to Supabase (enums, wineries, flights, varietals, shared_itineraries, health checks, field overrides). RLS enabled on all tables.
- **Import pipeline:** `scripts/import-wineries.ts` parses 8 CSV sheets, validates, upserts. Dry-run verified: 68 wineries, 118 flights, 344 varietals, 0 errors.
- **Types:** Generated from Supabase + mapper layer (`toWineryForDisplay`, `toWineryForMatching`).
- **Coordinates:** Validated all 68, fixed 3 inaccurate ones (Coppola, Benziger, Fort Ross).
- **Scripts:** `pnpm db:import`, `pnpm db:import:dry`, `pnpm db:reset`, `pnpm db:gen-types`

**Still open (not blocking deploy but needed before public launch):**

- [ ] D2.1 — Confirm closed wineries (Arrowood, Fieldstone, Murphy-Goode); create `scripts/import-config.yml` with exclusions
- [ ] D2.2 — Audit for duplicate/near-duplicate entries; document merge decisions
- [ ] D2.4 — HTTP HEAD check on all `booking_url` and `website_url`; fix broken links, ensure HTTPS
- [ ] D2.5 — Spot-check experience flags (dog/kid/wheelchair/food) against winery websites (15 wineries)
- [ ] D2.6 — Validate all Excel enum values map to DB enums; document any coercion needed
- [ ] D4.3 — Test RLS: anonymous can SELECT wineries/flights, cannot INSERT/UPDATE/DELETE; service role can do everything
- [ ] D5.3 — Apply exclusions and overrides from import config
</details>

<details>
<summary><strong>Phase D6 — Matching Engine</strong> ✅</summary>

Filters, scoring, explanations, orchestrator, progressive filter relaxation, 44 unit tests, 7 golden file profiles (55 assertions against real Supabase data). `pnpm test:golden` to run.

**Still open (minor refinements):**

- [ ] Review `style_sustainable` → `styleEducational` mapping overlap
- [ ] Re-run `pnpm test:golden -- --update` after any scoring changes
</details>

<details>
<summary><strong>Phase D7 — Wire Up (Mock → Real Data)</strong> ✅</summary>

All pages wired to Supabase: quiz submit → server action → matching engine → results. Winery detail/browse pages use real data. Share flow saves to `shared_itineraries` table. ISR caching on winery pages (hourly revalidation).

</details>

---

## 🚀 Deploy to Vercel — Step by Step

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

- [ ] Home page loads, hero renders, CTA works
- [ ] Quiz: complete all 4 steps → results page shows real wineries with scores
- [ ] Results: map renders with pins, share button creates a plan URL
- [ ] Plan page: shared URL loads the saved itinerary
- [ ] Browse: `/wineries` shows all 68 wineries with working filters
- [ ] Detail: click any winery → detail page with flights, hours, amenities
- [ ] Legal: `/terms` and `/privacy` pages render

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

## Pre-launch polish

_Things to tighten before sharing beyond coworkers. None of these block the Vercel deploy._

### Data quality

- [ ] **Closed wineries:** Confirm Arrowood, Fieldstone, Murphy-Goode are closed; create `scripts/import-config.yml` with `excluded_slugs` + reasons; check for other closures
- [ ] **Duplicates:** Audit for near-duplicate entries (Cline Cellars vs Cline Family Cellars, etc.); define canonical slugs; document merge decisions
- [ ] **URL validation:** HTTP HEAD check on every `booking_url` and `website_url`; fix broken links; ensure HTTPS
- [ ] **Experience flag spot-check:** Verify dog/kid/wheelchair/food flags against 15 winery websites
- [ ] **Enum validation:** Confirm all Excel values map to defined enums; document any coercion
- [ ] **Import config:** Wire `scripts/import-config.yml` exclusions/overrides into `import-wineries.ts`

### Scoring refinements

- [ ] Review `style_sustainable` → `styleEducational` mapping (overlaps for biodynamic/organic wineries but misses educational tour-focused wineries)
- [ ] Re-run golden tests after any scoring changes: `pnpm test:golden -- --update`

### Security & access

- [ ] Test RLS policies: anonymous can SELECT wineries/flights, cannot INSERT/UPDATE/DELETE
- [ ] Restrict Mapbox token to production domain(s) in Mapbox dashboard
- [ ] CSRF verification: confirm Next.js server action origin validation is active

### Visual QA

- [ ] Lighthouse audit on deployed build: target Performance >90, CLS = 0, no FOUT
- [ ] Responsive QA at 375px, 768px, 1024px, 1440px
- [ ] Test iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari

---

## Rate limiting & abuse protection

_Every third-party service has usage-based pricing. This is a pre-public-launch requirement, but not needed for coworker testing._

### Service limits (free tiers)

| Service  | Free tier                | Alert at |
| -------- | ------------------------ | -------- |
| Mapbox   | 50K map loads/mo         | 40K      |
| Supabase | 500MB DB + 5GB bandwidth | 80%      |
| Vercel   | 100GB bandwidth/mo       | 80GB     |
| Resend   | 100 emails/day           | 80/day   |

### Rate limits to implement

| Endpoint          | Limit | Window | Why                     |
| ----------------- | ----- | ------ | ----------------------- |
| Quiz submit       | 10    | 1 hour | Matching engine compute |
| Share/plan create | 5     | 1 hour | DB write spam           |
| Email send        | 3     | 1 hour | Resend free tier        |
| PDF generate      | 5     | 1 hour | Server rendering cost   |

- [x] Choose rate limiting approach: in-memory token bucket (zero dependencies, no paid services)
- [x] Create `src/lib/rate-limit.ts` utility (token bucket with automatic eviction)
- [x] Apply to quiz submit (10/hr), plan create (5/hr) server actions
- [x] Return `429` with `Retry-After` header from middleware
- [x] Middleware: global 60 req/min per IP to catch scrapers (`src/middleware.ts`)

### Kill switches (env vars in Vercel dashboard)

- [ ] `NEXT_PUBLIC_DISABLE_MAP=true` → static image instead of Mapbox GL
- [ ] `DISABLE_EMAIL=true` → disable email share
- [ ] `DISABLE_SHARE_CREATE=true` → stop new plan creation, existing plans still viewable
- [ ] `MAINTENANCE_MODE=true` → disable all writes, site stays browsable

### Bot protection

- [ ] Check `navigator.webdriver` + bot user-agents before mounting map; bots get static placeholder
- [ ] Honeypot fields on quiz and email forms; reject silently if filled

### Cloudflare free tier (future — recommended before public launch)

_The best free protection layer you can add. Handles WAF, DDoS, and distributed rate limiting where in-memory middleware can't (across edge nodes). Requires a custom domain (not `*.vercel.app`)._

#### Step-by-step setup

1. **Create a free Cloudflare account** at cloudflare.com
2. **Add your domain** — Cloudflare will scan existing DNS records
3. **Update nameservers** at your registrar to Cloudflare's (they'll tell you which two)
4. **Wait for propagation** (usually 5–30 minutes, up to 24 hours)
5. **Set SSL/TLS mode to "Full (strict)"** — Cloudflare → Vercel is already HTTPS
6. **Enable "Bot Fight Mode"** — Settings → Security → Bots → toggle on. Free, blocks known bad bots automatically.
7. **Add a rate limiting rule** (1 free rule):
   - Security → WAF → Rate limiting rules → Create rule
   - **When:** URI path contains `/results` (catches server action POSTs to the results page)
   - **Rate:** 20 requests per 10 seconds per IP
   - **Action:** Block for 60 seconds
   - This protects `submitQuiz` and `createPlan` at the edge before requests even reach Vercel
8. **Add WAF custom rules** (5 free rules), suggested:
   - Block requests with empty `User-Agent`
   - Block known scraper ASNs if you see abuse in analytics
   - Challenge requests to `/plan/*` that aren't `GET` (prevents plan creation spam)
   - Block non-US traffic if your audience is US-only (optional, aggressive)
9. **Enable "Under Attack Mode"** as a kill switch during active attacks (presents a 5-second challenge page)
10. **Turn on Cloudflare Analytics** — free, privacy-friendly, see traffic patterns

#### What you get for free

| Feature                    | Free tier                                 |
| -------------------------- | ----------------------------------------- |
| DDoS protection (L3/L4/L7) | Unlimited                                 |
| Bot Fight Mode             | Yes                                       |
| WAF custom rules           | 5 rules                                   |
| Rate limiting rules        | 1 rule                                    |
| SSL/TLS                    | Full                                      |
| Analytics                  | Basic                                     |
| Page rules                 | 3 rules                                   |
| Caching                    | Yes (but Vercel CDN already handles this) |

#### What you don't get (Pro $20/mo)

- WAF managed rulesets (OWASP)
- More rate limiting rules
- Bot analytics / super bot fight mode
- Custom cache rules

---

## SEO & performance

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

## Data Pipeline — Enterprise Winery Data System

_Replace the one-shot CSV import with an automated, multi-source pipeline that keeps data fresh and scales to 400-600+ wineries. Each phase builds on the previous one._

```
Discovery → Crawl → Extract → Enrich → Review → Publish → Monitor
```

**Tech choices:**
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Crawling | Firecrawl (hosted) | Handles JS rendering, returns clean markdown, rate limiting built in |
| LLM Extraction | Claude Haiku via Anthropic SDK | Fast, cheap, good at structured extraction |
| LLM Enrichment | Claude Sonnet via Anthropic SDK | Better at creative/editorial content |
| Scheduling | Vercel Cron or GitHub Actions | Already in the stack |
| Pipeline orchestration | Next.js API routes (`/api/pipeline/*`) | One deploy |
| Admin UI | Next.js pages with shadcn/ui | Consistent with app |

**Cost at scale:** ~$50/mo at 400 wineries (Firecrawl ~$30, Haiku ~$5, Sonnet ~$15).

---

### Phase P1: Foundation (DB + tracking infrastructure)

- [x] Migration: `pipeline_runs` table — `(id, stage, status, wineries_processed, wineries_failed, error_summary, started_at, completed_at, metadata JSONB)`
- [x] Migration: `winery_registry` table — `(id, name, normalized_name, source, source_id, website_url, latitude, longitude, matched_winery_id, coverage_tier, created_at, updated_at)`
- [x] Migration: `winery_scrapes` table — `(id, winery_id, run_id, page_url, page_title, raw_markdown, word_count, scraped_at)`
- [x] Migration: `winery_extractions` table — `(id, winery_id, run_id, extracted_fields JSONB, model_used, token_count, extracted_at)`
- [x] Migration: `content_drafts` table — `(id, winery_id, extraction_id, field_name, current_value, proposed_value, confidence, source_quote, status, reviewed_by, reviewed_at, created_at)`
- [x] Migration: `url_health_checks` table — `(id, winery_id, url, status_code, redirect_url, response_time_ms, checked_at)`
- [x] Migration: add to `wineries` table — `coverage_tier`, `last_scraped_at`, `last_verified_at`, `content_status`, `data_sources JSONB`
- [x] Backfill existing 68 wineries as `coverage_tier = 'editorial'`
- [x] `lib/pipeline/tracking.ts` — helpers to start/complete/fail a pipeline run
- [x] Migration: `winery_snapshots` table — `(id, winery_id, run_id, snapshot JSONB, reason, created_at)` for rollback
- [x] RLS policies on all new tables (service role only for writes, admin read)

### Phase P2: Discovery (find new wineries)

- [x] `scripts/discover-osm.ts` — Overpass API query for `amenity=winery` + `craft=winery` in Sonoma County bounding box
- [x] Fuzzy dedup engine: Levenshtein ≤ 3 on normalized name, coordinate proximity < 200m, exact domain match (`src/lib/pipeline/dedup.ts`)
- [ ] Manual override table for known aliases (e.g., "Jordan Vineyard & Winery" = "Jordan Winery")
- [x] Match against existing 68 wineries; tag matched with `osm_node_id`; unmatched → `discovered` tier
- [x] `pnpm discover:osm` + `pnpm discover:osm:dry`
- [x] Scrape Sonoma County Vintners + Wine Road member directories (public HTML) — `scripts/discover-associations.ts` + `src/lib/pipeline/associations.ts`; anchor-tag parser with per-source member link patterns, social/platform host blocklist, nav/generic-text exclusion, and `--fixture=<path>` flag for offline iteration when association sites return 403 to the bot UA
- [x] Cross-reference against OSM + editorial list; `pnpm discover:associations` — dedups against live `wineries` via `findBestMatch`, upserts matched into `winery_registry` as `editorial` tier and unmatched as `discovered`, tracks run in `pipeline_runs` with per-source counts. Tests: `src/lib/pipeline/associations.test.ts` (18 cases)
- [x] `scripts/merge-discoveries.ts` — merge all sources, dedup, report + optional `--promote` to create stub wineries
- [ ] Coverage tier display: editorial = full detail pages, verified = map + browse + basic matching, discovered = map pin + name + "Visit website" only
- [ ] Schedule: monthly discovery runs

### Phase P3: Crawl (fetch current winery website content)

- [x] Firecrawl account + API key
- [x] `lib/pipeline/crawl.ts` — wrapper: initiate crawl via REST API, poll status, return markdown; 5 pages/winery (free tier budget: 100 wineries/mo), `onlyMainContent`, regex include patterns for visit/tasting/hours/reservation pages
- [x] `scripts/crawl-wineries.ts` — iterate wineries, crawl each site, store to `winery_scrapes`; supports `--winery=slug`, `--tier=editorial`, `--force`, `--dry-run`; 10s delay between wineries; skips wineries scraped within last 30 days
- [x] `pnpm pipeline:crawl` + `pnpm pipeline:crawl:dry`
- [x] `FIRECRAWL_API_KEY` env var (optional in validation, required at runtime by crawl)
- [x] Tested with 3 wineries (Jordan, Cline, Dry Creek) + 1 with DB writes (Iron Horse)
- [ ] Schedule: weekly for editorial, monthly for verified, quarterly for discovered

### Phase P4: Extraction (raw content → structured data) ✅

- [x] `lib/pipeline/extract.ts` — send scraped markdown to Claude Haiku via tool-use (`extract_winery_fields`); truncates per-page and total markdown to stay within token budget
- [x] Extraction schema covers factual winery fields: `phone`, `address_{street,city,zip}`, `reservation_url`, `reservation_type`, `hours`, `max_group_size`, `tasting_duration_typical`, and all experience/amenity booleans (`is_dog_friendly`, `has_food_pairing`, `has_outdoor_seating`, `has_sunset_views`, `has_picnic_area`, `has_cave_tour`, etc.). Each field is `{ value, confidence, source_quote }`.
- [x] Confidence scoring prompt: 1.0 = explicitly stated, 0.5 = inferred, 0.0 = not found; `EXTRACTION_SCHEMA_VERSION` stamped into every extracted row so future shape changes are detectable
- [x] `lib/pipeline/diff.ts` — typed diff engine comparing extracted values to current `wineries` row; normalizes URLs/phones/strings, canonicalizes `hours` JSON, drops proposals below `MIN_DRAFT_CONFIDENCE = 0.4`, emits `DraftProposal[]` for changed fields only (12 vitest cases in `diff.test.ts`)
- [x] Store to `winery_extractions` with `model_used`, `token_count` (input + output), and extracted_fields JSONB including `_schema_version`, `_input_tokens`, `_output_tokens`
- [x] `pnpm pipeline:extract` / `pnpm pipeline:extract:dry` — CLI runner `scripts/extract-wineries.ts` with `--winery=`, `--tier=`, `--limit=`, `--force`, `--dry-run`; loads latest scrape per page_url per winery, skips wineries extracted within 30 days (unless `--force`), clears prior `pending` drafts for the winery before inserting new ones, tracks each run in `pipeline_runs`

### Phase P5: Enrichment (LLM editorial content)

- [x] `lib/pipeline/enrich.ts` — send extracted data + raw content to Claude Sonnet via tool-use (`generate_winery_editorial`); context block packs name, AVA, scale, signature wines, prior extracted facts, then up to 32k chars of scraped markdown across pages
- [x] Generate: `tagline` (≤15 words), `description` (2-3 sentences), `unique_selling_point` (insider tip, 1-2 sentences), `best_for` (3-5 comma-separated tags) — each returned as `{ value, reasoning, confidence }`
- [x] Generate: style scores (`style_classic`, `style_luxury`, `style_family_friendly`, `style_social`, `style_sustainable`, `style_adventure`) on 1–5 integer scale with per-field reasoning
- [x] Generate: editorial judgments (`is_hidden_gem`, `is_must_visit`, `is_local_favorite`, `quality_score`, `popularity_score` — scores 1–10) with per-field reasoning
- [x] Voice guardrails baked into the system prompt: warm, specific over generic ("known for their single-vineyard Pinot Noir" not "best winery"), no fabricated facts, omit fields rather than guess, model told to lower confidence when unsure
- [x] Source citations: every generated field carries its own `reasoning` (stored in `content_drafts.source_quote`); the raw page URLs that fed the model are returned on `EnrichmentResult.sources` and logged per run
- [x] Regeneration policy: skip wineries whose most recent enrichment draft is <`STALE_CONTENT_DAYS` (90) old AND tied to the current latest extraction; re-enrich on a newer extraction or an older draft (see `scripts/enrich-wineries.ts` + `--force`)
- [x] Output: proposals written to `content_drafts` with `status='pending'` (matches the existing draft-status enum) via `buildEnrichmentDrafts()` — drops proposals below `MIN_ENRICHMENT_CONFIDENCE = 0.5` and skips fields that already match the current row after normalization
- [x] `pnpm pipeline:enrich` / `pnpm pipeline:enrich:dry` — CLI runner `scripts/enrich-wineries.ts` with `--winery=`, `--tier=`, `--limit=`, `--force`, `--dry-run`; clears prior pending _enrichment_ drafts (filtered by field_name so extraction drafts stay intact), tracks each run in `pipeline_runs`
- [ ] **Goal: once P5+P6 are stable, the Excel sheet is retired. All data managed through the pipeline + admin UI.**

### Phase P6: Review & Publish (human-in-the-loop)

**Auto-approve rules** (skip human review):

- [x] Confidence ≥ `AUTO_APPROVE_HIGH_CONFIDENCE` (0.9) AND field is factual (phone, address, hours, reservation_url, max_group_size, tasting_duration_typical)
- [x] Addition (current_value is null) AND factual AND confidence ≥ `AUTO_APPROVE_ADDITION_CONFIDENCE` (0.7)
- [ ] Price change within ±20% of current value (N/A — no price field in current draft surface; revisit if pricing gets extracted)

**Flag for human review** (everything else):

- [x] Confidence < 0.9 factual updates
- [x] Editorial content (`tagline`, `description`, `unique_selling_point`, `best_for`)
- [x] Editorial judgments (`is_hidden_gem`, `is_must_visit`, `is_local_favorite`, `quality_score`, `popularity_score`)
- [x] Style scores (`style_classic` … `style_adventure`)
- [x] Experience flags (`is_dog_friendly`, `has_*`, `private_tasting_available`) — all routed to review so reviewers can eyeball matching impact
- [x] Fields affecting match scoring (e.g. `reservation_type`) even at high confidence
- [x] Unknown field names (publisher refuses)

**Classification + publish engine** — `src/lib/pipeline/publish.ts`:

- [x] `DRAFT_FIELDS` registry: category (`factual` / `experience_flag` / `editorial` / `style_score` / `editorial_judgment`), storage type (`text` / `boolean` / `integer` / `hours_json`), and `affectsMatching` flag for every publishable field
- [x] `classifyDraft(draft)` — returns `{ auto, reason }` using the rules above; category checked before `affectsMatching` so reasons are specific (`style_score`, not `affects_matching`)
- [x] `parseProposedValue(field, text)` — deserializes `content_drafts.proposed_value` (always stored as text) back into the winery column's native type; throws on unknown fields or malformed values
- [x] `buildWineryPatch(drafts)` — merges a winery's approved drafts into one typed `{ field → value }` patch
- [x] `nextCoverageTier(current)` — promotes `discovered → verified` on first publish; other tiers unchanged
- [x] `classifyProposal(proposal)` — convenience wrapper for in-memory `DraftProposal` / `EnrichmentDraftProposal` values
- [x] 24 unit tests covering auto-approve rules, parsers, patch merging, and tier promotion (`src/lib/pipeline/publish.test.ts`)

Admin UI tasks (deferred — `uidotsh` MCP offline):

- [ ] Password-protected route group: `/admin/*`; env var `ADMIN_PASSWORD`; middleware auth check
- [ ] `/admin/review` — pending drafts queue sorted by priority (editorial wineries first)
- [ ] Side-by-side diff: current value vs. proposed value with source quote
- [ ] Actions: Approve / Reject (with note) / Edit & Approve
- [ ] Bulk: "Approve all for this winery", "Skip to next"
- [ ] Keyboard shortcuts: A=approve, E=edit, R=reject, N=next
- [ ] Progress indicator: "23 of 68 wineries reviewed"

Publish flow:

- [x] Snapshot current winery row to `winery_snapshots` before overwriting (JSONB copy + `run_id`, `reason='pipeline_publish'`)
- [x] Single-statement UPDATE per winery containing every approved field change + `last_verified_at=now()` + `content_status='published'` + coverage-tier promotion
- [x] Applied drafts deleted after apply; audit trail lives in `pipeline_runs.metadata` (`applied[]` with snapshot_id, field_count, field names, tier transition) and `winery_snapshots` (before-state)
- [x] `pnpm pipeline:publish` / `pnpm pipeline:publish:dry` (`scripts/publish-wineries.ts`)
  - `--winery=slug` — limit to a single winery
  - `--auto-only` — run the auto-approve sweep without applying anything
  - `--skip-auto` — apply already-approved drafts without re-running the sweep
  - `--dry-run` — classify + report, no writes
- [x] Pipeline run tracked with `stage='publish'`; failures mark the run `failed` with an `error_summary`, partial successes mark `partial`

Rollback:

- [ ] `/admin/history/:wineryId` — timeline of snapshots per winery (deferred with admin UI)
- [ ] "Revert to this version" button restores snapshot JSONB to `wineries` row (deferred with admin UI)
- [ ] Revert creates its own snapshot (so you can undo a revert) (deferred with admin UI)

### Phase P7: Monitoring & Scheduling

- [ ] URL health check: weekly HEAD request to every winery URL; flag 404s and redirects; store in `url_health_checks`
- [ ] Staleness detection: alert when winery not verified in >90 days
- [ ] Pipeline health: success/failure rates per stage per run via `pipeline_runs` queries
- [ ] Data quality: flag wineries missing critical fields (name, region, lat/lng)
- [ ] `/admin/health` dashboard — overview: winery count, last import/scrape/enrichment dates, broken URLs, stale data warnings, pipeline run history
- [ ] Vercel cron config for all scheduled stages (discovery monthly, crawl weekly/monthly, health checks weekly)
- [ ] Show "Last verified: {date}" on winery detail page
- [ ] "Report an issue" link on winery detail page

### Phase P8: Pipeline orchestration & ops

- [x] `scripts/run-pipeline.ts` — discovery → crawl → extract → enrich → publish (auto-approve + apply) in sequence. Each stage is spawned as its own tsx subprocess so the orchestrator reuses existing per-stage logic (`pipeline_runs` tracking, skip-if-recent windows, draft cleanup).
- [x] Per-stage error handling: stage failures abort by default; `--continue-on-error` keeps going. Final summary table prints stage, status, wall-clock duration, and exit code/notes.
- [x] `pnpm pipeline:run`, `pnpm pipeline:run:dry`, `pnpm pipeline:run --winery=<id>` (auto-skips discovery when a winery filter is set), plus `--tier=`, `--limit=`, `--force`, `--only=`, `--skip=`
- [ ] `/admin/pipeline` — manual trigger buttons, run status, last run summary, raw scrape viewer
- [ ] Health check endpoint: `/api/health`
- Error tracking → see **Phase P10: Observability — Sentry**

### Phase P9: Click attribution & analytics

- [ ] `click_events` table: `(id, winery_id, source_page, booking_url, clicked_at, session_id)`
- [ ] Track "Book a Tasting" clicks via `navigator.sendBeacon` (non-blocking)
- [ ] Append `?ref=sonomasip` to outbound booking URLs
- [ ] `/admin/clicks` dashboard: clicks per winery (7d/30d/all-time), top performers, CSV export

### Phase P10: Observability — Sentry

_Goal: every unhandled error in the Next.js app **and** every pipeline stage failure lands in Sentry with enough context (stage, run_id, winery_id, git SHA) to debug without re-running the pipeline. Source maps uploaded on every deploy so stack traces are readable._

**Account + project setup**

- [ ] Create Sentry org + project (`sonomasip-web`); move the stub from the Service accounts list here
- [ ] Generate auth token with `project:releases` + `project:write` scopes for source map uploads
- [ ] Add env vars to Vercel and `.env.local`: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
- [ ] Document the vars in `.env.example` and `src/lib/env.ts` (optional at runtime, required in production)

**Next.js integration**

- [ ] `pnpm add @sentry/nextjs`
- [ ] Run `npx @sentry/wizard@latest -i nextjs` to scaffold `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and the `instrumentation.ts` hook
- [ ] Wrap `next.config.ts` with `withSentryConfig` — enable `hideSourceMaps: true`, `widenClientFileUpload: true`, tunnel route `/monitoring` to bypass ad-blockers
- [ ] Set release name to the git SHA (`SENTRY_RELEASE=${VERCEL_GIT_COMMIT_SHA}`) so Vercel deploys and Sentry releases line up
- [ ] `tracesSampleRate`: 1.0 in dev, 0.1 in prod; `profilesSampleRate`: 0 for now (cost)
- [ ] `beforeSend` hook scrubs: scraped markdown bodies, Firecrawl API keys, anthropic keys, supabase service role, cookies
- [ ] Verify source map upload on a preview deploy (throw a test error from `/api/sentry-example-api`, confirm symbolicated stack trace in Sentry)

**Pipeline CLI instrumentation**

- [ ] `pnpm add @sentry/node` (separate from `@sentry/nextjs` — the CLI scripts run as `tsx` subprocesses, not in Next.js runtime)
- [ ] `src/lib/pipeline/sentry.ts` — `initPipelineSentry({ stage, runId })` that calls `Sentry.init` once per subprocess with the same DSN, tags (`stage`, `run_id`), and a `flush(2000)` hook for `process.on('beforeExit')`
- [ ] Call `initPipelineSentry` at the top of every stage script: `scripts/discover-osm.ts`, `scripts/discover-associations.ts`, `scripts/merge-discoveries.ts`, `scripts/crawl-wineries.ts`, `scripts/extract-wineries.ts`, `scripts/enrich-wineries.ts`, `scripts/publish-wineries.ts`, `scripts/run-pipeline.ts`
- [ ] Wrap each per-winery loop iteration in `Sentry.withScope` — tag `winery_id`, `winery_slug`, `coverage_tier` so one bad winery doesn't drown out the rest
- [ ] Report stage failures from `lib/pipeline/tracking.ts::failPipelineRun` as Sentry events with `fingerprint: [stage, error_class]` so repeated failures group
- [ ] Breadcrumb on each stage transition in `run-pipeline.ts` (`stage_start`, `stage_complete`, `stage_failed`) with duration + exit code

**Alerting**

- [ ] Alert rule: any pipeline event with `level=error` AND `stage in (crawl,extract,enrich,publish)` → email + Slack
- [ ] Alert rule: spike detection on Next.js server errors (>10/min)
- [ ] Alert rule: any error tagged `winery_id` repeating across ≥3 consecutive runs (persistent bad winery)
- [ ] Weekly digest: top 10 issues by frequency

**Verification**

- [ ] Throw a dummy error from `scripts/run-pipeline.ts` behind a `--sentry-test` flag and confirm it shows up with stage + run_id tags
- [ ] Trigger a client-side error from a dev page and confirm source maps resolve to `.tsx` line numbers
- [ ] Document Sentry setup + DSN rotation in `docs/OPS.md`

### Future: Geographic expansion

- [ ] Add Napa Valley AVA regions to `ava_region` enum
- [ ] Update app copy from "Sonoma" to "Sonoma & Napa" where appropriate

### Future: Google Places Sync

- [ ] Map `google_place_id` for each winery
- [ ] Weekly sync: auto-update `rating_google` + `review_count`; flag hours drift for review
- [ ] Never auto-update: hours, booking_url, experience flags, style scores
- [ ] ToS compliance

---

## Post-MVP (Phase 9)

### Product expansion

- [ ] Drive-time ordering (Mapbox Directions / OSRM)
- [ ] Optional auth / saved trips
- [ ] Booking partner integrations if APIs exist
- [ ] PDF export: text-first print route; v2 with Mapbox Static image
- [ ] Email share: send via Resend with share URL + summary

### AI features (after deterministic V1 is stable)

- [ ] Natural language → plan: parse intent → map to filter/score params → return same explainable cards
- [ ] RAG / tool-calling: expose winery rows to model; cite slugs/fields

---

## Service accounts (manual setup when needed)

- [x] Supabase project (ref: `rxihebhphpbhzanijfuv`, region: us-east-2)
- [ ] Vercel project linked to repo
- [ ] Mapbox token restricted to app domain(s)
- [ ] Domain DNS + SSL
- [ ] Transactional email provider (Resend) + verified domain + API key
- [ ] Sentry project (tracked in **Phase P10**)
- [ ] Cloudflare account (for content pipeline)
- [ ] Plausible analytics account

---

## Design decisions (reference)

| Decision                                 | Resolution                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Budget band → dollar mapping             | `$` ≤ $35, `$$` ≤ $65, `$$$` ≤ $100, `$$$$` = no cap                                                  |
| Style dimension scores                   | 5 numeric columns (1–5): relaxed, adventurous, educational, celebratory, social                       |
| `ReservationType` values                 | `walk_ins_welcome`, `reservations_recommended`, `appointment_only` + separate `isMembersOnly` boolean |
| `FlightFormat` expanded                  | `seated, standing, tour, outdoor, picnic, bar`                                                        |
| Sonoma Coast region                      | Added as 6th region                                                                                   |
| `Setting` field                          | `vineyard, estate, downtown, hilltop, cave` (display-only V1)                                         |
| `primaryVarietal` → `signatureVarietals` | Changed to array; join table uses `is_signature` boolean                                              |
| Walk-in filter                           | Passes both `walk_ins_welcome` and `reservations_recommended`                                         |
| Shared itinerary storage                 | JSONB snapshot (full winery+flight data), not just IDs                                                |
| Click tracking                           | `navigator.sendBeacon` (non-blocking)                                                                 |
| Style scores & editorial judgments       | LLM-generated (P5), manually overridable via admin UI. No field is exempt from automation.            |
| Excel sheet retirement                   | Excel is a one-time bootstrap. Once P5+P6 are stable, all data managed through pipeline + admin UI.   |
| Pipeline rollback                        | `winery_snapshots` table stores full JSONB row before each publish. Revert via admin UI.              |

### Data source authority

| Source                       | Trust                                   | Refresh                        |
| ---------------------------- | --------------------------------------- | ------------------------------ |
| Curated CSV (68 editorial)   | Highest — editorial voice               | Manual, quarterly              |
| OpenStreetMap / Overpass     | High for existence/location             | Quarterly                      |
| Wine association directories | High for "is this a real tasting room?" | Annual                         |
| Wikidata SPARQL              | Medium — incomplete but authoritative   | Quarterly                      |
| Google Places (optional)     | High for facts, low for domain data     | Weekly                         |
| URL health checks            | Binary signal                           | Weekly                         |
| User reports (future)        | Lowest — signal only                    | Real-time submit, async review |

**Conflict resolution:** Editorial always wins. OSM/Wikidata provide discovery and basic facts but never overwrite editorial fields.
