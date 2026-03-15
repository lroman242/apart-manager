# Implementation Plan: Meter Readings Management

**Branch**: `003-meter-readings` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-meter-readings/spec.md`

## Summary

Add per-apartment monthly meter reading tracking. Owners record consumption quantities for each tariff (resources require explicit qty, services default to 1) once per billing month. Price overrides per line item are supported. A new `meter_readings` page lists all recordings newest-first. Entry point is a button added to each apartment card. Database: two new tables (`meter_readings`, `reading_line_items`). Mutations via a single new Edge Function (`readings-create`). Reads via the Supabase JS client directly.

## Technical Context

**Language/Version**: JavaScript (ES2020+), React 18; TypeScript (Deno 1.x) for Edge Functions
**Primary Dependencies**: Vite 5, vite-plugin-pwa, @supabase/supabase-js v2, Tailwind CSS v4
**Storage**: Supabase (PostgreSQL) — new `meter_readings` + `reading_line_items` tables with RLS
**Testing**: Manual end-to-end per quickstart.md; `npm run lint` must pass
**Target Platform**: PWA (browser + home-screen installation)
**Project Type**: Web application (React PWA + Supabase)
**Performance Goals**: Standard web-app responsiveness; no special throughput requirements
**Constraints**: Append-only readings (constitution Principle III); Ukrainian UI (Principle VI); all auth via Supabase (Principle V)
**Scale/Scope**: Single-user personal tool; handful of apartments, dozens of monthly readings

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | Single Edge Function for create; reads go directly to Supabase client. No extra abstraction. |
| II. React + PWA Standards | ✅ PASS | Functional components, hooks; `npm run lint` enforced |
| III. Data Integrity — Immutable History | ✅ PASS | Readings are append-only in this feature; editing/deleting is out of scope |
| IV. Supabase as Single Source of Truth | ✅ PASS | New tables added via migration; no client-side persistence |
| V. Security via Supabase Auth | ✅ PASS | Edge Function uses service-role + `auth.getUser()`; RLS on both new tables |
| VI. Ukrainian as UI Language | ✅ PASS | All new UI copy in Ukrainian (enforced in implementation tasks) |

No violations. No Complexity Tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/003-meter-readings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── edge-functions.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── apartments/
│   │   └── ApartmentCard.jsx      # modified: add meter readings button (top-right)
│   └── readings/                  # new directory
│       ├── ReadingList.jsx         # list of readings newest-first
│       ├── ReadingCard.jsx         # single reading entry (period + line items + total)
│       └── ReadingForm.jsx         # create reading form (initial + monthly)
├── hooks/
│   └── useReadings.js              # new: fetch readings + createReading action
└── pages/
    └── ReadingsPage.jsx            # new: /apartments/:id/readings

supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_meter-readings.sql   # new tables + RLS
└── functions/
    └── readings-create/
        ├── index.ts
        └── deno.json

src/App.jsx                         # modified: add /apartments/:id/readings route
```

**Structure Decision**: Single-project React PWA. New `readings/` component directory mirrors the existing `tariffs/` pattern. One Edge Function for the create mutation; reads use the Supabase JS client directly (same pattern as tariffs).
