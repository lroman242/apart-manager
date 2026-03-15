# Feature Specification: Tariffs Management

**Feature Branch**: `002-tariffs-management`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "add Tarifs management page per appartment, where I can add new 'services' & 'resources' with price. I could be fixed price per service or price per used volume of resources."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Services for an Apartment (Priority: P1)

The owner navigates to a specific apartment's tariffs page and adds a **service** — a fixed-price
item charged at a flat rate regardless of usage (e.g., building maintenance fee, internet).
They can also edit the price or name of an existing service, and remove a service no longer
applicable to the apartment.

**Why this priority**: Fixed-price services are the simplest and most common tariff type.
Without this, the tariffs page has no value at all — it is the foundation for billing records.

**Independent Test**: Navigate to any apartment → open Tariffs → add a service with a name
and fixed price → it appears in the list. Edit its price → list reflects the new value.
Delete it → it disappears. No other apartment's tariffs are affected.

**Acceptance Scenarios**:

1. **Given** an apartment with no tariffs, **When** the owner adds a service named "Internet" with price 250, **Then** the service appears in the tariffs list with name "Internet" and price 250.
2. **Given** a service exists, **When** the owner edits its price to 300, **Then** the list shows the updated price 300.
3. **Given** a service exists, **When** the owner deletes it, **Then** it no longer appears in the list.
4. **Given** the owner submits a service with an empty name, **When** the form is submitted, **Then** an inline error is shown and nothing is saved.
5. **Given** apartment A and apartment B, **When** a service is added to apartment A, **Then** apartment B's tariffs list is unchanged.

---

### User Story 2 - Manage Resources for an Apartment (Priority: P2)

The owner adds a **resource** — an item priced per unit of consumption (e.g., electricity per
kWh, water per m³, gas per m³). Each resource has a name, unit label, and price per unit.
They can edit or delete resources the same way as services.

**Why this priority**: Resource-based tariffs complete the pricing model. Services alone cover
flat fees; resources are needed to calculate usage-based charges. Both types together represent
the full tariff set for real-world apartment billing.

**Independent Test**: Add a resource "Електроенергія" with unit "кВт·год" and price per unit
4.50 → appears in the list with correct type, unit, and price. Edit price → reflected. Delete → gone.

**Acceptance Scenarios**:

1. **Given** an apartment's tariffs page, **When** the owner adds a resource "Електроенергія" with unit "кВт·год" and price per unit 4.50, **Then** the resource appears in the list with name, unit, and price per unit correctly displayed.
2. **Given** a resource exists, **When** the owner edits the price per unit, **Then** the updated price is shown.
3. **Given** a resource exists, **When** the owner deletes it, **Then** it no longer appears.
4. **Given** the owner submits a resource without a unit label, **When** the form is submitted, **Then** an inline error is shown and nothing is saved.

---

### User Story 3 - Navigate to Tariffs from Apartment List (Priority: P3)

From the main apartments list, the owner can open the tariffs page for any apartment. The
tariffs page clearly shows which apartment it belongs to and allows returning to the apartment
list.

**Why this priority**: Navigation is required for the feature to be accessible, but the core
tariffs functionality (US1 + US2) can be built and tested in isolation first.

**Independent Test**: From the apartment list, click the tariffs action for an apartment →
tariffs page opens showing the correct apartment name. Click back → return to apartment list.

**Acceptance Scenarios**:

1. **Given** the apartment list, **When** the owner taps "Тарифи" on an apartment card, **Then** the tariffs page for that apartment opens.
2. **Given** the tariffs page is open, **When** the owner taps the back/return button, **Then** they return to the apartment list.
3. **Given** the tariffs page, **When** the owner views it, **Then** the apartment name is clearly shown as the page heading.

---

### Edge Cases

- What happens when an apartment has no tariffs yet? → Empty state shown with prompts to add the first service or resource.
- What happens when the owner submits a tariff with a negative price? → Inline validation error; not saved.
- What happens when the owner submits a price of zero? → Allowed (a service may be temporarily free).
- What happens when two tariffs have the same name? → Allowed; names are not required to be unique within an apartment.
- What happens when the owner deletes the only tariff? → The list returns to the empty state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a tariffs management page scoped to a single apartment.
- **FR-002**: Users MUST be able to add a **service** with a name and a fixed price.
- **FR-003**: Users MUST be able to add a **resource** with a name, a unit label, and a price per unit.
- **FR-004**: Users MUST be able to edit the name and price of any existing tariff (service or resource).
- **FR-005**: Users MUST be able to delete any existing tariff.
- **FR-006**: The tariffs page MUST display all tariffs for the selected apartment, with services and resources visually distinguished from each other.
- **FR-007**: The system MUST validate that name is non-empty and price is a non-negative number before saving; invalid submissions MUST show inline errors without saving.
- **FR-008**: Tariffs MUST be scoped per apartment — changes to one apartment's tariffs MUST NOT affect any other apartment.
- **FR-009**: The apartment list MUST provide navigation to the tariffs page for each apartment.
- **FR-010**: The tariffs page MUST display the apartment name as context and provide a way to return to the apartment list.
- **FR-011**: For resources, the unit label MUST be required and displayed alongside the price per unit (e.g., "4.50 / кВт·год").

### Key Entities

- **Tariff**: Belongs to one apartment. Has a name and a type (service or resource). A service has a single fixed price. A resource has a price per unit and a unit label (free-text, e.g., "кВт·год", "м³").
- **Apartment** (existing): The parent entity. One apartment has zero or more tariffs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner can add, edit, and delete both a service and a resource for an apartment in under 2 minutes total.
- **SC-002**: Tariffs for one apartment are never visible on or affect another apartment's tariffs page.
- **SC-003**: Submitting a tariff with an empty name or invalid price shows an error without creating or modifying any data.
- **SC-004**: The tariffs page renders all existing tariffs for an apartment immediately upon opening, with no manual refresh required.
- **SC-005**: The tariff type (service vs. resource) is visually distinguishable at a glance without opening any detail view.

## Assumptions

- An apartment can have any number of tariffs (no hard limit in scope).
- Tariff names do not need to be unique within an apartment.
- A price of zero is valid (a service may be temporarily free).
- Tariffs are displayed in creation order; no custom sorting is required.
- Tariffs are not shared across apartments; there is no "template tariff" concept in this scope.
- The unit label for resources is a free-text field (no predefined dropdown of units).
- No history or audit trail for tariff changes is required in this feature.
- Delete does not require a separate confirmation dialog (unlike apartment deletion) — a single tap/click is sufficient given low consequence of the action.
