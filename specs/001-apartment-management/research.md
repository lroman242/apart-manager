# Research: Apartment Management

**Feature**: `001-apartment-management`
**Date**: 2026-03-15

## 1. Project Scaffold: Vite + React PWA

**Decision**: Vite 5 with `@vitejs/plugin-react` and `vite-plugin-pwa` using the `generateSW`
strategy.

**Rationale**: `generateSW` auto-generates a Workbox service worker that pre-caches all static
assets. No custom service-worker code is needed for an app that is primarily online. This
satisfies the PWA installability requirement (valid manifest + service worker) with minimal
configuration.

**Alternatives considered**:
- `injectManifest` strategy — required only when custom offline logic is needed; overkill here.
- CRA / Next.js — heavier, not aligned with the simplicity principle.

**Minimal vite.config.js for PWA**:
```js
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Apart Manager',
    short_name: 'ApartMgr',
    theme_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
})
```

---

## 2. Supabase Client Singleton

**Decision**: Create `src/lib/supabase.js` that exports a single `createClient` instance
initialised from `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.

**Rationale**: A singleton prevents multiple client instances. Vite's `VITE_` prefix exposes
env vars to client-side bundles. `persistSession: true` keeps the authenticated session across
page reloads. Service-role keys must never be used client-side (Principle V).

**Alternatives considered**:
- React Context wrapping the client — adds indirection for no benefit; direct import is simpler.
- Initialising inside `useEffect` — delays availability; import-time init is cleaner.

---

## 3. Row Level Security — Single Owner

**Decision**: Enable RLS on `apartments` and create a single `FOR ALL` policy restricting
access to any authenticated user (`auth.role() = 'authenticated'`).

**Rationale**: Because this is a single-owner personal app with one Supabase Auth account,
binding to `auth.role() = 'authenticated'` is sufficient — the owner is always the only
authenticated user. Adding a `user_id` foreign key is unnecessary complexity (Principle I) when
there will never be more than one account.

**Alternatives considered**:
- `auth.uid() = user_id` column — correct for multi-tenant apps; out of scope here.
- Permissive / disabled RLS — violates Principle V.

**SQL**:
```sql
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage apartments"
  ON apartments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 4. ESLint Flat Config for React

**Decision**: ESLint v9 flat config (`eslint.config.js`) with `eslint-plugin-react` (using
`jsx-runtime` preset for React 17+ automatic transform) and `eslint-plugin-react-hooks`.

**Rationale**: ESLint v9 deprecates `.eslintrc`; Vite 5 scaffolds flat config by default.
`jsx-runtime` preset suppresses the `react/react-in-jsx-scope` false positive. The hooks plugin
enforces the Rules of Hooks and exhaustive-deps.

**Alternatives considered**:
- Legacy `.eslintrc.json` — deprecated, will be removed in future ESLint.
- Prettier integration — orthogonal concern; add separately if desired.

---

## 5. Styling: Tailwind CSS v4

**Decision**: Tailwind CSS v4 (CSS-first configuration).

**Rationale**: Tailwind v4 targets modern browsers (Safari 16.4+, Chrome 111+) which aligns
with a PWA that will be self-hosted for a single owner. Build performance is significantly
faster than v3 (~8× incremental builds). CSS-first config removes the need for a separate
`tailwind.config.js`.

**Alternatives considered**:
- Tailwind v3 — only warranted for legacy browser support; not needed here.
- CSS Modules — valid but more verbose for utility-heavy UIs.

---

## 6. Supabase Auth Integration

**Decision**: Use Supabase built-in email/password auth. The frontend wraps all protected
routes in an auth guard component that checks `supabase.auth.getSession()` and redirects to
a login page if no session exists. Session state is managed via `supabase.auth.onAuthStateChange`.

**Rationale**: Matches Principle V exactly — no custom JWT logic, no additional libraries.
The Supabase client handles token refresh automatically.

**Alternatives considered**:
- OAuth providers (Google, GitHub) — optional per constitution, not needed for a personal tool.
- Custom session management — explicitly forbidden by Principle V.

---

## 7. Supabase Edge Functions for Mutations

**Decision**: Implement all write operations (create, update, delete, set-status) as individual
Supabase Edge Functions (Deno/TypeScript). Read operations remain as direct Supabase client
calls. Each function is created with `supabase functions new <name>`.

**Rationale**: FR-011 requires all mutations to go through server-side functions. FR-012 requires
server-side validation independent of the client. Edge Functions are the Supabase-native,
zero-infrastructure way to achieve this — no separate server to maintain, deploy, or scale.

**Auth pattern inside Edge Functions**:
1. The Supabase JS client automatically forwards the user's session JWT in the
   `Authorization: Bearer <jwt>` header when calling `supabase.functions.invoke()`.
2. Each Edge Function creates a per-request Supabase client using the user's JWT
   (forwarded from the `Authorization` header), so RLS still applies. The service-role
   key is NOT needed and NOT used.
3. If the JWT is missing or invalid, Supabase returns 401 before the function body runs.

**Pattern (each Edge Function)**:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  // validate input, perform DB operation, return structured response
})
```

**Why user JWT (not service-role)**:
- Using the user's JWT preserves RLS enforcement at the database level (defense in depth).
- Avoids the need for a service-role secret in Edge Function environment.
- Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` are needed — both are automatically injected
  by Supabase into the Edge Function environment.

**Invocation from React**:
```js
const { data, error } = await supabase.functions.invoke('apartments-create', {
  body: { name, address }
})
```

**Error response format** (consistent across all functions):
```json
{ "error": "<human-readable message>" }
```

**Alternatives considered**:
- Single `apartments` function with routing by HTTP method — saves one directory but makes
  each function harder to read and test independently. Rejected: YAGNI on shared routing.
- PostgreSQL functions (RPC via `supabase.rpc()`) — can enforce validation via CHECK constraints
  and triggers, but cannot return structured HTTP error messages (FR-013) nor be independently
  deployed/updated. Rejected for failing FR-013.
- Direct Supabase client mutations — cannot satisfy FR-011/FR-012 regardless of RLS config.
  Rejected per spec requirements.
