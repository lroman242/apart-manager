# Contract: Supabase Edge Functions

**Type**: Supabase Edge Functions (HTTPS, Deno runtime)
**Feature**: `001-apartment-management`
**Date**: 2026-03-15

All mutation operations (create, update, delete, set status) go through Edge Functions.
The Supabase JS client invokes them via `supabase.functions.invoke(name, { body })` and
automatically forwards the user's session JWT in the `Authorization` header.

**Common behaviour**:
- All functions require a valid authenticated session → `401` if missing or expired.
- All functions return `Content-Type: application/json`.
- Error shape is always `{ "error": "<message>" }` with an appropriate HTTP status.
- Success shape is the mutated resource or `{ "success": true }`.

---

## `apartments-create`

**Created with**: `supabase functions new apartments-create`

**Invocation**:
```js
const { data, error } = await supabase.functions.invoke('apartments-create', {
  body: { name, address }
})
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Non-empty |
| `address` | string \| null | No | Optional free-text |

**Success (201)**:
```json
{ "id": 1, "name": "Flat 3B", "address": "12 Main St", "status": "active", "created_at": "2026-03-15T10:00:00Z" }
```

**Errors**:

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "name is required" }` | Missing or empty name |
| 401 | `{ "error": "Unauthorized" }` | No valid session JWT |
| 500 | `{ "error": "Internal server error" }` | Unexpected DB failure |

---

## `apartments-update`

**Created with**: `supabase functions new apartments-update`

**Invocation**:
```js
const { data, error } = await supabase.functions.invoke('apartments-update', {
  body: { id, name, address }
})
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | number | Yes | Apartment to update |
| `name` | string | Yes | Non-empty |
| `address` | string \| null | No | Pass `null` to clear |

**Success (200)**:
```json
{ "id": 1, "name": "Flat 3B Updated", "address": null, "status": "active", "created_at": "2026-03-15T10:00:00Z" }
```

**Errors**:

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "id is required" }` | Missing id |
| 400 | `{ "error": "name is required" }` | Missing or empty name |
| 401 | `{ "error": "Unauthorized" }` | No valid session JWT |
| 404 | `{ "error": "Not found" }` | No apartment with given id |
| 500 | `{ "error": "Internal server error" }` | Unexpected DB failure |

---

## `apartments-delete`

**Created with**: `supabase functions new apartments-delete`

**Invocation**:
```js
const { data, error } = await supabase.functions.invoke('apartments-delete', {
  body: { id }
})
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | number | Yes | Apartment to delete |

**Success (200)**:
```json
{ "success": true }
```

**Errors**:

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "id is required" }` | Missing id |
| 401 | `{ "error": "Unauthorized" }` | No valid session JWT |
| 404 | `{ "error": "Not found" }` | No apartment with given id |
| 500 | `{ "error": "Internal server error" }` | Unexpected DB failure |

---

## `apartments-set-status`

**Created with**: `supabase functions new apartments-set-status`

**Invocation**:
```js
const { data, error } = await supabase.functions.invoke('apartments-set-status', {
  body: { id, status }
})
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | number | Yes | Apartment to update |
| `status` | string | Yes | Must be `"active"` or `"on_hold"` |

**Success (200)**:
```json
{ "id": 1, "status": "on_hold" }
```

**Errors**:

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "id is required" }` | Missing id |
| 400 | `{ "error": "status must be active or on_hold" }` | Invalid status value |
| 401 | `{ "error": "Unauthorized" }` | No valid session JWT |
| 404 | `{ "error": "Not found" }` | No apartment with given id |
| 500 | `{ "error": "Internal server error" }` | Unexpected DB failure |

---

## Environment Variables (Edge Functions)

Supabase automatically injects these into every Edge Function's Deno environment:

| Variable | Source | Notes |
|----------|--------|-------|
| `SUPABASE_URL` | Auto-injected | Project URL |
| `SUPABASE_ANON_KEY` | Auto-injected | Used to create per-request client with user JWT |

No additional secrets are required. The service-role key is NOT used.
