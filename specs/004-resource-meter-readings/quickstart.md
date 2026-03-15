# Quickstart & Integration Scenarios: Resource Meter Reading Input

**Branch**: `004-resource-meter-readings` | **Date**: 2026-03-15

---

## Prerequisites

- Feature 003 (utility payments) deployed and working
- Apartment with a resource tariff "Електроенергія" (кВт·год) and a service tariff "Інтернет"
- At least one utility payment already recorded for the apartment with a meter reading

---

## Scenario 1: First Payment — No Previous Meter Value

**Test**: Meter reading field shown but no auto-calculation on first payment.

1. Open an apartment that has no utility payments.
2. Click "Показники" → "Додати перший запис".
3. The form opens. For "Електроенергія" (resource), a "Показник лічильника" field is visible below the quantity field.
4. Enter `1450` in the meter reading field.
5. **Expected**: Quantity field remains empty (no previous value to subtract from). Owner must enter qty manually.
6. Enter `100` in the quantity field.
7. Save.
8. **Expected**: Payment saved. meter_value_previous = null, meter_value_current = 1450, qty = 100.

---

## Scenario 2: Second Payment — Auto-Calculated Quantity

**Test**: Entering meter reading auto-fills qty = current − previous.

1. Previous payment exists with electricity meter at 1450.
2. Open new payment form (February).
3. For "Електроенергія", the "Попередній показник: 1450" label is displayed.
4. Enter `1570` in the "Показник лічильника" field.
5. **Expected**: Quantity field instantly updates to `120` (= 1570 − 1450).
6. Save.
7. **Expected**: Payment saved with qty = 120, meter_value_previous = 1450, meter_value_current = 1570.

---

## Scenario 3: Validation — Current Value Less Than Previous

**Test**: Error shown when current < previous, qty not auto-filled.

1. Previous electricity meter = 1450.
2. Open new payment form.
3. Enter `1400` in the meter reading field.
4. **Expected**: Inline error "Поточне значення не може бути меншим за попереднє" appears. Quantity field is NOT updated.
5. Correct to `1570`.
6. **Expected**: Error clears, qty updates to 120.

---

## Scenario 4: Manual Quantity Still Works (No Regression)

**Test**: Leaving meter reading field empty lets owner enter qty manually.

1. Open new payment form.
2. Leave the "Показник лічильника" field empty for electricity.
3. Enter `95` in the quantity field directly.
4. Save.
5. **Expected**: Payment saved with qty = 95, meter_value_previous = null, meter_value_current = null.
6. History shows electricity as "95 кВт·год" with no meter values displayed.

---

## Scenario 5: History View Shows Meter Values

**Test**: Saved meter readings appear in payment history.

1. February payment was saved with electricity meter 1450 → 1570 (qty 120).
2. Open the utility payments page.
3. View the February entry.
4. **Expected**: Electricity line shows "1450 → 1570 (120 кВт·год)".
5. March payment saved without meter reading (qty 95 entered manually).
6. **Expected**: March electricity line shows "95 кВт·год" (no meter values).

---

## Scenario 6: Service Tariffs Unaffected

**Test**: "Інтернет" (service) shows no meter reading field.

1. Open any payment form.
2. **Expected**: "Інтернет" row has no "Показник лічильника" field — only qty (default 1) and price.

---

## Scenario 7: Lint Check

```bash
npm run lint
```

**Expected**: Zero errors.
