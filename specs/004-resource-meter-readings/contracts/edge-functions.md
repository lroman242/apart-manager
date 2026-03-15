# Edge Function Contracts: Resource Meter Reading Input

**Branch**: `004-resource-meter-readings` | **Date**: 2026-03-15

---

## `readings-create` (extended)

The existing `readings-create` Edge Function is extended to accept one new optional field per line item. Only `meter_value_current` is accepted and stored; the previous meter value is not sent by the client — it is derived at query time from the prior payment's `meter_value_current`. All existing behaviour and validation is unchanged.

### New optional fields per line item

| Field | Type | Rules |
|-------|------|-------|
| `meter_value_current` | `number \| null` | Optional. If provided, must be >= 0. |

### Extended request body example

```json
{
  "apartment_id": 1,
  "period_start": "2026-02-01",
  "period_end":   "2026-02-28",
  "line_items": [
    {
      "tariff_name":         "Електроенергія",
      "tariff_type":         "resource",
      "unit":                "кВт·год",
      "quantity":            120,
      "unit_price":          4.50,
      "meter_value_current": 1570
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

### Extended success response (201)

```json
{
  "id": 43,
  "apartment_id": 1,
  "period_start": "2026-02-01",
  "period_end": "2026-02-28",
  "created_at": "2026-02-05T10:00:00.000Z",
  "line_items": [
    {
      "id": 103,
      "payment_id": 43,
      "tariff_name": "Електроенергія",
      "tariff_type": "resource",
      "unit": "кВт·год",
      "quantity": "120.000",
      "unit_price": "4.50",
      "subtotal": "540.00",
      "meter_value_current": "1570.000",
      "created_at": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

### New error responses

| Status | Condition | Body |
|--------|-----------|------|
| `400` | `meter_value_current < 0` | `{ "error": "meter_value_current must be >= 0" }` |

All existing error responses (401, 400 for other fields, 409, 500) remain unchanged.

---

## `readings-update` (new)

Updates an existing payment and replaces all its line items. Only intended for the most recent payment — enforced by the UI, not the function.

### Request body

```json
{
  "payment_id":   43,
  "period_start": "2026-01-10",
  "period_end":   "2026-02-10",
  "line_items": [
    {
      "tariff_name":         "Електроенергія",
      "tariff_type":         "resource",
      "unit":                "кВт·год",
      "quantity":            125,
      "unit_price":          4.50,
      "meter_value_current": 1575
    }
  ]
}
```

### Success response (200)

Same shape as `readings-create` 201 response, with updated values.

### Error responses

| Status | Condition | Body |
|--------|-----------|------|
| `401` | Missing or invalid JWT | `{ "error": "unauthorized" }` |
| `400` | Invalid field | Same field-level errors as `readings-create` |
| `500` | DB error | `{ "error": "<db message>" }` |
