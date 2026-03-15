# Feature Specification: Utility Payments Management

**Feature Branch**: `003-meter-readings`
**Created**: 2026-03-15
**Status**: Complete
**Input**: User description: "add utility payments management feature to each appartment. Add button to the top right corner of appartment card. If an appartment has no utility payments data add ability to add initial utility payments. utility payments should be added once a month. on the initial readings need to add start date. the next reading will be start date + 1 month from the previous. It should be a date range. Need to specify qty for each tariff - need to enter value of consumed resources for each resource and qty = 1 by default for each service, but could be changed. There should be ability to change price as well. On the appartment page should be listed all added utility payments (months) in desc order."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Initial Utility Payment Entry (Priority: P1)

An owner opens an apartment card that has no utility payments yet. They click the utility payments button in the top-right corner of the card. Because no readings exist, they are prompted to enter an initial reading: they choose a start date (the beginning of the first billing month), then fill in consumed quantities for each resource tariff and confirm or adjust quantities for each service tariff. They may also override the default tariff price for any line item. After saving, the apartment's utility payments page shows the first billing month entry.

**Why this priority**: Without the ability to create the first reading, no subsequent readings can be added. This is the entry point for the entire feature.

**Independent Test**: Navigate to an apartment with no readings → click the utility payments button → enter start date 2026-01-01, set electricity consumption to 120 kWh, leave internet qty at 1 → save → readings list shows one entry for January 2026.

**Acceptance Scenarios**:

1. **Given** an apartment has no utility payments, **When** the owner opens the utility payments view, **Then** a prompt to create the first reading is shown with a start date field and one line per active tariff.
2. **Given** the initial reading form is open, **When** the owner saves without filling resource quantities, **Then** validation prevents saving and shows an error for each empty resource quantity.
3. **Given** the initial reading form is open, **When** the owner enters all required data and saves, **Then** the reading is saved and appears as the first entry in the readings list for that apartment.
4. **Given** the owner overrides the price for a tariff line, **When** they save, **Then** the overridden price is recorded for that specific reading only — the base tariff is unchanged.

---

### User Story 2 — Add Monthly Utility Payment (Priority: P2)

An owner opens the utility payments page for an apartment that already has at least one reading. The system automatically calculates the next billing period (previous period end date + 1 day as start, start + 1 calendar month − 1 day as end) and opens the new reading form pre-filled with that locked date range. The owner enters consumption values and saves.

**Why this priority**: The recurring monthly workflow is the core operational task owners perform every month.

**Independent Test**: An apartment has a reading for 2026-01-01 to 2026-01-31 → click "Додати показники" → form shows date range 2026-02-01 to 2026-02-28 pre-filled and read-only → enter electricity 95 → save → list shows February entry above January.

**Acceptance Scenarios**:

1. **Given** the last reading ended on 2026-01-31, **When** the owner adds a new reading, **Then** the form is pre-filled with date range 2026-02-01 – 2026-02-28 and that range is not editable.
2. **Given** a service tariff exists, **When** the owner opens a new reading form, **Then** the service quantity defaults to 1 and can be changed.
3. **Given** a resource tariff exists, **When** the owner opens a new reading form, **Then** the resource quantity is empty and must be filled before saving.
4. **Given** the owner saves a valid reading, **Then** the readings list updates immediately with the new entry at the top.

---

### User Story 3 — View Readings List (Priority: P3)

From the apartment card the owner navigates to the utility payments page and sees all monthly readings listed newest-first. Each entry shows the billing period, per-tariff line items, and total cost for that month.

**Why this priority**: Historical visibility lets owners verify data and track monthly costs over time.

**Independent Test**: An apartment has 3 readings (Jan, Feb, Mar 2026) → open utility payments page → entries appear: March, February, January. Each entry shows tariff name, qty, unit price, subtotal, and total.

**Acceptance Scenarios**:

1. **Given** an apartment has multiple readings, **When** the owner opens the readings page, **Then** entries appear newest first.
2. **Given** the list is shown, **When** the owner views an entry, **Then** each entry displays the billing period dates, per-tariff line items (name, qty, unit, price per unit, subtotal), and total cost.
3. **Given** an apartment has no readings, **When** the owner opens the readings page, **Then** an empty state is shown with a prompt to add the first reading.

---

### Edge Cases

- What happens when a tariff is added after some readings already exist? New tariffs appear on subsequent readings only; existing readings are not retroactively modified.
- What happens when a tariff is deleted but readings reference it? Reading line items preserve a snapshot of the tariff name and price at the time of recording and remain unchanged.
- What happens if the owner tries to add a second reading for the same billing month? The system prevents duplicate periods — only one reading per billing month per apartment is allowed.
- What happens if an apartment has no active tariffs when adding a reading? The form can be saved with no line items (recording the period with zero cost).
- How does the system handle months with varying lengths (e.g. February)? End date is always start date + 1 calendar month − 1 day, using calendar-accurate arithmetic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each apartment card MUST display a utility payments button in the top-right corner.
- **FR-002**: The utility payments button MUST navigate to the apartment's utility payments page.
- **FR-003**: If an apartment has no readings, the utility payments page MUST display a prompt to create the first reading, including a start date selector.
- **FR-004**: For the initial reading, the end date MUST be automatically calculated as start date + 1 calendar month − 1 day.
- **FR-005**: For all subsequent readings the date range MUST be auto-calculated from the previous reading's end date and MUST NOT be editable by the owner.
- **FR-006**: Each reading form MUST list all currently active tariffs for the apartment as line items.
- **FR-007**: For resource tariffs the quantity field MUST be empty by default and MUST be required before saving.
- **FR-008**: For service tariffs the quantity field MUST default to 1 and MUST be editable.
- **FR-009**: Each line item MUST allow the owner to override the unit price; the override applies only to that reading and does not modify the base tariff.
- **FR-010**: The system MUST prevent saving a reading if any resource tariff quantity is missing.
- **FR-011**: The system MUST prevent adding a second reading for the same billing period on the same apartment.
- **FR-012**: The utility payments list MUST display all readings for an apartment in descending order by billing period start date.
- **FR-013**: Each list entry MUST show: billing period (start – end), per-tariff line items (name, qty, unit if resource, unit price, subtotal), and total cost.
- **FR-014**: Deleting or editing a base tariff MUST NOT modify existing reading line items; snapshots are preserved.

### Key Entities

- **MeterReading**: One billing month for an apartment. Has a billing period start date, billing period end date, and a list of line items. Linked to one apartment.
- **ReadingLineItem**: One tariff line within a reading. Captures a snapshot of: tariff name, tariff type (service/resource), unit label (for resources), quantity entered by owner, unit price (default from tariff, overridable), and computed subtotal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner can record a complete monthly reading in under 2 minutes.
- **SC-002**: Date ranges for all subsequent readings are always auto-calculated — zero manual date entry required or possible.
- **SC-003**: 100% of reading entries display a total cost equal to the sum of their line item subtotals.
- **SC-004**: The system enforces one reading per billing month per apartment — duplicate period entries are impossible.
- **SC-005**: Historical reading snapshots are never altered when base tariffs change, maintaining full cost audit accuracy.

## Assumptions

- Only one reading per calendar month per apartment is valid.
- The billing period for the initial reading starts on the owner-chosen date and ends exactly one calendar month later minus one day.
- All tariffs active for the apartment at the moment of reading creation are included as line items; tariffs added later are not backfilled into past readings.
- Readings are append-only; editing or deleting an existing reading is out of scope for this feature.
- The owner is the sole authenticated user; no role-based access changes are needed.
- Line item subtotals are calculated as quantity × unit price and stored as a fixed snapshot, not recomputed from the base tariff later.
