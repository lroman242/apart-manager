# Implementation Plan: Resource Meter Reading Input

**Branch**: `004-resource-meter-readings` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-resource-meter-readings/spec.md`

## Summary

Extend the utility payment form so resource tariff rows accept a current meter reading value. The consumed quantity is auto-calculated as (current − previous). The previous value is looked up from the most recent existing payment for the same apartment + tariff name. Both meter values are stored on the line item as an extension to the existing `payment_line_items` table (two nullable columns). The payment history view is updated to show previous → current meter values for resource line items that have them. No new Edge Functions — the existing `readings-create` function is extended to accept and persist the new fields; the lookup of previous meter values happens client-side via a direct Supabase query.

## Technical Context

**Language/Version**: JavaScript (ES2020+), React 18; TypeScript (Deno 1.x) for Edge Functions
**Primary Dependencies**: Vite 5, @supabase/supabase-js v2, Tailwind CSS v4
**Storage**: Supabase (PostgreSQL) — `payment_line_items` extended with two nullable `numeric(10,3)` columns
**Testing**: Manual end-to-end per quickstart.md; `npm run lint` must pass
**Target Platform**: PWA (browser)
**Project Type**: Web application (React PWA + Supabase)
**Performance Goals**: Standard web-app responsiveness
**Constraints**: Append-only payments (Constitution III); Ukrainian UI (Principle VI); no new Edge Functions (Principle I — simplest solution)
**Scale/Scope**: Single-user personal tool

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | Extend existing table + existing Edge Function; no new infrastructure |
| II. React + PWA Standards | ✅ PASS | Functional components, hooks; `npm run lint` enforced |
| III. Data Integrity — Immutable History | ⚠️ EXCEPTION | Edit limited to last payment only; all prior payments remain immutable |
| IV. Supabase as Single Source of Truth | ✅ PASS | Schema change via migration; previous value read from DB |
| V. Security via Supabase Auth | ✅ PASS | Existing Edge Function auth pattern unchanged; RLS unchanged |
| VI. Ukrainian as UI Language | ✅ PASS | All new UI labels and errors in Ukrainian |

No violations. No Complexity Tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/004-resource-meter-readings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── edge-functions.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code changes (repository root)

```text
supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_meter-reading-columns.sql  # new: ADD COLUMN meter_value_previous + meter_value_current to payment_line_items
└── functions/
    └── readings-create/
        └── index.ts    # modified: accept + persist meter_value_previous / meter_value_current per line item

src/
├── hooks/
│   └── useReadings.js  # modified: add fetchPreviousMeterValues(apartmentId) — queries most recent meter_value_current per tariff name
└── components/
    └── readings/
        ├── ReadingForm.jsx   # modified: add meter reading input per resource; live qty auto-calc; error on current < previous
        └── ReadingCard.jsx   # modified: show "previous → current" meter values on resource line items that have them
```

```text
supabase/functions/readings-update/
├── index.ts     # new: PATCH handler — update utility_payments + replace line items
└── deno.json    # new: import map (same as readings-create)
```

**Structure Decision**: Additive — one nullable column, extend existing files, one new Edge Function (`readings-update`) for the edit flow.
