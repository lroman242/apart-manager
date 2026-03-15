# Feature Specification: Resource Meter Reading Input

**Feature Branch**: `004-resource-meter-readings`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "add ability to set meter readings for resources on adding utility payment. Once new meter value set it will auto calculate qty by subtracting from previous meter value"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Enter Meter Reading for Auto-Calculated Quantity (Priority: P1)

When adding a utility payment, for each resource tariff the owner can choose to enter the current meter reading value instead of manually typing the consumed quantity. Once a current meter value is entered, the system automatically calculates the consumed quantity as: current meter value − previous meter value. The calculated quantity is displayed immediately so the owner can confirm it before saving.

**Why this priority**: This is the core of the feature. Manually computing consumption from meter readings is error-prone; auto-calculation saves time and eliminates arithmetic mistakes.

**Independent Test**: Apartment has a previous payment where electricity meter ended at 1450. Open new payment form → enter current meter value 1570 → quantity field instantly shows 120 (= 1570 − 1450). Save → the payment stores qty = 120 and meter reading = 1570.

**Acceptance Scenarios**:

1. **Given** a resource tariff has a previous payment with a recorded meter value of 1450, **When** the owner enters 1570 as the current meter value, **Then** the consumed quantity is automatically calculated as 120 and displayed in the quantity field.
2. **Given** the current meter value is entered, **When** the owner saves the payment, **Then** the payment line item stores qty = 120 and the meter reading value 1570 is persisted for use in the next payment.
3. **Given** no previous meter value exists (first payment), **When** the owner enters the current meter value, **Then** the quantity field remains empty and the owner must enter it manually (the meter reading is still saved for next time).
4. **Given** the owner enters a current meter value lower than the previous one, **When** the calculation runs, **Then** an inline error is shown: "Поточне значення не може бути меншим за попереднє" and the quantity is not auto-filled.
5. **Given** the owner clears the meter reading field, **When** the field is emptied, **Then** the auto-calculated quantity is removed and the quantity field reverts to its prior value (empty for resources).

---

### User Story 2 — View Meter Readings on Payment History (Priority: P2)

Each resource line item in the payment history shows the meter reading values (previous and current) alongside the quantity and unit, giving the owner a complete audit trail of meter readings over time.

**Why this priority**: Without seeing the meter values in history, the owner cannot verify that past calculations were correct or look up what the previous reading was.

**Independent Test**: Payment saved with electricity meter reading 1570 → open payments list → January entry shows "1450 → 1570 (120 кВт·год)" for the electricity line item.

**Acceptance Scenarios**:

1. **Given** a payment was saved with a meter reading, **When** the owner views the payment in the list, **Then** the resource line item shows both previous and current meter values alongside the quantity.
2. **Given** a payment was saved without a meter reading (manually entered quantity), **When** the owner views the payment, **Then** no meter values are shown for that line item — only the quantity as before.

---

### Edge Cases

- What if the resource has no previous meter value (first payment for that resource)? The current value field is shown, but no auto-calculation happens — the owner enters qty manually. The current value is saved as the baseline for the next payment.
- What if the owner switches between meter-reading mode and manual qty mode? The last explicitly entered value in the active field is used.
- What if the owner saves without entering a current meter value? The payment saves normally with the manually entered quantity; no meter reading is stored for that line item.
- What if a new resource tariff is added after several payments exist? The first payment using that tariff has no previous meter value, so quantity is entered manually. The meter value from that payment becomes the baseline going forward.
- What if meter reading values are non-integer (e.g., gas meters with decimal readings)? Decimal meter values must be supported.

---

### User Story 3 — Edit Last Payment (Priority: P2)

The owner can correct the most recent utility payment — updating period dates, quantities, prices, and meter readings. Only the last payment is editable; older payments remain immutable.

**Why this priority**: Mistakes happen during data entry; the owner needs a way to correct the last record without deleting and re-creating it.

**Independent Test**: Last payment has electricity qty=100, price=4.50 → tap "Редагувати" → change qty to 105 → save → payment list shows updated subtotal; older payments unchanged.

**Acceptance Scenarios**:

1. **Given** there is at least one payment, **When** the owner views the payment list, **Then** the most recent payment shows a "Редагувати" button; all other payments do not.
2. **Given** the owner taps "Редагувати", **When** the edit form opens, **Then** all existing values (dates, quantities, prices, meter readings) are pre-populated.
3. **Given** the owner changes values and saves, **When** the save completes, **Then** the payment list reflects the updated values.
4. **Given** the owner cancels the edit, **When** the form closes, **Then** the original payment is unchanged.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For each resource tariff in the payment form, a meter reading input field MUST be displayed alongside the quantity field.
- **FR-002**: When the owner enters a current meter value and a previous meter value exists for that tariff on this apartment, the system MUST automatically calculate quantity = current − previous and populate the quantity field.
- **FR-003**: The auto-calculated quantity MUST update live as the owner types the current meter value.
- **FR-004**: If the current meter value is less than the previous meter value, the system MUST show an inline validation error and MUST NOT auto-populate the quantity field.
- **FR-005**: If no previous meter value exists for a tariff on this apartment (first payment using that tariff), the meter reading field MUST still be shown and the entered value MUST be saved as the baseline for future payments.
- **FR-006**: Saving a payment MUST persist the current meter reading value for each resource tariff line item that has one.
- **FR-007**: If the owner does not enter a meter reading value, the line item MUST save with the manually entered quantity (existing behaviour unchanged).
- **FR-008**: Each resource line item in the payment history list MUST display the previous and current meter reading values when they were recorded with that payment.
- **FR-009**: Meter reading values MUST support decimal numbers (e.g., 1234.567 for gas meters).
- **FR-010**: The previous meter value shown in the form MUST be the current meter value from the most recent payment for the same apartment and tariff name.
- **FR-011**: A "Редагувати" button MUST appear only on the most recent payment card in the payment list.
- **FR-012**: Opening the edit form MUST pre-populate all fields from the existing payment.
- **FR-013**: Saving an edit MUST update the existing payment record and its line items in-place.

### Key Entities

- **ReadingLineItem** (extended): Adds two new optional fields: `meter_value_previous` (the baseline, copied from the prior line item's `meter_value_current` at form-open time) and `meter_value_current` (entered by the owner). Quantity is still stored as the computed or manually entered value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner can record a complete monthly payment using meter readings in under 2 minutes — no manual subtraction needed.
- **SC-002**: 100% of auto-calculated quantities match current minus previous meter value with no rounding error beyond 3 decimal places.
- **SC-003**: The previous meter value is always pre-loaded correctly — 0 cases where an incorrect baseline is shown.
- **SC-004**: Entering a meter value lower than the previous one is always blocked with a clear error — 0 invalid calculations saved.
- **SC-005**: Payments saved without meter readings continue to work exactly as before — 0 regressions in existing behaviour.

## Assumptions

- Only resource tariffs have meter readings; service tariffs (fixed price, qty-based) are unaffected by this feature.
- The "previous meter value" for a given tariff is looked up by matching on apartment + tariff name (snapshot name) across existing payment line items, using the most recent payment's current meter value.
- Meter reading input is optional — owners may still enter quantity directly without using the meter reading field.
- Meter values are stored per line item (not in a separate meter history table) to maintain the append-only, snapshot approach of the existing system.
- Decimal precision: meter values stored to 3 decimal places (same as quantity).
- Only the most recent payment may be edited; older payments remain immutable.
