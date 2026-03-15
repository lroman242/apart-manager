# Contract: Apartments Table (Read Operations)

**Type**: Supabase database table (direct `@supabase/supabase-js` client — reads only)
**Feature**: `001-apartment-management`
**Date**: 2026-03-15

Read operations use the Supabase JS client directly with RLS enforcement.
**All write operations (create, update, delete, set-status) go through Edge Functions** —
see [`edge-functions.md`](./edge-functions.md).

---

## List all apartments

```js
const { data, error } = await supabase
  .from('apartments')
  .select('*')
  .order('created_at', { ascending: false })
```

**Returns**: Array of apartment objects ordered newest-first.
**RLS**: Requires authenticated session; returns only rows accessible to the current user.

---

## Error Handling

All read operations return `{ data, error }`. The caller MUST check `error` and display a
user-friendly inline message on failure. No silent failures.

## Auth Contract

All table operations above require the Supabase client to have an active authenticated
session. The auth guard in `App.jsx` ensures this before any apartment operation can
be triggered. If a session expires mid-use, Supabase auto-refreshes the token transparently.
