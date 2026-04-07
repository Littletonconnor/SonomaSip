# Sonoma Sip — Engineering TODO

**Purpose:** Technical implementation tracker. Product intent & policies: **[`docs/PRD.md`](docs/PRD.md)**. Matching math: **[`docs/SCORING.md`](docs/SCORING.md)**.

> **UI WORK RULE:** Always invoke the `/ui` skill when building or modifying any page, component, or visual element.

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
| Analytics     | Plausible (not yet integrated)            |
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

## Content pipeline (Phase D8)

_Detail pages need rich, original content to drive click-throughs. Scrape winery websites → LLM extraction → LLM enrichment → human review → publish._

```
Registry (winery URLs)
  → Cloudflare /crawl API (websites → markdown)
  → Raw scrape storage (winery_scrapes table)
  → LLM extraction (structured: hours, flights, prices, varietals)
  → LLM enrichment (stories, taglines, visitor tips, seasonal notes)
  → Content drafts (content_drafts table, status: draft)
  → Admin review UI (approve/edit/reject)
  → Published to wineries table
```

### Setup

- [ ] Cloudflare account + API token (Browser Rendering permission)
- [ ] Env vars: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- [ ] Wrapper: `lib/pipeline/cloudflare-crawl.ts` (initiate crawl, poll, return markdown)
- [ ] Config: 10 pages/winery, markdown format, skip images/media/fonts
- [ ] Test with 3 winery websites

### Scrape pipeline

- [ ] `scripts/scrape-wineries.ts` — iterate registry, crawl each site
- [ ] `winery_scrapes` table: `(id, winery_id, url, raw_markdown, pages_crawled, scraped_at)`
- [ ] Rate limiting between crawls (68 wineries × 10 pages = ~680 renders)
- [ ] `--dry-run` mode; npm script: `pnpm pipeline:scrape`

### LLM extraction (structured data)

- [ ] `lib/pipeline/llm-extract.ts` — raw markdown → structured JSON (hours, flights, varietals, policies)
- [ ] `winery_llm_extractions` table: `(id, winery_id, scrape_id, extracted_data, model_used, tokens_used)`
- [ ] Diff against current DB values; auto-apply high-confidence changes to drafts; flag low-confidence for review

### LLM enrichment (original content)

- [ ] `lib/pipeline/llm-enrich.ts` — generate: story (2-3 paragraphs), tagline, flight descriptions, visitor tip, seasonal note
- [ ] System prompt: SonomaSip editorial voice (warm, knowledgeable, opinionated)
- [ ] Never fabricate facts; include source citations in draft metadata
- [ ] `content_drafts` table: `(id, winery_id, field_name, current_value, draft_value, status, reviewed_by)`
- [ ] Status: `draft` → `approved` / `rejected` → `published`
- [ ] npm script: `pnpm pipeline:enrich`

### Orchestrator

- [ ] `scripts/run-pipeline.ts` — scrape → extract → enrich in sequence
- [ ] Per-winery error handling; summary report
- [ ] npm scripts: `pnpm pipeline:run`, `pnpm pipeline:run --winery=slug`

### Schema additions

- [ ] Migration: `winery_scrapes`, `winery_llm_extractions`, `content_drafts` tables
- [ ] Add `content_status` + `last_scraped_at` to `wineries`

### Cost estimate

~68 wineries × ~3K tokens/winery ≈ 200K tokens/month ≈ $1–3/month (Claude Haiku or GPT-4o-mini). Cloudflare Browser Rendering: ~680 renders/month (free or near-free).

---

## Admin pages (Phase D9)

_Two people reviewing content. Speed matters — reviewing 68 wineries should take ~30 minutes._

### Auth

- [ ] Password-protected route group: `/admin/*`
- [ ] Env var: `ADMIN_PASSWORD` (upgrade to Supabase auth later if needed)
- [ ] Middleware to check auth on all `/admin` routes

### Content review (`/admin/review`)

- [ ] List pending content drafts grouped by winery
- [ ] Side-by-side: current published vs LLM draft with diff highlighting
- [ ] Actions: Approve, Edit (inline), Reject (with note)
- [ ] Bulk: "Approve all for this winery", "Skip to next"
- [ ] Keyboard shortcuts: A=approve, E=edit, R=reject, N=next
- [ ] Progress: "23 of 68 wineries reviewed"

### Data health dashboard (`/admin/health`)

- [ ] Overview: active winery count, last import/scrape/enrichment dates
- [ ] Broken URLs, stale data warnings (>90 days), pipeline run history

### Click attribution dashboard (`/admin/clicks`)

- [ ] `click_events` table: `(id, winery_id, source_page, booking_url, clicked_at, session_id)`
- [ ] Track "Book a Tasting" clicks via `navigator.sendBeacon` (non-blocking)
- [ ] Append `?ref=sonomasip` to outbound booking URLs
- [ ] Dashboard: clicks per winery (7d/30d/all-time), top performers
- [ ] CSV export for winery partnership outreach

### Pipeline trigger (`/admin/pipeline`)

- [ ] Manual trigger buttons: full pipeline, single winery scrape, single winery re-enrich
- [ ] Run status indicator, last run summary
- [ ] View raw scrape output per winery (debugging)

---

## Reliability & operations (Phase 7)

### Observability

- [ ] Sentry + source maps (error tracking)
- [ ] Health check endpoint: `/api/health`
- [ ] Uptime monitoring on `/` and `/api/health`

### Data freshness

- [ ] **URL health check** (weekly): HEAD every `bookingUrl`, flag broken
- [ ] **Stale data alert**: flag wineries not verified in >90 days
- [ ] **Quarterly audit**: spot-check 15-20 wineries across all regions
- [ ] **Seasonal hours** (Mar + Nov): bulk review before summer/winter shift
- [ ] **Annual full audit** (Jan): verify all editorial wineries, run discovery for new openings
- [ ] Show "Last verified: {date}" on winery detail page
- [ ] "Report an issue" link on winery detail page

### Google Places Sync (optional, future)

- [ ] Map `google_place_id` for each winery
- [ ] Weekly sync: auto-update `rating_google` + `review_count`; flag hours drift for review
- [ ] Never auto-update: hours, booking_url, experience flags, style scores
- [ ] ToS compliance

---

## Winery discovery (Phase D0 — expand beyond 68)

_Expand from 68 editorial wineries to a comprehensive Sonoma + Napa registry (target: 400–600+). All discovery sources are free._

### Coverage tiers

- [ ] Add `coverage_tier` enum: `editorial` | `verified` | `discovered`
  - **Editorial** — full curated data (current 68). Rich detail pages, full quiz matching.
  - **Verified** — basic info confirmed. Shown on map + browse. Basic quiz matching.
  - **Discovered** — exists but not reviewed. Map pin + name + "Visit website" only.
- [ ] Add column to `wineries` table; update detail page, quiz matching, browse/map for tier-aware display

### OpenStreetMap discovery (primary, free)

- [ ] `scripts/discover-osm.ts` — Overpass API query for `amenity=winery` + `craft=winery` in Sonoma/Napa bounding box
- [ ] Fuzzy-match against existing 68 wineries (name + proximity ~500m)
- [ ] Tag matched with `osm_node_id`; unmatched become `discovered`
- [ ] `pnpm discover:osm`

### Wine association directories (cross-validation, free)

- [ ] Scrape Sonoma County Vintners + Napa Valley Vintners member directories
- [ ] Cross-reference against OSM + editorial list
- [ ] `pnpm discover:associations`

### Registry merge & dedup

- [ ] `scripts/merge-discoveries.ts` — merge all sources (editorial > OSM > association > Wikidata)
- [ ] Dedup: fuzzy name + coordinate proximity (<500m)
- [ ] Output: `docs/csv/winery-registry.csv` with `coverage_tier` + source columns
- [ ] Human review pass

### Geographic expansion

- [ ] Add Napa Valley AVA regions to `ava_region` enum
- [ ] Update app copy from "Sonoma" to "Sonoma & Napa" where appropriate

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
- [ ] Sentry project
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
