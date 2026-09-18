# Visual & Responsive Checklist (Issue #10)

## Overview
This document records the visual inspection results for the TokTickIT Lab 3 delivery. All main screens have been inspected across three target viewports: Desktop (1280px), Tablet (768px), and Mobile (375px). 

Screenshots are available in the `artifacts/lab-03/screenshots/` directory.

## Checklist Results

### 1. Design-Token Consistency
* **Requirement**: Colors, fonts, and spacing follow the Zen Green design language.
* **Status**: ⚠️ **Pass with Fixes**
* **Action/Known Issue**: The `StaffTicketDetail` screen was using `#FFFCFA` for the internal notes background. It was fixed to use `#FEF0C7` to explicitly match the "Subtle amber background" requirement in the `ui-spec.md`. Other primary brand colors (`#006B3C`, `#EAF6EF`) were correctly applied across components.

### 2. Role Navigation Correctness
* **Requirement**: Menus display appropriately based on the authenticated role (Requester / IT Staff / Administrator).
* **Status**: ⚠️ **Pass with Known Issue**
* **Action/Known Issue**: The `App.tsx` global header properly dynamically renders "User Management" and "Queue" links only for Administrators. However, "My Tickets" / "Create Ticket" for Requester and "Ticket Queue" for IT Staff are not explicitly rendered in the global top header menu. They are currently handled as sequential full-page blocks via the `#` hash routing logic in `App.tsx`. 

### 3. Badge Styling
* **Requirement**: Consistent coloring and typography for `TicketStatus`, `RequestedPriority`, and `ITPriority`.
* **Status**: ✅ **Pass**
* **Action/Known Issue**: Badges for both Priority (`PRIORITY_BADGE`) and Status (`STATUS_BADGE`) are correctly mapped to their respective enums (e.g. New is `#006B3C`, Open is `#026AA2`).

### 4. Editable vs. Read-Only Field Styling
* **Requirement**: Clear visual distinction between inputs that can be edited and those that are read-only.
* **Status**: ✅ **Pass**
* **Action/Known Issue**: `disabled` attributes on forms (like during submission, or internal notes input when posting) apply proper gray-out styling leveraging Bootstrap's built-in disabled input states.

### 5. Validation Placement
* **Requirement**: Error messages must display in consistent locations (e.g., inline below inputs).
* **Status**: ✅ **Pass**
* **Action/Known Issue**: Checked the authentication screen and ticket detail note submission. Validation errors (`.text-danger`) correctly appear below the corresponding fields.

### 6. Focus States
* **Requirement**: Focus indicators are clear for accessibility.
* **Status**: ✅ **Pass**
* **Action/Known Issue**: Bootstrap's default focus ring (blue glow) properly highlights inputs when they receive focus. 

### 7. No Clipping, Overlap, or Horizontal Overflow
* **Requirement**: UI must scale cleanly without breaking on smaller viewports.
* **Status**: ✅ **Pass**
* **Action/Known Issue**: Confirmed via screenshots.
  * **Desktop (1280px)**: Data tables are full width.
  * **Tablet (768px)**: Content condenses but does not overflow.
  * **Mobile (375px)**: The Staff Ticket Queue effectively converts from a `<table>` to a list of responsive `.card` elements to prevent horizontal scrolling.

## Viewport Inspection Coverage
* **Login & Auth**: Captured (Desktop, Tablet, Mobile) - Default & Error states.
* **Staff Queue**: Captured (Desktop, Tablet, Mobile).
* **Ticket Detail**: Captured (Desktop, Tablet, Mobile).
* **User Management**: Captured (Desktop, Tablet, Mobile).
