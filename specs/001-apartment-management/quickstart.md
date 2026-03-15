# Quickstart: Apartment Management

**Feature**: `001-apartment-management`
**Date**: 2026-03-15

This guide covers how to set up and run the Apart Manager app locally, including the
Supabase project setup, database migration, and Edge Function development workflow.

---

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project (free tier is sufficient)
- Supabase CLI (`npm install -g supabase` or via [official docs](https://supabase.com/docs/guides/cli))

---

## 1. Bootstrap the Vite React project

```bash
npm create vite@latest apart-manager -- --template react
cd apart-manager
npm install
```

Install dependencies:

```bash
npm install @supabase/supabase-js
npm install -D vite-plugin-pwa @vitejs/plugin-react
npm install -D tailwindcss @tailwindcss/vite
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks @eslint/js globals
```

---

## 2. Configure environment variables

Create `.env.local` in the project root (this file is gitignored):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Find these values in your Supabase project under **Settings → API**.

> The service-role key is NOT needed in `.env.local`. It is never used client-side.

---

## 3. Apply the database migration

### Option A: Supabase Dashboard (manual)

1. Open your Supabase project → **SQL Editor**.
2. Paste and run the contents of
   `supabase/migrations/20260315110937_initial-migration.sql`.

### Option B: Supabase CLI

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

---

## 4. Set up Supabase Auth

1. In the Supabase dashboard → **Authentication → Settings**: ensure email/password
   sign-in is enabled (it is by default).
2. Under **Authentication → Users**, create your owner account manually.
3. No email confirmation is required for a personal internal tool — you can disable it
   under **Auth → Email Templates → Confirm signup**.

---

## 5. Create and deploy Edge Functions

Each mutation operation has a dedicated Edge Function. Create them with the Supabase CLI:

```bash
supabase functions new apartments-create
supabase functions new apartments-update
supabase functions new apartments-delete
supabase functions new apartments-set-status
```

This creates `supabase/functions/<name>/index.ts` for each function.

### Develop locally

Start the local Supabase stack and serve functions:

```bash
supabase start
supabase functions serve
```

Functions are available at `http://localhost:54321/functions/v1/<name>`.

### Deploy to production

```bash
supabase functions deploy apartments-create
supabase functions deploy apartments-update
supabase functions deploy apartments-delete
supabase functions deploy apartments-set-status
```

> No secrets need to be set manually — `SUPABASE_URL` and `SUPABASE_ANON_KEY` are
> automatically available inside every Edge Function's Deno environment.

---

## 6. Run the app

```bash
npm run dev
```

Navigate to `http://localhost:5173`. You should see the login page. Sign in with the
credentials you created in step 4.

---

## 7. Validate the feature

After signing in:

1. **Empty state**: The apartments list shows an empty-state message with an "Add Apartment"
   button.
2. **Add**: Click "Add Apartment", enter a name, submit → apartment appears in the list
   (routed through `apartments-create` Edge Function).
3. **Edit**: Click edit on the apartment, change the name, save → change reflects immediately
   (routed through `apartments-update` Edge Function).
4. **On Hold**: Click "Put on hold" → apartment shows the "On Hold" badge
   (routed through `apartments-set-status` Edge Function with `status: "on_hold"`).
5. **Unhold**: Click "Remove hold" → badge disappears
   (routed through `apartments-set-status` Edge Function with `status: "active"`).
6. **Delete**: Click delete, confirm → apartment is removed
   (routed through `apartments-delete` Edge Function).
7. **Server-side validation**: Try submitting an empty name directly to the Edge Function
   endpoint — it should return `400 { "error": "name is required" }` with no record created.

---

## 8. Verify linting passes

```bash
npm run lint
```

Zero errors required before any code is considered complete (Principle II).
