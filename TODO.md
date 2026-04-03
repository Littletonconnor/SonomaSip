# Sonoma Sip — Engineering TODO

**Purpose:** Technical implementation tracker. Check boxes as work completes. Product intent, policies, and metrics definitions: **[`docs/PRD.md`](docs/PRD.md)**. Matching math: **[`docs/SCORING.md`](docs/SCORING.md)**.

> **UI WORK RULE:** Always invoke the `/ui` skill (`.claude/skills/ui/SKILL.md`) when building or modifying any page, component, or visual element. Every screen must look like a professional designer built it.

---

## References

| Artifact | Path / URL |
|----------|------------|
| Product requirements (non-technical) | `docs/PRD.md` |
| Scoring / filters (technical) | `docs/SCORING.md` |
| Seed / editorial data (Excel) | `docs/sonoma-winery-database-complete.xlsx` |
| Original PRD (archive) | `docs/sonoma-winery-prd.docx` |
| Planning workbook (archive) | `docs/sonoma-winery-website-architecture.xlsx` |
| **shadcn/ui docs** | https://ui.shadcn.com/docs |
| shadcn — component list | https://ui.shadcn.com/docs/components |
| shadcn — theming (OKLCH tokens) | https://ui.shadcn.com/docs/theming |
| shadcn — Tailwind v4 guide | https://ui.shadcn.com/docs/tailwind-v4 |
| shadcn — CLI reference | https://ui.shadcn.com/docs/cli |
| Next.js agent docs (in node_modules) | `node_modules/next/dist/docs/` |

---

## Target stack

| Layer | Choice |
|-------|--------|
| App | Next.js (App Router), TypeScript |
| Components | shadcn/ui (Radix primitives, Tailwind v4) |
| Database | Supabase (PostgreSQL) |
| Map | Mapbox GL (`react-map-gl` or equivalent) |
| Email | Resend or Postmark (pick one) |
| Analytics | Plausible (cookie-light); privacy policy still required |
| Hosting | Vercel + Supabase (confirm regions) |
| Observability | Sentry (recommended) |

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

- [ ] Accuracy disclaimer (footer + PDF + email per PRD)
- [ ] Privacy policy (analytics, email, share URLs)
- [ ] Terms; footer line: independent guide / no affiliation

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

### 3.5.1 Mock data & types

- [ ] TypeScript types in `src/lib/types.ts`:
  - `Winery` — all fields needed for detail page (name, slug, region, story, hours, lat/lng, reservation type, noise level, features, ratings, etc.)
  - `Flight` — name, price, duration, wines included, format, food pairing
  - `QuizAnswers` — step-by-step form state
  - `MatchResult` — winery + score + reasons array
- [ ] Mock data in `src/lib/mock-data.ts`: 6–8 representative wineries
  - Cover: different price ranges ($25–$200+)
  - Cover: regions (Russian River, Dry Creek, Sonoma Valley, Alexander Valley, Carneros)
  - Cover: vibes (intimate, lively, family-friendly, luxury, educational)
  - Cover: reservation types (walk-in, appointment, members-only)
  - Cover: accessibility (dog/kid/wheelchair), food pairings, outdoor seating, views
- [ ] Mock flights: 2–3 per winery with different formats and prices
- [ ] Mock quiz results: 2 pre-computed ranked lists for different personas

### 3.5.2 Landing page _(use `/ui` skill — this is the most important page)_

**Navigation (sticky):**
- [ ] Logo (left) — "Sonoma Sip" wordmark in Cormorant
- [ ] Links (center): How It Works, Wineries, About
- [ ] CTA button (right): "Plan Your Visit" (wine bg)
- [ ] Mobile: hamburger menu + sticky bottom CTA bar after scrolling past hero
- [ ] Sticky nav has backdrop-blur + semi-transparent background on scroll

**Hero section:**
- [ ] Announcement pill: "Covering 68+ Sonoma County wineries" (subtle, above headline)
- [ ] Headline: benefit-focused, NOT just the app name (e.g. "Your Perfect Sonoma Wine Day, Planned in Minutes")
- [ ] Subheadline: 1-2 sentences explaining the quiz → match → plan flow
- [ ] Primary CTA: "Plan Your Visit" (large, wine bg, hover scale effect)
- [ ] Secondary CTA: "Browse Wineries" (outline variant)
- [ ] Background: warm mesh gradient (burgundy/gold) with subtle noise texture
- [ ] Optional: animated gradient shift or subtle parallax

**Social proof / stats bar:**
- [ ] "68 curated wineries | Personalized matches | Free to use"
- [ ] Or logo-style trust indicators
- [ ] Subtle separator from hero

**How It Works (3 steps):**
- [ ] Step cards with Lucide icons (Wine, BarChart3, MapPin or similar)
- [ ] Step numbers in gold with connecting visual flow
- [ ] Brief, punchy copy per step
- [ ] Scroll-triggered staggered entrance animation

**Features bento grid:**
- [ ] 4-6 tiles highlighting key benefits with icons:
  - "Matches Your Taste" (grape/wine icon)
  - "Budget-Aware" (dollar icon)
  - "Group-Friendly" (users icon)
  - "Map Your Day" (map icon)
  - "Real Details" (info icon — hours, policies, accessibility)
  - "Share Your Plan" (share icon — print, email, link)
- [ ] Varied tile sizes (bento layout, not uniform grid)
- [ ] Subtle hover effect on tiles

**Featured wineries teaser:**
- [ ] "Discover Sonoma's Best" heading
- [ ] 3-4 winery cards from mock data (name, region, tagline, price hint)
- [ ] "View All Wineries →" link
- [ ] Cards with warm shadow, hover lift

**Final CTA section:**
- [ ] Full-width gradient background (wine → bark)
- [ ] "Ready to discover your perfect Sonoma day?" headline
- [ ] Repeated "Plan Your Visit" CTA
- [ ] Cream text on dark gradient

**Footer:**
- [ ] Sonoma Sip logo/wordmark
- [ ] Navigation links: How It Works, Wineries, Privacy, Terms
- [ ] Disclaimer: "Independent guide. Verify details before visiting."
- [ ] "Made with love in Sonoma County"
- [ ] Clean, warm design with bark/cream palette

**Cross-cutting:**
- [ ] Scroll-triggered fade-in animations on all sections
- [ ] Smooth anchor scrolling for "How It Works" nav link
- [ ] Responsive: pixel-perfect at 375px, 768px, 1024px, 1440px
- [ ] Mobile sticky CTA bar (appears after scrolling past hero)
- [ ] Page loads in <3 seconds (CSS gradients, no heavy images)

### 3.5.3 Quiz flow _(use `/ui` skill)_

- [ ] Quiz shell: centered card on cream background, max-width-lg
- [ ] Stepper: visual progress bar with labeled steps, current step in wine, completed in gold
- [ ] Step 1 — Varietals: multi-select chips/toggles (Pinot Noir, Chardonnay, Cabernet, Zinfandel, Sparkling, Rosé, etc.)
- [ ] Step 2 — Vibe: card-based selection with icons (Relaxed & Scenic, Educational, Celebratory, Adventurous, Social & Lively)
- [ ] Step 3 — Budget: tappable price bands or elegant slider ($, $$, $$$, $$$$)
- [ ] Step 4 — Must-haves: toggle switches with icons (Views, Food/Pairing, Outdoor Seating, Dog-Friendly, Kid-Friendly, Wheelchair Accessible)
- [ ] Step 5 — Region & Stops: region card selector + number-of-wineries stepper (1-5)
- [ ] Step 6 — Extras: members-only toggle (off by default), group size field
- [ ] Navigation: Back (ghost) / Next (primary) buttons, Next disabled until valid
- [ ] Step transitions: smooth fade/slide animation between steps
- [ ] `sessionStorage` persistence — resume on refresh
- [ ] Submit: loading state → navigate to `/results` with mock data
- [ ] Design: each step feels delightful and considered, not like a boring form
- [ ] Responsive: full-width card on mobile, constrained centered card on desktop

### 3.5.4 Results page _(use `/ui` skill)_

**Layout:**
- [ ] Desktop: scrollable list (left, ~60%) + map area (right, ~40%) — sticky map
- [ ] Mobile: stacked list with sticky "Show Map" toggle button at bottom
- [ ] Tablet: stacked or side-by-side depending on orientation

**Header area:**
- [ ] "Your Recommendations" heading with count ("5 wineries matched")
- [ ] Collapsible "Your Preferences" summary (badges showing quiz choices)
- [ ] Action bar: Share, Print, Email buttons (outline style)

**Map area:**
- [ ] Static placeholder: Sonoma region SVG illustration or gradient card with "Map coming soon"
- [ ] Shows approximate winery locations as dots (use lat/lng from mock data)

**Result cards:**
- [ ] Rank badge: gold circle with number (#1, #2, etc.)
- [ ] Winery name (Cormorant), region tag (badge), price range
- [ ] Top-3 match reasons in plain language ("Perfect for Pinot lovers", "Great views & outdoor seating")
- [ ] Feature badges: pills for "Reservation Required", "Walk-In", "Dog Friendly", "Members Only"
- [ ] Hover: subtle lift + shadow
- [ ] Click: navigate to `/wineries/[slug]`

**Empty state:**
- [ ] Friendly message: "No wineries matched your preferences"
- [ ] Illustration or icon
- [ ] CTA: "Try relaxing your filters" → back to quiz

**Skeletons:**
- [ ] Loading skeleton matching card layout shape

### 3.5.5 Winery detail page _(use `/ui` skill)_

- [ ] Breadcrumb: Home > Wineries > [Name]
- [ ] Hero: winery name (Cormorant h1), region badge, vibe tagline
- [ ] Visual placeholder: warm gradient band or vine pattern (photos later)
- [ ] About section: editorial story from mock data
- [ ] Hours: clean table/grid (Mon–Sun + times), status indicator (Open/Closed)
- [ ] Tasting experiences: cards with type, description, price, duration
- [ ] Flights table: shadcn Table — flight name, wines, price, format
- [ ] Logistics grid: icon + label for parking, group size, noise level, reservation type
- [ ] Accessibility row: dog/kid/wheelchair with clear icons and labels
- [ ] Ratings: star display + count
- [ ] Primary CTA: "Book a Tasting" (wine bg, large, external link icon)
- [ ] "You Might Also Like" — 2-3 related winery cards
- [ ] Responsive: single column mobile, two-column desktop for some sections

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

## Progress log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-04-02 | 0.1, 3.1 | Scaffold: Next.js, Tailwind, pnpm, ESLint, Prettier |
| 2026-04-02 | 0.3 | All routes + error pages |
| 2026-04-02 | 0.5, 0.5b | Sonoma design system + shadcn/ui (all components) |

---

## Changelog (this file)

| Date | Change |
|------|--------|
| 2026-04-02 | First engineering backlog |
| 2026-04-02 | Locked Q1–Q14 implementation targets |
| 2026-04-02 | Split product doc to `docs/PRD.md`; moved data to `docs/`; TODO is technical-only |
| 2026-04-02 | Phase 9.2 AI roadmap; PRD §14 + README deterministic-first note |
| 2026-04-02 | Restructured to UI-first approach: Phase 3.5 (mock data prototype) before backend phases |
| 2026-04-02 | Added shadcn/ui docs references |
