---

description: "Task list for Apartment Management feature"
---

# Tasks: Apartment Management

**Input**: Design documents from `/specs/001-apartment-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks grouped by user story. Each story is independently implementable and
testable. Edge Functions handle all mutations (FR-011/FR-012); reads use the Supabase client directly.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1 / US2 / US3)
- Exact file paths in every description

## Status key

- `[x]` = Implemented and verified
- `[ ]` = Pending

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Bootstrap Vite React PWA project with all tooling configured.

- [x] T001 Initialize Vite React project with all dependencies: `@supabase/supabase-js`, `react`, `react-dom`, `react-router-dom`; devDependencies: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `tailwindcss`, `@tailwindcss/vite`, `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@eslint/js`, `globals`
- [x] T002 [P] Configure `vite.config.js` with `@vitejs/plugin-react`, `@tailwindcss/vite`, and `VitePWA` plugin (registerType: autoUpdate, manifest with name "Apart Manager", display standalone, icons icon-192.png + icon-512.png)
- [x] T003 [P] Configure ESLint flat config in `eslint.config.js` with `eslint-plugin-react` (jsx-runtime preset) + `eslint-plugin-react-hooks`; add `"lint": "eslint src"` script to `package.json`
- [x] T004 [P] Configure Tailwind CSS v4 by adding `@import "tailwindcss"` to `src/index.css`
- [x] T005 [P] Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders; add `.env.local` to `.gitignore`
- [x] T006 [P] Add placeholder PWA icons `public/icon-192.png` and `public/icon-512.png` (192×192 and 512×512 PNG)
- [x] T007 Create `src/lib/supabase.js` — singleton `createClient` from env vars, `persistSession: true`, `autoRefreshToken: true`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth guard, and app shell — MUST be complete before any user story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create `supabase/migrations/20260315110937_initial-migration.sql` — `apartments` table (id bigserial PK, name text NOT NULL, address text, status text NOT NULL DEFAULT 'active' CHECK IN ('active','on_hold'), created_at timestamptz NOT NULL DEFAULT now()); enable RLS; add policy `FOR ALL TO authenticated USING (true) WITH CHECK (true)`
- [x] T009 Apply migration to Supabase project via `supabase db push` or Supabase Dashboard SQL Editor
- [x] T010 Create `src/pages/LoginPage.jsx` — email + password inputs, `supabase.auth.signInWithPassword`, inline error on failure
- [x] T011 Create `src/App.jsx` — auth guard with `supabase.auth.getSession()` on mount + `onAuthStateChange` subscription; renders `<LoginPage>` when unauthenticated, `<ApartmentsPage>` when authenticated
- [x] T012 Create `src/main.jsx` — entry point rendering `<App>` into `#root`; import `src/index.css`

**Checkpoint**: App boots, login works, authenticated users reach app shell.

---

## Phase 3: User Story 1 — View and Add Apartments (Priority: P1) 🎯 MVP

**Goal**: Owner sees all apartments (including empty state) and adds new ones via a
server-validated Edge Function.

**Independent Test**: Empty state → add apartment (name only) → appears in list. Add with name
+ address → appears. Submit empty name → inline error, nothing saved. Submit directly to
`apartments-create` with empty name → 400 response, no DB row created.

- [x] T013 [P] [US1] Create `src/components/apartments/ApartmentCard.jsx` — renders name, address (if set), creation date, status badge ("On Hold" when `status === 'on_hold'`); accepts `onEdit`, `onDelete`, `onToggleHold` callback props
- [x] T014 [P] [US1] Create `src/components/apartments/ApartmentForm.jsx` — controlled name (required) + address (optional) inputs; inline "Name is required" error on empty submit; accepts `initialValues`, `onSubmit`, `onCancel` props; supports create and edit modes; no auto-save on unmount
- [x] T015 [P] [US1] Create `src/components/apartments/ApartmentList.jsx` — renders `<ApartmentCard>` per apartment; shows empty-state with "Add your first apartment" prompt + button when list is empty; accepts `apartments` array and action callback props
- [x] T016 [US1] Create `supabase/functions/apartments-create/index.ts` using `supabase functions new apartments-create` — CORS preflight handler; parse JSON body; reject `400 { "error": "name is required" }` if name missing or empty; create per-request Supabase client with user JWT from Authorization header; insert into `apartments`, return `201` with row; return `401` if no auth header. **Note**: migrate logic from existing `supabase/functions/create-apartment/index.ts` then delete that directory.
- [x] T017 [US1] Update `createApartment` in `src/hooks/useApartments.js` — replace direct `.insert()` call with `supabase.functions.invoke('apartments-create', { body: { name, address } })`; surface `data.error` from response as thrown Error (depends on T016)
- [x] T018 [US1] Create `src/pages/ApartmentsPage.jsx` — `useApartments` hook wired to `<ApartmentList>`; local state for form open/close; `createApartment` passed to form `onSubmit`; closes form and refreshes list on success
- [x] T019 [US1] `<ApartmentsPage>` rendered at `/` route in `src/App.jsx`

**Checkpoint**: US1 complete. Owner can view list and add apartments via Edge Function with
server-side validation. Verify empty state, add, and inline validation before US2.

---

## Phase 4: User Story 2 — Edit and Delete (Priority: P2)

**Goal**: Owner edits name/address or permanently deletes an apartment (with confirmation),
both routed through Edge Functions.

**Independent Test**: Edit name → saves via Edge Function → reflects in list. Submit edit with
empty name → 400, list unchanged. Delete with confirm → gone. Delete → cancel → unchanged.

- [x] T020 [P] [US2] Create `src/components/apartments/DeleteConfirmDialog.jsx` — modal with apartment name, "Delete" + "Cancel" buttons; calls `onConfirm` only on explicit confirm; calls `onCancel` on cancel
- [x] T021 [P] Create `supabase/functions/apartments-update/index.ts` using `supabase functions new apartments-update` — parse `{ id, name, address }`; return `400` if id missing or name empty; return `401` if no auth; update apartments row by id with user JWT client; return `404` if no row matched; return `200` with updated row per `contracts/edge-functions.md`
- [x] T022 [P] Create `supabase/functions/apartments-delete/index.ts` using `supabase functions new apartments-delete` — parse `{ id }`; return `400` if id missing; return `401` if no auth; verify row exists with user JWT client (return `404` if not); delete row; return `200 { "success": true }` per `contracts/edge-functions.md`
- [x] T023 [US2] Update `updateApartment` and `deleteApartment` in `src/hooks/useApartments.js` — replace direct `.update()` and `.delete()` calls with `supabase.functions.invoke('apartments-update', ...)` and `supabase.functions.invoke('apartments-delete', ...)`; surface `data.error` from response as thrown Error (depends on T021, T022)
- [x] T024 [US2] Wire edit flow in `src/pages/ApartmentsPage.jsx` — `onEdit` opens `<ApartmentForm>` with `initialValues`; form `onSubmit` calls `updateApartment`; closes on success
- [x] T025 [US2] Wire delete flow in `src/pages/ApartmentsPage.jsx` — `onDelete` opens `<DeleteConfirmDialog>`; confirm calls `deleteApartment`; cancel closes without action

**Checkpoint**: US1 + US2 both functional. Edit and delete route through Edge Functions.

---

## Phase 5: User Story 3 — On Hold / Unhold (Priority: P3)

**Goal**: Owner toggles hold status via Edge Function; on-hold apartments are visually distinct.

**Independent Test**: "Put on hold" → "On Hold" badge + dimmed card. "Remove hold" → normal.
Submit directly with invalid status → 400 response, status unchanged.

- [x] T026 Create `supabase/functions/apartments-set-status/index.ts` using `supabase functions new apartments-set-status` — parse `{ id, status }`; return `400 { "error": "status must be active or on_hold" }` if status invalid; return `400` if id missing; return `401` if no auth; update status with user JWT client; return `404` if no row; return `200 { id, status }` per `contracts/edge-functions.md`
- [x] T027 [US3] Update `setHold` and `removeHold` in `src/hooks/useApartments.js` — replace direct `.update({ status })` calls with `supabase.functions.invoke('apartments-set-status', { body: { id, status } })`; surface `data.error` from response as thrown Error (depends on T026)
- [x] T028 [US3] `src/components/apartments/ApartmentCard.jsx` — visually distinguish on-hold cards (muted/dimmed); "Put on hold" / "Remove hold" button calling `onToggleHold`
- [x] T029 [US3] Wire hold toggle in `src/pages/ApartmentsPage.jsx` — `onToggleHold` calls `setHold` or `removeHold` based on current status

**Checkpoint**: All three user stories complete with Edge Function mutations.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T030 [P] Run `npm run lint` and fix all ESLint errors in `src/` to zero (Principle II)
- [x] T031 [P] Verify PWA installability: `npm run build && npm run preview` → Chrome DevTools → Application → Manifest; confirm no errors and install prompt available
- [x] T032 Deploy all 4 Edge Functions to Supabase: `supabase functions deploy apartments-create && supabase functions deploy apartments-update && supabase functions deploy apartments-delete && supabase functions deploy apartments-set-status`
- [x] T033 Validate end-to-end per `quickstart.md §7`: all 7 steps — including step 7 (submit empty name directly to `apartments-create` endpoint, confirm `400` response with no row created)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Requires Phase 2; T013–T015 parallel, then T016–T017, then T018–T019
- **US2 (Phase 4)**: Requires Phase 2; T021–T022 parallel, then T023, then T024–T025 (T020 parallel)
- **US3 (Phase 5)**: Requires Phase 2; T026, then T027, then T028–T029
- **Polish (Phase 6)**: Requires all desired stories complete

### Remaining Work Summary

| Phase | Pending Tasks |
|-------|--------------|
| Polish | T033 (end-to-end manual validation) |

**1 task remaining** out of 33 total. All code implemented, migration applied, functions deployed.

### Parallel Opportunities (remaining tasks)

- T021 and T022 (both Edge Functions, different directories) — parallel
- T021/T022 before T023 (hook needs both functions to exist)
- T026 before T027 (hook needs function to exist)
- T032 after T016, T021, T022, T026 are all complete

---

## Parallel Execution Example: Remaining Edge Functions

```bash
# Start these together (US2 Edge Functions):
T021 — supabase/functions/apartments-update/index.ts
T022 — supabase/functions/apartments-delete/index.ts

# Then:
T023 — update src/hooks/useApartments.js (updateApartment + deleteApartment)
```

---

## Implementation Strategy

### Minimum to satisfy FR-011 / FR-012

1. ✅ Phases 1–2 complete
2. ✅ US1–US3 frontend complete
3. **T016** → create `apartments-create`, delete old `create-apartment`
4. **T017** → update hook `createApartment` to invoke Edge Function
5. **T021 + T022** (parallel) → create `apartments-update` + `apartments-delete`
6. **T023** → update hook `updateApartment` + `deleteApartment`
7. **T026** → create `apartments-set-status`
8. **T027** → update hook `setHold` + `removeHold`
9. **T009** → apply migration, **T032** → deploy, **T033** → validate

### Order for single-developer session

T009 → T016 → T017 → (T021 ∥ T022) → T023 → T026 → T027 → T032 → T033

---

## Notes

- `[P]` tasks = different files, safe to run in parallel
- `[Story]` label maps each task to its user story for traceability
- `create-apartment/` directory exists with working implementation — T016 migrates that logic to `apartments-create/` using `supabase functions new apartments-create`, then the old directory should be deleted
- Edge Functions use the user's JWT (forwarded by `supabase.functions.invoke`) — no service-role key needed
- `supabase.functions.invoke` returns `{ data, error }` where `data` is the parsed JSON body; check `data.error` for application-level errors from the function
- Run `npm run lint` after updating the hook to catch any import or rule violations
