# Sonoma Sip — Agent Instructions

## How to Run

| Task | Command |
|------|---------|
| Start dev server | `pnpm dev` (runs at http://localhost:3000) |
| Build for production | `pnpm build` |
| Run linter | `pnpm lint` |
| Run tests | `pnpm test` |
| Format code | `pnpm format` |
| Check formatting | `pnpm format:check` |

## Required Behaviors

### Task Tracking
- **Always read `TODO.md` at the start of any session.** It tracks all engineering work across phases.
- **Check off completed items** in `TODO.md` as you finish them. Do not leave stale checkboxes.

### UI and Frontend Work
- **Always invoke the `/ui` skill** (located at `.claude/skills/ui/SKILL.md`) when doing any UI work: building components, creating pages, implementing layouts, or styling. This skill uses the `uidotsh` MCP tool and provides design guidance. This is mandatory — do not skip it for any visual implementation.

### Reference Documents
- **`docs/PRD.md`** — Product requirements, user flows, policies, acceptance criteria
- **`docs/SCORING.md`** — Matching engine rules, weights, filter logic, worked examples
- **`docs/sonoma-winery-database-complete.xlsx`** — Source data for 68 curated wineries

### Components (shadcn/ui)
- **All shadcn/ui components are installed** in `src/components/ui/`. Use them before building custom ones.
- Components are source files — edit them directly. That is the intended workflow.
- **Docs:** https://ui.shadcn.com/docs/components
- **Theming:** Colors use OKLCH in `globals.css`. Semantic tokens map to our Sonoma palette (primary = wine, background = cream, card = linen, muted = fog).
- Use `cn()` from `@/lib/utils` to compose Tailwind classes.
- Add new components: `pnpm dlx shadcn@latest add <name>`

### Tech Stack
- Next.js App Router + TypeScript (strict mode)
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- Supabase (PostgreSQL) for data
- Mapbox GL for maps
- pnpm as package manager
- Absolute imports via `@/`
