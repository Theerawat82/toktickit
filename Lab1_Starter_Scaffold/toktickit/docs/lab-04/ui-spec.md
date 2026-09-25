# Lab 4: Sprint 4 - UI Specification

## 1. IT Staff Dashboard
The IT Staff Dashboard serves as the primary landing page for IT personnel, providing a high-level overview of system workload and their personal responsibilities.
*   **Metric Cards:**
    *   **Unassigned Tickets:** Total count of tickets waiting for assignment.
    *   **My Assigned Tickets:** Total count of open/in-progress tickets assigned to the logged-in staff member.
    *   **Status & Priority Metrics:** Breakdown of tickets by status (e.g., Open, In Progress) and Priority (e.g., High, Critical).
*   **My Recent Tickets:** A concise list or table showing the most recently updated tickets assigned to the user, providing quick access to active work.

## 2. Requester Dashboard
The Requester Dashboard provides a focused view, strictly limited to the user's own submitted requests.
*   **Summarized Metrics:**
    *   **Open:** Count of tickets awaiting action.
    *   **In Progress:** Count of tickets currently being worked on.
    *   **Resolved:** Count of tickets that have reached resolution status.
    *   **Closed:** Count of finalized tickets.
*   *Requirement: This dashboard must only display data specific to the authenticated Requester.*

## 3. Actions Taken UI (Ticket Detail View)
The Ticket Detail page is expanded to include an "Actions Taken" section to track progress.
*   **List/Table View:** Displays a chronological list of actions taken on the ticket (Date, Performed By, Action Description, Follow-up notes).
    *   *Read-only for Requesters.*
*   **Create Mode:** A form available *only* to IT Staff and Admins.
    *   **Fields:** `actionDescription` (textarea), `followUpRequired` (checkbox).
    *   **Conditional Field:** `followUpNote` (textarea) becomes visible and required ONLY if `followUpRequired` is checked.

## 4. States & Design
All new components must adhere to the existing application design system, maintaining the "Zen Green" styling.
*   **Loading State:** Use skeleton loaders or spinner animations while dashboard metrics or actions are being fetched from the server.
*   **Empty State:** Display clear, friendly messages when there is no data (e.g., "No actions taken yet", "You have no assigned tickets").
*   **Forbidden State:** Ensure UI elements like the "Add Action" button are completely hidden from unauthorized users (Requesters), rather than just disabled.
*   **Safe-failure State:** If a dashboard fails to load metrics, display a localized error message ("Failed to load metrics") without crashing the rest of the application layout.
*   **Responsiveness:** All dashboards and tables must be responsive, gracefully stacking or scrolling horizontally on mobile devices.
