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