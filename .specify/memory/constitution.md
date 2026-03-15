<!--
SYNC IMPACT REPORT
==================
Version change: 2.0.0 → 2.1.0 (MINOR — Principle VI added)
Modified principles: none
Added sections:
  - VI. Ukrainian as the UI Language
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md  ✅ Constitution Check is generic; compatible
  - .specify/templates/spec-template.md  ✅ no mandatory sections added or removed
  - .specify/templates/tasks-template.md ✅ no new task categories required
Deferred TODOs: none
-->

# Apart Manager Constitution

## Core Principles

### I. Simplicity First

This is an internal personal tool. All design and implementation decisions MUST favor the
simplest solution that satisfies requirements. YAGNI applies strictly — no feature, abstraction,
or infrastructure element may be added speculatively.

- Complexity MUST be justified with a concrete current requirement.
- No generic frameworks, plugin systems, or extensibility layers unless actively needed.
- Three similar inline expressions are preferred over a premature shared utility.

**Rationale**: Over-engineering an internal tool wastes time and creates maintenance burden
with zero user benefit.

### II. React + PWA Standards

The frontend MUST be a Progressive Web App built with React.

- The app MUST be installable (valid `manifest.json`, service worker registration).
- Components MUST be functional (hooks-based); class components are not permitted.
- ESLint with a React-appropriate ruleset (e.g., `eslint-plugin-react`,
  `eslint-plugin-react-hooks`) MUST be configured and MUST pass with zero errors before
  any code is merged.
- Linting MUST be executable via a single `npm run lint` (or equivalent) command.

**Rationale**: PWA enables offline-capable home-screen installation. Consistent linting
prevents common React anti-patterns (stale closures, missing deps).

### III. Data Integrity — Immutable History

Meter readings are financial records and MUST be treated as append-only history.

- Only the **most recent** reading entry for a given apartment MAY be edited or deleted.
- All prior readings are immutable once a newer reading exists.
- Initial readings entered when adding an apartment follow the same rules once a
  subsequent reading is added.
- The UI MUST make it visually clear which entry is editable.

**Rationale**: Editing historical readings would corrupt past payment calculations and
create audit inconsistencies.

### IV. Supabase as the Single Source of Truth

All persistent state lives in Supabase (PostgreSQL). No client-side persistence
(localStorage, IndexedDB) may duplicate or shadow database state.

- Database schema changes MUST be applied via Supabase migrations (SQL files tracked in
  version control), not ad-hoc SQL.
- The React frontend communicates with Supabase exclusively via the `@supabase/supabase-js`
  client; no custom backend server is required or permitted.
- Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) MUST be used for
  all Supabase credentials; no hardcoding.

**Rationale**: Keeping one authoritative data store avoids sync bugs and simplifies the
deployment topology (static frontend + managed database).

### V. Security via Supabase Auth

Access to the application MUST be protected using Supabase Auth.

- Supabase Auth MUST be used for user authentication (email/password login is sufficient;
  OAuth providers are optional and not required).
- All Supabase tables MUST have Row Level Security (RLS) enabled; permissive or open
  policies are not permitted.
- The frontend MUST enforce an authenticated session before rendering any protected
  content; unauthenticated users MUST be redirected to the login page.
- No custom auth server, JWT signing logic, or session management code is permitted —
  all auth state is managed by `@supabase/supabase-js` and Supabase's built-in auth.
- Supabase service-role keys MUST NOT be used in the frontend; only the `anon` key is
  permitted client-side.
- Auth credentials and Supabase keys MUST NOT be committed to version control.

**Rationale**: Supabase Auth provides a robust, maintained auth layer without requiring a
custom backend, while RLS ensures data is protected at the database level regardless of
client-side logic.

### VI. Ukrainian as the UI Language

All user-facing text in the application MUST be written in Ukrainian.

- Labels, buttons, headings, error messages, placeholders, tooltips, and any other UI
  copy MUST be in Ukrainian.
- Mixed-language UI is not permitted; English MAY appear only in developer-facing
  contexts (code comments, CLI output, logs) that are not visible to end users.
- A dedicated i18n framework is NOT required — hardcoded Ukrainian strings are sufficient
  for this single-language internal tool.

**Rationale**: The app is used by Ukrainian speakers; native-language UI eliminates
cognitive friction and avoids confusing mixed-language interfaces.

## Technology Stack

| Layer | Choice |
|-------|--------|
| Frontend framework | React (latest stable) |
| Build tool | Vite |
| PWA support | `vite-plugin-pwa` |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (built-in) |
| Supabase client | `@supabase/supabase-js` |
| Linter | ESLint + `eslint-plugin-react` + `eslint-plugin-react-hooks` |
| Styling | CSS Modules or Tailwind CSS (project choice at plan time) |
| Hosting | Any static host (no Basic Auth requirement) |
| UI language | Ukrainian |

All technology choices outside this table MUST be the simplest option available (Principle I).

## Development Workflow

- All database schema changes tracked as SQL migration files under `supabase/migrations/`.
- RLS policies MUST be included in migration files and reviewed as part of any schema change.
- `npm run lint` MUST pass before considering any task complete.
- Features are sliced by user story; each story MUST be independently testable after its
  phase is complete.
- Secrets (Supabase keys, auth credentials) MUST be managed via `.env` files excluded
  from git via `.gitignore`.
- All new UI copy MUST be written in Ukrainian (Principle VI); English strings in UI
  components are a linting/review violation.

## Governance

This constitution supersedes all other practices, conventions, or ad-hoc decisions for the
Apart Manager project. Any amendment requires:

1. A documented reason for the change.
2. A version bump following semantic versioning:
   - **MAJOR**: backward-incompatible governance change or principle removal/redefinition.
   - **MINOR**: new principle or section added, or material expansion of guidance.
   - **PATCH**: clarifications, wording, or non-semantic refinements.
3. Update of `LAST_AMENDED_DATE`.
4. Consistency check across all `.specify/templates/` files.

All feature plans and tasks MUST pass the Constitution Check gates defined in
`plan-template.md` before implementation begins.

**Version**: 2.1.0 | **Ratified**: 2026-03-15 | **Last Amended**: 2026-03-15
