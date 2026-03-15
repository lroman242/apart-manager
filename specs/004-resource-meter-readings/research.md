# Research: Resource Meter Reading Input

**Branch**: `004-resource-meter-readings` | **Date**: 2026-03-15

---

## Decision 1: Store Meter Values on Line Items (Not a Separate Table)

**Decision**: Add `meter_value_current numeric(10,3)` as a single nullable column to the existing `payment_line_items` table. The previous meter value is always derived at query time from the prior payment's `meter_value_current` — it is not stored as a separate column.

**Rationale**: The existing system already stores tariff snapshots (name, price, unit) as immutable line item data. Meter readings are simply another snapshot field on the same row. Adding a separate `meter_readings` table would create a parallel history with its own FK relationships — unnecessary complexity for what is fundamentally "two more optional fields per line item." Nullable columns mean zero impact on existing payments that don't use meter readings.

**Alternatives considered**:
- Separate `meter_readings` table with FK → `payment_line_items` — rejected (Principle I: over-engineering for two fields)
- Storing meter values in a JSONB `metadata` column — rejected (harder to query, no type safety)

---

## Decision 2: Previous Value Lookup — Client-Side Query Before Form Opens

**Decision**: When the payment form is opened, `useReadings.js` performs a single query: for each resource tariff name in this apartment, find the `meter_value_current` from the most recent `payment_line_items` row (joined to `utility_payments` ordered by `period_start DESC`). This map of `{tariff_name: previousMeterValue}` is passed into `ReadingForm` as a prop.

**Rationale**: This lookup is a simple SELECT, not a mutation — no Edge Function needed. Running it client-side before the form opens keeps the Edge Function focused on inserts only (Principle I). The query is fast (indexed on `payment_id` → joined to `utility_payments.apartment_id`).

**Query pattern**:
```sql
SELECT DISTINCT ON (pli.tariff_name)
  pli.tariff_name,
  pli.meter_value_current
FROM payment_line_items pli
JOIN utility_payments up ON pli.payment_id = up.id
WHERE up.apartment_id = $apartmentId
  AND pli.meter_value_current IS NOT NULL
ORDER BY pli.tariff_name, up.period_start DESC
```

**Alternatives considered**:
- Store a global "current meter value" per apartment+tariff in the `tariffs` table — rejected (tariffs are not meant to track state; violates separation of concerns)
- Fetch inside `readings-create` Edge Function and return previous values — rejected (adds a read step to a write function; complicates the contract)

---

## Decision 3: Extend `readings-create` Edge Function (Not a New Function)

**Decision**: The existing `readings-create` Edge Function is extended to accept one new optional field per line item: `meter_value_current`. It is passed through and inserted into `payment_line_items` unchanged. The previous meter value is not sent by the client and is not stored — it is derived at query time from the prior payment's `meter_value_current`. No server-side calculation — quantity is still validated as `> 0` (already calculated client-side).

**Rationale**: The Edge Function already handles all line item insertion logic. Adding two nullable pass-through fields is a minimal change. Re-creating the calculation server-side would duplicate client logic (Principle I).

**Alternatives considered**:
- New `readings-meter` Edge Function — rejected (Principle I: one mutation, one function)

---

## Decision 4: Quantity Remains the Source of Truth

**Decision**: `quantity` in `payment_line_items` continues to be the authoritative consumed amount. When meter readings are used, `quantity = meter_value_current - meter_value_previous` (calculated client-side). Both the auto-calculated and manually entered paths write to the same `quantity` field.

**Rationale**: Downstream cost calculations (`subtotal = quantity × unit_price`) work correctly without knowing whether the quantity came from meter readings or manual entry. Keeping `quantity` as the single source of truth avoids dual-path logic in display and reporting code.

---

## Decision 5: Lookup Key — Tariff Name (Not Tariff ID)

**Decision**: Previous meter values are looked up by `tariff_name` (the snapshot field on line items), not by `tariff_id`, because tariffs don't have a stable FK in line items (they're snapshots).

**Rationale**: The existing data model stores `tariff_name` as a text snapshot. There is no `tariff_id` column on `payment_line_items`. Matching by name is consistent with the existing snapshot approach and works correctly even if a tariff is deleted and recreated with the same name.
