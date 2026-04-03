# Sonoma Sip — Engineering TODO

**Purpose:** Technical implementation tracker. Check boxes as work completes. Product intent, policies, and metrics definitions: **[`docs/PRD.md`](docs/PRD.md)**. Matching math: **[`docs/SCORING.md`](docs/SCORING.md)**.

> **UI WORK RULE:** Always invoke the `/ui` skill (`.claude/skills/ui/SKILL.md`) when building or modifying any page, component, or visual element. Every screen must look like a professional designer built it.

---

## References

| Artifact                             | Path / URL                                     |
| ------------------------------------ | ---------------------------------------------- |
| Product requirements (non-technical) | `docs/PRD.md`                                  |
| Scoring / filters (technical)        | `docs/SCORING.md`                              |
| Seed / editorial data (Excel)        | `docs/sonoma-winery-database-complete.xlsx`    |
| Original PRD (archive)               | `docs/sonoma-winery-prd.docx`                  |
| Planning workbook (archive)          | `docs/sonoma-winery-website-architecture.xlsx` |
| **shadcn/ui docs**                   | https://ui.shadcn.com/docs                     |
| shadcn — component list              | https://ui.shadcn.com/docs/components          |
| shadcn — theming (OKLCH tokens)      | https://ui.shadcn.com/docs/theming             |
| shadcn — Tailwind v4 guide           | https://ui.shadcn.com/docs/tailwind-v4         |
| shadcn — CLI reference               | https://ui.shadcn.com/docs/cli                 |
| Next.js agent docs (in node_modules) | `node_modules/next/dist/docs/`                 |

---

## Target stack

| Layer         | Choice                                                  |
| ------------- | ------------------------------------------------------- |
| App           | Next.js (App Router), TypeScript                        |
| Components    | shadcn/ui (Radix primitives, Tailwind v4)               |
| Database      | Supabase (PostgreSQL)                                   |
| Map           | Mapbox GL (`react-map-gl` or equivalent)                |
| Email         | Resend or Postmark (pick one)                           |
| Analytics     | Plausible (cookie-light); privacy policy still required |
| Hosting       | Vercel + Supabase (confirm regions)                     |
| Observability | Sentry (recommended)                                    |

---

## Approach: UI-first with mock data

Build the full user experience with mock data first. Validate that every screen feels right. Then wire up the real backend (Supabase, import, matching engine).

```
Track A — UI Prototype (current focus)
  Phase 0 (spec, design) ✅
    → Phase 3 (Next.js shell) ✅
    → Phase 3.5 (all screens with mock data) ← YOU ARE HERE
    → Validate & iterate

Track B — Backend (after UI is validated)
  Phase 0.6 (data model / ERD)
    → Phase 0.7 (SCORING.md spec)
    → Phase 1 (Supabase schema + RLS + types)
    → Phase 2 (import from Excel)
    → Phase 4 (matching engine + tests)

Wire Up: Replace mock data with real Supabase queries + matching engine

Track C — Polish & Launch
  Phase 6 (SEO / perf)
    → Phase 7 (ops)
    → Phase 8 (a11y, QA, launch)
    → Phase 9 (post-MVP)
```

---

## Phase 0 — Specification & design

### 0.1 Repository & tooling

- [x] Git init; `.gitignore` (`.env*`, `node_modules`, `.next`, `.vercel`, Supabase temp)
- [x] Package manager (**pnpm**); `engines` / `.nvmrc` for Node
- [x] EditorConfig, Prettier, ESLint (Next-compatible)
- [x] Root `README.md`: dev commands, env setup, link to `docs/`
- [x] `.env.example` (no secrets)

### 0.2 Service accounts _(manual — do when needed)_

- [ ] Supabase project (note ref, DB password, region)
- [ ] Vercel project linked to repo
- [ ] Mapbox token; restrict HTTP referrers when domain known
- [ ] Domain DNS
- [ ] Transactional email provider + verified domain + API key
- [ ] Optional: Sentry, Google Cloud (Places only if building sync)

### 0.3 Routes & errors

- [x] Route list: `/`, quiz entry, results, `/plan/[shareId]`, `/wineries`, `/wineries/[slug]`, print/PDF route, legal pages
- [x] Quiz URL strategy (single entry + client step state vs nested routes)
- [x] `not-found` / `error` UI

### 0.4 Legal copy _(draft when ready — doesn't block UI)_

**Accuracy & liability disclaimer:**

- [ ] Prominent disclaimer on every page with winery data (footer, results, detail, plan, PDF, email): "Sonoma Sip is an independent guide. We are not affiliated with, endorsed by, or sponsored by any winery listed. Information may be outdated or inaccurate — always verify details directly with the winery before visiting."
- [ ] Winery detail page: dedicated disclaimer block near the CTA, not just footer
- [ ] Shared plan / PDF: disclaimer as first or last line of the document

**Terms of Service — key clauses:**

- [ ] **Independent guide / no affiliation:** Sonoma Sip is an independent informational resource. We are not agents, representatives, or affiliates of any winery. Listing does not imply endorsement in either direction.
- [ ] **No guarantee of accuracy:** All winery information (hours, prices, policies, availability, amenities) is provided for informational purposes only. We make reasonable efforts to keep data current but cannot guarantee accuracy. Users must verify details with wineries before visiting.
- [ ] **Third-party content:** Winery names, descriptions, and details are sourced from publicly available information. All trademarks belong to their respective owners. If a winery wishes to update or remove their listing, they can contact us.
- [ ] **Winery opt-out / update process:** Clear contact method (email) for wineries to request corrections, updates, or removal of their listing. Commit to processing requests within a reasonable timeframe (e.g., 7 business days).
- [ ] **Limitation of liability:** Sonoma Sip is not liable for any damages arising from reliance on information provided, including but not limited to incorrect hours, prices, policies, or closures.
- [ ] **User-generated content:** If users can submit reviews/reports in the future, include clause reserving right to moderate and disclaiming responsibility for user content.

**Privacy policy:**

- [ ] Analytics data collection (Plausible/PostHog — cookie-light)
- [ ] Email collection (only if user opts into email share)
- [ ] Share URL data (what's stored, how long, who can access)
- [ ] No sale of personal data
- [ ] CCPA compliance (California users)

**Footer legal line (all pages):**

- [ ] "Sonoma Sip is an independent guide — not affiliated with any listed winery. Verify details before visiting."

### 0.5 Design system

- [x] Fonts, color tokens, spacing (WCAG AA on controls)
- [x] Component inventory: Button, Chip, Slider, Stepper, Card, Modal, Toast, Skeleton, list row, map callout
- [ ] Key screens: landing, quiz step, results split, detail, print _(covered by Phase 3.5)_
- [ ] Imagery policy (avoid implying winery endorsement)

### 0.5b shadcn/ui integration

- [x] Install shadcn/ui (`pnpm dlx shadcn@latest init --defaults --base radix`)
- [x] Install all components (`pnpm dlx shadcn@latest add --all`)
- [x] Configure shadcn theme with Sonoma tokens in OKLCH (wine, gold, sage, bark, cream, etc.)
- [x] Map shadcn semantic tokens (primary → wine, background → cream, card → linen, muted → fog, etc.)
- [x] Replace hand-rolled Button, Card, Badge with shadcn versions
- [x] All primitives installed: Slider, Dialog, Toast (Sonner), Skeleton, Toggle, and 50+ more
- [x] Add shadcn documentation references to TODO.md
- [ ] Verify components render correctly with Sonoma palette (visual check)

---

## Phase 3 — Next.js foundation

### 3.1 Bootstrap

- [x] `create-next-app` App Router + TS + ESLint
- [x] Absolute imports `@/`
- [x] Styling system (Tailwind or CSS modules)—one consistent approach
- [x] Root layout, providers

### 3.2 Config

- [ ] `env.ts` with Zod validation; separate public vs server secrets

### 3.3 CI

- [ ] `pnpm typecheck`, `lint`, `test` in CI

---

## Phase 3.4 — App fundamentals (favicon, PWA, meta)

- [ ] **Favicon:** Generate favicon set (favicon.ico, apple-touch-icon.png, favicon-16x16.png, favicon-32x32.png) — wine-themed icon
- [ ] **Web app manifest:** `public/manifest.json` with app name, theme color (wine), background color (cream), icons, display: standalone
- [ ] **PWA meta tags:** `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">`, `<link rel="manifest">`
- [ ] **OG / social meta:** Default Open Graph image, title, description for link previews
- [ ] **Viewport:** Ensure proper mobile viewport, safe-area-inset for notched devices
- [ ] **Loading states:** Global loading indicator or skeleton for route transitions
- [ ] **Offline support (stretch):** Service worker for basic offline page if feasible

---

## Phase 3.5 — UI Prototype with Mock Data ← CURRENT FOCUS

_Build every screen using mock data. No real database, no real matching engine. Validate the experience, then wire up the backend. Every page must look like it was designed by a professional designer._

> **MANDATORY:** Use the `/ui` skill for every page build. Reference shadcn docs (https://ui.shadcn.com/docs/components) for component APIs. Reference Aceternity UI (https://ui.aceternity.com/) for animated component inspiration.

### 3.5.0 Animation & visual infrastructure

- [x] Install Framer Motion: `pnpm add motion`
- [x] Create `src/components/ui/animated-section.tsx` — scroll-triggered fade-in-up wrapper
- [x] Create gradient/texture utilities:
  - Warm mesh gradient hero background (burgundy → gold, using CSS gradients)
  - Subtle noise texture overlay (SVG filter or CSS)
  - Section divider patterns (gentle wave or vine SVG from Haikei)
- [x] Create `src/components/layout/navbar.tsx` — sticky nav with blur, logo, links, CTA
- [x] Create `src/components/layout/footer.tsx` — reusable footer with branding + legal
- [x] Generate SVG illustrations/icons for feature sections (Lucide icons + custom wine-themed SVGs)

**Visual resources:**

- Gradients: https://csshero.org/mesher/ (mesh), https://haikei.app/ (waves/blobs)
- Icons: Lucide React (already installed)
- Illustrations: https://undraw.co/ (recolor to Sonoma palette)
- Patterns: https://heropatterns.com/ (subtle SVG backgrounds)

### 3.5.1 Mock data & types ✅

- [x] TypeScript types in `src/lib/types.ts`:
  - `Winery` — all fields needed for detail page (name, slug, region, story, hours, lat/lng, reservation type, noise level, features, ratings, etc.)
  - `Flight` — name, price, duration, wines included, format, food pairing
  - `QuizAnswers` — step-by-step form state
  - `MatchResult` — winery + score + reasons array
- [x] Mock data in `src/lib/mock-data.ts`: 8 representative wineries
  - Cover: different price ranges ($20–$190)
  - Cover: regions (Russian River, Dry Creek, Sonoma Valley, Alexander Valley, Carneros)
  - Cover: vibes (intimate, lively, family-friendly, luxury, educational)
  - Cover: reservation types (walk-in, appointment, members-only)
  - Cover: accessibility (dog/kid/wheelchair), food pairings, outdoor seating, views
- [x] Mock flights: 2–3 per winery with different formats and prices
- [x] Mock quiz results: 2 pre-computed ranked lists (casual couple + luxury group)

### 3.5.2 Landing page ✅

- [x] Sticky navbar with blur, logo, links, CTA + mobile hamburger
- [x] Hero: announcement pill, benefit headline, sub-copy, dual CTAs, photo grid with floating match card
- [x] Social proof / stats bar
- [x] How It Works: 3-step flow with Lucide icons, gold step numbers, staggered scroll animation
- [x] Features grid: 6 tiles (taste, budget, group, map, details, share) with icons
- [x] Featured wineries teaser: 4 mock wineries with region/price, "View all" link
- [x] Final CTA: gradient-cta section with cream text
- [x] Footer: logo, nav links, disclaimer, "Made with love"
- [x] Cross-cutting: scroll-triggered fade-ins, smooth anchors, responsive

### 3.5.3 Quiz flow ✅

- [x] Full-bleed editorial layout: big Cormorant headings, generous spacing, max-w-3xl
- [x] Animated wine-colored progress bar (sticky, top of viewport)
- [x] Step 1 — Varietals: multi-select chips with Lucide icons (9 varietals)
- [x] Step 2 — Vibe + Budget: vibe cards with icons (5 options) + budget band tiles (4 tiers)
- [x] Step 3 — Must-haves + Group: toggle cards (6 must-haves) + group size selector + members-only toggle
- [x] Step 4 — Regions + Stops: region cards with area labels (5 regions) + stop count selector (2–5)
- [x] Navigation: Continue (wine primary) / Go back (text link)
- [x] Step transitions: smooth fade-up animation via motion/react
- [x] `sessionStorage` persistence — resume on refresh (`useSessionStorage` hook)
- [x] Submit: navigates to `/results`
- [x] Responsive: full-width on mobile, constrained on desktop

### 3.5.4 Results page ✅

- [x] Desktop: two-column layout — result cards (60%) + sticky map placeholder (40%)
- [x] Mobile: stacked — cards above, map below
- [x] Header: "Your Recommendations" h1 + match count + Share/Print/Email action bar
- [x] Collapsible preferences summary (badges from quiz answers via sessionStorage)
- [x] Map placeholder: gradient card with positioned winery dots from lat/lng, legend list below
- [x] Result cards: gold rank badge, Cormorant name, region tag, price, rating, 3 match reasons, feature pills
- [x] Cards: hover shadow transition, click → `/wineries/[slug]`, staggered entrance animation
- [x] Empty state: Search icon, friendly message, "Retake the Quiz" CTA
- [x] Retake Quiz + Browse all wineries links at bottom of results
- [ ] Loading skeleton matching card layout shape

### 3.5.5 Winery detail page ✅

- [x] Two-column split layout: sticky left sidebar (name, region, rating, CTA, features, amenities) + right scrollable content
- [x] Breadcrumb: Home > Wineries > [Name]
- [x] Star rating display with count
- [x] "Book a Tasting" primary CTA with external link
- [x] About section with editorial story + varietal badges
- [x] Flight cards: name, description, price, duration, wine count, format, food pairing badge
- [x] Hours table: Mon–Sun with open/close times, closed indicator
- [x] Logistics: parking, group size, noise level, reservation type
- [x] Amenity badges: dog/kid/wheelchair/food/outdoor/views (active vs inactive styling)
- [x] Nearby Wineries: up to 3 related cards from same region
- [x] Responsive: collapses to single column on mobile
- [x] Static generation via generateStaticParams for all 8 mock wineries

### 3.5.6 Browse / directory page _(use `/ui` skill)_

- [ ] Page header: "All Wineries" + count badge ("68 wineries")
- [ ] View toggle: grid / compact list switch
- [ ] Sort dropdown: Name A-Z, Price Low-High, Region
- [ ] Filter panel: region checkboxes, price range, feature toggles (dog, food, views, walk-in)
- [ ] Desktop: filter sidebar (left) + grid (right)
- [ ] Mobile: filter drawer (sheet from bottom) + full-width cards
- [ ] Winery cards: name, region, price, 2-3 feature badges, gradient placeholder image
- [ ] Cards link to `/wineries/[slug]`

### 3.5.7 Shared plan page _(use `/ui` skill)_

- [ ] `/plan/[id]`: read-only view of a mock itinerary
- [ ] Header: "Your Sonoma Sip Plan" + "Generated on {date}"
- [ ] Preferences summary: badges showing what was asked for
- [ ] Ordered winery list: rank, name, region, match reasons, key details
- [ ] Map placeholder
- [ ] Action bar: Copy Link, Print/PDF, Email (styled, non-functional)
- [ ] Disclaimer footer: "Verify details before visiting"
- [ ] OG meta tags for link previews

### 3.5.9 Map integration (Mapbox GL)

_Custom-styled Mapbox map that matches the Sonoma palette. Used on results page and shared plan page._

- [ ] Install `react-map-gl` + `mapbox-gl`: `pnpm add react-map-gl mapbox-gl`
- [ ] Create Mapbox account + API token; add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.example`
- [ ] Design custom Mapbox Studio style: cream/linen terrain, muted greens for vegetation, wine-colored roads or labels, warm tones matching the site palette
- [ ] Create `src/components/map/sonoma-map.tsx` — reusable map component with Sonoma center, zoom bounds, and custom style URL
- [ ] Custom map markers: wine-colored pins with rank numbers (matching the result card gold badges)
- [ ] Marker popups: winery name, region, price range, link to detail page
- [ ] Replace map placeholder on results page (`src/app/results/page.tsx`) with real Mapbox map
- [ ] Replace map placeholder on shared plan page (`src/app/plan/[id]/page.tsx`)
- [ ] Responsive: map fills container on desktop, collapsible on mobile with "Show Map" toggle
- [ ] Performance: lazy-load map component, only initialize when visible
- [ ] Restrict Mapbox token to app domain(s) via Mapbox dashboard

### 3.5.8 Design QA pass

- [ ] Typography: Cormorant Garamond on all headings, Inter on all body text, consistent scale
- [ ] Colors: wine for primary actions, gold for accents/badges, cream/linen backgrounds, bark for emphasis
- [ ] Spacing: consistent vertical rhythm (16/24/32/48/64/96px sections)
- [ ] States: hover, focus, active, disabled on every interactive element
- [ ] Dark mode: every page renders correctly with inverted Sonoma palette
- [ ] Animations: scroll-triggered fade-ins, hover lifts, smooth transitions everywhere
- [ ] Performance: no layout shifts (CLS = 0), no FOUT, <3s load
- [ ] Responsive QA: test at 375px, 768px, 1024px, 1440px — pixel-perfect at each
- [ ] Accessibility: keyboard navigation works, focus rings visible, WCAG AA contrast
- [ ] No default browser styles, no unstyled flash, no broken layouts

---

## Phase 0.6 — Data model _(after UI is validated)_

- [ ] ERD: `wineries`, `flights`, normalization vs JSONB decision
- [ ] Column mapping from **`docs/sonoma-winery-database-complete.xlsx`** (every sheet)
- [ ] Stable slug = Excel `id`; enums for reservation, noise, walk-in, flight_type, etc.
- [ ] Derived fields: `min_flight_price` (budget uses flights **≤ $200** only), `max_flight_price`, `has_food_pairing_any`, `is_members_only`, etc.
- [ ] Tables: `import_runs`, `shared_itineraries` (`payload` jsonb + `payload_version`)
- [ ] RLS plan documented before migration

### 0.7 `docs/SCORING.md`

- [ ] Persona inference table (answers → weights)
- [ ] Filter rules (varietals, must-haves, budget, optional walk-in-only)
- [ ] Scoring formula + normalization + tie-breakers
- [ ] Explanation templates
- [ ] ≥3 worked examples (input → top 5 + reasons)

### 0.8 Data quality (pre-import)

- [ ] Remove closed Jackson Family venues from seed workbook (Arrowood, Fieldstone, Murphy-Goode)
- [ ] Fix logistics slugs referencing removed / invalid wineries
- [ ] Dedupe Bella / Cline (and similar) → canonical slug
- [ ] Scribe: `members-only` flag + copy per PRD
- [ ] Validate lat/long; fix Carneros / county display per PRD
- [ ] Spot-check reservation URLs (HTTPS, live)
- [ ] Sample verify dog/kid/wheelchair flags (time-boxed)

### 0.9 Analytics instrumentation

- [ ] Plausible snippet / proxy per their Next.js guidance
- [ ] Events: `quiz_started`, `quiz_step_completed`, `quiz_completed`, `itinerary_computed` (count ≥ 1), optional `results_rendered`, `winery_detail_opened`, `share_created`, `pdf_downloaded`, `email_sent`
- [ ] Funnel: completion → `itinerary_computed`

---

## Phase 1 — Supabase: schema, RLS, types _(after UI + data model)_

### 1.1 CLI & clients

- [ ] `supabase init`; link remote
- [ ] Server + browser Supabase clients (cookie pattern for Next)

### 1.2 Migrations

- [ ] Extensions (PostGIS optional, defer if unused)
- [ ] `wineries` + related tables / enums
- [ ] `flights` (FK `winery_id`)
- [ ] `import_runs`, `shared_itineraries`
- [ ] Indexes: unique `wineries.slug`, `flights.winery_id`, filters as needed
- [ ] Apply to staging first

### 1.3 RLS

- [ ] RLS enabled on all user-facing tables
- [ ] `SELECT` public read: `wineries`, `flights`
- [ ] `shared_itineraries`: controlled `INSERT` (server-only or rate-limited path); `SELECT` by id
- [ ] No public `UPDATE`/`DELETE` on core content

### 1.4 Types

- [ ] `supabase gen types typescript` → commit under e.g. `types/database.ts`
- [ ] Optional CI: regen on migration change

---

## Phase 2 — Data ingestion _(after Supabase schema)_

### 2.1 Importer

- [ ] Add `xlsx` or `exceljs`
- [ ] Entrypoint: `scripts/import-wineries.ts` (or package)
- [ ] Parsers per sheet; join on `id`
- [ ] Validation: required fields, enums, ranges, boolean coercion
- [ ] Transactional upsert; on failure log to `import_runs.errors_json`
- [ ] Derived fields computed pre-write
- [ ] `--dry-run` mode

### 2.2 Ops

- [ ] Default input path: **`docs/sonoma-winery-database-complete.xlsx`**
- [ ] `package.json` scripts: `db:import`, `db:reset` (local), `db:types`
- [ ] Optional: CI import to staging on workbook change

### 2.3 Verification

- [ ] Post-import: winery count = 68 (post-dedupe), flights ~118+, zero orphan flights
- [ ] Manual spot-check 5 random wineries vs Excel

---

## Phase 4 — Matching engine (TypeScript) _(after data import)_

### 4.1 Modules

- [ ] `lib/matching/types.ts`
- [ ] `lib/matching/filters.ts`
- [ ] `lib/matching/score.ts`
- [ ] `lib/matching/explain.ts`
- [ ] `lib/matching/index.ts` — `recommend(...)`

### 4.2 Tests

- [ ] Unit tests: each filter edge case
- [ ] Golden files: ≥5 profiles → ordering snapshot
- [ ] Optional: deterministic sort stability test

### 4.3 Server authority

- [ ] Recommendations computed server-side for persistence (share/PDF/email)
- [ ] No client-only source of truth for ranked results

---

## Phase 5 — Wire up: replace mock data with real backend

- [ ] Replace mock data imports with Supabase queries
- [ ] Quiz submit → server action → matching engine → results
- [ ] Winery detail pages: `generateStaticParams` + revalidate policy
- [ ] Share: insert `shared_itineraries` → Supabase
- [ ] PDF: text-first print route / CSS; v2: Mapbox Static image
- [ ] Email: send via Resend/Postmark with share URL + summary
- [ ] Rate limit share create + email by IP

---

## Phase 6 — SEO & performance

- [ ] `metadata` per winery page
- [ ] JSON-LD where accurate (`Winery` / `TouristAttraction`)
- [ ] `sitemap.xml`, `robots.txt`
- [ ] Lighthouse-driven fixes (LCP, fonts)
- [ ] `next/image` if using photos

---

## Phase 7 — Integrations & operations

### 7.1 Optional Google Places

- [ ] `google_place_id` column if used
- [ ] Scheduled job: rating, review count, business status; `last_places_sync_at`
- [ ] ToS compliance for cache/display

### 7.2 Reliability

- [ ] Sentry + source maps
- [ ] Uptime check `/` + `/api/health`
- [ ] Supabase backup / PITR verification

### 7.3 Runbooks

- [ ] Doc: import from `docs/*.xlsx`, rollback via backup
- [ ] Optional: protected admin import trigger

### 7.4 Data freshness & automated verification

_Winery info changes: hours shift seasonally, flights get repriced, wineries close or go members-only, reservation URLs break. We need automated + manual processes to keep data trustworthy._

**Automated checks (scheduled jobs):**

- [ ] **URL health check** (weekly): Hit every `bookingUrl` in the database. Flag 4xx/5xx/timeout as broken. Write results to `data_health_checks` table. Alert via email or dashboard.
- [ ] **Google Places sync** (weekly/biweekly): Pull `business_status` (OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY), current `opening_hours`, `rating`, `review_count`. Auto-flag wineries where Google hours diverge from our hours by >1 hour. Auto-update ratings. Never auto-update hours — flag for manual review.
- [ ] **Price drift detection** (monthly): If Google Places or a scraping service exposes pricing, compare against our `min_flight_price`/`max_flight_price`. Flag >20% drift for review.
- [ ] **Stale data alert**: Flag any winery not manually verified in >90 days. Surface in admin dashboard.

**Manual review cadence:**

- [ ] **Quarterly audit** (Jan, Apr, Jul, Oct): Spot-check 15-20 wineries across all regions. Verify hours, prices, reservation policy, and amenity flags against winery websites. Update database. Log audit in `import_runs`.
- [ ] **Seasonal hours update** (Mar + Nov): Many wineries shift to summer/winter hours. Bulk review all hours against winery websites before each season change.
- [ ] **Annual full audit** (January): Full pass on all 68 wineries. Verify every field. Remove permanently closed wineries. Add new notable wineries.

**Schema support:**

- [ ] Add `last_verified_at` timestamp column to `wineries` table
- [ ] Add `data_health_checks` table: `winery_id`, `check_type` (url_health | places_sync | manual_audit), `status`, `details_json`, `checked_at`
- [ ] Add `verification_notes` text column for auditor comments
- [ ] Admin dashboard or simple script to surface flagged wineries

**User-facing transparency:**

- [ ] Show "Last verified: {date}" on winery detail page (when `last_verified_at` is set)
- [ ] Accuracy disclaimer on every page with winery data (already planned in 0.4)
- [ ] "Report an issue" link on winery detail page — simple email or form to flag outdated info

---

## Phase 8 — Accessibility, QA, launch

### 8.1 A11y

- [ ] Full keyboard quiz path
- [ ] Focus management modals/map
- [ ] List as map alternative
- [ ] Optional: axe in CI

### 8.2 QA matrix

- [ ] iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari
- [ ] Slow 3G on results

### 8.3 User tests

- [ ] ~5 sessions: plan day, share, open book link

### 8.4 Launch

- [ ] Prod env review
- [ ] DNS + SSL
- [ ] Smoke tests post-deploy
- [ ] 48h error monitoring

---

## Phase 9 — Post-MVP

### 9.1 Routing & product expansion

- [ ] Drive-time ordering (Mapbox Directions / OSRM)
- [ ] Optional auth / saved trips
- [ ] Booking partner integrations if APIs exist
- [ ] Geographic expansion only if PRD scope changes

### 9.2 AI-assisted features (after deterministic V1 is stable)

_Principles: retrieve from structured DB first; LLM formats/converses; no fabricated wineries or policies; fallback to quiz + `lib/matching` on failure. See `docs/PRD.md` §14._

- [ ] **NL → plan:** Parse intent → map to filter/score params or retrieval query; return same explainable cards as deterministic path
- [ ] **RAG / tool-calling:** Expose winery rows (or search RPC) to the model; cite slugs/fields in debug mode
- [ ] **Evals:** Golden prompts + expected winery sets; regression on hallucination / wrong filters
- [ ] **Safety & privacy:** Prompt/PII logging policy; update privacy policy; rate limits on AI endpoints
- [ ] **Optional:** Conversational refinement ("quieter third stop"), itinerary narrative for PDF/email (facts-only)

---

## Analytics & Observability — Platform Recommendations

_Focused on what's actually cheap for a Next.js app with sampled logscope events._

### Analytics (Browser Clicks/Events)

| Platform | Free Tier | Cost at ~1M events/mo | Best For |
|---|---|---|---|
| **PostHog** | 1M events/mo, 5K session replays | $0 | All-in-one: analytics, replay, feature flags. Has a Next.js SDK |
| **OpenPanel** | Self-hosted = unlimited, free | ~$90/mo cloud | Open-source Mixpanel alternative. Self-host on a $5 VPS |
| **Umami** | Self-hosted = unlimited, free | $20/mo cloud | Lightweight privacy-focused web analytics. No cookies |

### Logs / Observability (Server-Side)

| Platform | Free Tier | Notes |
|---|---|---|
| **Axiom** | **500 GB/mo ingest**, 30-day retention | Absurdly generous. Has a Vercel/Next.js integration. Top pick |
| **SigNoz** | Self-hosted = unlimited | Open-source Datadog alternative. OpenTelemetry native |
| **HyperDX** | 3 GB/mo cloud, self-hosted = free | Combines session replay + logs + traces |
| **OpenObserve** | Self-hosted = free | Claims 140x less storage than Elasticsearch. Single binary |

### Error Tracking

| Platform | Free Tier | Notes |
|---|---|---|
| **GlitchTip** | 1K events/mo, self-hosted = free | Sentry-compatible SDK, much cheaper |
| **Sentry** | 5K errors/mo | The standard, but costs add up fast |

### Recommendation for This Setup

**Pragmatic combo (mostly free):**

1. **PostHog** for browser analytics — sample at 10-50% with `createSamplingFilter` to stay under 1M events/mo free tier
2. **Axiom** for server logs — 500 GB free is massive. Send sampled logscope records as JSON
3. Use logscope's `createSamplingFilter` with `keepWhen` conditions so **errors and slow requests are never sampled away**, only the routine info/debug logs get thinned out

**Fully self-hosted ($5-20/mo VPS):**
- Umami (analytics) + SigNoz (logs/traces) + GlitchTip (errors)

### How It'd Work with logscope

The sampling strategy is the key — multiple sinks with different sampling rates:

```typescript
import { configure, createSamplingFilter, getConsoleSink, withFilter } from 'logscope'

const sampling = createSamplingFilter({
  rates: {
    trace: 0.01,    // 1% of trace
    debug: 0.05,    // 5% of debug
    info: 0.1,      // 10% of info
    // warning, error, fatal = 100% (default)
  },
  keepWhen: [
    (r) => (r.properties.status as number) >= 500,
    (r) => (r.properties.duration as number) > 2000,
  ],
})
```

Then your PostHog sink and Axiom sink both get the sampled stream — errors always come through, routine logs are thinned to keep you in free tiers.

---

## Progress log

| Date       | Phase     | Notes                                               |
| ---------- | --------- | --------------------------------------------------- |
| 2026-04-02 | 0.1, 3.1  | Scaffold: Next.js, Tailwind, pnpm, ESLint, Prettier |
| 2026-04-02 | 0.3       | All routes + error pages                            |
| 2026-04-02 | 0.5, 0.5b | Sonoma design system + shadcn/ui (all components)   |

---

## Changelog (this file)

| Date       | Change                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| 2026-04-02 | First engineering backlog                                                                |
| 2026-04-02 | Locked Q1–Q14 implementation targets                                                     |
| 2026-04-02 | Split product doc to `docs/PRD.md`; moved data to `docs/`; TODO is technical-only        |
| 2026-04-02 | Phase 9.2 AI roadmap; PRD §14 + README deterministic-first note                          |
| 2026-04-02 | Restructured to UI-first approach: Phase 3.5 (mock data prototype) before backend phases |
| 2026-04-02 | Added shadcn/ui docs references                                                          |
