# Research: Meter Readings Management

**Branch**: `003-meter-readings` | **Date**: 2026-03-15

---

## Decision 1: Calendar-Accurate Month Arithmetic

**Decision**: Use the JavaScript `Date` constructor idiom `new Date(year, month + 1, 0)` to compute the last day of any month (automatically handles February, 30/31-day months, and leap years).

**Rationale**: Native Date handles all edge cases. Given start date `period_start`:
- `period_end = new Date(startYear, startMonth + 1, 0)` → last day of the same calendar month as start.
- For subsequent readings: `nextStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate() + 1)`, then `nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, 0)`.

**Alternatives considered**: `date-fns` library (`endOfMonth`, `addMonths`) — rejected because adding a dependency for two arithmetic operations violates Principle I.

---

## Decision 2: Data Model — Two-Table Design

**Decision**: `meter_readings` (one row per billing month per apartment) + `reading_line_items` (one row per tariff line within a reading). Foreign key `reading_line_items.reading_id → meter_readings.id ON DELETE CASCADE`.

**Rationale**: Normalized design matches the existing `apartments`/`tariffs` pattern. Line items are stored as snapshots (name, type, unit, price copied at creation time) so base-tariff changes never corrupt history (spec FR-014 / Constitution III).

**Alternatives considered**: Storing line items as a JSONB column on `meter_readings` — simpler writes but harder to query individual line items and less consistent with project conventions.

---

## Decision 3: Single Edge Function (`readings-create`)

**Decision**: One `readings-create` Edge Function handles the full creation of a reading and all its line items in a single transaction-like operation. Reads are performed directly via the Supabase JS client.

**Rationale**: All mutations in the project use Edge Functions for auth + validation. Creating a reading requires validating multiple line items atomically — a single function call is cleaner than multiple client-side inserts. Reads are simple SELECT queries — no Edge Function overhead needed (same pattern as tariffs).

**Alternatives considered**: Multiple separate Edge Functions for reading + line items — more moving parts, violates Principle I.

---

## Decision 4: Duplicate Period Prevention

**Decision**: A `UNIQUE (apartment_id, period_start)` constraint on `meter_readings`. The Edge Function also checks for an existing row before inserting and returns a descriptive 409 error.

**Rationale**: Database-level constraint is the definitive guard. UI-level check in the Edge Function gives a user-friendly error message before the DB constraint fires.

---

## Decision 5: Date Storage Format

**Decision**: Store `period_start` and `period_end` as PostgreSQL `date` type (no timezone). The client sends ISO 8601 date strings (`YYYY-MM-DD`).

**Rationale**: Billing periods are calendar-relative (not time-relative). Using `date` type avoids timezone shift bugs when displaying month boundaries.

---

## Decision 6: Subtotal Storage

**Decision**: Store `subtotal` as a `numeric(12,2)` column explicitly calculated and supplied by the Edge Function (`quantity × unit_price`), not a generated column.

**Rationale**: PostgreSQL `GENERATED ALWAYS AS … STORED` requires both operands to be the same numeric precision; mixing `numeric(10,3)` qty with `numeric(10,2)` price is supported but adds complexity. Explicit calculation in application code is simpler and consistent with the existing project pattern. Subtotals are immutable once stored (append-only).

---

## Decision 7: Meter Readings Button Placement

**Decision**: Add a button labeled "Показники" in the top-right corner of the apartment card, styled consistently with existing card buttons but visually distinct (e.g., positioned absolutely or via flex layout adjustment) to match the spec requirement for top-right placement.

**Rationale**: Spec explicitly requires top-right placement. Existing card layout uses a flex row for card actions at the bottom; a separate top-right element requires adjusting the card's header area flex layout.
