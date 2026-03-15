# Feature Specification: Apartment Management

**Feature Branch**: `001-apartment-management`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "first create a functionality related to apartments management (CRUD + put on hold & unhold). Database schema: ID int, Name string, Address optional string, CreatedAt. Backend operations implemented as server-side functions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Add Apartments (Priority: P1)

The owner opens the app and sees a list of all their apartments. They can add a new apartment
by providing its name and an optional address. The new apartment immediately appears in the list.

**Why this priority**: Without the ability to view and create apartments, no other feature in
the app has anything to operate on. This is the foundational entry point for the entire product.

**Independent Test**: Can be fully tested by navigating to the apartments list, adding a new
apartment, and verifying it appears in the list with the correct name, address, and creation date.

**Acceptance Scenarios**:

1. **Given** the apartments list is empty, **When** the owner visits the app, **Then** a clear
   empty-state message is shown with a prompt to add the first apartment.
2. **Given** the apartments list has entries, **When** the owner visits the app, **Then** all
   apartments are displayed with their name, address (if set), status, and creation date.
3. **Given** the owner clicks "Add Apartment", **When** they submit a valid name (address is
   optional), **Then** the apartment is saved and immediately visible in the list.
4. **Given** the owner attempts to add an apartment, **When** they submit an empty name,
   **Then** an inline validation error is shown and the apartment is not saved.

---

### User Story 2 - Edit and Delete an Apartment (Priority: P2)

The owner can update an apartment's name or address, or permanently remove an apartment they
no longer own.

**Why this priority**: Corrections and removals are essential housekeeping. Without them, bad
data accumulates. Lower priority than creation because the app is still usable with minor
data errors.

**Independent Test**: Can be fully tested by editing an existing apartment's details and
verifying the changes persist, then deleting a different apartment and confirming it no longer
appears in the list.

**Acceptance Scenarios**:

1. **Given** an apartment exists, **When** the owner edits its name or address and saves,
   **Then** the updated values are reflected immediately in the list.
2. **Given** an apartment exists, **When** the owner clears the address field and saves,
   **Then** the apartment is saved with no address.
3. **Given** an apartment exists, **When** the owner chooses to delete it and confirms the
   action, **Then** the apartment is permanently removed from the list.
4. **Given** the owner initiates a delete, **When** the confirmation dialog appears,
   **Then** they must explicitly confirm before deletion proceeds (no accidental deletes).

---

### User Story 3 - Put Apartment On Hold / Unhold (Priority: P3)

The owner can mark an apartment as "on hold" to indicate it is temporarily inactive
(e.g., vacant, under renovation). A held apartment remains visible in the list but is
visually distinguished and excluded from active payment workflows. The owner can remove
the hold at any time to make the apartment active again.

**Why this priority**: This is a status management convenience feature. The app delivers
core value without it; it is added to support real-world scenarios where apartments cycle
in and out of active use.

**Independent Test**: Can be fully tested by putting an active apartment on hold, verifying
its visual distinction in the list, then unholding it and verifying it returns to active
appearance.

**Acceptance Scenarios**:

1. **Given** an active apartment, **When** the owner selects "Put on hold", **Then** the
   apartment's status changes to "On Hold" and it is visually distinguished in the list
   (e.g., dimmed or tagged).
2. **Given** an on-hold apartment, **When** the owner selects "Remove hold", **Then** the
   apartment's status returns to "Active" and its normal appearance is restored.
3. **Given** an on-hold apartment, **When** the owner views the list, **Then** the hold
   status is clearly communicated without hiding the apartment.
4. **Given** an on-hold apartment, **When** the owner attempts to enter meter readings for
   it (future feature), **Then** the system prevents the action with an explanatory message.

---

### Edge Cases

- What happens when the owner tries to delete the only apartment? The system MUST allow it;
  an empty list is a valid state.
- What happens when two apartments have the same name? Names are not required to be unique;
  duplicates are allowed (the owner distinguishes them by address or context).
- What happens if the owner navigates away mid-edit without saving? Changes MUST be discarded
  and the original values retained (no auto-save).
- What happens when the list grows large? The list MUST be scrollable; no pagination is
  required (assumption: personal use, likely under 50 apartments).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all apartments in a single scrollable list, ordered by
  creation date descending (newest first).
- **FR-002**: System MUST allow the owner to create an apartment with a required Name and an
  optional Address.
- **FR-003**: System MUST automatically record the creation timestamp when an apartment is added.
- **FR-004**: System MUST allow the owner to edit the Name and Address of any existing apartment.
- **FR-005**: System MUST allow the owner to delete any apartment after explicit confirmation.
- **FR-006**: System MUST allow the owner to put any active apartment "on hold".
- **FR-007**: System MUST allow the owner to remove the hold from any on-hold apartment,
  returning it to active status.
- **FR-008**: System MUST visually distinguish on-hold apartments from active ones in the list.
- **FR-009**: System MUST prevent submission of an apartment with an empty name and display
  an inline validation message.
- **FR-010**: System MUST require explicit confirmation before permanently deleting an apartment.
- **FR-011**: System MUST process all create, edit, delete, hold, and unhold operations through
  server-side functions — no data mutation may originate directly from the client to the database.
- **FR-012**: System MUST perform server-side validation of apartment data (e.g. required name,
  valid status transitions) independently of any client-side checks, so that bypassing the UI
  does not allow invalid data to be persisted.
- **FR-013**: Server-side functions MUST return structured error responses that the client can
  display as user-friendly messages.

### Key Entities

- **Apartment**: Represents a property owned by the user. Attributes: unique numeric identifier
  (auto-assigned), name (required text), address (optional text), status (active or on hold),
  creation timestamp. Supports lifecycle transitions: active ↔ on hold, and permanent deletion.

## Assumptions

- A single owner uses the app; no multi-tenancy or per-user apartment scoping is needed.
- Apartment names are not required to be unique.
- "On hold" status has no expiry — it persists until manually removed by the owner.
- The list will remain small enough (under 50 items) that search, filter, and pagination
  are out of scope for this feature.
- Deleting an apartment that has future-feature data (meter readings) will be addressed
  when those features are built; for now, deletion is unconditional after confirmation.
- Each CRUD and status-change operation has a dedicated server-side function; no batch or
  bulk operations are required for this feature.
- Server-side functions enforce authentication — unauthenticated callers receive an error
  and no data is returned or mutated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can add a new apartment in under 30 seconds from landing on the
  apartments page.
- **SC-002**: All apartments are visible in a scrollable list with no additional navigation
  or pagination interaction required.
- **SC-003**: Editing an apartment's details and saving completes in under 20 seconds.
- **SC-004**: Putting an apartment on hold or removing a hold requires no more than 2 clicks
  and takes effect immediately without a full page reload.
- **SC-005**: Accidental deletion is impossible — no apartment can be permanently deleted
  without passing through a confirmation step.
- **SC-006**: Invalid data (e.g., empty apartment name) submitted directly to the backend —
  bypassing the UI — is rejected with a descriptive error; no invalid record is persisted.
- **SC-007**: All data operations complete within 2 seconds under normal network conditions
  as perceived by the owner.
