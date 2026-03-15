# Edge Function Contracts: Utility Payments

**Branch**: `003-meter-readings` | **Date**: 2026-03-15

---

## Common Rules

All Edge Functions:
- Accept `POST` requests with `Content-Type: application/json`
- Require `Authorization: Bearer <jwt>` header
- Return `Content-Type: application/json`
- Validate the JWT via `supabase.auth.getUser(token)` using a service-role client
- Return `401` if the token is missing, invalid, or expired
- Use `--no-verify-jwt` deploy flag (required for new Supabase key format)

### Standard Error Shape

```json
{ "error": "<human-readable message>" }
```

---

## `readings-create`

**Purpose**: Create a new utility payment record for one billing month, including all line items.

**Method**: `POST`
**Function name**: `readings-create`

### Request Body

```json
{
  "apartment_id": 1,
  "period_start": "2026-01-01",
  "period_end":   "2026-01-31",
  "line_items": [
    {
      "tariff_name":  "Електроенергія",
      "tariff_type":  "resource",
      "unit":         "кВт·год",
      "quantity":     120,
      "unit_price":   4.50
    },
    {
      "tariff_name":  "Інтернет",
      "tariff_type":  "service",
      "unit":         null,
      "quantity":     1,
      "unit_price":   250.00
    }
  ]
}
```

### Field Validation

| Field | Rule |
|-------|------|
| `apartment_id` | Required. Positive integer. |
| `period_start` | Required. ISO 8601 date string (`YYYY-MM-DD`). |
| `period_end` | Required. ISO 8601 date string. Must be ≥ `period_start`. |
| `line_items` | Required. Array (may be empty if apartment has no tariffs). |
| `line_items[].tariff_name` | Required. Non-empty string. |
| `line_items[].tariff_type` | Required. `"service"` or `"resource"`. |
| `line_items[].unit` | Required non-empty string when `tariff_type = "resource"`. Null/omitted for services. |
| `line_items[].quantity` | Required. Number > 0. |
| `line_items[].unit_price` | Required. Number ≥ 0. |

### Success Response — `201 Created`

```json
{
  "id": 42,
  "apartment_id": 1,
  "period_start": "2026-01-01",
  "period_end": "2026-01-31",
  "created_at": "2026-01-05T10:00:00.000Z",
  "line_items": [
    {
      "id": 101,
      "payment_id": 42,
      "tariff_name": "Електроенергія",
      "tariff_type": "resource",
      "unit": "кВт·год",
      "quantity": "120.000",
      "unit_price": "4.50",
      "subtotal": "540.00",
      "created_at": "2026-01-05T10:00:00.000Z"
    },
    {
      "id": 102,
      "payment_id": 42,
      "tariff_name": "Інтернет",
      "tariff_type": "service",
      "unit": null,
      "quantity": "1.000",
      "unit_price": "250.00",
      "subtotal": "250.00",
      "created_at": "2026-01-05T10:00:00.000Z"
    }
  ]
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| `400` | `apartment_id` missing or not a positive integer | `{ "error": "apartment_id must be a positive integer" }` |
| `400` | `period_start` missing or invalid date | `{ "error": "period_start must be a valid date (YYYY-MM-DD)" }` |
| `400` | `period_end` missing, invalid, or before `period_start` | `{ "error": "period_end must be a valid date on or after period_start" }` |
| `400` | Line item `quantity` ≤ 0 | `{ "error": "quantity must be greater than 0" }` |
| `400` | Line item `unit_price` < 0 | `{ "error": "unit_price must be >= 0" }` |
| `400` | Resource line item missing `unit` | `{ "error": "unit is required for resource tariffs" }` |
| `401` | Missing or invalid JWT | `{ "error": "unauthorized" }` |
| `409` | A payment record already exists for this apartment + period_start | `{ "error": "a payment record already exists for this billing period" }` |
| `500` | Unexpected server error | `{ "error": "internal server error" }` |
