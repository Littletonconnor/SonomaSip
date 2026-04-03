# Sonoma Sip — Engineering TODO

**Purpose:** Technical implementation tracker. Check boxes as work completes. Product intent, policies, and metrics definitions: **[`docs/PRD.md`](docs/PRD.md)**. Matching math: **[`docs/SCORING.md`](docs/SCORING.md)**.

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
| Database | Supabase (PostgreSQL) |
| Map | Mapbox GL (`react-map-gl` or equivalent) |
| Email | Resend or Postmark (pick one) |
| Analytics | Plausible (cookie-light); privacy policy still required |
| Hosting | Vercel + Supabase (confirm regions) |
| Observability | Sentry (recommended) |

---

## Dependency graph

```
Phase 0 (spec, ERD, design, SCORING draft)
    → Phase 1 (Supabase schema + RLS + types)
    → Phase 2 (importer from docs/*.xlsx → Postgres)
    → Phase 3 (Next.js shell)
    → Phase 4 (matching engine + tests)  ⟵ can use fixtures after Phase 2 shape is stable
    → Phase 5 (UX: quiz → results → detail → share/PDF/email)
    → Phase 6 (SEO / perf)
    → Phase 7 (ops: Places sync optional, backups, runbooks)
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

### 0.2 Service accounts

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

### 0.4 Legal copy

- [ ] Accuracy disclaimer (footer + PDF + email per PRD)
- [ ] Privacy policy (analytics, email, share URLs)
- [ ] Terms; footer line: independent guide / no affiliation

### 0.5 Design system

- [x] Fonts, color tokens, spacing (WCAG AA on controls)
- [x] Component inventory: Button, Chip, Slider, Stepper, Card, Modal, Toast, Skeleton, list row, map callout
- [ ] Key screens: landing, quiz step, results split, detail, print
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

### 0.6 Data model

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

## Phase 1 — Supabase: schema, RLS, types

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

## Phase 2 — Data ingestion

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

## Phase 4 — Matching engine (TypeScript)

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

## Phase 5 — Product UI & flows

### 5.1 Landing

- [ ] Hero, how-it-works, CTA → quiz
- [ ] Secondary CTA → `/wineries`
- [ ] Footer: disclaimer + legal links

### 5.2 Quiz

- [ ] Steps: varietals, vibe, budget, must-haves, region/stops, **members-only toggle (default off)**, optional group fields
- [ ] Zod schemas per step + full object
- [ ] `sessionStorage` hydrate/debounce
- [ ] Stepper: Back/Next + validation
- [ ] Submit → server → results navigation (avoid huge query strings)

### 5.3 Results

- [ ] Split layout: list + Mapbox; mobile stack/tabs
- [ ] Markers + clustering + fit bounds
- [ ] Cards: rank, top-3 reasons, price hint, badges (reservation, members-only)
- [ ] Empty state + CTA to relax filters
- [ ] Loading skeletons

### 5.4 Winery detail

- [ ] `/wineries/[slug]` — `generateStaticParams` + revalidate policy
- [ ] Sections: story, hours, experiences, flights table, logistics, ratings, pairs-well links
- [ ] Single primary CTA → `reservation_url` (new tab)

### 5.5 Share / PDF / email

- [ ] Insert `shared_itineraries`: payload = prefs + ordered winery ids + version (≤ ~50KB cap); **rehydrate** from DB on read
- [ ] `/plan/[id]`: read-only; OG tags; **Generated on {date}**
- [ ] Rate limit share create + email by IP
- [ ] PDF v1: text-first print route / CSS; v2: Mapbox Static image
- [ ] Email: link to share URL + summary (Resend/Postmark)

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
- [ ] **Optional:** Conversational refinement (“quieter third stop”), itinerary narrative for PDF/email (facts-only)

---

## Progress log

| Date | Phase | Notes |
|------|-------|-------|
| | | _(add a row when a phase or milestone completes)_ |

---

## Changelog (this file)

| Date | Change |
|------|--------|
| 2026-04-02 | First engineering backlog |
| 2026-04-02 | Locked Q1–Q14 implementation targets |
| 2026-04-02 | Split product doc to `docs/PRD.md`; moved data to `docs/`; TODO is technical-only |
| 2026-04-02 | Phase 9.2 AI roadmap; PRD §14 + README deterministic-first note |
