# Supabase Table Contract: tariffs

**Feature**: 002-tariffs-management
**Date**: 2026-03-15

---

## Read Access (direct Supabase client)

Reads bypass Edge Functions and use the Supabase JS client directly. RLS enforces that only
authenticated users can read tariffs.

```js
// List all tariffs for one apartment
supabase.from('tariffs').select('*').eq('apartment_id', id).order('created_at', { ascending: true })
```

**Columns returned**: `id`, `apartment_id`, `name`, `type`, `price`, `unit`, `created_at`

---

## Write Access (Edge Functions only)

All mutations go through Edge Functions:

| Operation | Function          |
|-----------|-------------------|
| Create    | `tariffs-create`  |
| Update    | `tariffs-update`  |
| Delete    | `tariffs-delete`  |

---

## RLS Policy

```sql
CREATE POLICY "Authenticated users can manage tariffs"
  ON tariffs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

All authenticated users have full access. No per-row user isolation (single-owner tool).

---

## Cascade Behaviour

When an apartment is deleted (`apartments.id`), all its tariffs are automatically deleted
via `ON DELETE CASCADE` on the `apartment_id` foreign key.
