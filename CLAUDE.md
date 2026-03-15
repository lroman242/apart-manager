# apart-manager Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-15

## Active Technologies
- JavaScript (ES2020+), React 18; TypeScript (Deno) for Edge Functions + Vite 5, vite-plugin-pwa, @supabase/supabase-js, Tailwind CSS v4, (001-apartment-management)
- Supabase (PostgreSQL) — `apartments` table with RLS (001-apartment-management)
- Supabase (PostgreSQL) — `tariffs` table with FK to `apartments`, RLS enabled (002-tariffs-management)
- JavaScript (ES2020+), React 18; TypeScript (Deno 1.x) for Edge Functions + Vite 5, vite-plugin-pwa, @supabase/supabase-js v2, Tailwind CSS v4 (003-meter-readings)
- Supabase (PostgreSQL) — new `meter_readings` + `reading_line_items` tables with RLS (003-meter-readings)

- JavaScript (ES2020+), React 18 + Vite 5, vite-plugin-pwa, @supabase/supabase-js, Tailwind CSS v4, (001-apartment-management)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

JavaScript (ES2020+), React 18: Follow standard conventions

## Recent Changes
- 003-meter-readings: Added JavaScript (ES2020+), React 18; TypeScript (Deno 1.x) for Edge Functions + Vite 5, vite-plugin-pwa, @supabase/supabase-js v2, Tailwind CSS v4
- 002-tariffs-management: Added JavaScript (ES2020+), React 18; TypeScript (Deno) for Edge Functions + Vite 5, vite-plugin-pwa, @supabase/supabase-js, Tailwind CSS v4
- 001-apartment-management: Added JavaScript (ES2020+), React 18; TypeScript (Deno) for Edge Functions + Vite 5, vite-plugin-pwa, @supabase/supabase-js, Tailwind CSS v4,


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
