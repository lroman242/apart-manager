---

description: "Task list for Resource Meter Reading Input feature"
---

# Tasks: Resource Meter Reading Input

**Input**: Design documents from `/specs/004-resource-meter-readings/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec — no test tasks included.

**Organization**: This feature is purely additive — one nullable column, extended Edge Function, extended form and card. Phase structure reflects the dependency chain: schema first, then backend, then UI.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1 / US2)
- Exact file paths in every description

## Status key

- `[x]` = Implemented and verified
- `[ ]` = Pending

---

## Phase 1: Setup (Database Migration)

**Purpose**: Extend the schema with the two new nullable columns — all story work depends on this.

- [x] T001 Create migration via `supabase migration new meter-reading-columns` — fill generated file with: `ALTER TABLE payment_line_items ADD COLUMN meter_value_current numeric(10,3) CONSTRAINT payment_line_items_meter_current_check CHECK (meter_value_current >= 0);`
- [x] T002 Apply migration via `supabase db push`

**Checkpoint**: `payment_line_items` has one new nullable column. Existing rows have NULL; existing queries are unaffected.

---

## Phase 2: Foundational (Backend Extension)

**Purpose**: Extend `readings-create` Edge Function to accept and persist the new fields, and add server-side validation. Required before any UI work can be tested end-to-end.

**⚠️ CRITICAL**: No user story work can be validated end-to-end until this phase is complete.

- [x] T003 Extend `supabase/functions/readings-create/index.ts` — in the line item insertion loop, read one new optional field: `meter_value_current` (number | null | undefined); add server-side validation: if `meter_value_current` is provided and not null, it MUST be >= 0 (error: `"meter_value_current must be >= 0"`); pass `meter_value_current` into the `payment_line_items` insert alongside existing fields (use `null` when not provided); redeploy with `supabase functions deploy readings-create --no-verify-jwt`

**Checkpoint**: POST to `readings-create` with `meter_value_current: 1570` stores the value. POST with `meter_value_current: -1` returns 400.

---

## Phase 3: User Story 1 — Meter Reading Input with Auto-Calculated Quantity (Priority: P1) 🎯 MVP

**Goal**: Owner enters a current meter value for each resource tariff in the payment form; quantity is auto-calculated as current − previous.

**Independent Test**: Apartment has a previous payment with electricity meter ending at 1450 → open new payment form → "Попередній показник: 1450.000" label visible → enter 1570 in meter field → qty field instantly shows 120 → save → payment stored with qty=120, meter_value_current=1570.

### Implementation for User Story 1

- [x] T004 [P] [US1] Add `fetchPreviousMeterValues(apartmentId)` to `src/hooks/useReadings.js` — add a new exported async helper (not part of the hook state) that queries: `supabase.from('payment_line_items').select('tariff_name, meter_value_current, utility_payments!inner(apartment_id, period_start)').eq('utility_payments.apartment_id', apartmentId).not('meter_value_current', 'is', null).order('utility_payments.period_start', { ascending: false })`; deduplicate by `tariff_name` keeping only the first (most recent) row per name; return a plain object `{ [tariffName]: meterValueCurrent }` (e.g., `{ "Електроенергія": 1450 }`)
- [x] T005 [US1] Extend `src/pages/ReadingsPage.jsx` — call `fetchPreviousMeterValues(apartmentId)` before the form opens (in a `useEffect` or lazily on button click), store the result in state `previousMeterValues` (default `{}`); pass `previousMeterValues` as a new prop to `<ReadingForm>`
- [x] T006 [US1] Extend `src/components/readings/ReadingForm.jsx` — add `previousMeterValues` prop (default `{}`); for each resource tariff line item, add a meter reading row below the quantity/price inputs: label showing `previousMeterValues[item.tariff_name]` if it exists ("Попередній показник: X" or "Перший показник" if no previous) — this is displayed to the user for reference only and is NOT sent in the payload; a numeric input "Показник лічильника" (`step="0.001"`, `min="0"`, `placeholder="0.000"`); store meter value per line in state `meterValues` (object keyed by index, default `{}`); when meter value changes for a resource line: if previous exists and current >= previous → auto-set `quantity` = `(current - previous).toFixed(3)` as a string and clear any qty error; if current < previous → set inline error `"Поточне значення не може бути меншим за попереднє"` on the meter field and clear quantity (this is a client-only concern — the previous value is not sent to the server); if previous does not exist → leave quantity unchanged (owner fills manually); update the `handleSubmit` payload: include only `meter_value_current: meterValues[i] != null && meterValues[i] !== '' ? parseFloat(meterValues[i]) : null` per line item — do NOT include `meter_value_previous` in the payload; meter field errors stored in `meterErrors` state (keyed by index)

**Checkpoint**: US1 complete. Enter meter reading in form → qty auto-fills. Save → meter values stored in DB.

---

## Phase 4: User Story 2 — Display Meter Readings in Payment History (Priority: P2)

**Goal**: Resource line items in the payments list show "previous → current" meter values when they were recorded.

**Independent Test**: Two payments exist — earlier payment with electricity meter_value_current=1450, later payment with electricity meter_value_current=1570 → open payments list → the later payment's electricity line shows "1450.000 → 1570.000 кВт·год" (previous value derived from the earlier payment).

### Implementation for User Story 2

- [x] T007 [US2] Extend `src/components/readings/ReadingCard.jsx` — in the resource line item render: after the existing name/qty/price display, check if `item.meter_value_current != null`; if so, render a secondary line showing `"{previousMeterValue} → {meter_value_current}"` formatted with `parseFloat(x).toFixed(3)` (or without trailing zeros using `Number(x)`); use a small, muted style (e.g., `text-xs text-gray-400`); to find the previous meter value for `payments[i]` tariff X: scan `payments[i+1..n]` (payments are sorted desc by `period_start`) for the first line item with matching `tariff_name` that has a non-null `meter_value_current` — that value is the previous reading; if a previous value is found: show `"1450 → 1570 {unit}"`; if no previous value exists (first payment with meter): show `"→ 1570 {unit}"`; service tariff lines and resource lines without meter values are unchanged

**Checkpoint**: US1 + US2 complete. Full flow: enter meter reading → save → history shows meter values.

---

## Phase 4b: User Story 3 — Edit Last Payment (Priority: P2)

**Goal**: Owner can correct the most recent payment. Only the last card shows "Редагувати"; edit form opens pre-populated; save updates in-place via `readings-update`.

- [x] T010 Create `supabase/functions/readings-update/index.ts` — PATCH handler: validate inputs (same rules as readings-create), update `utility_payments`, delete + reinsert `payment_line_items`; copy `deno.json` from readings-create; deploy with `--no-verify-jwt`
- [x] T011 Add `updatePayment(paymentId, payload)` to `src/hooks/useReadings.js` — calls `readings-update` via `supabase.functions.invoke`
- [x] T012 Extend `src/components/readings/ReadingForm.jsx` — add `mode='edit'` and `initialPayment` prop; pre-populate startDate, endDateInput, lineItems, meterValues from existing payment; both period dates editable in edit mode
- [x] T013 Extend `src/pages/ReadingsPage.jsx` — add `editPayment` state, `openEditForm(payment)`, `handleUpdate(payload)`; pass `onEdit` to ReadingList
- [x] T014 [P] Extend `src/components/readings/ReadingCard.jsx` — show "Редагувати" button only when `isLatest=true`
- [x] T015 [P] Extend `src/components/readings/ReadingList.jsx` — pass `isLatest={i===0}` and `onEdit` to ReadingCard

**Checkpoint**: US3 complete. Tap "Редагувати" on last card → form opens pre-populated → save → list updated.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T008 [P] Run `npm run lint` in repo root and fix all ESLint errors in `src/` to zero (Principle II)
- [x] T009 Validate end-to-end per `quickstart.md`: all 7 scenarios — first payment no previous, auto-calc, validation error, manual qty no regression, history display, service unaffected, lint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002 must follow T001
- **Foundational (Phase 2)**: Requires T002 (migration applied) — **BLOCKS end-to-end testing**
- **US1 (Phase 3)**: Requires Phase 2 complete (Edge Function must persist meter values); T004 and T005+T006 partially parallel (T004 is in a different file from T005/T006)
- **US2 (Phase 4)**: Requires T003 deployed (so meter values exist in DB to display); can start in parallel with US1 UI work
- **Polish (Phase 5)**: Requires all story phases complete

### Task Dependencies Within US1

- T004 (hook helper) — independent of T005/T006 (different file)
- T005 (ReadingsPage) — depends on T004 (uses `fetchPreviousMeterValues`)
- T006 (ReadingForm) — can start in parallel with T005 (different file; receives `previousMeterValues` as prop)

### Remaining Work Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001–T002 | 2 |
| Foundational | T003 | 1 |
| US1 | T004–T006 | 3 |
| US2 | T007 | 1 |
| Polish | T008–T009 | 2 |

**9 tasks total.**

### Parallel Opportunities

- T004 and T006 can be worked in parallel (different files: hook vs. component)
- T007 (ReadingCard) can start in parallel with T004–T006 (different file; only needs T003 deployed to test)
- T008 (lint) can run alongside T009 (validation)

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational — extend Edge Function (T003)
3. Complete Phase 3: US1 — hook helper + ReadingsPage + ReadingForm (T004–T006)
4. **STOP and VALIDATE**: Meter reading input → auto-calc → save works end-to-end
5. Proceed to US2

### Incremental Delivery

1. Setup + Foundational → schema + backend ready
2. US1 → Meter reading input + auto-calc (**MVP**)
3. US2 → History shows meter values
4. Polish → Lint + full validation

---

## Notes

- `[P]` tasks = different files, safe to run in parallel
- This feature is purely additive — all changes are backwards-compatible; no existing behaviour changes
- `previousMeterValues` map is built client-side from existing `payment_line_items` data; no new DB tables or columns beyond the one nullable field (`meter_value_current`)
- The `DISTINCT ON` pattern is emulated JS-side (filter to first occurrence per tariff name after sorting DESC by period)
- When `meter_value_current` is provided but no previous reading exists for the tariff (first reading), the quantity is not auto-calculated — owner fills manually; `meter_value_current` is still stored as the baseline for future readings
- Only `meter_value_current` is stored in the DB and sent in the Edge Function payload; the previous value is always derived at query time (ReadingCard) or from the pre-loaded `previousMeterValues` map (ReadingForm) — it is never stored or transmitted as a separate field
- Supabase JS client query uses `.not('meter_value_current', 'is', null)` to filter only rows that have meter values
