# Data Model: Apartment Management

**Feature**: `001-apartment-management`
**Date**: 2026-03-15

## Entity: Apartment

Represents a property owned by the user.

### Fields

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `bigint` | No | auto (sequence) | Primary key, auto-incrementing |
| `name` | `text` | No | — | Required; not unique |
| `address` | `text` | Yes | `NULL` | Optional free-text |
| `status` | `text` | No | `'active'` | Enum: `'active'` or `'on_hold'` |
| `created_at` | `timestamptz` | No | `now()` | Set on insert, never updated |

> **Note**: The `status` column is not in the original user-supplied schema but is required
> to implement the hold/unhold feature. It is added here with a `CHECK` constraint.

### Validation Rules

- `name` MUST NOT be empty (enforced at DB level via `NOT NULL` and by Edge Function before insert).
- `status` MUST be one of `'active'` or `'on_hold'` (DB-level `CHECK` constraint and Edge Function validation).
- `created_at` is set by the database and MUST NOT be supplied or modified by the client or Edge Functions.
- `address` MAY be `NULL` or an empty string; the UI treats both as "no address".

### State Transitions

```
active ──(put on hold)──► on_hold
on_hold ──(remove hold)──► active
active / on_hold ──(delete)──► [removed]
```

There is no other status; a newly created apartment is always `active`.

### Access Pattern

| Operation | Access method |
|-----------|--------------|
| List / read all | Direct Supabase JS client (RLS enforced) |
| Create | `apartments-create` Edge Function |
| Update name/address | `apartments-update` Edge Function |
| Delete | `apartments-delete` Edge Function |
| Hold / unhold | `apartments-set-status` Edge Function |

### Migration SQL

```sql
-- supabase/migrations/20260315110937_initial-migration.sql

CREATE TABLE apartments (
  id         bigserial    PRIMARY KEY,
  name       text         NOT NULL,
  address    text,
  status     text         NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'on_hold')),
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage apartments"
  ON apartments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## Client-Side Shape

The React app works with plain JavaScript objects matching the Supabase row shape:

```js
// Apartment object as returned by Supabase JS client (reads) or Edge Functions (mutations)
{
  id: 1,                          // number
  name: "Flat 3B",                // string
  address: "12 Main St, Apt 3B",  // string | null
  status: "active",               // "active" | "on_hold"
  created_at: "2026-03-15T10:00:00Z" // ISO string
}
```

## Indexes

No additional indexes beyond the primary key are required at this scale (<50 rows).
