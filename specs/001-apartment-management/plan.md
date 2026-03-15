# Implementation Plan: Apartment Management

**Branch**: `001-apartment-management` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-apartment-management/spec.md`

## Summary

Build the apartment management foundation for the Apart Manager PWA: a React page where the
owner can create, view, edit, delete, and toggle the hold status of apartments. Data mutations
(create, edit, delete, hold/unhold) are routed through Supabase Edge Functions which perform
server-side validation before persisting to PostgreSQL. Read operations use the Supabase JS
client directly with RLS enforcement. This feature also establishes the project scaffold
(Vite, PWA config, ESLint, Supabase client, Tailwind CSS v4, auth guard).

## Technical Context

**Language/Version**: JavaScript (ES2020+), React 18; TypeScript (Deno) for Edge Functions
**Primary Dependencies**: Vite 5, vite-plugin-pwa, @supabase/supabase-js, Tailwind CSS v4,
eslint-plugin-react, eslint-plugin-react-hooks
**Storage**: Supabase (PostgreSQL) — `apartments` table with RLS
**Backend**: Supabase Edge Functions (Deno runtime) — 4 mutation functions
**Testing**: Not required for this feature (no testing framework specified in spec)
**Target Platform**: Web PWA (desktop + mobile browser, installable)
**Project Type**: PWA web application (static frontend + Supabase managed backend)
**Performance Goals**: List renders instantly (<1s); mutations complete within 2 seconds (SC-007)
**Constraints**: Offline installable; no custom backend server; single `anon` key on client;
service-role key only in Edge Functions (server-side Supabase secrets)
**Scale/Scope**: Single owner, ~50 apartments maximum

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Simplicity First | No speculative abstractions; YAGNI strictly | ⚠️ Justified exception — 4 Edge Functions add measurable complexity. Justified by FR-011 (all mutations MUST go through server-side functions) and FR-012 (server-side validation independent of client). No simpler alternative satisfies both requirements simultaneously. |
| II. React + PWA Standards | Functional components only; ESLint pass; PWA installable | ✅ Pass — vite-plugin-pwa + manifest + service worker; all components hooks-based |
| III. Data Integrity | N/A for this feature (no meter readings) | ✅ Pass — not applicable |
| IV. Supabase as Single Source of Truth | Migrations in `supabase/migrations/`; credentials via env vars; no custom backend server | ✅ Pass — Edge Functions are Supabase-managed serverless infrastructure, not a "custom backend server." Invoked via `supabase.functions.invoke()` (the `@supabase/supabase-js` client). Schema tracked in migration files. |
| V. Security via Supabase Auth | RLS enabled; frontend auth guard; service-role key NOT in frontend | ✅ Pass — RLS on apartments table; auth guard in App.jsx; service-role key stored as Supabase secret (server-side only, never in .env.local or frontend bundle) |

*Post-design re-check*: All gates pass. Principle I exception documented in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-apartment-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── apartments-table.md    # Read operations (direct Supabase client)
│   └── edge-functions.md      # Mutation operations (Edge Function API)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── apartments/
│       ├── ApartmentList.jsx       # Scrollable list, empty state
│       ├── ApartmentCard.jsx       # Single row: name, address, status badge, actions
│       ├── ApartmentForm.jsx       # Create / edit form (shared)
│       └── DeleteConfirmDialog.jsx # Confirmation modal
├── pages/
│   ├── ApartmentsPage.jsx          # Page container for apartment management
│   └── LoginPage.jsx               # Supabase Auth email/password login
├── hooks/
│   └── useApartments.js            # Reads via Supabase client; mutations via Edge Functions
├── lib/
│   └── supabase.js                 # Singleton Supabase client
├── App.jsx                         # Router + auth guard
└── main.jsx                        # Entry point

supabase/
├── functions/
│   ├── apartments-create/
│   │   └── index.ts               # POST — validate + insert new apartment
│   ├── apartments-update/
│   │   └── index.ts               # PATCH — validate + update name / address
│   ├── apartments-delete/
│   │   └── index.ts               # POST — verify existence + delete apartment
│   └── apartments-set-status/
│       └── index.ts               # PATCH — validate status value + update status
└── migrations/
    └── 20260315110937_initial-migration.sql

public/
├── icon-192.png
└── icon-512.png

vite.config.js
eslint.config.js
.env.local                          # Gitignored; holds VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

**Structure Decision**: Static frontend + Supabase managed backend. All frontend source under
`src/`. Supabase Edge Functions under `supabase/functions/`, one directory per function
(Supabase CLI convention for `supabase functions new <name>`).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| 4 Edge Functions (Principle I complexity) | FR-011 requires all mutations through server-side functions; FR-012 requires server-side validation independent of the client | Direct Supabase client calls satisfy no server-side validation guarantee — any user with the anon key can bypass the UI and write invalid data to the DB. RLS alone cannot enforce application-level constraints (non-empty name, valid status transitions). Edge Functions are the minimal Supabase-native solution. |
