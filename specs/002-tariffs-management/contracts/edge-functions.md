# Edge Function Contracts: Tariffs Management

**Feature**: 002-tariffs-management
**Date**: 2026-03-15

All functions:
- Accept `POST` only (OPTIONS for CORS preflight)
- Require `Authorization: Bearer <jwt>` header (user session token)
- Return `Content-Type: application/json`
- Validate the user's JWT via `supabase.auth.getUser(token)` before any DB access
- Use `SUPABASE_SERVICE_ROLE_KEY` for the internal Supabase client (same pattern as feature 001)
- Deploy with `--no-verify-jwt` flag

---

## tariffs-create

**Path**: `supabase/functions/tariffs-create/index.ts`
**Invoked as**: `supabase.functions.invoke('tariffs-create', { body: {...} })`

### Request Body

```json
{
  "apartment_id": 1,
  "name": "Електроенергія",
  "type": "resource",
  "price": 4.50,
  "unit": "кВт·год"
}
```

| Field          | Type   | Required | Notes                                         |
|----------------|--------|----------|-----------------------------------------------|
| `apartment_id` | number | YES      | Must be a positive integer                    |
| `name`         | string | YES      | Non-empty after trim                          |
| `type`         | string | YES      | Must be `"service"` or `"resource"`           |
| `price`        | number | YES      | Must be >= 0                                  |
| `unit`         | string | Conditional | Required when `type = "resource"`; omit or null for service |

### Responses

| Status | Body                                      | Condition                        |
|--------|-------------------------------------------|----------------------------------|
| 201    | Full tariff row                           | Created successfully             |
| 400    | `{ "error": "apartment_id is required" }` | Missing/invalid apartment_id     |
| 400    | `{ "error": "name is required" }`         | Empty name                       |
| 400    | `{ "error": "type must be service or resource" }` | Invalid type            |
| 400    | `{ "error": "price must be a non-negative number" }` | Invalid price         |
| 400    | `{ "error": "unit is required for resources" }` | Resource missing unit       |
| 401    | `{ "error": "Unauthorized" }`             | Missing/invalid auth token       |
| 500    | `{ "error": "<db message>" }`             | Unexpected DB error              |

---

## tariffs-update

**Path**: `supabase/functions/tariffs-update/index.ts`

### Request Body

```json
{
  "id": 5,
  "name": "Інтернет",
  "price": 280,
  "unit": null
}
```

| Field   | Type   | Required   | Notes                                              |
|---------|--------|------------|----------------------------------------------------|
| `id`    | number | YES        | Tariff ID to update                                |
| `name`  | string | YES        | Non-empty after trim                               |
| `price` | number | YES        | Must be >= 0                                       |
| `unit`  | string | Conditional | Required (non-empty) when updating a resource tariff; null/absent for service |

**Note**: `type` is immutable — the function reads the existing row's type to enforce unit
validation; clients do not send `type` in the update body.

### Responses

| Status | Body                                          | Condition                    |
|--------|-----------------------------------------------|------------------------------|
| 200    | Full updated tariff row                       | Updated successfully         |
| 400    | `{ "error": "id is required" }`               | Missing/invalid id           |
| 400    | `{ "error": "name is required" }`             | Empty name                   |
| 400    | `{ "error": "price must be a non-negative number" }` | Invalid price         |
| 400    | `{ "error": "unit is required for resources" }` | Resource missing unit      |
| 401    | `{ "error": "Unauthorized" }`                 | Missing/invalid auth token   |
| 404    | `{ "error": "Not found" }`                    | Tariff ID does not exist     |
| 500    | `{ "error": "<db message>" }`                 | Unexpected DB error          |

---

## tariffs-delete

**Path**: `supabase/functions/tariffs-delete/index.ts`

### Request Body

```json
{ "id": 5 }
```

| Field | Type   | Required | Notes                |
|-------|--------|----------|----------------------|
| `id`  | number | YES      | Tariff ID to delete  |

### Responses

| Status | Body                             | Condition                    |
|--------|----------------------------------|------------------------------|
| 200    | `{ "success": true }`            | Deleted successfully         |
| 400    | `{ "error": "id is required" }`  | Missing/invalid id           |
| 401    | `{ "error": "Unauthorized" }`    | Missing/invalid auth token   |
| 404    | `{ "error": "Not found" }`       | Tariff ID does not exist     |
| 500    | `{ "error": "<db message>" }`    | Unexpected DB error          |

---

## CORS Headers (all functions)

```ts
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
```
