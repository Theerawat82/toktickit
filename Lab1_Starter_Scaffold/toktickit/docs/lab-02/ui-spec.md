# UI Specification: TokTickIT

## 1. Design System Tokens
*   **Colors:**
    *   Primary: Zen Green `#006B3C`
    *   Secondary: `#0B7A46`
    *   Background Tint: `#EAF6EF`
    *   Error: `#D92D20`
    *   Warning: `#F79009`
    *   Success: `#039855`
    *   Neutral Text: `#344054`
*   **Typography:**
    *   Font Family: Inter, system-ui, sans-serif.
    *   Headings: H1 (24px, Bold), H2 (20px, SemiBold), H3 (18px, Medium).
    *   Body: 14px, Regular.
*   **Spacing:**
    *   Base Unit: 4px.
    *   Common Scale: 8px (xs), 16px (sm), 24px (md), 32px (lg).

## 2. Component States
*   **Editable:** Inputs have a 1px solid border (`#D0D5DD`), white background.
*   **Read-only:** Inputs have a transparent or gray background (`#F9FAFB`), no border, text is `#344054`.
*   **Error:** Inputs have a red border (`#D92D20`), display a red asterisk `*` for mandatory fields, and show inline helper text below the field in `#D92D20`.
*   **Disabled:** Opacity 50%, cursor `not-allowed`, background `#F2F4F7`.
*   **Focus:** Outline `2px solid #006B3C` with a 2px offset.
*   **Busy/Submitting:** Buttons show a spinner icon, text changes to "Submitting...", cursor `wait`, interactions disabled.

## 3. Responsive Breakpoints & Layout Rules
*   **Desktop (≥992px):**
    *   *Create Ticket:* Side-by-side two-column layout for form fields.
    *   *My Tickets:* Data table layout with visible columns for ID, Title, Status, Priority, Date, and Actions.
    *   *Ticket Detail:* Split view. Main content (details, history) taking 70% width, sidebar (metadata, attachments) taking 30% width.
*   **Tablet (768px - 991px):**
    *   *Create Ticket:* Single column, full-width fields.
    *   *My Tickets:* Data table with hidden lower-priority columns (e.g., ID, Date are hidden or collapsed).
    *   *Ticket Detail:* Stacked view. Main content on top, sidebar below.
*   **Mobile (<768px):**
    *   *Create Ticket:* Single column, touch-friendly large inputs (minimum height 44px).
    *   *My Tickets:* Card-based layout instead of a table. Each card displays key info (Title, Status badge, Date).
    *   *Ticket Detail:* Fully stacked, full-width sections.

## 4. Accessibility Standards
*   **ARIA Attributes:** Use `aria-label`, `aria-describedby` for form inputs with helper/error text. Use `aria-live="polite"` for dynamic search results or error messages.
*   **Keyboard Navigation:** All interactive elements (buttons, links, form fields, table headers for sorting) must be reachable via `Tab` key. Focus rings must be visible.
*   **Color Contrast:** Ensure text-to-background contrast ratio meets WCAG 2.1 AA standards (minimum 4.5:1 for normal text). Do not rely solely on color to convey information (e.g., use an icon + color for status).
# Zen Green UI Specification

## 1. Color Tokens
- Primary Green: `#006B3C` (Header, Primary Buttons)
- Secondary Green: `#0B7A46` (Active Tabs, Links, Hover)
- Pale Green: `#EAF6EF` (Selected Items, Callouts)
- Page Background: `#F5F7F6`
- Error Text/Border: Dark Red (`#D32F2F`)

## 2. Component States & Styling
- **Editable Controls:** Background White, Neutral Border.
- **Read-Only Controls:** Soft Gray-Green / Ivory shading.
- **Buttons:**
  - Primary: `#006B3C` background, White text.
  - Disabled: Grayed out, non-clickable.
  - Busy State: Spinner icon with "Submitting..." text.
- **Validation:** Red asterisk (*) for required fields. Error messages strictly below fields.

## 3. Layout & Responsive Rules
- **Desktop (≥992px):** Multi-column form and data table.
- **Tablet (768px-991px):** 2-column layout.
- **Mobile (<768px):** Stacked vertical controls, responsive cards for table rows.

## 4. Visual Inspection Screenshots
- Create Ticket Mode: `artifacts/lab-02/screenshots/create-ticket/`
- My Tickets Screen: `artifacts/lab-02/screenshots/my-tickets/`
- Ticket Detail Mode: `artifacts/lab-02/screenshots/ticket-detail/`
