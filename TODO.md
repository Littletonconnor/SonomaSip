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

- [x] **Favicon:** Dynamic icon generation via `src/app/icon.tsx` (32x32) and `src/app/apple-icon.tsx` (180x180) — wine glass on burgundy gradient
- [x] **Web app manifest:** `public/manifest.json` with app name, theme color (wine #722F37), background color (cream #F7F2EC), icons, display: standalone
- [x] **PWA meta tags:** Viewport with `viewportFit: cover`, `themeColor`, `appleWebApp` capable + black-translucent, manifest link — all via Next.js `Viewport` + `Metadata` exports
- [x] **OG / social meta:** Dynamic OG image via `src/app/opengraph-image.tsx` (1200x630), Twitter card: summary_large_image, title + description
- [x] **Viewport:** Safe-area-inset via `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]` on body
- [x] **Loading states:** Route-level loading skeletons for results, browse/wineries, winery detail, and shared plan — all matching actual page layout shapes

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
- [x] Loading skeleton matching card layout shape

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

### 3.5.6 Browse / directory page ✅

- [x] Page header: "All Wineries" + dynamic count
- [x] Sort dropdown: Name A–Z, Price Low/High, Highest Rated (custom styled select per ui.sh guidelines)
- [x] Filter panel: 5 region buttons + 5 feature toggles (walk-in, dog, kid, food, views)
- [x] Desktop: sticky left filter sidebar (220px) + 3-column card grid
- [x] Mobile: collapsible filter panel with active count badge
- [x] Winery cards: name, rating, tagline, region, price range, up to 3 feature badges
- [x] Cards link to `/wineries/[slug]`, hover shadow transition, staggered animation
- [x] Empty state: "No wineries match" + clear filters button
- [x] Clear all filters link when any filter is active

### 3.5.7 Shared plan page ✅

- [x] Two-column itinerary: sticky left sidebar (header, preferences, actions, map) + right scrollable winery stops
- [x] Header: "Your Wine Day Itinerary" + stop count + generated date
- [x] Preference badges from mock plan data
- [x] Action bar: Copy Link, Print, Email buttons (styled, non-functional)
- [x] Map placeholder with positioned winery dots from lat/lng
- [x] Numbered winery stops: rank badge, name (links to detail), region, price, rating, match reasons, feature badges, "Book a Tasting" link
- [x] Disclaimer footer: independent guide, verify details
- [x] OG meta tags for link previews

### 3.5.9 Map integration (Mapbox GL)

_Custom-styled Mapbox map that matches the Sonoma palette. Used on results page and shared plan page._

- [x] Install `react-map-gl` + `mapbox-gl`: `pnpm add react-map-gl mapbox-gl`
- [x] Create Mapbox account + API token; add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.example`
- [x] Design custom Mapbox Studio style: "Dawn Wine Country" — warm golden parchment terrain, lush storybook greens, terracotta roads, dawn-tinted hillshade. Published as `mapbox://styles/littletonconnor/cmnj990w1004z01sla3326exf`
- [x] Create `src/components/map/sonoma-map.tsx` — reusable map component with auto-fit bounds, lazy loading (IntersectionObserver), interactive legend with flyTo, and `reuseMaps` for performance
- [x] Custom map markers: wine-colored circular dots (`size-7`) with Inter font rank numbers, `ring-2 ring-white`, darker wine on select
- [x] Marker popups: frosted glass card (matching hero card style), winery name + region, custom close button, `rounded-xl` with warm shadow
- [x] Replace map placeholder on results page (`src/app/results/page.tsx`) with real Mapbox map + legend
- [x] Replace map placeholder on shared plan page (`src/app/plan/[id]/page.tsx`) via `PlanMap` client wrapper
- [x] Responsive: map fills container on desktop, collapsible on mobile with "Show Map" toggle using `AnimatePresence`
- [x] Performance: lazy-load map component via `next/dynamic` + `IntersectionObserver`, only initialize when visible
- [ ] Restrict Mapbox token to app domain(s) via Mapbox dashboard

### 3.5.8 Design QA pass

- [x] Typography: Cormorant Garamond on all headings, Inter on all body text, consistent scale — audited, all correct
- [x] Colors: wine for primary actions, gold for accents/badges, cream/linen backgrounds, bark for emphasis — replaced hardcoded `bg-white/92` with `bg-background/92`, replaced `text-white` with `text-primary-foreground` in map legend
- [x] Spacing: consistent vertical rhythm — fixed results page from `py-10 md:py-14` to `py-12 md:py-16`
- [x] States: hover, focus, active, disabled — added `focus-visible:outline-wine` to all filter buttons, added `group-hover:text-wine` to landing page winery teasers, added hover highlight to plan page winery stops
- [x] Dark mode: fixed hero card and Mapbox popup to use CSS custom properties (`var(--background)`, `color-mix`) that auto-adapt
- [x] Animations: scroll-triggered fade-ins on all sections via `AnimatedSection`, hover transitions on cards and links — audited, all present
- [ ] Performance: no layout shifts (CLS = 0), no FOUT, <3s load _(needs Lighthouse test on deployed build)_
- [ ] Responsive QA: test at 375px, 768px, 1024px, 1440px _(needs visual testing)_
- [x] Accessibility: keyboard navigation works, focus rings visible on all interactive elements, WCAG AA contrast verified on critical text pairs
- [x] No default browser styles, no unstyled flash, no broken layouts — audited, all clean

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
- [ ] Rate limit share create + email by IP _(see Phase 7.5 for comprehensive rate limiting plan)_

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

## Phase 7.5 — Rate limiting & abuse protection _(pre-launch requirement)_

_Every third-party service has usage-based pricing. Every server action has compute cost. Rate limiting is not optional — it's a launch blocker. Budget context: Mapbox free tier = 50K map loads/mo, Supabase free tier = 50K monthly active users + 500MB DB + 5GB bandwidth, Resend free tier = 100 emails/day, Vercel free tier = 100GB bandwidth/mo._

### 7.5.1 Client-side map load protection

- [ ] **Session-based map load cap:** Track map initializations per browser session in `sessionStorage`. After N loads (e.g., 20) in a single session, show a static map image (Mapbox Static Images API — 50K free/mo) instead of the interactive GL map. Display a message: "Interactive map limit reached for this session. Refresh tomorrow for full access."
- [ ] **`reuseMaps` prop:** Enable on `react-map-gl` `<Map>` to reuse GL context across soft navigations instead of re-initializing (avoids counting new map loads on back/forward)
- [ ] **Lazy-load only:** Map component mounts via `IntersectionObserver` — never loads unless user scrolls to it. This alone prevents map loads from bots/crawlers hitting the page
- [ ] **Bot/crawler exclusion:** Check `navigator.webdriver` and common bot user-agent patterns client-side before mounting the map. Bots get the static placeholder only

### 7.5.2 Server-side rate limiting (API routes / server actions)

- [ ] **Choose rate limiting library:** `@upstash/ratelimit` (Redis-backed, serverless-native, works with Vercel) or `next-rate-limit` (simpler, in-memory). Upstash has a generous free tier (10K commands/day). Decision: Upstash for production, in-memory for dev
- [ ] **Rate limit middleware:** Create `src/lib/rate-limit.ts` utility that wraps the chosen library. Accept `identifier` (IP or fingerprint), `limit`, and `window` params. Return `{ success, remaining, reset }`
- [ ] **IP extraction:** Use `headers().get('x-forwarded-for')` (Vercel sets this) with fallback to `x-real-ip`. Hash the IP before storing (privacy)

### 7.5.3 Per-endpoint rate limits

| Endpoint / Action | Limit | Window | Reason |
|---|---|---|---|
| Quiz submit (server action) | 10 | 1 hour | Prevents matching engine abuse (compute cost) |
| Share/itinerary create | 5 | 1 hour | Prevents DB write spam (Supabase row count) |
| Email send (share via email) | 3 | 1 hour | Resend free tier = 100/day total. Strictest limit |
| PDF generate | 5 | 1 hour | Server-side rendering cost |
| Page views (results/plan) | 60 | 1 hour | General abuse prevention |
| API health check | 30 | 1 minute | Prevent monitoring abuse |

- [ ] Apply rate limits to quiz submit server action
- [ ] Apply rate limits to share/itinerary create server action
- [ ] Apply rate limits to email send server action
- [ ] Apply rate limits to PDF generation route
- [ ] Return proper `429 Too Many Requests` with `Retry-After` header
- [ ] User-friendly rate limit UI: show a gentle message ("You've been busy! Please wait a few minutes before trying again.") instead of a raw error

### 7.5.4 Global abuse protection

- [ ] **Vercel Edge Middleware rate limiting:** Add `middleware.ts` at the project root with a sliding window rate limit on all routes. Generous global limit (e.g., 200 requests/minute per IP) to catch automated scrapers without affecting real users
- [ ] **Vercel WAF / Firewall Rules:** If on Vercel Pro, configure firewall rules to block known bot networks and suspicious traffic patterns. On free tier, rely on middleware
- [ ] **CSRF protection:** All server actions should validate origin header. Next.js does this by default for Server Actions, but verify it's not disabled
- [ ] **Honeypot fields:** Add hidden form fields to the quiz and email forms. Any submission with these filled is a bot — reject silently

### 7.5.5 Third-party cost monitoring & alerts

- [ ] **Mapbox usage dashboard:** Set up billing alerts in Mapbox dashboard at 50%, 80%, and 95% of free tier (25K, 40K, 47.5K map loads)
- [ ] **Supabase usage monitoring:** Monitor DB size, bandwidth, and row counts in Supabase dashboard. Alert at 80% of free tier limits
- [ ] **Resend email monitoring:** Track daily email count. Alert at 80 emails/day (80% of 100/day free limit)
- [ ] **Vercel bandwidth monitoring:** Track bandwidth usage. Alert at 80GB/mo (80% of 100GB free tier)
- [ ] **Monthly cost review:** Calendar reminder to review all service dashboards on the 1st of each month

### 7.5.6 Emergency kill switches

- [ ] **Map kill switch:** Environment variable `NEXT_PUBLIC_DISABLE_MAP=true` that replaces the interactive map with a static image globally. Flip in Vercel dashboard if Mapbox costs spike
- [ ] **Email kill switch:** `DISABLE_EMAIL=true` that disables the email share feature entirely. Returns a friendly "Email sharing is temporarily unavailable" message
- [ ] **Share kill switch:** `DISABLE_SHARE_CREATE=true` that prevents new itinerary creation while still allowing existing shares to be viewed
- [ ] **Read-only mode:** Single `MAINTENANCE_MODE=true` flag that disables all write operations (share, email, quiz submit) while keeping the site browsable

### 7.5.7 Testing & validation

- [ ] Load test rate limits locally: script that sends N requests in rapid succession, verify 429s fire at correct thresholds
- [ ] Verify rate limit headers are present in responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- [ ] Test kill switches: flip each env var, verify graceful degradation
- [ ] Test bot detection: verify crawlers get static content, not interactive maps
- [ ] Document rate limits in README or ops runbook for future reference

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

| Platform      | Free Tier                        | Cost at ~1M events/mo | Best For                                                        |
| ------------- | -------------------------------- | --------------------- | --------------------------------------------------------------- |
| **PostHog**   | 1M events/mo, 5K session replays | $0                    | All-in-one: analytics, replay, feature flags. Has a Next.js SDK |
| **OpenPanel** | Self-hosted = unlimited, free    | ~$90/mo cloud         | Open-source Mixpanel alternative. Self-host on a $5 VPS         |
| **Umami**     | Self-hosted = unlimited, free    | $20/mo cloud          | Lightweight privacy-focused web analytics. No cookies           |

### Logs / Observability (Server-Side)

| Platform        | Free Tier                              | Notes                                                         |
| --------------- | -------------------------------------- | ------------------------------------------------------------- |
| **Axiom**       | **500 GB/mo ingest**, 30-day retention | Absurdly generous. Has a Vercel/Next.js integration. Top pick |
| **SigNoz**      | Self-hosted = unlimited                | Open-source Datadog alternative. OpenTelemetry native         |
| **HyperDX**     | 3 GB/mo cloud, self-hosted = free      | Combines session replay + logs + traces                       |
| **OpenObserve** | Self-hosted = free                     | Claims 140x less storage than Elasticsearch. Single binary    |

### Error Tracking

| Platform      | Free Tier                        | Notes                               |
| ------------- | -------------------------------- | ----------------------------------- |
| **GlitchTip** | 1K events/mo, self-hosted = free | Sentry-compatible SDK, much cheaper |
| **Sentry**    | 5K errors/mo                     | The standard, but costs add up fast |

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
import { configure, createSamplingFilter, getConsoleSink, withFilter } from 'logscope';

const sampling = createSamplingFilter({
  rates: {
    trace: 0.01, // 1% of trace
    debug: 0.05, // 5% of debug
    info: 0.1, // 10% of info
    // warning, error, fatal = 100% (default)
  },
  keepWhen: [
    (r) => (r.properties.status as number) >= 500,
    (r) => (r.properties.duration as number) > 2000,
  ],
});
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
