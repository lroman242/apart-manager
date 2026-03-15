# Data Model: Resource Meter Reading Input

**Branch**: `004-resource-meter-readings` | **Date**: 2026-03-15

---

## Modified Entity: `payment_line_items`

Two new nullable columns are added to the existing table. All existing columns are unchanged.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `meter_value_previous` | `numeric(10,3)` | nullable | Snapshot of the previous period's `meter_value_current` for this tariff, copied at form-open time. Null if no prior reading exists or if meter reading was not used. |
| `meter_value_current` | `numeric(10,3)` | nullable, CHECK >= 0 | Meter reading entered by owner for this payment period. Null if owner did not use meter reading input. |

**No other table changes.**

---

## Migration

```sql
ALTER TABLE payment_line_items
  ADD COLUMN meter_value_previous numeric(10,3),
  ADD COLUMN meter_value_current  numeric(10,3) CHECK (meter_value_current >= 0);
```

---

## Previous Meter Value Lookup Query

Run client-side before the payment form opens, once per apartment:

```sql
SELECT DISTINCT ON (pli.tariff_name)
  pli.tariff_name,
  pli.meter_value_current
FROM payment_line_items pli
JOIN utility_payments up ON pli.payment_id = up.id
WHERE up.apartment_id = :apartmentId
  AND pli.tariff_type = 'resource'
  AND pli.meter_value_current IS NOT NULL
ORDER BY pli.tariff_name, up.period_start DESC;
```

Returns a map `{ tariffName → previousMeterValue }` used to pre-populate the form.

---

## Validation Rules

| Rule | Enforced by |
|------|-------------|
| `meter_value_current >= 0` | DB constraint + client validation |
| `meter_value_current > meter_value_previous` when both present | Client validation (inline error: "Поточне значення не може бути меншим за попереднє") |
| `quantity > 0` (unchanged) | Edge Function + client validation |
| `meter_value_previous` must match the previous period's `meter_value_current` | Client-side lookup (no DB constraint needed) |

---

## No New Tables or Relationships

This feature is purely additive: two nullable columns on an existing table, one migration, no FK changes, no new RLS policies needed.
