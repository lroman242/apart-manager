# Research: Tariffs Management

**Feature**: 002-tariffs-management
**Date**: 2026-03-15

---

## §1 Data Modelling: Polymorphic Tariff Types

**Decision**: Single `tariffs` table with a `type` column (`'service'` | `'resource'`) and a
nullable `unit` column (only populated for resources).

**Rationale**: Two entity types (service, resource) share 80% of their structure (id,
apartment_id, name, price, created_at). A single table with a discriminator column is
the simplest design (Principle I). The `unit` column is `NULL` for services and a non-empty
string for resources — enforced at the application layer.

**Alternatives considered**:
- Two separate tables (`services`, `resources`): more schema complexity, two RLS policies,
  two hooks — rejected as over-engineering for this scope.
- JSONB `meta` column for type-specific fields: less readable, harder to validate — rejected.

---

## §2 Mutation Architecture: Edge Functions vs. Direct Client

**Decision**: Mutations (create, update, delete) go through Supabase Edge Functions, mirroring
the pattern established in feature 001. Reads use the direct Supabase client.

**Rationale**: Feature 001 established Edge Functions as the mutation layer for server-side
validation and a consistent security boundary. Diverging from this pattern for tariffs would
introduce inconsistency in the codebase without simplification benefit. The constitution's
Principle I exception (justified complexity) already covers this architecture.

**Alternatives considered**:
- Direct Supabase client for all operations: simpler per Principle I, but inconsistent with
  the existing pattern; would require revisiting if server-side validation is later needed.
- Shared/generic mutation Edge Function: over-engineered; YAGNI.

**Functions required**:
- `tariffs-create`: validates apartment_id, name, type, price, unit (required for resources)
- `tariffs-update`: validates id, name, price, unit
- `tariffs-delete`: validates id, verifies existence, deletes

---

## §3 Routing: Tariffs Page Navigation

**Decision**: Tariffs page is routed at `/apartments/:id/tariffs`, with the apartment ID
available via React Router `useParams`.

**Rationale**: The tariff scope is per-apartment. A nested URL makes the relationship
explicit and supports direct navigation / bookmarking. React Router is already in the
project.

**Alternatives considered**:
- Modal/drawer within the apartment list page: hides the tariffs behind UX layers, makes
  deep-linking impossible — rejected.
- Query param `?apartment=123`: less idiomatic for a full page — rejected.

---

## §4 RLS Policy

**Decision**: Same pattern as `apartments` — `FOR ALL TO authenticated USING (true) WITH CHECK (true)`.

**Rationale**: This is a single-owner personal tool. All authenticated users are the owner.
Row-level user isolation is not required. The pattern is already established and reviewed.

---

## §5 Price Storage

**Decision**: `numeric(10,2)` — stores up to 8 digits before decimal, 2 after.

**Rationale**: Monetary values should not be stored as floating-point to avoid rounding errors.
`numeric(10,2)` covers realistic tariff prices (up to 99,999,999.99) with cent precision.

---

## §6 Type Immutability

**Decision**: The `type` field (service vs. resource) is set at creation and is NOT editable.

**Rationale**: Changing type would require adding/removing the `unit` field mid-edit, creating
confusing UX. If the user needs a different type, they delete and recreate. Simpler forms,
simpler validation.
