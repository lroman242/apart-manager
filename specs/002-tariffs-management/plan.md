# Implementation Plan: Tariffs Management

**Branch**: `002-tariffs-management` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-tariffs-management/spec.md`

## Summary

Add a per-apartment tariffs management page where the owner can create, edit, and delete
**services** (fixed-price items) and **resources** (price-per-unit items). Mutations go through
three new Supabase Edge Functions (`tariffs-create`, `tariffs-update`, `tariffs-delete`).
Reads use the direct Supabase client. Navigation is via a new "Тарифи" button on each
apartment card, routing to `/apartments/:id/tariffs`.

## Technical Context

**Language/Version**: JavaScript (ES2020+), React 18; TypeScript (Deno) for Edge Functions
**Primary Dependencies**: Vite 5, vite-plugin-pwa, @supabase/supabase-js, Tailwind CSS v4
**Storage**: Supabase (PostgreSQL) — `tariffs` table with FK to `apartments`, RLS enabled
**Testing**: Not requested
**Target Platform**: Web PWA (modern browsers)
**Project Type**: Web application (PWA)
**Performance Goals**: Standard PWA responsiveness; no special targets
**Constraints**: Offline display not required; auth required for all access
**Scale/Scope**: Single-owner personal tool; no concurrent-user concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Simplicity First | No speculative abstractions. Single table, no shared tariff templates, no sorting controls. Three Edge Functions mirror existing apartment pattern. | ✅ PASS |
| II. React + PWA Standards | New components are functional/hooks-based. ESLint must pass. PWA manifest unchanged (no new icons needed). | ✅ PASS |
| III. Data Integrity | Tariffs are not financial history records — this principle applies to meter readings. No append-only constraint needed here. | ✅ N/A |
| IV. Supabase as Single Source of Truth | `tariffs` table via Supabase migration. No localStorage. Reads via `@supabase/supabase-js`. Mutations via Edge Functions (established exception from feature 001). | ✅ PASS |
| V. Security via Supabase Auth | RLS enabled on `tariffs` table. Auth guard already wraps all protected routes. Edge Functions validate JWT via `auth.getUser()`. | ✅ PASS |
| VI. Ukrainian UI Language | All new UI copy (labels, buttons, errors, placeholders) MUST be in Ukrainian. | ✅ REQUIRED — enforced in all new components |

**Post-design re-check**: No violations. The Edge Function pattern is an established justified
exception (feature 001). Complexity tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-tariffs-management/
├── plan.md              ✅ this file
├── research.md          ✅ Phase 0
├── data-model.md        ✅ Phase 1
├── quickstart.md        ✅ Phase 1
├── contracts/
│   ├── edge-functions.md  ✅ Phase 1
│   └── tariffs-table.md   ✅ Phase 1
└── tasks.md             (Phase 2 — /speckit.tasks)
```

### Source Code

```text
supabase/
├── migrations/
│   └── 20260315120000_tariffs.sql          # new: tariffs table + RLS
└── functions/
    ├── tariffs-create/
    │   ├── index.ts                         # new: POST create tariff
    │   └── deno.json
    ├── tariffs-update/
    │   ├── index.ts                         # new: POST update tariff
    │   └── deno.json
    └── tariffs-delete/
        ├── index.ts                         # new: POST delete tariff
        └── deno.json

src/
├── hooks/
│   └── useTariffs.js                        # new: read + mutation hook
├── pages/
│   └── TariffsPage.jsx                      # new: /apartments/:id/tariffs
├── components/
│   └── tariffs/
│       ├── TariffList.jsx                   # new: list with empty state
│       ├── TariffCard.jsx                   # new: single tariff row
│       └── TariffForm.jsx                   # new: create/edit form
└── App.jsx                                  # modified: add tariffs route
    components/apartments/
    └── ApartmentCard.jsx                    # modified: add "Тарифи" button
```

**Structure Decision**: Single React project (no backend/ frontend split). Mirrors the
existing `apartments/` component structure with a parallel `tariffs/` directory.
