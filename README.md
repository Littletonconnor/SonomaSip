# Sonoma Sip

**Sonoma Sip** is a personal project: a **Sonoma County winery guide** that helps people plan tastings without wading through huge, generic directories. You answer a short questionnaire about wine preferences, budget, vibe, and practical needs (kids, dogs, accessibility, and similar). The app returns a **personalized, ranked list** of wineries—with **plain-language reasons** each one fits—alongside a **map**, **detail pages** for all curated venues, and ways to **share**, **print**, or **email** a plan.

The first version focuses on **68 hand-curated wineries** in Sonoma County. It is an **independent guide** (no official partnerships with listed wineries); booking always happens on each winery’s own site.

**How recommendations work (V1):** matching is **deterministic**—rules and scores over structured data—so results stay explainable and testable. The roadmap includes **AI-assisted** features (e.g. natural-language planning) **after** that baseline ships; see **[Future directions](docs/PRD.md#14-future-directions-after-deterministic-v1)** in the PRD.

## Documentation

| Doc                                | What it is                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| [`docs/PRD.md`](docs/PRD.md)       | Product requirements—goals, scope, flows, policies (no implementation detail). |
| [`TODO.md`](TODO.md)               | Engineering checklist: stack, phases, and delivery tasks.                      |
| [`docs/README.md`](docs/README.md) | Index of spreadsheets and supporting files in `docs/`.                         |

## Data

Editorial source data lives in **`docs/sonoma-winery-database-complete.xlsx`**. A repeatable import pipeline loads it into the app database during development and operations (see `TODO.md`).

## Status

Early build—application code and live deployment are not assumed to exist yet. Track progress in [`TODO.md`](TODO.md).
