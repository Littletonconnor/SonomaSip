# Sonoma Sip — Claude Code Instructions

## Dev Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm format       # Prettier (write)
pnpm format:check # Prettier (check only)
```

## Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Map:** Mapbox GL
- **Email:** Resend or Postmark
- **Package manager:** pnpm
- **Hosting:** Vercel + Supabase

## Project Structure

```
src/app/          # Next.js App Router pages and layouts
src/lib/          # Shared utilities, matching engine, etc.
docs/             # PRD, scoring spec, editorial data (xlsx)
public/           # Static assets
```

## Workflow Rules

### Task Tracking
- **Always read `TODO.md` before starting work.** It is the source of truth for what needs to be done.
- **Check off items in `TODO.md` when they are completed.** Keep it up to date.

### UI Work
- **Always use the `/ui` skill** when doing any UI or frontend work. This skill is at `.claude/skills/ui/SKILL.md` and uses the `uidotsh` MCP tool. It must be invoked for component creation, page layout, styling, and any visual implementation.

### Reference Docs
- **Product requirements:** `docs/PRD.md` — goals, scope, user flows, policies
- **Matching logic:** `docs/SCORING.md` — filters, weights, scoring formula
- **Editorial data:** `docs/sonoma-winery-database-complete.xlsx` — 68 curated wineries

### Code Standards
- TypeScript strict mode
- Absolute imports via `@/`
- Prettier for formatting (run `pnpm format` before committing)
- Single quotes, semicolons, trailing commas
