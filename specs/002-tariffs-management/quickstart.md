# Quickstart: Tariffs Management

**Feature**: 002-tariffs-management
**Date**: 2026-03-15

---

## Prerequisites

- Feature 001 (apartment management) deployed and working
- Supabase project accessible (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` set)
- Supabase CLI installed and linked to the project

---

## §1 Apply Database Migration

```bash
supabase db push
```

Verify in Supabase Dashboard → Table Editor: `tariffs` table exists with columns
`id`, `apartment_id`, `name`, `type`, `price`, `unit`, `created_at`.

---

## §2 Create Edge Functions

```bash
supabase functions new tariffs-create
supabase functions new tariffs-update
supabase functions new tariffs-delete
```

Replace the generated `index.ts` files with the implementations per `contracts/edge-functions.md`.

Update each function's `deno.json`:

```json
{
  "imports": {
    "@supabase/functions-js": "jsr:@supabase/functions-js@^2",
    "@supabase/supabase-js": "npm:@supabase/supabase-js"
  }
}
```

---

## §3 Deploy Edge Functions

```bash
supabase functions deploy tariffs-create tariffs-update tariffs-delete --no-verify-jwt
```

---

## §4 Run the App

```bash
docker compose up
```

Or locally:

```bash
npm run dev
```

---

## §5 Manual Validation Checklist

### Navigation
- [ ] Apartment card shows "Тарифи" button
- [ ] Clicking "Тарифи" navigates to `/apartments/:id/tariffs`
- [ ] Tariffs page shows the apartment name in the heading
- [ ] "Назад" button returns to apartment list

### Services (fixed price)
- [ ] Empty tariffs page shows empty state message
- [ ] Add service "Інтернет" with price 250 → appears in list as service
- [ ] Edit price to 280 → list reflects 280
- [ ] Delete service → disappears from list
- [ ] Submit service with empty name → inline error, no row created

### Resources (price per unit)
- [ ] Add resource "Електроенергія" unit "кВт·год" price 4.50 → appears with unit label
- [ ] Edit price per unit → list reflects updated value
- [ ] Delete resource → disappears
- [ ] Submit resource with empty unit → inline error, no row created
- [ ] Submit resource with negative price → inline error, no row created

### Isolation
- [ ] Tariffs added to apartment A are NOT visible on apartment B's tariffs page

### Server-side validation
- [ ] POST to `tariffs-create` with empty name → `400 { "error": "name is required" }`
- [ ] POST to `tariffs-create` with type "resource" and no unit → `400 { "error": "unit is required for resources" }`
- [ ] POST to `tariffs-delete` with non-existent id → `404 { "error": "Not found" }`

---

## §6 Lint Check

```bash
npm run lint
```

Expected: 0 errors.
