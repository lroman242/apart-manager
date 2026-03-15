# Data Model: Tariffs Management

**Feature**: 002-tariffs-management
**Date**: 2026-03-15

---

## Entities

### Tariff

Represents a single pricing item belonging to one apartment. A tariff is either a
**service** (fixed price) or a **resource** (price per unit of consumption).

| Column         | Type             | Nullable | Constraints                                      |
|----------------|------------------|----------|--------------------------------------------------|
| `id`           | bigserial        | NO       | PRIMARY KEY                                      |
| `apartment_id` | bigint           | NO       | REFERENCES apartments(id) ON DELETE CASCADE      |
| `name`         | text             | NO       | Non-empty (app-level validation)                 |
| `type`         | text             | NO       | CHECK IN ('service', 'resource'); immutable      |
| `price`        | numeric(10,2)    | NO       | CHECK price >= 0                                 |
| `unit`         | text             | YES      | Required when type = 'resource'; NULL for service|
| `created_at`   | timestamptz      | NO       | DEFAULT now()                                    |

**Relationships**:
- Belongs to one `apartment` (FK: `apartment_id → apartments.id`)
- When an apartment is deleted, all its tariffs are cascade-deleted

**Indexes**:
- `tariffs_apartment_id_idx` on `(apartment_id)` — supports fetching all tariffs for an apartment

---

## Validation Rules

| Field        | Rule                                                                  |
|--------------|-----------------------------------------------------------------------|
| `name`       | Required, non-empty after trim                                        |
| `type`       | Must be exactly `'service'` or `'resource'`; set at creation only    |
| `price`      | Required, numeric, >= 0                                               |
| `unit`       | Required and non-empty when `type = 'resource'`; must be NULL/absent when `type = 'service'` |

---

## State Transitions

Tariffs have no status field. The lifecycle is: **created → (optionally edited) → deleted**.

The `type` is the only immutable field — all other fields (name, price, unit) are editable.

---

## Migration

**File**: `supabase/migrations/20260315120000_tariffs.sql`

```sql
CREATE TABLE tariffs (
  id           bigserial      PRIMARY KEY,
  apartment_id bigint         NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  name         text           NOT NULL,
  type         text           NOT NULL
                 CONSTRAINT tariffs_type_check
                 CHECK (type IN ('service', 'resource')),
  price        numeric(10,2)  NOT NULL
                 CONSTRAINT tariffs_price_check
                 CHECK (price >= 0),
  unit         text,
  created_at   timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX tariffs_apartment_id_idx ON tariffs(apartment_id);

ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tariffs"
  ON tariffs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Read Queries

All reads use the direct Supabase client (no Edge Function needed):

```js
// Fetch all tariffs for an apartment, ordered by creation
supabase
  .from('tariffs')
  .select('*')
  .eq('apartment_id', apartmentId)
  .order('created_at', { ascending: true })
```
