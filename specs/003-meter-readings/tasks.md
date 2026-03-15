---

description: "Task list for Utility Payments feature"
---

# Tasks: Utility Payments Management

**Input**: Design documents from `/specs/003-meter-readings/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks grouped by user story. The form component (ReadingForm) handles both initial and monthly modes via props. ReadingsPage is built incrementally across phases — each phase adds a self-contained, testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1 / US2 / US3)
- Exact file paths in every description

## Status key

- `[x]` = Implemented and verified
- `[ ]` = Pending

---

## Phase 1: Setup (Database & Edge Function Scaffolding)

**Purpose**: Create the database schema and Edge Function skeleton that all user stories depend on.

- [x] T001 Create migration via `supabase migration new utility-payments` — fill generated file with: `utility_payments` table (`id bigserial PK`, `apartment_id bigint NOT NULL REFERENCES apartments(id) ON DELETE CASCADE`, `period_start date NOT NULL`, `period_end date NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, `UNIQUE(apartment_id, period_start)`); `payment_line_items` table (`id bigserial PK`, `payment_id bigint NOT NULL REFERENCES utility_payments(id) ON DELETE CASCADE`, `tariff_name text NOT NULL`, `tariff_type text NOT NULL CHECK (tariff_type IN ('service','resource'))`, `unit text`, `quantity numeric(10,3) NOT NULL CHECK (quantity > 0)`, `unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0)`, `subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0)`, `created_at timestamptz NOT NULL DEFAULT now()`); indexes `utility_payments_apartment_id_idx` and `payment_line_items_payment_id_idx`; enable RLS on both tables; policies `FOR ALL TO authenticated USING (true) WITH CHECK (true)` on both tables
- [x] T002 Apply migration to Supabase project via `supabase db push`
- [x] T003 Scaffold `supabase/functions/readings-create/` via `supabase functions new readings-create`; read the generated `deno.json` and add `"@supabase/supabase-js": "npm:@supabase/supabase-js"` to the imports map (same pattern as existing tariff functions)

**Checkpoint**: Migration applied — `utility_payments` and `payment_line_items` tables exist with RLS. Edge Function directory scaffolded.

---

## Phase 2: Foundational (Shared Hook, Route & Card Button)

**Purpose**: Navigation entry point, data hook, and page skeleton — required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create `src/hooks/useReadings.js` — exports `useReadings(apartmentId)`: state `payments` (array), `loading`, `error`; `fetchPayments()` calls `supabase.from('utility_payments').select('*, payment_line_items(*)').eq('apartment_id', apartmentId).order('period_start', { ascending: false })`, sets state; called on mount via `useEffect`; stub `createPayment(payload)` (throws `new Error('not implemented')`); returns `{ payments, loading, error, createPayment }`
- [x] T005 Create `src/pages/ReadingsPage.jsx` — reads `apartmentId` from `useParams`; fetches apartment name via `supabase.from('apartments').select('id,name').eq('id', apartmentId).single()`; fetches apartment's tariffs via `supabase.from('tariffs').select('*').eq('apartment_id', apartmentId).order('created_at', { ascending: true })`; renders header with apartment name + "← Назад" button (`useNavigate` to `/`); shows loading/error states from `useReadings`; renders placeholder `<div>` for content (replaced in US1 and US3); all Ukrainian
- [x] T006 Add route `/apartments/:id/readings` in `src/App.jsx` — wrap in existing `AuthGuard`, render `<ReadingsPage />`; import ReadingsPage
- [x] T007 Add "Показники" button to `src/components/apartments/ApartmentCard.jsx` — place the button in the top-right area of the card: in the header `<div className="flex items-start justify-between gap-2">`, move the "Призупинено" badge to sit alongside a new "Показники" button by wrapping both in a `<div className="flex items-center gap-2 shrink-0">`; button calls `onReadings(apartment)` prop; label "Показники"; style `text-sm px-3 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors`; add `onReadings` to function props
- [x] T008 Thread `onReadings` through `src/components/apartments/ApartmentList.jsx` — add `onReadings` to function props; pass to each `<ApartmentCard>`
- [x] T009 Wire `onReadings` in `src/pages/ApartmentsPage.jsx` — add `onReadings={(apt) => navigate(\`/apartments/${apt.id}/readings\`)}` prop to `<ApartmentList>` (note: `useNavigate` is already imported)

**Checkpoint**: Clicking "Показники" on any apartment card navigates to `/apartments/:id/readings`, showing the apartment name, a back button, and a loading/empty placeholder.

---

## Phase 3: User Story 1 — Initial Payment Entry (Priority: P1) 🎯 MVP

**Goal**: Owner records the very first utility payment for an apartment.

**Independent Test**: Open an apartment with no payments → click "Показники" → empty state shows "Показників ще немає" → click "Додати перший запис" → form opens with start date picker and one row per tariff → set start date 2026-01-01, enter electricity qty 120, leave internet qty at 1 → save → one entry appears showing period Jan 2026 and correct totals.

### Implementation for User Story 1

- [x] T010 [US1] Implement `supabase/functions/readings-create/index.ts` — POST handler using `SUPABASE_SERVICE_ROLE_KEY` + `auth.getUser(token)` auth pattern (same as existing functions); validate: `apartment_id` positive int, `period_start` valid ISO date, `period_end` valid ISO date and >= `period_start`, each `line_item` has non-empty `tariff_name`, `tariff_type` in `['service','resource']`, `quantity > 0`, `unit_price >= 0`, `unit` non-empty for resource type; check for existing `utility_payments` row with same `(apartment_id, period_start)` → return 409 `{ "error": "a payment record already exists for this billing period" }`; insert `utility_payments` row; insert all `payment_line_items` rows with `subtotal = quantity * unit_price` (rounded to 2 decimals); return 201 `{ ...payment, line_items: [...] }`; error responses per `contracts/edge-functions.md`
- [x] T011 [P] [US1] Create `src/components/readings/ReadingForm.jsx` — props: `mode` ('initial'|'monthly'), `periodStart` (ISO string, for monthly), `periodEnd` (ISO string, for monthly), `tariffs` (array of tariff objects), `onSubmit(payload)`, `onCancel`; **Initial mode**: date input for start date (default today formatted as YYYY-MM-DD), end date auto-calculated as last day of that month via `new Date(y, m+1, 0)` and displayed read-only; **Monthly mode**: both `periodStart`/`periodEnd` shown as read-only text (not inputs); **Line items** (one row per tariff): tariff name (read-only label), qty input (resource: empty required, service: default `'1'`), unit label if resource, price input (editable, defaults to `tariff.price`), live subtotal = qty × price formatted to 2 decimal places; total (sum of all subtotals) shown at bottom; **Validation**: resource qty empty or non-positive → "Кількість обов'язкова"; price negative → "Ціна не може бути від'ємною"; **Submit** builds `{ period_start, period_end, line_items: [{ tariff_name, tariff_type, unit, quantity: parseFloat, unit_price: parseFloat }] }` and calls onSubmit; **Buttons**: "Зберегти" (disabled while submitting, shows "Збереження…"), "Скасувати"; all labels/errors in Ukrainian
- [x] T012 [US1] Implement `createPayment` in `src/hooks/useReadings.js` — replace stub: calls `supabase.functions.invoke('readings-create', { body: { apartment_id: Number(apartmentId), ...payload } })`; checks `data?.error` and throws Error; calls `fetchPayments()` on success
- [x] T013 [US1] Wire initial payment flow into `src/pages/ReadingsPage.jsx` — add state `formMode` (null | 'initial' | 'monthly') and `actionError`; when `!loading && payments.length === 0 && !formMode`: show empty state div with text "Показників ще немає" and button "Додати перший запис" that sets `formMode = 'initial'`; when `formMode === 'initial'`: render `<ReadingForm mode="initial" tariffs={tariffs} onSubmit={handleCreate} onCancel={handleCancel} />`; `handleCreate(payload)` calls `createPayment(payload)`, clears formMode on success, sets `actionError` on failure; show `actionError` as red banner (same style as TariffsPage); clear placeholder div (depends on T011, T012)
- [x] T014 [US1] Deploy Edge Function: `supabase functions deploy readings-create --no-verify-jwt`

**Checkpoint**: US1 complete. First payment can be created end-to-end. Empty state → form → saved entry.

---

## Phase 4: User Story 2 — Add Monthly Payment (Priority: P2)

**Goal**: Owner records subsequent monthly payments with auto-calculated, locked date ranges.

**Independent Test**: Apartment has Jan 2026 payment → open readings page → "Додати показники" button visible → click → form opens with period "01.02.2026 – 28.02.2026" shown read-only → enter electricity qty 95 → save → February entry appears at top above January.

### Implementation for User Story 2

- [x] T015 [US2] Add monthly payment button and period logic to `src/pages/ReadingsPage.jsx` — add helper function `getNextPeriod(lastPeriodEnd)` inside the component: parse `lastPeriodEnd` as `new Date(lastPeriodEnd + 'T00:00:00')` to avoid timezone shift; compute `nextStart = new Date(y, m, d + 1)`; compute `nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, 0)`; format both as `YYYY-MM-DD` strings; when `!loading && payments.length > 0 && !formMode`: render "Додати показники" button that sets `formMode = 'monthly'`; when `formMode === 'monthly'`: compute `{ periodStart, periodEnd } = getNextPeriod(payments[0].period_end)` and render `<ReadingForm mode="monthly" periodStart={periodStart} periodEnd={periodEnd} tariffs={tariffs} onSubmit={handleCreate} onCancel={handleCancel} />`

**Checkpoint**: US1 + US2 complete. First and subsequent monthly payments both work. Date range is always auto-calculated correctly.

---

## Phase 5: User Story 3 — View Payments List (Priority: P3)

**Goal**: All recorded payments listed newest-first with full line-item detail.

**Independent Test**: Apartment has Jan, Feb, Mar 2026 payments → readings page shows March at top, then February, then January; each entry shows correct subtotals and total cost.

### Implementation for User Story 3

- [x] T016 [P] [US3] Create `src/components/readings/ReadingCard.jsx` — props: `payment` (object with `payment_line_items` array); format period as `"DD.MM.YYYY – DD.MM.YYYY"` using `toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })`; show period in a header; for each line item: show `tariff_name`, qty + `" " + unit` (if resource), `"× "` + unit_price formatted to 2 decimal places, subtotal formatted to 2 decimal places; show total cost (sum of all `parseFloat(item.subtotal)`) at bottom labeled "Разом:"; style consistent with existing cards (white bg, rounded-xl, border, p-4); all Ukrainian labels
- [x] T017 [P] [US3] Create `src/components/readings/ReadingList.jsx` — props: `payments`, `onAdd`, `onAddFirst`; if `payments.length === 0`: show empty state with text "Показників ще немає" and button "Додати перший запис" (calls `onAddFirst`); else: show "Додати показники" button at the top + render `<ReadingCard key={p.id} payment={p} />` for each payment; all Ukrainian
- [x] T018 [US3] Wire `ReadingList` into `src/pages/ReadingsPage.jsx` — replace the conditional empty-state/form-only rendering with `<ReadingList payments={payments} onAdd={() => setFormMode('monthly')} onAddFirst={() => setFormMode('initial')} />`; keep the form rendering block above the list (form shows when formMode is set, list always visible when formMode is null); remove duplicate empty-state code added in T013 (ReadingList handles it now)

**Checkpoint**: All three user stories complete. Full navigation flow, form, and list all work end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T019 [P] Run `npm run lint` in repo root and fix all ESLint errors in `src/` to zero (Principle II)
- [x] T020 Validate end-to-end per `quickstart.md`: all 7 scenarios — initial entry, monthly entry, price override, missing qty validation, duplicate prevention, list order, lint check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002 must follow T001
- **Foundational (Phase 2)**: Requires Phase 1 complete (T002 applied) — **BLOCKS all user stories**; T004–T009 can run in parallel
- **US1 (Phase 3)**: Requires Phase 2 complete; T010 and T011 are parallel, T012 depends on T010, T013 depends on T011+T012, T014 after T010
- **US2 (Phase 4)**: Requires US1 complete (T014 deployed, T013 wired)
- **US3 (Phase 5)**: Requires Phase 2 complete; T016 and T017 parallel, T018 depends on both
- **Polish (Phase 6)**: Requires all desired stories complete

### Remaining Work Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001–T003 | 3 |
| Foundational | T004–T009 | 6 |
| US1 | T010–T014 | 5 |
| US2 | T015 | 1 |
| US3 | T016–T018 | 3 |
| Polish | T019–T020 | 2 |

**20 tasks total.**

### Parallel Opportunities

- T004–T009 (Phase 2, different files) — parallel after T002
- T010, T011 (Edge Function and ReadingForm — different files) — parallel within US1
- T016, T017 (ReadingCard and ReadingList — different files) — parallel within US3

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T009)
3. Complete Phase 3: US1 (T010–T014)
4. **STOP and VALIDATE**: Initial payment entry works end-to-end
5. Proceed to US2 and US3

### Incremental Delivery

1. Setup + Foundational → DB + navigation ready
2. US1 → First payment recordable (**MVP**)
3. US2 → Monthly payments with auto-dates
4. US3 → Full list view with formatted cards
5. Polish → Lint + end-to-end validation

---

## Notes

- `[P]` tasks = different files, safe to run in parallel
- `[Story]` label maps each task to its user story for traceability
- `readings-create` inserts both `utility_payments` and `payment_line_items` in a single function call — atomic from the caller's perspective
- `useReadings` fetches `utility_payments` with nested `payment_line_items` using Supabase's `select('*, payment_line_items(*)')` — one query, no N+1
- `payments[0]` is the most recent payment (sorted desc by period_start) — used to compute next period dates
- Date arithmetic uses native JS `Date` constructor idiom `new Date(y, m+1, 0)` for last-day-of-month (no extra libraries)
- All Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` + `auth.getUser(token)` + `--no-verify-jwt` pattern from feature 001/002
