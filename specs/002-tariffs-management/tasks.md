---

description: "Task list for Tariffs Management feature"
---

# Tasks: Tariffs Management

**Input**: Design documents from `/specs/002-tariffs-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks grouped by user story. Each story is independently implementable and
testable. Edge Functions handle all mutations; reads use the Supabase client directly.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1 / US2 / US3)
- Exact file paths in every description

## Status key

- `[x]` = Implemented and verified
- `[ ]` = Pending

---

## Phase 1: Setup (Database & Edge Function Scaffolding)

**Purpose**: Create the database schema and Edge Function skeletons that all user stories depend on.

- [x] T001 Create `supabase/migrations/20260315144427_tariffs.sql` — `tariffs` table: `id bigserial PK`, `apartment_id bigint NOT NULL REFERENCES apartments(id) ON DELETE CASCADE`, `name text NOT NULL`, `type text NOT NULL CHECK (type IN ('service','resource'))`, `price numeric(10,2) NOT NULL CHECK (price >= 0)`, `unit text`, `created_at timestamptz NOT NULL DEFAULT now()`; create index `tariffs_apartment_id_idx ON tariffs(apartment_id)`; enable RLS; add policy `FOR ALL TO authenticated USING (true) WITH CHECK (true)`
- [x] T002 Apply migration to Supabase project via `supabase db push`
- [x] T003 [P] Scaffold `supabase/functions/tariffs-create/` using `supabase functions new tariffs-create` — replace generated `index.ts` with CORS + auth stub; add `deno.json` with imports `{ "@supabase/functions-js": "jsr:@supabase/functions-js@^2", "@supabase/supabase-js": "npm:@supabase/supabase-js" }`
- [x] T004 [P] Scaffold `supabase/functions/tariffs-update/` using `supabase functions new tariffs-update` — same deno.json as T003
- [x] T005 [P] Scaffold `supabase/functions/tariffs-delete/` using `supabase functions new tariffs-delete` — same deno.json as T003

**Checkpoint**: Migration applied. Three Edge Function directories exist with correct deno.json. DB has `tariffs` table with RLS.

---

## Phase 2: Foundational (Shared Hook & Route)

**Purpose**: `useTariffs` hook and `TariffsPage` route skeleton — required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Create `src/hooks/useTariffs.js` — exports `useTariffs(apartmentId)`: state `tariffs`, `loading`, `error`; `fetchTariffs()` reads `supabase.from('tariffs').select('*').eq('apartment_id', apartmentId).order('created_at', { ascending: true })`; called on mount; stubs for `createTariff`, `updateTariff`, `deleteTariff` (each calls the respective Edge Function via `supabase.functions.invoke`, then calls `fetchTariffs()`; surfaces `data.error` as thrown Error)
- [x] T007 Create `src/pages/TariffsPage.jsx` — reads `apartmentId` from `useParams`; fetches the apartment name via `supabase.from('apartments').select('id,name').eq('id', apartmentId).single()`; renders heading with apartment name; shows loading/error states; renders `<TariffList>` (placeholder for now); "← Назад" button navigates to `/` via `useNavigate`
- [x] T008 Add route `/apartments/:id/tariffs` in `src/App.jsx` — wrap in existing `AuthGuard`, render `<TariffsPage />`; import TariffsPage

**Checkpoint**: Navigating to `/apartments/1/tariffs` shows the page skeleton with the apartment name and a back button.

---

## Phase 3: User Story 1 — Manage Services (Priority: P1) 🎯 MVP

**Goal**: Owner can add, edit, and delete fixed-price services on a tariff page.

**Independent Test**: Navigate to any apartment's tariffs page → add service "Інтернет" price 250
→ appears in list. Edit price to 280 → list updates. Delete → disappears. Submit empty name → inline error, nothing saved.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `src/components/tariffs/TariffCard.jsx` — props: `tariff`, `onEdit`, `onDelete`; displays `tariff.name` and formatted price; shows type badge ("Послуга" for service, "Ресурс" for resource); shows `tariff.unit` next to price when `tariff.type === 'resource'` (e.g., "4.50 / кВт·год"); "Редагувати" and "Видалити" buttons; all text in Ukrainian
- [x] T010 [P] [US1] Create `src/components/tariffs/TariffList.jsx` — props: `tariffs`, `onAdd`, `onEdit`, `onDelete`; renders `<TariffCard>` per tariff; shows empty state ("Тарифів ще немає") with two buttons "Додати послугу" and "Додати ресурс" when list is empty; accepts `onAddService` and `onAddResource` as separate callbacks; all text in Ukrainian
- [x] T011 [P] [US1] Implement `supabase/functions/tariffs-create/index.ts` — POST handler; validate `apartment_id` (number), `name` (non-empty string), `type` in `['service','resource']`, `price` (>= 0 number), `unit` (required non-empty string when type is resource); create service-role Supabase client; validate user JWT via `auth.getUser(token)`; insert into `tariffs`; return 201 with row; error responses per `contracts/edge-functions.md`
- [x] T012 [P] [US1] Implement `supabase/functions/tariffs-update/index.ts` — POST handler; validate `id` (number), `name` (non-empty), `price` (>= 0); fetch existing row to get `type`; validate `unit` (required for resource type); update row; return 200 with updated row; return 404 if not found; error responses per `contracts/edge-functions.md`
- [x] T013 [P] [US1] Implement `supabase/functions/tariffs-delete/index.ts` — POST handler; validate `id` (number); verify row exists; delete; return 200 `{ success: true }`; return 404 if not found; error responses per `contracts/edge-functions.md`
- [x] T014 [US1] Implement `createTariff`, `updateTariff`, `deleteTariff` in `src/hooks/useTariffs.js` — replace stubs from T006: `createTariff({ name, type, price, unit })` invokes `tariffs-create` with `{ apartment_id: apartmentId, name, type, price, unit }`; `updateTariff(id, { name, price, unit })` invokes `tariffs-update`; `deleteTariff(id)` invokes `tariffs-delete`; all surface `data.error` as thrown Error; each calls `fetchTariffs()` on success (depends on T011, T012, T013)
- [x] T015 [US1] Create `src/components/tariffs/TariffForm.jsx` — props: `initialValues` (with `type` pre-set), `onSubmit`, `onCancel`; controlled inputs: `name` (required), `price` (required, numeric >= 0); shows `unit` field only when `type === 'resource'` (required); inline validation errors in Ukrainian ("Назва обов'язкова", "Ціна повинна бути невід'ємним числом", "Одиниця виміру обов'язкова"); submit button text: "Додати" (create) or "Зберегти зміни" (edit); "Скасувати" button; all text in Ukrainian
- [x] T016 [US1] Wire `TariffList`, `TariffForm`, and `useTariffs` into `src/pages/TariffsPage.jsx` — local state for `formMode` (null | `{ type: 'service' }` | `{ type: 'resource' }` | tariff object for edit); render form card when `formMode` is set; pass `createTariff`/`updateTariff`/`deleteTariff` from hook; `onAdd` from list opens form with correct type pre-set; close form and refresh on success; show action errors inline
- [x] T017 [US1] Deploy Edge Functions: `supabase functions deploy tariffs-create tariffs-update tariffs-delete --no-verify-jwt`

**Checkpoint**: US1 complete. Add, edit, delete services all work through Edge Functions. Server-side validation returns 400 for empty name.

---

## Phase 4: User Story 2 — Manage Resources (Priority: P2)

**Goal**: Owner can add, edit, and delete resources (price-per-unit tariffs with a unit label).

**Independent Test**: Add resource "Електроенергія" unit "кВт·год" price 4.50 → appears with
unit displayed. Edit price → updates. Delete → gone. Submit without unit → inline error.

### Implementation for User Story 2

- [x] T018 [US2] Verify `TariffForm.jsx` from T015 correctly shows/hides the `unit` field based on `type` prop — the form already handles resources via `type` pre-set in `initialValues`; confirm unit field shows for resources and is hidden for services; confirm unit validation fires correctly; no new file needed if T015 is complete
- [x] T019 [US2] Verify `tariffs-create` Edge Function from T011 correctly rejects resource submissions missing `unit` — manually POST `{ apartment_id, name: "test", type: "resource", price: 1 }` without unit → confirm `400 { "error": "unit is required for resources" }`
- [x] T020 [US2] Verify `tariffs-update` Edge Function from T012 correctly fetches existing row type and enforces unit for resources — manually POST `{ id: <resource_id>, name: "test", price: 1 }` without unit → confirm `400 { "error": "unit is required for resources" }`
- [x] T021 [US2] Verify `TariffCard.jsx` from T009 correctly displays unit for resources — confirm "4.50 / кВт·год" format renders and unit is absent for services

**Checkpoint**: US1 + US2 both functional. Resources have unit field in form, validation, and display.

---

## Phase 5: User Story 3 — Navigation from Apartment List (Priority: P3)

**Goal**: "Тарифи" button on each apartment card opens the correct tariffs page.

**Independent Test**: From apartment list, click "Тарифи" on apartment A → tariffs page opens
with apartment A's name in heading. Click "← Назад" → back to apartment list.

### Implementation for User Story 3

- [x] T022 [US3] Add "Тарифи" button to `src/components/apartments/ApartmentCard.jsx` — add button in the card action row that calls `onTariffs(apartment)` prop; label "Тарифи"; style consistent with "Редагувати" button (indigo text link)
- [x] T023 [US3] Wire `onTariffs` in `src/pages/ApartmentsPage.jsx` — pass `onTariffs={(apt) => navigate(\`/apartments/${apt.id}/tariffs\`)}` to `<ApartmentList>`; import `useNavigate` from react-router-dom
- [x] T024 [US3] Thread `onTariffs` through `src/components/apartments/ApartmentList.jsx` — add `onTariffs` prop and pass to each `<ApartmentCard>`

**Checkpoint**: All three user stories complete. Full navigation flow works end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T025 [P] Run `npm run lint` and fix all ESLint errors in `src/` to zero (Principle II)
- [x] T026 Validate end-to-end per `quickstart.md §5`: all checklist items — navigation, services CRUD, resources CRUD, isolation, server-side validation, and lint check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T003/T004/T005 parallel
- **Foundational (Phase 2)**: Requires Phase 1 (T002 migration applied) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Requires Phase 2; T009–T013 parallel, then T014, then T015, then T016, then T017
- **US2 (Phase 4)**: Requires US1 complete (T011/T012 must exist and be deployed)
- **US3 (Phase 5)**: Requires Phase 2 (TariffsPage route exists); can run in parallel with US1/US2
- **Polish (Phase 6)**: Requires all desired stories complete

### Remaining Work Summary

| Phase | Tasks |
|-------|-------|
| Setup | T001–T005 |
| Foundational | T006–T008 |
| US1 | T009–T017 |
| US2 | T018–T021 |
| US3 | T022–T024 |
| Polish | T025–T026 |

**26 tasks total.**

### Parallel Opportunities

- T003, T004, T005 (three different function directories) — parallel
- T009, T010, T011, T012, T013 (different files, no interdependencies) — parallel within US1
- T022, T023, T024 (US3 navigation) are independent of US2 verification tasks

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T008)
3. Complete Phase 3: US1 (T009–T017)
4. **STOP and VALIDATE**: Services CRUD works end-to-end
5. Proceed to US2 and US3

### Incremental Delivery

1. Setup + Foundational → DB + route scaffold ready
2. US1 → Services CRUD fully working (**MVP**)
3. US2 → Resources validated (mostly verification of T011/T012/T015 behavior)
4. US3 → Navigation wired from apartment list
5. Polish → Lint + end-to-end validation

---

## Notes

- `[P]` tasks = different files, safe to run in parallel
- `[Story]` label maps each task to its user story for traceability
- US2 tasks (T018–T021) are primarily verification tasks — the resource logic is built into US1's Edge Functions and form; US2 validates it works correctly
- `supabase.functions.invoke` returns `{ data, error }` — always check `data.error` for application-level errors
- The `type` field is immutable — `TariffForm` receives `type` as part of `initialValues` and never renders a type selector; the update Edge Function reads existing row type from DB
- Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` + `auth.getUser(token)` pattern from feature 001
- Deploy all three functions together with `--no-verify-jwt` (required for new Supabase key format)
