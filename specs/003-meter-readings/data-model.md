# Data Model: Utility Payments

**Branch**: `003-meter-readings` | **Date**: 2026-03-15

---

## Entity: `utility_payments`

Represents one billing month's payment record for an apartment.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `bigserial` | PRIMARY KEY | |
| `apartment_id` | `bigint` | NOT NULL, FK → `apartments(id)` ON DELETE CASCADE | |
| `period_start` | `date` | NOT NULL | First day of billing month (owner-entered for initial; auto-calc for subsequent) |
| `period_end` | `date` | NOT NULL | Last day of billing month (always auto-calculated) |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | |

**Unique constraint**: `UNIQUE (apartment_id, period_start)` — one payment record per billing month per apartment.

**Index**: `utility_payments_apartment_id_idx ON utility_payments(apartment_id)`

**RLS**: Enabled. Policy: `FOR ALL TO authenticated USING (true) WITH CHECK (true)`

---

## Entity: `payment_line_items`

One tariff line within a utility payment. Stores a snapshot of the tariff details at the time of recording.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `bigserial` | PRIMARY KEY | |
| `payment_id` | `bigint` | NOT NULL, FK → `utility_payments(id)` ON DELETE CASCADE | |
| `tariff_name` | `text` | NOT NULL | Snapshot of `tariffs.name` at recording time |
| `tariff_type` | `text` | NOT NULL, CHECK IN ('service', 'resource') | Snapshot of `tariffs.type` |
| `unit` | `text` | nullable | Snapshot of `tariffs.unit`; non-null for resources |
| `quantity` | `numeric(10,3)` | NOT NULL, CHECK > 0 | Consumed qty for resources; count for services (default 1) |
| `unit_price` | `numeric(10,2)` | NOT NULL, CHECK >= 0 | Snapshot of `tariffs.price`, overridable by owner |
| `subtotal` | `numeric(12,2)` | NOT NULL, CHECK >= 0 | `quantity × unit_price`, calculated by Edge Function |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | |

**Index**: `payment_line_items_payment_id_idx ON payment_line_items(payment_id)`

**RLS**: Enabled. Policy: `FOR ALL TO authenticated USING (true) WITH CHECK (true)`

---

## Relationships

```
apartments (1) ──< utility_payments (1) ──< payment_line_items
tariffs (n)  ←─ snapshot ─── payment_line_items
```

- `utility_payments` is scoped to one apartment.
- `payment_line_items` are immutable snapshots; they do not have a live FK to `tariffs` (the tariff can be deleted without affecting historical line items).

---

## Validation Rules (enforced by Edge Function)

| Rule | Scope |
|------|-------|
| `apartment_id` must be a positive integer | `utility_payments` |
| `period_start` must be a valid ISO date | `utility_payments` |
| `period_end` must be ≥ `period_start` | `utility_payments` |
| No existing record with same `(apartment_id, period_start)` | `utility_payments` |
| At least one line item must be provided (or zero — no tariffs case allowed) | `payment_line_items` |
| Each line item `quantity` must be > 0 | `payment_line_items` |
| Each line item `unit_price` must be >= 0 | `payment_line_items` |
| `tariff_type` must be `service` or `resource` | `payment_line_items` |
| `unit` must be non-null/non-empty when `tariff_type = 'resource'` | `payment_line_items` |

---

## Date Calculation Logic

```
Initial reading:
  period_start = owner-selected date
  period_end   = last day of period_start's calendar month
               = new Date(year, month + 1, 0)  [JS]

Subsequent readings:
  period_start = prev period_end + 1 day
  period_end   = last day of new period_start's calendar month
```
