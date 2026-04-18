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
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix primitives) — all components installed in `src/components/ui/`
- **Database:** Supabase (PostgreSQL)
- **Map:** Mapbox GL
- **Email:** Resend or Postmark
- **Package manager:** pnpm
- **Hosting:** Vercel + Supabase

## Project Structure

```
src/app/          # Next.js App Router pages and layouts
src/components/ui # shadcn/ui components (source files — edit directly)
src/lib/          # Shared utilities (cn(), matching engine, etc.)
src/hooks/        # Shared React hooks
docs/             # PRD, scoring spec, ERD
public/           # Static assets
components.json   # shadcn/ui configuration
```

## shadcn/ui

Components are installed as source files — they are ours to customize. When adding or updating:

```bash
pnpm dlx shadcn@latest add <component>       # Add a new component
pnpm dlx shadcn@latest add <component> --diff # Preview changes before overwriting
```

- **Docs:** https://ui.shadcn.com/docs
- **Theming:** Colors use OKLCH format in `globals.css`. shadcn semantic tokens (primary, secondary, muted, etc.) are mapped to our Sonoma palette.
- **Tailwind v4 guide:** https://ui.shadcn.com/docs/tailwind-v4
- Use `cn()` from `@/lib/utils` to merge class names.
- Use shadcn components before building custom ones.

## Workflow Rules

### Task Tracking

- **Always read `TODO.md` before starting work.** It is the source of truth for what needs to be done.
- **Check off items in `TODO.md` when they are completed.** Keep it up to date.

### UI Work — MANDATORY ui.sh Usage

**CRITICAL: ALL UI work MUST use the ui.sh MCP tools. No exceptions.**

Before writing ANY UI code (components, pages, layouts, styling), you MUST:

1. **Verify the uidotsh MCP server is connected** by calling `mcp__uidotsh__uidotsh_fetch` with `uidotsh://ui`. If this call fails, STOP and tell the user the MCP server is not connected. Do NOT write UI code without it.
2. **Load the ui skill** by fetching `uidotsh://ui` and following its routing instructions to load the appropriate design guidelines.
3. **Load design guidelines** for the specific work — always fetch `uidotsh://ui/design-guidelines/general` plus any relevant component guidelines before writing markup.
4. **Use the ui-picker workflow** (`uidotsh://ui/ui-picker`) for any new design or exploratory UI work. Generate multiple variants with `data-uidotsh-pick` / `data-uidotsh-option` attributes and let the user choose in-browser.

This applies to: landing pages, page sections, component creation, layout changes, styling updates, responsive work, dark mode, and any visual implementation.

**If the MCP server is down, do not proceed with UI work.** Ask the user to fix the connection first. Writing UI code without ui.sh guidance produces generic, AI-looking output that will need to be redone.

### Reference Docs

- **Product requirements:** `docs/PRD.md` — goals, scope, user flows, policies
- **Matching logic:** `docs/SCORING.md` — filters, weights, scoring formula
- **Editorial data:** 68 curated wineries live in Supabase (`wineries` table). The original seed workbook has been retired — edit wineries via the admin panel.

### Supabase Environments

Two separate Supabase projects — **never point local dev at prod**.

- **Production:** ref `rxihebhphpbhzanijfuv`. Used by the deployed Vercel app (Production env). Never run migrations or pipeline scripts against this unless the change has shipped to the dev project first.
- **Dev:** a second Supabase project (to be provisioned). Used by `pnpm dev` and all Vercel Preview deploys. Seed with a `pg_dump` of prod, then iterate freely.

Vercel env var mapping:

- `Production` scope → prod Supabase URL/keys.
- `Preview` + `Development` scope → dev Supabase URL/keys.

`.env.local` points at the dev project. Migrations land in the dev project first; apply to prod only after smoke-testing.

### Code Standards

- TypeScript strict mode
- Absolute imports via `@/`
- Prettier for formatting (run `pnpm format` before committing)
- Single quotes, semicolons, trailing commas
- **No unnecessary comments.** Do not add comments that restate what the code does. Only comment to explain _why_ something non-obvious is done. No section dividers, no "// Component" or "// Styles" markers, no TODO/FIXME unless tracking a real issue.
