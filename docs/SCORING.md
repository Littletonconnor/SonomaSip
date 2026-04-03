# Matching & scoring specification

This document is **engineering-owned**: persona weights, filter rules, normalization, tie-breakers, and worked examples.

**Product context:** [`PRD.md`](./PRD.md) (Section 8.4 describes the budget/outlier rule in product terms).

## Status

- [ ] Initial spec drafted  
- [ ] Weights and formulas implemented in code  
- [ ] Golden tests passing  

## Required sections (fill as you implement)

1. **Persona inference** — Map quiz answers → weight vector (no user-facing persona pick).
2. **Hard filters** — Varietals (if any selected), must-haves, budget vs `min_flight_price` using **only flights ≤ $200** for the minimum used in budget logic; NULL handling.
3. **Soft score** — Weighted combination of style/features + optional quality/rating nudge.
4. **Tie-breakers** — Ordered list.
5. **Explanations** — Template strings and feature → reason mapping.
6. **Worked examples** — ≥3 inputs → expected top-N slugs + reasons.

See **`TODO.md` Phase 0.7** for checklist items.
