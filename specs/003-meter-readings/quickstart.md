# Quickstart & Integration Scenarios: Utility Payments

**Branch**: `003-meter-readings` | **Date**: 2026-03-15

---

## Prerequisites

- Supabase project running with `apartments` and `tariffs` tables populated
- At least one apartment exists
- At least one resource tariff (e.g., "Електроенергія", unit "кВт·год") and one service tariff (e.g., "Інтернет") exist for the test apartment
- `readings-create` Edge Function deployed with `--no-verify-jwt`
- Migration applied (`supabase db push`)
- User authenticated (session active)

---

## Scenario 1: Add Initial Utility Payment

**Test**: First payment for an apartment that has no payment history.

1. Open the apartment list.
2. On an apartment card with no payments, click "Показники" (top-right corner).
3. The utility payments page opens showing an empty state with a "Додати показники" button.
4. Click "Додати показники".
5. The form shows:
   - A **start date** picker (today pre-selected).
   - A line item row for each active tariff on this apartment.
   - Resource tariff: empty quantity field + unit label + price (editable).
   - Service tariff: quantity field pre-filled with `1` (editable) + price (editable).
6. Set start date to `2026-01-01`.
7. Enter `120` for electricity (кВт·год).
8. Leave internet qty as `1`.
9. Click "Зберегти".
10. **Expected**: Payment entry appears in the list showing period "01.01.2026 – 31.01.2026", electricity 120 × 4.50 = 540.00, internet 1 × 250.00 = 250.00, total 790.00.

---

## Scenario 2: Add Next Monthly Payment

**Test**: Second payment — date range is auto-calculated and locked.

1. From the utility payments page (which now shows the January entry), click "Додати показники".
2. **Expected**: The form opens with period start `2026-02-01` and period end `2026-02-28` pre-filled and read-only.
3. Enter `95` for electricity.
4. Leave internet qty as `1`.
5. Click "Зберегти".
6. **Expected**: February entry appears at the top of the list (above January). Period shows "01.02.2026 – 28.02.2026".

---

## Scenario 3: Override Price on a Line Item

**Test**: Owner-overridden price is stored in the snapshot, not affecting the base tariff.

1. Open the form for a new payment.
2. Change the price for electricity from `4.50` to `5.00`.
3. Enter qty `100`.
4. Save.
5. **Expected**: The new entry shows subtotal `100 × 5.00 = 500.00`.
6. Navigate to Tariffs for the apartment → confirm electricity price is still `4.50`.

---

## Scenario 4: Validation — Missing Resource Quantity

**Test**: Saving without filling a resource quantity is blocked.

1. Open the new payment form.
2. Leave the electricity quantity empty.
3. Click "Зберегти".
4. **Expected**: Inline error "Кількість обов'язкова" appears next to the electricity field. Nothing is saved.

---

## Scenario 5: Duplicate Period Prevention

**Test**: Adding a second payment for the same month is blocked.

1. January payment already exists.
2. Attempt to call `readings-create` with `period_start: "2026-01-01"` again.
3. **Expected**: Error response `409 { "error": "a payment record already exists for this billing period" }` is returned. No duplicate entry in the list.

---

## Scenario 6: Readings List Order

**Test**: List is always newest-first.

1. Add payments for January, February, March 2026.
2. Open the utility payments page.
3. **Expected**: Order is March → February → January.

---

## Scenario 7: Lint Check

```bash
npm run lint
```

**Expected**: Zero errors.
