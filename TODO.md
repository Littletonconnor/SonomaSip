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

## Approach: UI-first, then data pipeline, then wire up

Build the full user experience with mock data first. Validate that every screen feels right. Then build the data pipeline — this is the backbone of the product. Not a one-time import, but a multi-source pipeline that feeds deterministic matching AND LLM content curation.

```
Track A — UI Prototype (current focus)
  Phase 0 (spec, design) ✅
    → Phase 3 (Next.js shell) ✅
    → Phase 3.5 (all screens with mock data) ← YOU ARE HERE
    → Validate & iterate

Track B — Data Pipeline (the backbone — after UI is validated)
  Phase D0 (winery discovery — expand from 68 to comprehensive registry)
  Can run in parallel:
    Phase D1 (schema design) + Phase D2 (data quality) + Phase D3 (SCORING.md)
  Then sequentially:
    → Phase D4 (Supabase migrations)
    → Phase D5 (import pipeline — handles both editorial + discovered wineries)
    → Phase D6 (matching engine)
    → Phase D7 (wire up)

Track C — Content Pipeline & Monetization (foundational — before launch)
  Phase D8 (content pipeline: scrape → LLM → review)
    + Phase D9 (admin pages: review UI, health dashboard, click dashboard)
    + Phase D10 (click attribution: tracking + reporting)

Track D — Polish & Launch
  Phase 6 (SEO / perf)
    → Phase 7 (ops)
    → Phase 8 (a11y, QA, launch)
    → Phase 9 (post-MVP)
```

### Data Source Authority Hierarchy

| Source                               | Provides                                                             | Trust                                    | Refresh                        | Cost |
| ------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------- | ------------------------------ | ---- |
| Curated CSV (68 editorial wineries)  | Editorial stories, style scores, flights, experience flags, pairings | Highest — editorial voice                | Manual, quarterly              | Free |
| OpenStreetMap / Overpass API         | Winery discovery: name, coordinates, address, website, phone         | High for existence/location              | Quarterly discovery runs       | Free |
| Wine association directories         | Member lists (cross-validation, new winery discovery)                | High for "is this a real tasting room?"  | Annual scrape                  | Free |
| Wikidata SPARQL                      | Cross-validation, Wikipedia descriptions                             | Medium — incomplete but authoritative    | Quarterly                      | Free |
| Google Places API (optional, future) | business_status, live ratings, hours (comparison only)               | High for facts, low for domain data      | Weekly                         | Paid |
| URL Health Checks                    | Booking URL liveness                                                 | Binary signal                            | Weekly                         | Free |
| User Reports (future)                | "This is wrong" flags                                                | Lowest — signal only, never auto-applied | Real-time submit, async review | Free |

**Conflict resolution:** Editorial always wins. OSM/Wikidata provide discovery and basic facts but never overwrite editorial fields. Google (if added later) can auto-update `rating_google` but only _flags_ hours drift for human review. URL checks flag broken links. User reports create a review queue, never touch the canonical record.

---

## Phase 0 — Specification & design

### 0.1 Repository & tooling

- [x] Git init; `.gitignore` (`.env*`, `node_modules`, `.next`, `.vercel`, Supabase temp)
- [x] Package manager (**pnpm**); `engines` / `.nvmrc` for Node
- [x] EditorConfig, Prettier, ESLint (Next-compatible)
- [x] Root `README.md`: dev commands, env setup, link to `docs/`
- [x] `.env.example` (no secrets)

### 0.2 Service accounts _(manual — do when needed)_

- [x] Supabase project — ref: `rxihebhphpbhzanijfuv`, region: us-east-2
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

- [x] Prominent disclaimer on every page with winery data (footer, results, detail, plan, PDF, email): "Sonoma Sip is an independent guide. We are not affiliated with, endorsed by, or sponsored by any winery listed. Information may be outdated or inaccurate — always verify details directly with the winery before visiting."
- [ ] Winery detail page: dedicated disclaimer block near the CTA, not just footer
- [x] Shared plan / PDF: disclaimer as first or last line of the document — present on plan page

**Terms of Service — key clauses:**

- [x] **Independent guide / no affiliation:** Sonoma Sip is an independent informational resource. We are not agents, representatives, or affiliates of any winery. Listing does not imply endorsement in either direction.
- [x] **No guarantee of accuracy:** All winery information (hours, prices, policies, availability, amenities) is provided for informational purposes only. We make reasonable efforts to keep data current but cannot guarantee accuracy. Users must verify details with wineries before visiting.
- [x] **Third-party content:** Winery names, descriptions, and details are sourced from publicly available information. All trademarks belong to their respective owners. If a winery wishes to update or remove their listing, they can contact us.
- [x] **Winery opt-out / update process:** Clear contact method (email) for wineries to request corrections, updates, or removal of their listing. Commit to processing requests within a reasonable timeframe (e.g., 7 business days).
- [x] **Limitation of liability:** Sonoma Sip is not liable for any damages arising from reliance on information provided, including but not limited to incorrect hours, prices, policies, or closures.
- [x] **User-generated content:** If users can submit reviews/reports in the future, include clause reserving right to moderate and disclaiming responsibility for user content.

**Privacy policy:**

- [x] Analytics data collection (Plausible/PostHog — cookie-light)
- [x] Email collection (only if user opts into email share)
- [x] Share URL data (what's stored, how long, who can access)
- [x] No sale of personal data
- [x] CCPA compliance (California users)

**Footer legal line (all pages):**

- [x] "Sonoma Sip is an independent guide — not affiliated with any listed winery. Verify details before visiting."

### 0.5 Design system

- [x] Fonts, color tokens, spacing (WCAG AA on controls)
- [x] Component inventory: Button, Chip, Slider, Stepper, Card, Modal, Toast, Skeleton, list row, map callout
- [x] Key screens: landing, quiz step, results split, detail, print _(covered by Phase 3.5)_
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

- [x] `env.ts` with Zod validation; separate public vs server secrets — `src/lib/env.ts` with `publicSchema` (MAPBOX_TOKEN, SITE_URL) and `serverSchema` (extensible for Supabase, Resend)

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

### 3.5.11 Results page polish

_The empty state, error state, loading skeleton, and overall results UI need a quality pass to feel premium and editorial — not like default framework output._

#### Empty state (`EmptyState` component)

- [ ] Richer illustration: replace the plain Search icon with a wine-themed empty state (e.g., empty wine glass, vineyard silhouette, or custom SVG) — should feel warm, not sterile
- [ ] Better copy hierarchy: larger, more empathetic headline ("We couldn't find a perfect match — yet"), supportive sub-copy explaining what they can do
- [ ] Actionable suggestions: show 2–3 specific tips for broadening their search (e.g., "Try adding more regions", "Relax your budget filter", "Remove some must-haves") based on which filters were most restrictive
- [ ] Secondary CTA: add "Browse All Wineries" link alongside "Retake the Quiz" so users have options
- [ ] Subtle animation: gentle fade-in or illustration animation to soften the disappointment

#### Error state (`ErrorState` component)

- [ ] Friendlier tone: softer headline ("Something didn't go as planned"), reassuring sub-copy
- [ ] Retry action: add a "Try Again" button that re-runs the quiz submission without navigating away
- [ ] Contact fallback: small "If this keeps happening, let us know" link or text

#### Loading skeleton (`ResultsSkeleton`)

- [ ] Polish shimmer effect: use a warm-toned shimmer (cream/linen gradient) instead of default gray pulse
- [ ] Add skeleton for preference badges section
- [ ] Skeleton map placeholder on desktop side

#### Result cards (`ResultCard`)

- [ ] Score ring animation: animate the SVG stroke on mount (draw-in effect)
- [ ] Hover state: more pronounced card lift/shadow on hover for better affordance
- [ ] Winery image: placeholder for future winery photo (gradient or pattern placeholder that looks intentional)
- [ ] "Book a Tasting" inline CTA: small secondary action on each card so users don't have to click through to detail page
- [ ] Truncate long match reason lists: show top 3, expandable "Show more" if >3

#### Header & actions

- [x] Functional Share button: copy share URL to clipboard with toast confirmation
- [x] Functional Print button: trigger `window.print()` with a print-optimized stylesheet
- [x] Functional Email button: open mailto with pre-filled subject and share URL
- [ ] Results count copy: make it warmer (e.g., "We found 12 wineries you'll love" instead of "12 wineries matched your preferences")

#### Map integration

- [ ] Highlight card ↔ map pin interaction: hovering a result card highlights the corresponding map pin (and vice versa)
- [ ] Fly-to on card click: clicking a card briefly highlights the pin on the map before navigating to detail
- [ ] Mobile map: full-screen expandable overlay instead of inline collapse

#### Responsive & polish

- [ ] Mobile card layout: optimize spacing and typography for small screens (375px)
- [ ] Print stylesheet: hide map, nav, footer; clean card layout for printing
- [ ] Page transition: smooth entrance animation when navigating from quiz to results

### 3.5.10 Content refresh

- [x] **"How It Works" section rewrite:** Current copy says "Three questions. One perfect day." but the quiz is 4 steps, not 3 questions. Rethink the headline, step titles, and descriptions to accurately reflect the actual quiz flow (varietals → vibe/budget → must-haves/group → regions/stops). The "three questions" framing is misleading.
- [ ] **Logo redesign:** Current wine glass icon (`src/app/icon.tsx`, `src/app/apple-icon.tsx`, navbar) looks like a goblet. Replace with a more refined, professional wine glass silhouette that feels editorial/luxury. Update favicon, apple icon, navbar logo, and manifest icons.

---

> **Open questions for future sessions:** exact LLM prompts and editorial voice definition, content freshness cadence, admin review UX workflow, how click attribution data feeds into winery partnership outreach, and whether the scrape → enrich pipeline should run on Vercel cron or a separate worker.

### Design decisions resolved (2026-04-04)

These decisions were identified during a schema review and are now codified in `src/lib/types.ts` and `docs/SCORING.md`:

| Decision                                     | Resolution                                                                                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Budget band → dollar mapping**             | `$` ≤ $35, `$$` ≤ $65, `$$$` ≤ $100, `$$$$`= no cap. Defined in`SCORING.md` §1.                                                                                                                                                                   |
| **Style dimension scores**                   | 5 numeric columns (1–5): `styleRelaxed`, `styleAdventurous`, `styleEducational`, `styleCelebratory`, `styleSocial`. Added to `Winery` type as `StyleScores` object. Required for soft scoring.                                                    |
| **Editorial quality/popularity scores**      | `qualityScore` (1–5, editorial), `popularityScore` (1–5, editorial), `ratingGoogle` (1–5, from Google Places). All nullable. Added to `Winery` type.                                                                                              |
| **`ReservationType` values**                 | Changed from `walk-in / appointment / members-only` to `walk_ins_welcome / reservations_recommended / appointment_only`. Members-only is a separate boolean (`isMembersOnly`). `reservations_recommended` = walk-ins possible but not guaranteed. |
| **`FlightFormat` expanded**                  | Added `tour` and `bar` to match actual Excel data. Full set: `seated, standing, picnic, outdoor, tour, bar`.                                                                                                                                      |
| **Sonoma Coast region**                      | Added as 6th region. If Excel contains Sonoma Coast wineries, they get their own bucket. Quiz and types updated.                                                                                                                                  |
| **`Setting` field**                          | New enum: `vineyard, estate, downtown, hilltop, cave`. Display-only for V1 (not a scoring dimension). Nullable.                                                                                                                                   |
| **`primaryVarietal` → `signatureVarietals`** | Changed from single value to array. Allows multiple signature varietals per winery. The normalized `winery_varietals` table uses `is_signature` boolean.                                                                                          |
| **Walk-in filter behavior**                  | "Walk-in friendly" filter passes both `walk_ins_welcome` and `reservations_recommended` (per `SCORING.md` §3.6).                                                                                                                                  |
| **Shared itinerary flight ID stability**     | `shared_itineraries.results` JSONB stores full winery+flight data (snapshot), not just IDs. Safe against `DELETE + INSERT` on flights during re-import.                                                                                           |
| **Click tracking client-side**               | Use `navigator.sendBeacon` or fire-and-forget fetch to avoid blocking the redirect to booking URL.                                                                                                                                                |

---

## Phase D0 — Winery Discovery & Registry _(expand beyond 68 editorial wineries)_

**Goal:** Build a comprehensive registry of every winery and tasting room in Sonoma County AND Napa Valley. The 68 editorial wineries become the richest entries in a much larger dataset. Target: 400–600+ wineries total. All discovery sources are free.

**Geographic expansion:** The app covers Sonoma County + Napa Valley (not just Sonoma). This means new AVA regions (Napa-side), expanded coordinate bounds, and updated branding language where needed.

### D0.1 Coverage tiers

Define how wineries at different data richness levels appear in the app:

- [ ] Add `coverage_tier` enum: `editorial` | `verified` | `discovered`
  - **Editorial** — full curated data (current 68). Rich detail pages, full quiz matching, editorial content, style scores.
  - **Verified** — basic info confirmed (name, location, website, hours, reservation policy, a few amenities). Shown on map and browse pages. Eligible for basic quiz matching (location, budget if known, reservation type).
  - **Discovered** — exists in registry but not yet reviewed. Shown on map only (pin + name + "Visit website"). Not eligible for quiz matching.
- [ ] Add `coverage_tier` column to `wineries` table (default: `discovered`)
- [ ] Update winery detail page to handle reduced data gracefully (verified/discovered tiers)
- [ ] Update quiz matching to only include `editorial` + `verified` wineries
- [ ] Update browse/map to show all tiers with visual differentiation (e.g., muted pins for discovered)

### D0.2 OpenStreetMap / Overpass API discovery (primary source — free)

OSM's Overpass API lets you query for all `amenity=winery` and `craft=winery` nodes in a bounding box. Completely free, no API key, no rate limit for reasonable usage.

- [ ] Write `scripts/discover-osm.ts` — queries Overpass API for wineries in Sonoma + Napa bounding box
  - Query: `[out:json];(node["amenity"="winery"](38.0,−123.5,39.0,−122.0);node["craft"="winery"](38.0,−123.5,39.0,−122.0);way["amenity"="winery"](38.0,−123.5,39.0,−122.0);way["craft"="winery"](38.0,−123.5,39.0,−122.0););out center;`
  - Extract: name, latitude, longitude, address, website, phone, opening_hours (OSM format)
  - Output: `docs/csv/discovered-osm.csv`
- [ ] Fuzzy-match OSM results against existing 68 editorial wineries (name + proximity threshold ~500m)
- [ ] Tag matched wineries with `osm_node_id` for future syncs
- [ ] Tag unmatched results as new `discovered` entries
- [ ] npm script: `pnpm discover:osm`
- [ ] Run and review: how many wineries does OSM know about? What's missing?

### D0.3 Wine association directory scraping (cross-validation — free)

Official wine association member directories are the most authoritative "does this tasting room exist and is it open to the public?" source.

- [ ] Scrape Sonoma County Vintners member directory (public web page)
- [ ] Scrape Napa Valley Vintners member directory (public web page)
- [ ] Output: `docs/csv/discovered-associations.csv` (name, website, region)
- [ ] Cross-reference against OSM discoveries and editorial list
- [ ] Wineries on association lists but not in OSM → flag for manual addition
- [ ] npm script: `pnpm discover:associations`

### D0.4 Wikidata SPARQL (supplementary — free)

Wikidata can provide structured data (founding year, owner, Wikipedia description) and serve as a third cross-validation source.

- [ ] Write SPARQL query for wineries in Sonoma County + Napa Valley
- [ ] Extract: name, coordinates, website, founding date, Wikipedia article URL
- [ ] Cross-reference against existing registry
- [ ] npm script: `pnpm discover:wikidata`

### D0.5 Registry merge & deduplication

- [ ] `scripts/merge-discoveries.ts` — merges all discovery sources into a single canonical registry
  - Priority: editorial CSV > OSM > association > Wikidata
  - Dedup by: fuzzy name match (Levenshtein or similar) + coordinate proximity (<500m)
  - Output: `docs/csv/winery-registry.csv` — the master list with `coverage_tier` and source columns
- [ ] Human review step: scan the merged list for obvious junk (non-wineries, duplicates the fuzzy match missed, entries outside target regions)
- [ ] npm script: `pnpm discover:merge`

### D0.6 Expand geographic scope

- [ ] Add Napa Valley AVA regions to `ava_region` enum: `napa_valley`, `oakville`, `rutherford`, `stags_leap_district`, `yountville`, `st_helena`, `calistoga`, `howell_mountain`, `spring_mountain`, `atlas_peak`, `diamond_mountain`, `mount_veeder`, `wild_horse_valley`, `coombsville`, `chiles_valley`, `los_carneros` (shared with Sonoma)
- [ ] Expand validation bounds in `scripts/lib/validate.ts` to cover Napa (current bounds already include Napa geographically, but update the warning message from "Sonoma County" to "Sonoma/Napa wine country")
- [ ] Update any hard-coded "Sonoma" references in app copy that should now say "Sonoma & Napa" (audit needed)

### D0.7 Import pipeline updates

- [ ] Update `scripts/import-wineries.ts` to handle registry CSV alongside editorial CSVs
  - Editorial wineries: full import (all 8 CSVs) → `coverage_tier: editorial`
  - Discovered wineries: basic import (registry CSV only) → `coverage_tier: discovered`
- [ ] Verified wineries: as manual review enriches discovered entries, promote to `coverage_tier: verified`
- [ ] Dry-run with merged data to validate before live import

### D0.8 Ongoing discovery cadence

- [ ] Run `discover:osm` quarterly to catch new openings
- [ ] Cross-reference closures: if an OSM entry disappears or gets tagged `disused:amenity=winery`, flag for review
- [ ] Track discovery runs in `import_runs` table (source: `osm_discovery`, `association_scrape`, etc.)
- [ ] Promotion workflow: discovered → verified (checklist: confirm website works, confirm open to public, fill reservation_type + basic hours)

---

## Phase D1 — Schema Design _(can start now, parallel with D2 + D3)_

Design decisions documented here — these drive everything downstream.

**JSONB vs Normalized:**

| Data                     | Decision          | Why                                                                                                           |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Hours                    | JSONB             | Read as unit, never filtered by day                                                                           |
| Varietals                | Normalized table  | Filtered during matching, needs indexes                                                                       |
| Flights                  | Normalized table  | Multiple per winery, aggregated for budget                                                                    |
| Style scores             | 5 columns         | `styleRelaxed`, `styleAdventurous`, `styleEducational`, `styleCelebratory`, `styleSocial` (1–5 each)          |
| Experience flags         | 6 boolean columns | `isDogFriendly`, `isKidFriendly`, `isWheelchairAccessible`, `hasFoodPairing`, `hasOutdoorSeating`, `hasViews` |
| Import errors            | JSONB             | Variable structure, write-once                                                                                |
| Shared itinerary results | JSONB             | Snapshot, versioned, retrieved by ID only                                                                     |

### D1.1 Column mapping from Excel

- [x] Map every column from all 8 Excel sheets to database columns — documented inline in migration SQL comments
- [x] Document column name → DB field → TypeScript type for each
- [x] Identify columns that are editorial-only (description, tagline) vs filterable vs scoreable
- [ ] Flag columns with data quality issues (see D2)

### D1.2 Enum design

_Values below are locked in `src/lib/types.ts` as of 2026-04-04. DB enums must match._

- [x] `reservation_type`: `walk_ins_welcome`, `reservations_recommended`, `appointment_only` _(updated from old `walk-in / appointment / members-only` — members-only is now a separate boolean)_
- [x] `noise_level`: `quiet`, `moderate`, `lively`
- [x] `flight_format`: `seated`, `standing`, `tour`, `outdoor`, `picnic`, `bar` _(expanded to match actual Excel data)_
- [x] `ava_region`: `russian_river_valley`, `dry_creek_valley`, `alexander_valley`, `sonoma_valley`, `carneros`, `sonoma_coast` _(6 regions, Sonoma Coast added)_
- [x] `setting`: `vineyard`, `estate`, `downtown`, `hilltop`, `cave` _(display-only for V1)_
- [x] Validate each enum against actual Excel values — mapped in migration 001 comments; added 4 new AVA regions from CSV (sonoma_mountain, green_valley, petaluma_gap, rockpile)

### D1.3 ERD & table design

- [x] `wineries` table: 70+ columns from all 8 CSV sheets, style scores use CSV names (style_classic, style_luxury, etc.)
- [x] `winery_varietals` join table: `(winery_id, varietal, is_signature)`
- [x] `flights` table: `(winery_id, name, price, wines_count, duration_minutes, format, food_included, reservation_required, description)`
- [x] `import_runs` table: audit trail for data imports
- [x] `shared_itineraries` table: UUID PK, JSONB quiz_answers + results snapshot, payload_version
- [x] `data_health_checks` table: URL health, hours drift, rating drift, missing data, user reports
- [x] `field_overrides` table: editorial override audit trail
- [x] Provenance fields on `wineries`: `last_verified_at`, `last_places_sync_at`, `data_source`, `verification_notes`, `is_active`
- [ ] Document the ERD (can be a markdown table or mermaid diagram)

### D1.4 RLS plan

- [x] Document RLS rules before writing migrations
- [x] `wineries`, `flights`, `winery_varietals`: public `SELECT` (read-only)
- [x] `shared_itineraries`: server-only `INSERT`, public `SELECT` by id
- [x] `import_runs`, `data_health_checks`, `field_overrides`: admin-only (service role key)
- [x] No public `UPDATE`/`DELETE` on any content table

### D1.5 TypeScript type reconciliation

- [x] Reconcile `src/lib/types.ts` (current mock types) with new schema — done 2026-04-04: added `StyleScores`, `Setting`, `signatureVarietals`, `qualityScore`, `popularityScore`, `ratingGoogle`; updated `ReservationType`, `FlightFormat`, `Region`
- [x] Plan the `WineryForMatching` flat type (pre-joined, all scoring fields, no DB queries in scoring loop)
- [x] Plan the `WineryForDisplay` type (what the UI needs)
- [x] Decide: generate types from Supabase — `pnpm db:gen-types` generates `src/lib/database.types.ts`

---

## Phase D2 — Data Quality _(can start now, parallel with D1 + D3)_

Clean the source data BEFORE importing. Garbage in, garbage out.

### D2.1 Identify closures & exclusions

- [ ] Confirm closed wineries: Arrowood, Fieldstone, Murphy-Goode (Jackson Family)
- [ ] Create `scripts/import-config.yml` with `excluded_slugs` list and reasons
- [ ] Check for any other closures since Excel was compiled

### D2.2 Resolve duplicates

- [ ] Audit for duplicate/near-duplicate entries (Bella, Cline, etc.)
- [ ] Define canonical slug for each
- [ ] Document merge decisions

### D2.3 Validate coordinates

- [x] All lat/long within Sonoma County bounding box (lat 38.0–39.0, lon -123.5 to -122.0) — ✅ 68/68 pass. Validation script: `scripts/validate-coordinates.ts`
- [x] Fix Carneros / county display per PRD — Domaine Carneros has Napa mailing address but is in Carneros AVA (straddles Napa/Sonoma). City="Napa", ZIP=94559 are correct for its physical location. No change needed.
- [x] Spot-check 10 random wineries on a map — Cross-referenced against Google Maps/Apple Maps/Yelp. Fixed 3 inaccurate coordinates: Francis Ford Coppola (was 7.4km off), Benziger (2.5km off), Fort Ross Vineyard (4.4km off). Remaining 7/10 spot-checks exact match.

### D2.4 Validate URLs

- [ ] HTTP HEAD check on every `booking_url` and `website_url` in Excel
- [ ] Fix or flag broken links
- [ ] Ensure all URLs are HTTPS

### D2.5 Validate experience flags

- [ ] Spot-check dog/kid/wheelchair/food-pairing flags against winery websites (time-boxed, 15 wineries)
- [ ] Scribe: confirm `members-only` nuance (weekends only → V1 treats as binary)
- [ ] Document any overrides in `import-config.yml`

### D2.6 Validate enums & ranges

- [ ] Every `reservation_type` value in Excel maps to a defined enum
- [ ] Every `noise_level` value maps to a defined enum
- [ ] Flight prices are numeric and reasonable ($0–$500 range)
- [ ] Flight formats match expanded enum (seated, standing, tour, outdoor, picnic, bar)
- [ ] Document any Excel values that need mapping/coercion

---

## Phase D3 — SCORING.md Spec _(can start now, parallel with D1 + D2)_

_Initial spec drafted in `docs/SCORING.md` on 2026-04-04. Budget bands, style weights, hard filters, soft scoring formula, tie-breakers, explanation templates, and 5 worked example skeletons are defined. Needs validation against real imported data._

### D3.1 Persona inference

- [x] Define the quiz answer → persona weight mapping table — see `SCORING.md` §2
- [x] Cover all quiz dimensions: vibes → style weights, group size → implicit weights, budget → hard filter + soft score

### D3.2 Hard filters

- [x] Document all must-have filters — see `SCORING.md` §3
- [x] Varietals: OR logic (winery must have at least one selected varietal)
- [x] Budget: `minFlightPrice ≤ maxBudget` (flights ≤$200 only for min price calc)
- [x] Walk-in-only: passes `walk_ins_welcome` OR `reservations_recommended`
- [x] Members-only: exclude by default; -10 point penalty if included via override
- [x] Accessibility: dog-friendly, kid-friendly, wheelchair-accessible
- [x] Region filter: OR logic on selected regions
- [x] Group size: hard filter when groupSize ≥ 8

### D3.3 Soft scoring

- [x] Define the weighted scoring formula — see `SCORING.md` §4
- [x] Style dimension scoring: quiz vibe → style\_\* column weights (40 pts)
- [x] Experience bonus: matched must-haves + amenity count (20 pts)
- [x] Budget proximity: sweet spot at 70% of budget ceiling (20 pts)
- [x] Rating blend: 0.4 × qualityScore + 0.3 × popularityScore + 0.3 × ratingGoogle (15 pts)
- [x] Normalize scores to 0–100 range

### D3.4 Tie-breakers & diversity

- [x] Tie-breaking rule: qualityScore → ratingGoogle → alphabetical (deterministic)
- [x] Geographic diversity: demote 3rd+ winery from same region in top 5
- [x] AVA diversity: top 5 should represent ≥3 different regions when possible

### D3.5 Explanation templates

- [x] Define the "why we picked this" template per winery — see `SCORING.md` §6
- [x] Map each scoring dimension to a human-readable reason (16 templates)
- [x] Selection rule: top 3–5 by relevance, prioritize must-have matches

### D3.6 Worked examples

- [x] ≥5 complete examples: quiz input → expected filter behavior → scoring notes — see `SCORING.md` §7
- [x] Cover edge cases: very restrictive (example 4), very broad (example 5)
- [ ] Fill in expected top-5 slugs after real data import (TBD in D6.7)
- [ ] These become golden test files for Phase D6

---

## Phase D4 — Supabase Migrations _(after D1 schema design)_

### D4.1 Project setup

- [x] `supabase init`; link remote project (ref: `rxihebhphpbhzanijfuv`)
- [x] Browser Supabase client (`src/lib/supabase.ts`) — server client (cookie pattern) deferred to when needed
- [x] Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### D4.2 Migrations

- [x] Migration 001: create enums (7 enums including 10-value `ava_region`)
- [x] Migration 002: create `wineries` table (70+ columns)
- [x] Migration 003: create `winery_varietals` table + indexes
- [x] Migration 004: create `flights` table + FK + indexes
- [x] Migration 005: create `import_runs` table
- [x] Migration 006: create `shared_itineraries` table
- [x] Migration 007: create `data_health_checks` + `field_overrides` tables
- [x] Migration 008: add missing AVA regions (`bennett_valley`, `chalk_hill`, `fort_ross_seaview`) found in CSV data
- [x] Indexes: unique `wineries.slug`, `flights.winery_id`, `winery_varietals.winery_id`, ava_primary, reservation_type, is_active
- [x] Applied to remote Supabase via `supabase db push`

### D4.3 RLS policies

- [x] Enable RLS on all tables
- [x] Implement policies per D1.4 plan (inline in migrations)
- [ ] Test: anonymous user can SELECT wineries/flights, cannot INSERT/UPDATE/DELETE
- [ ] Test: service role can do everything

### D4.4 Type generation

- [x] `supabase gen types typescript` → `src/lib/database.types.ts` (script: `pnpm db:gen-types`)
- [x] ~~Add `db:types` script to package.json~~ — already exists as `db:gen-types`
- [x] Create mapper layer: Supabase row types → app types (`WineryForDisplay`, `WineryForMatching`) — `src/lib/mappers.ts` with `toFlight`, `toWineryForDisplay`, `toWineryForMatching`

---

## Phase D5 — Import Pipeline _(after D4 migrations)_

### D5.1 Parser setup

- [x] ~~Add `exceljs` dependency~~ — not needed; CSVs already exported to `docs/csv/`
- [x] Create `scripts/import-wineries.ts` entrypoint
- [ ] Read `scripts/import-config.yml` for exclusions and overrides

### D5.2 Sheet parsers

- [x] Parser for "Core Info" sheet → basic winery fields
- [x] Parser for "Experiences" sheet → experience flags + accessibility
- [x] Parser for "Styles" sheet → style\_\* scores (1-5)
- [x] Parser for "Flights" sheet → flight records
- [x] Parser for "Varietals" sheet → varietal arrays + signatures
- [x] Parser for "Logistics" sheet → hours, pairings, practical info
- [x] Parser for "Ratings" sheet → editorial scores + platform ratings
- [x] Parser for "Descriptions" sheet → tagline, description, editorial content _(descriptions are in core-info.csv)_
- [x] Each parser validates headers match expected schema _(via `scripts/lib/parse-csv.ts` CSV parser + `scripts/lib/validate.ts`)_

### D5.3 Join & transform

- [x] Join all sheets by slug into single `WineryImportRecord` per winery
- [ ] Apply exclusions from config
- [ ] Apply overrides from config
- [x] Compute derived fields: `min_flight_price` (flights ≤$200 only), `max_flight_price`, `has_food_pairing`, varietal arrays, vibe tags

### D5.4 Validation gate

- [x] Required fields: slug, name, lat, lon
- [x] Enum validation against defined enums _(via `scripts/lib/transforms.ts` mapping functions)_
- [x] Coordinate range check (Sonoma County bounding box)
- [x] URL format validation (HTTPS)
- [x] No duplicate slugs after exclusion/merge
- [x] Log warnings for non-fatal issues, errors for fatal ones

### D5.5 Database upsert

- [x] ~~Single Supabase transaction per import run~~ — sequential upserts with import_runs audit trail
- [x] UPSERT `wineries` (on conflict slug)
- [x] DELETE + INSERT `winery_varietals` for each winery
- [x] DELETE + INSERT `flights` for each winery _(safe: `shared_itineraries` stores full snapshot, not flight IDs)_
- [x] Record run in `import_runs` with source file SHA-256 hash

### D5.6 Dry-run mode

- [x] `--dry-run` flag: parse, validate, compute — but don't write to DB
- [x] Print summary: X wineries, Y flights, Z warnings, N errors
- [x] Always run dry-run before real import — **verified: 68 wineries, 118 flights, 344 varietals, 0 errors, 0 warnings**

### D5.7 Post-import verification

- [x] Automated assertions: winery count = 65-68, flights ≥ 100, zero orphan flights
- [x] All ~~5~~ 13 AVA regions represented
- [x] No null required fields
- [x] Print health report to console

### D5.8 npm scripts

- [x] `db:import` — run import against configured Supabase
- [x] `db:import:dry` — dry-run mode
- [ ] `db:reset` — reset local DB + re-import
- [x] ~~`db:types`~~ — already exists as `db:gen-types`

---

## Phase D6 — Matching Engine _(after D5 import + D3 scoring spec)_

### D6.1 Types

- [x] `WineryForMatching`, `MatchResult`, `QuizAnswers` — already defined in `src/lib/types.ts`; `ScoreBreakdown` added in `src/lib/matching/score.ts`

### D6.2 Filters

- [x] `lib/matching/filters.ts` — hard filters per D3.2
- [x] Each filter is a pure function: `(winery: WineryForMatching, answers: QuizAnswers) => boolean`
- [x] Compose filters: winery must pass ALL active hard filters

### D6.3 Scoring

- [x] `lib/matching/score.ts` — weighted scoring per D3.3
- [x] Pure function: `(winery: WineryForMatching, answers: QuizAnswers) => number`
- [x] Score normalized to 0-100

### D6.4 Explanations

- [x] `lib/matching/explain.ts` — per D3.5 templates
- [x] Generate human-readable "why this winery" for each match
- [x] Reference specific quiz answers in explanations

### D6.5 Orchestrator

- [x] `lib/matching/index.ts` — `recommend(wineries: WineryForMatching[], answers: QuizAnswers): MatchResult[]`
- [x] Flow: fetch all active wineries → filter → score → sort → diversify → take top N → explain
- [x] Deterministic: same input always produces same output

### D6.6 Unit tests

- [x] Test each filter independently with edge cases (44 tests across 3 files)
- [x] Test scoring with known inputs → expected scores
- [x] Test orchestrator: ranking, diversity, determinism, edge cases

### D6.7 Golden file tests

- [x] 7 quiz profiles (5 from SCORING.md + 2 edge cases) in `src/lib/matching/__fixtures__/quiz-profiles.ts`
- [x] Snapshot tests: input → expected top N ordering (`src/lib/matching/__tests__/golden.test.ts`)
- [x] Run against real Supabase data (not mocks) — 55 assertions, all passing
- [x] Invariant tests: no empty results, scores descending, scores 0–100, reasons populated, determinism
- [x] `pnpm test:golden` script for running golden tests independently

### D6.8 Filter relaxation

- [x] Progressive filter relaxation when hard filters return fewer results than `numStops`
- [x] Relaxation order: region → must-haves → budget → varietal (least to most important)
- [x] Members-only and group-size filters never relaxed (safety/logistics)
- [x] `filtersRelaxed` field on `MatchResult` so UI can inform users which filters were dropped

### D6.9 Scoring & data quality refinements _(from LLM verification report — `docs/quiz-results-verification.md`)_

- [x] **Fix `style_classic` → `styleRelaxed` mapping:** "Classic" (traditional, downtown tasting rooms) is not "Relaxed & Scenic" (calm, views, pastoral). Sebastiani scores as top "relaxed" pick when it shouldn't. Consider splitting or re-weighting the relaxed dimension to incorporate view/setting signals.
- [x] **Add `ava_secondary` to region matching:** Iron Horse (primary: Green Valley, secondary: Russian River Valley) fails the RRV region filter despite being geographically within the appellation. Match on `ava_secondary` as a fallback before triggering region relaxation.
- [x] **Audit `has_outdoor_seating` data:** Many wineries with described outdoor areas (patios, terraces, gardens) have `has_outdoor_seating = FALSE`. Cross-reference descriptions with the flag and fix inaccuracies. This causes unnecessary filter relaxation for the `casualCouple` profile.
- [x] **Increase rating weight for no-vibe profiles:** When no vibes are selected, the 40-point style match produces uniform scores, making the 15-point rating blend an insufficient tiebreaker. Consider boosting rating to 25 and style to 30 when weights are uniform, or add a quality-tier bonus for top-rated wineries.
- [x] **Deduplicate Cline entries:** `cline-cellars` and `cline-family-cellars` appear in the data with the same address. Merge into one canonical entry. This may cause a qualified family-friendly option to be missed in the `familyTrip` profile.
- [ ] **Review `style_sustainable` → `styleEducational` mapping:** Overlaps for biodynamic/organic wineries but misses educational tour-focused wineries. Benziger's tram tour is valued for sustainability score, which happens to be correct but for the wrong reason.
- [ ] Re-run `pnpm test:golden -- --update` after scoring changes and review updated snapshots

---

## Phase D7 — Wire Up: Replace Mock Data _(after D6 matching engine)_

### D7.1 Data layer

- [x] Create `lib/data/wineries.ts` — Supabase queries for fetching wineries
- [x] `getWineriesForMatching()` — flat, pre-joined, all scoring fields
- [x] `getWineryBySlug(slug)` — full detail for display
- [x] `getAllWinerySlugs()` — for `generateStaticParams`
- [x] Cache strategy: ISR with revalidate (hourly or on-demand)

### D7.2 Server actions

- [x] Quiz submit → server action → fetch wineries → matching engine → results
- [x] Server authority: recommendations computed server-side for persistence

### D7.3 Results page

- [x] Replace mock data with real `MatchResult[]` from server action
- [x] Wire up "why this winery" explanations

### D7.4 Winery detail pages

- [x] `generateStaticParams` from `getAllWinerySlugs()`
- [x] Revalidate policy (ISR, hourly)
- [x] Replace mock winery data with `getWineryBySlug()`

### D7.5 Browse page

- [x] Replace mock winery list with Supabase query
- [x] Wire up filters to real data

### D7.6 Share flow

- [x] Insert `shared_itineraries` → Supabase on share create
- [x] Load shared itinerary by ID on share page
- [ ] Rate limit share creation by IP

### D7.7 Plan page

- [x] Wire up plan/itinerary page to real data
- [ ] PDF: text-first print route / CSS; v2: Mapbox Static image
- [ ] Email: send via Resend/Postmark with share URL + summary

---

## Phase 0.9 — Analytics instrumentation

- [ ] Plausible snippet / proxy per their Next.js guidance
- [ ] Events: `quiz_started`, `quiz_step_completed`, `quiz_completed`, `itinerary_computed` (count ≥ 1), optional `results_rendered`, `winery_detail_opened`, `share_created`, `pdf_downloaded`, `email_sent`
- [ ] Funnel: completion → `itinerary_computed`

---

## Phase D8 — Content Pipeline _(foundational — before launch)_

_The detail pages need rich, original content to drive click-throughs. This pipeline scrapes winery websites, feeds them to LLMs, and produces original editorial content for human review._

**Architecture:**

```
Registry (winery URLs from Excel)
  → Cloudflare /crawl API (scrape websites as markdown)
  → Raw scrape storage (winery_scrapes table)
  → LLM extraction (structured data: hours, flights, prices, varietals)
  → LLM enrichment (original stories, descriptions, seasonal notes)
  → Content drafts (content_drafts table, status: draft)
  → Admin review UI (you + girlfriend approve/edit/reject)
  → Published to wineries table (status: approved)
```

### D8.1 Cloudflare Browser Rendering setup

- [ ] Cloudflare account + API token with "Browser Rendering - Edit" permission
- [ ] Environment variables: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- [ ] Wrapper utility: `lib/pipeline/cloudflare-crawl.ts` — initiates crawl, polls for completion, returns markdown
- [ ] Configuration: `limit: 10` pages per winery, `formats: ["markdown"]`, `rejectResourceTypes: ["image", "media", "font", "stylesheet"]`
- [ ] Respect robots.txt (Cloudflare does this by default)
- [ ] Test with 3 winery websites to validate output quality

### D8.2 Scrape pipeline

- [ ] `scripts/scrape-wineries.ts` — iterates registry, crawls each winery website
- [ ] `winery_scrapes` table: `(id, winery_id, url, raw_markdown, pages_crawled, scraped_at, cloudflare_job_id)`
- [ ] Store raw markdown per crawl — never throw away source material
- [ ] Rate limiting: space crawls to avoid hitting Cloudflare limits (68 wineries × 10 pages = ~680 renders)
- [ ] `--dry-run` mode: crawl 1 winery, print output, don't store
- [ ] npm script: `pipeline:scrape`

### D8.3 LLM extraction (structured data)

- [ ] `lib/pipeline/llm-extract.ts` — takes raw markdown, returns structured JSON
- [ ] Extraction prompt: "Given this winery website content, extract: hours of operation, tasting flight names/prices/descriptions, varietals offered, winemaker name, reservation policy, group size limits, accessibility info, events. Return as JSON matching this schema: {...}"
- [ ] `winery_llm_extractions` table: `(id, winery_id, scrape_id, extracted_data jsonb, model_used, tokens_used, extracted_at)`
- [ ] Diff extraction against current DB values — flag changes
- [ ] Auto-apply high-confidence factual changes (e.g., new flight added) to drafts
- [ ] Flag low-confidence changes for review (e.g., hours changed, price changed significantly)

### D8.4 LLM enrichment (original content generation)

- [ ] `lib/pipeline/llm-enrich.ts` — generates original editorial content
- [ ] Content types to generate:
  - `story` — 2-3 paragraph winery narrative (your editorial voice + fresh details from scrape)
  - `tagline` — one-line hook for cards/listings
  - `flight_descriptions` — enriched tasting experience descriptions
  - `visitor_tip` — "What to know before you go" (parking, dress code, best time to visit)
  - `seasonal_note` — current seasonal info if detected (harvest events, holiday hours)
- [ ] System prompt establishing SonomaSip editorial voice: warm, knowledgeable, opinionated, like a friend who knows wine country
- [ ] Never fabricate facts — only synthesize from scraped source material + existing editorial
- [ ] Include source citations in draft metadata (which scrape pages informed this content)
- [ ] `content_drafts` table: `(id, winery_id, field_name, current_value, draft_value, source_scrape_id, model_used, status, reviewed_by, reviewed_at, created_at)`
- [ ] Status enum: `draft`, `approved`, `rejected`, `published`
- [ ] npm script: `pipeline:enrich`

### D8.5 Full pipeline orchestrator

- [ ] `scripts/run-pipeline.ts` — runs scrape → extract → enrich in sequence
- [ ] Per-winery error handling: if one winery fails, continue with the rest
- [ ] Summary report: X wineries scraped, Y extractions completed, Z drafts generated, N errors
- [ ] npm scripts: `pipeline:run` (full), `pipeline:run --winery=slug` (single winery)
- [ ] Cron-ready: designed to run monthly via scheduled job or manual trigger

### D8.6 Schema additions

- [ ] Migration: `winery_scrapes` table
- [ ] Migration: `winery_llm_extractions` table
- [ ] Migration: `content_drafts` table
- [ ] Add `content_status` field to `wineries` for each enrichable field (editorial / llm_draft / llm_approved)
- [ ] Add `last_scraped_at` timestamp to `wineries`

### D8.7 Cost management

- [ ] Estimate monthly LLM costs: ~68 wineries × ~2K tokens input + ~1K tokens output per enrichment = ~200K tokens/month (~$1-3/month with Claude Haiku or GPT-4o-mini)
- [ ] Cloudflare Browser Rendering: ~680 page renders/month (free tier or very cheap)
- [ ] Log token usage per run in `winery_llm_extractions`
- [ ] Alert if monthly token usage exceeds budget threshold

---

## Phase D9 — Admin Pages _(before launch)_

_Two people reviewing content. Needs to be fast — reviewing 68 wineries should take ~30 minutes, not 3 hours._

### D9.1 Admin auth

- [ ] Simple password-protected route group: `/admin/*`
- [ ] Environment variable: `ADMIN_PASSWORD` (or Supabase auth if you want accounts later)
- [ ] Middleware to check auth on all `/admin` routes
- [ ] No public access to admin pages

### D9.2 Content review page (`/admin/review`)

- [ ] List all pending content drafts, grouped by winery
- [ ] For each draft: side-by-side view of current published content vs LLM draft
- [ ] Diff highlighting (show what changed)
- [ ] Actions per draft: Approve (publish immediately), Edit (inline editor, then approve), Reject (with optional note)
- [ ] Bulk actions: "Approve all for this winery", "Skip to next winery"
- [ ] Filter: by status (pending, approved, rejected), by winery, by field type
- [ ] Progress indicator: "23 of 68 wineries reviewed"
- [ ] Keyboard shortcuts: A = approve, E = edit, R = reject, N = next (speed matters for 68 wineries)

### D9.3 Data health dashboard (`/admin/health`)

- [ ] Overview: active winery count, last import date, last scrape date, last enrichment run
- [ ] Broken URLs list (from D2.4 / D7.4 health checks)
- [ ] Stale data warnings (not verified in >90 days)
- [ ] Google Places drift flags (hours/rating mismatches)
- [ ] Pipeline run history with success/error counts

### D9.4 Click attribution dashboard (`/admin/clicks`)

- [ ] Track "Book a Tasting" clicks per winery: `click_events` table `(id, winery_id, source_page, clicked_at, session_id)`
- [ ] Dashboard: clicks per winery (7d / 30d / all-time), click-through rate, top performing wineries
- [ ] UTM parameter support: append `?ref=sonomasip` to booking URLs
- [ ] Export: CSV download of click data (for pitching affiliate relationships to wineries)
- [ ] Future: conversion tracking if wineries provide affiliate links

### D9.5 Pipeline trigger page (`/admin/pipeline`)

- [ ] Manual trigger buttons: "Run full pipeline", "Scrape single winery", "Re-enrich single winery"
- [ ] Pipeline run status: in-progress indicator, last run summary
- [ ] Winery registry management: add/remove/edit winery URLs
- [ ] View raw scrape output for any winery (for debugging)

---

## Phase D10 — Click Attribution _(wire into existing UI)_

_Track every "Book a Tasting" click. This is how you prove value to wineries and eventually monetize._

### D10.1 Click tracking infrastructure

- [ ] `click_events` table: `(id, winery_id, source_page, booking_url, clicked_at, session_id, user_agent)`
- [ ] Server action: `trackBookingClick(wineryId, sourcePage)` — fires on "Book a Tasting" click
- [ ] Client-side: intercept booking link clicks, fire `navigator.sendBeacon` (non-blocking), then redirect to booking URL
- [ ] Append `?ref=sonomasip` (or UTM params) to all outbound booking URLs

### D10.2 Wire into existing pages

- [ ] Winery detail page: wrap "Book a Tasting" CTA with click tracker
- [ ] Results page: wrap any booking links with click tracker
- [ ] Plan page: wrap booking links with click tracker
- [ ] Browse page: if any direct booking links, wrap them too

### D10.3 Attribution reporting

- [ ] Monthly summary: total clicks, clicks per winery, top 10 wineries by traffic sent
- [ ] Exportable report (CSV) for sharing with potential winery partners
- [ ] Simple email report (optional): monthly stats sent to you

---

## Phase 6 — SEO & performance

- [ ] `metadata` per winery page
- [ ] JSON-LD where accurate (`Winery` / `TouristAttraction`)
- [ ] `sitemap.xml`, `robots.txt`
- [ ] Lighthouse-driven fixes (LCP, fonts)
- [ ] `next/image` if using photos

---

## Phase 7 — Integrations & operations

### 7.1 Google Places Sync (Track C — D8)

- [ ] Map `google_place_id` for each winery (manual or via Places API text search)
- [ ] Sync script: auto-update `rating_google`, `review_count_total`; flag hours drift for review
- [ ] Never auto-update: hours, booking_url, experience flags, style scores
- [ ] Cron route or scheduled job (weekly)
- [ ] ToS compliance for cache/display

### 7.2 Reliability

- [ ] Sentry + source maps
- [ ] Uptime check `/` + `/api/health`
- [ ] Supabase backup / PITR verification

### 7.3 Runbooks

- [ ] Doc: import from `docs/*.xlsx`, rollback via backup
- [ ] Optional: protected admin import trigger

### 7.4 Data Freshness & Automated Verification (Track C — D9)

_Winery info changes: hours shift seasonally, flights get repriced, wineries close or go members-only, reservation URLs break. We need automated + manual processes to keep data trustworthy._

**Automated checks (scheduled jobs):**

- [ ] **URL health check** (weekly): Hit every `bookingUrl` in the database. Flag 4xx/5xx/timeout as broken. Write results to `data_health_checks` table. Alert via email or dashboard.
- [ ] **Google Places sync** (weekly/biweekly): Pull `business_status` (OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY), current `opening_hours`, `rating`, `review_count`. Auto-flag wineries where Google hours diverge from our hours by >1 hour. Auto-update ratings. Never auto-update hours — flag for manual review.
- [ ] **Price drift detection** (monthly): If Google Places or a scraping service exposes pricing, compare against our `min_flight_price`/`max_flight_price`. Flag >20% drift for review.
- [ ] **Stale data alert**: Flag any winery not manually verified in >90 days. Surface in admin dashboard.

**Manual review cadence:**

- [ ] **Quarterly audit** (Jan, Apr, Jul, Oct): Spot-check 15-20 wineries across all regions. Verify hours, prices, reservation policy, and amenity flags against winery websites. Update database. Log audit in `import_runs`.
- [ ] **Seasonal hours update** (Mar + Nov): Many wineries shift to summer/winter hours. Bulk review all hours against winery websites before each season change.
- [ ] **Annual full audit** (January): Full pass on all editorial-tier wineries. Verify every field. Remove permanently closed wineries. Run discovery pipeline (D0) to catch new wineries opened since last run. Promote high-quality discovered wineries to verified/editorial.

**Schema support:**

- [x] Add `last_verified_at` timestamp column to `wineries` table — already in migration 002 (create_wineries.sql)
- [x] Add `data_health_checks` table: `winery_id`, `check_type` (url_health | places_sync | manual_audit), `status`, `details_json`, `checked_at` — migration 007
- [x] Add `verification_notes` text column for auditor comments — already in migration 002
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
- [x] **`reuseMaps` prop:** Enable on `react-map-gl` `<Map>` to reuse GL context across soft navigations instead of re-initializing (avoids counting new map loads on back/forward)
- [x] **Lazy-load only:** Map component mounts via `IntersectionObserver` — never loads unless user scrolls to it. This alone prevents map loads from bots/crawlers hitting the page
- [ ] **Bot/crawler exclusion:** Check `navigator.webdriver` and common bot user-agent patterns client-side before mounting the map. Bots get the static placeholder only

### 7.5.2 Server-side rate limiting (API routes / server actions)

- [ ] **Choose rate limiting library:** `@upstash/ratelimit` (Redis-backed, serverless-native, works with Vercel) or `next-rate-limit` (simpler, in-memory). Upstash has a generous free tier (10K commands/day). Decision: Upstash for production, in-memory for dev
- [ ] **Rate limit middleware:** Create `src/lib/rate-limit.ts` utility that wraps the chosen library. Accept `identifier` (IP or fingerprint), `limit`, and `window` params. Return `{ success, remaining, reset }`
- [ ] **IP extraction:** Use `headers().get('x-forwarded-for')` (Vercel sets this) with fallback to `x-real-ip`. Hash the IP before storing (privacy)

### 7.5.3 Per-endpoint rate limits

| Endpoint / Action            | Limit | Window   | Reason                                            |
| ---------------------------- | ----- | -------- | ------------------------------------------------- |
| Quiz submit (server action)  | 10    | 1 hour   | Prevents matching engine abuse (compute cost)     |
| Share/itinerary create       | 5     | 1 hour   | Prevents DB write spam (Supabase row count)       |
| Email send (share via email) | 3     | 1 hour   | Resend free tier = 100/day total. Strictest limit |
| PDF generate                 | 5     | 1 hour   | Server-side rendering cost                        |
| Page views (results/plan)    | 60    | 1 hour   | General abuse prevention                          |
| API health check             | 30    | 1 minute | Prevent monitoring abuse                          |

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

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-02 | First engineering backlog                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-04-02 | Locked Q1–Q14 implementation targets                                                                                                                                                                                                                                                                                                                                                          |
| 2026-04-02 | Split product doc to `docs/PRD.md`; moved data to `docs/`; TODO is technical-only                                                                                                                                                                                                                                                                                                             |
| 2026-04-02 | Phase 9.2 AI roadmap; PRD §14 + README deterministic-first note                                                                                                                                                                                                                                                                                                                               |
| 2026-04-02 | Restructured to UI-first approach: Phase 3.5 (mock data prototype) before backend phases                                                                                                                                                                                                                                                                                                      |
| 2026-04-02 | Added shadcn/ui docs references                                                                                                                                                                                                                                                                                                                                                               |
| 2026-04-03 | Replaced vague data phases (0.6-5) with granular D1-D7 pipeline plan + authority hierarchy                                                                                                                                                                                                                                                                                                    |
| 2026-04-03 | Added D8 (content pipeline: Cloudflare scrape → LLM enrichment), D9 (admin pages), D10 (click attribution)                                                                                                                                                                                                                                                                                    |
| 2026-04-04 | Schema review: resolved 11 design gaps. Updated types.ts (StyleScores, Setting, signatureVarietals, expanded enums, Sonoma Coast). Full SCORING.md spec (budget bands, style weights, filters, scoring formula, tie-breakers, 5 worked examples). Updated mock data + all page references. Marked D1.2 enums + D1.5 type reconciliation + D3 spec as done.                                    |
| 2026-04-04 | Added Phase D0 (Winery Discovery & Registry): plan to expand from 68 editorial wineries to comprehensive Sonoma + Napa coverage (~400-600 wineries) using free sources (OpenStreetMap Overpass API, wine association directories, Wikidata). Added coverage tiers (editorial/verified/discovered). Updated data source authority hierarchy. Expanded geographic scope to include Napa Valley. |
| 2026-04-05 | Cross-referenced TODO with codebase: checked off D7.1–D7.5 (data layer fully wired), key screens (0.5), map optimizations (reuseMaps, IntersectionObserver), schema items (last_verified_at, data_health_checks, verification_notes already in migrations). Moved CI (3.3) to bottom — deferred until app is ready.                                                                           |

---

## Deferred — CI _(move back up when app is ready for launch)_

- [ ] `pnpm typecheck`, `lint`, `test` in CI
