# Lab 4: Sprint 4 Engineering Contract - Specification

## 1. Sprint Goal
The goal of Sprint 4 is to deliver critical updates to the TokTickIT Helpdesk system by providing transparency into the resolution process, adding specialized dashboards, and enforcing data integrity. This includes adding the capability to track "Actions Taken" on tickets, providing targeted dashboards for IT Staff and Requesters, enforcing strict optimistic concurrency control for updates, and implementing a final Resolution Gate for ticket lifecycles.

## 2. Stakeholder Request
Stakeholders have identified that merely having a ticket status is insufficient. IT Staff need to log the specific actions performed to resolve issues (Actions Taken), and all users need a summarized view (Dashboard) of the system's state relative to their roles. Additionally, there have been data integrity issues with concurrent updates overwriting each other, and confusion regarding when a ticket is truly "Resolved" versus when the requester merely confirms their issue is fixed.

## 3. Scope
**Included Features:**
*   Creation and viewing of Actions Taken for Tickets.
*   IT Staff Dashboard with ticket metrics and assignments.
*   Requester Dashboard with personalized ticket metrics.
*   Implementation of Optimistic Concurrency Control (OCC) using versioning.
*   Implementation of a Resolution Gate advisory flag for Requesters.

**Excluded Features:**
*   Service Level Agreements (SLAs).
*   External notifications (email, SMS).
*   Asset or inventory management.

## 4. Functional Requirements
*   **FR-01:** IT Staff and Admins can create and edit an Action Taken record associated with a specific ticket.
*   **FR-02:** Requesters can view Actions Taken on their own tickets but cannot create or edit them.
*   **FR-03:** The system must provide a dashboard for IT Staff displaying aggregate metrics for unassigned tickets, their assigned tickets, and overall status/priority breakdowns.
*   **FR-04:** The system must provide a dashboard for Requesters displaying aggregate metrics of their own tickets by status.
*   **FR-05:** Requesters can confirm an issue is resolved via the UI, setting an advisory flag (Resolution Gate).
*   **FR-06:** The system must reject concurrent ticket updates that conflict by verifying version numbers.
*   **FR-07 (Hardening):** Prevent enumeration of Requesters by restricting `/api/requesters` to IT Staff and Administrators.
*   **FR-08 (Hardening):** Form data protection must be implemented to preserve user input during network or server errors across all creation forms.
*   **FR-09 (Hardening):** Gracefully block non-owners using HTTP 404 instead of 403 to prevent ticket existence enumeration.
*   **FR-01:** IT Staff and Admins can create an Action Taken record associated with a specific ticket.
*   **FR-02:** Requesters can view Actions Taken on their own tickets but cannot create them.
*   **FR-03:** The system must provide a dashboard for IT Staff displaying aggregate metrics for unassigned tickets, their assigned tickets, and overall status/priority breakdowns.
*   **FR-04:** The system must provide a dashboard for Requesters displaying aggregate metrics of their own tickets by status.
*   **FR-05:** Requesters can confirm an issue is resolved via the UI, setting an advisory flag.
*   **FR-06:** The system must reject concurrent ticket updates that conflict by verifying version numbers.

## 5. Business Rules
*   **BR-01:** An ActionTaken belongs to exactly one Ticket.
*   **BR-02:** `ticketOwnerId` coordinates the ticket, but `performedById` (on ActionTaken) can be a different IT Staff member.
*   **BR-03:** `performedById` is derived exclusively from the authenticated session (never client-supplied).
*   **BR-04:** `followUpNote` is required if `followUpRequired` is true.
*   **BR-05:** Requesters can only read Actions Taken on their own tickets.
*   **BR-06 (Resolution Gate Rule):** A Requester marking a problem as resolved only sets an advisory flag (`requesterConfirmedResolved = true`); it DOES NOT change the `currentStatus` to 'Resolved'.
*   **BR-07 (Concurrency Rule):** Every update to a Ticket must verify the `version` field. Mismatches result in a 409 Conflict.
*   **BR-08 (Resolution Block Rule):** A ticket cannot be transitioned to the RESOLVED status unless it has at least one associated ActionTaken record.
*   **BR-09 (Dashboard Calculation Rules):**
    *   'Requester Open' counts tickets owned by the user in NEW, OPEN, or REOPENED states.
    *   'Requester In Progress' counts tickets owned by the user in the IN PROGRESS state. Note: WAITING FOR REQUESTER is decoupled into its own separate card for better visibility (see Section 11).
    *   'IT Staff Unassigned' counts tickets without a `ticketOwnerId`, explicitly excluding CLOSED and CANCELLED tickets (since closed/cancelled tickets no longer need assignment).
    *   'IT Staff My Assigned' counts tickets assigned to the logged-in user, explicitly excluding CLOSED and CANCELLED tickets (since Resolved tickets still require IT Staff oversight to reach Final Closure).

### 5.1 Ticket Status-Transition Matrix
| From Status | To Status | Allowed Roles | Side Effects / Rules |
| :--- | :--- | :--- | :--- |
| New | Open, Cancelled | IT_Staff, Admin | |
| Open | In_Progress, Resolved, Cancelled | IT_Staff, Admin | |
| In_Progress | Waiting_for_Requester, Resolved | IT_Staff, Admin | Must have at least 1 Action Taken to reach Resolved (BR-08) |
| Waiting_for_Requester | In_Progress, Resolved | IT_Staff, Admin | Must have at least 1 Action Taken to reach Resolved (BR-08) |
| Resolved | Closed, Reopened | IT_Staff, Admin | Requesters can only confirm resolution (BR-06); IT Staff/Admin can actually close it. |
| Reopened | In_Progress, Resolved | IT_Staff, Admin | Must have at least 1 Action Taken to reach Resolved (BR-08) |

## 6. UI Specification Summary
The UI introduces new Dashboard views tailored to user roles (IT Staff vs. Requester) focusing on aggregate data. The Ticket Detail view is expanded to include an Actions Taken list and a creation form for authorized users. States like Loading, Empty, and Forbidden must be handled gracefully, adhering to the "Zen Green" design language. For detailed mockups and requirements, refer to [ui-spec.md](./ui-spec.md).

## 7. Data Changes
  *   **New Model: `ActionTaken`**
      *   Fields: `id`, `ticketId` (FK), `performedById` (FK), `actionDescription`, `result` (String, required), `attachmentNotes` (String, nullable), `followUpRequired` (boolean), `followUpNote` (string), `createdAt`, `actionDateTime`, `updatedAt`.
      *   **Drift Note**: Actions can now be edited via the new Edit endpoint.
  *   **Modified Model: `Ticket`**
      *   Add `version` (integer, default 1) for optimistic concurrency control.
      *   Add `requesterConfirmedResolved` (boolean, default false) for the resolution gate.
  *   **Migration/Backfill Strategy:**
      *   A database migration will create the `ActionTaken` table and add `version` and `requesterConfirmedResolved` columns to the `Ticket` table.
      *   Existing tickets will have their `version` initialized to 1 and `requesterConfirmedResolved` initialized to false.
  *   **Rollback / Recovery Approach:**
      *   To revert these migrations specifically, use `npx prisma migrate resolve --rolled-back lab4_add_actiontaken_version` first, then use `npx prisma migrate resolve --rolled-back lab4_add_actions_taken` second. Follow with manual `ALTER TABLE` down scripts if applying locally, or simply drop the `ActionTaken` table and remove the two columns from `Ticket`. 
      *   Since these are purely additive changes, rolling back this schema change does not touch or corrupt any existing Lab 2/3 data (Tickets, Comments, Internal Notes, or Attachments remain safe).
  
  ## 8. API Contract
The REST API will be expanded with endpoints for managing Actions Taken, retrieving dashboard metrics, and updating tickets with concurrency checks. For complete API details, refer to [api-spec.md](./api-spec.md).

## 9. Acceptance Criteria
*   **AC-01:** Given an IT Staff user, when they submit an Action Taken, then the record is saved and linked to the ticket, with `performedById` securely set to their user ID.
*   **AC-02:** Given an Action Taken where `followUpRequired` is true, when the `followUpNote` is empty, then the submission is rejected.
*   **AC-03:** Given a Requester, when they view a ticket they own, then they can see the list of Actions Taken but cannot see the form to add one.
*   **AC-04:** Given a Requester, when they mark a ticket as resolved, then the `requesterConfirmedResolved` flag is set to true, but the `currentStatus` remains unchanged.
*   **AC-05:** Given two concurrent updates to the same ticket, when the second update is submitted with a stale `version`, then the system returns a 409 Conflict.
*   **AC-06:** Given an IT Staff user, when they view the dashboard, they see aggregated ticket metrics (not raw ticket lists).

## 10. Definition of Done
*   [ ] Backend authorization is strictly enforced for all new endpoints.
*   [ ] Optimistic Concurrency Control (OCC) is enforced on all Ticket updates.
*   [ ] Dashboards return summarized, aggregate data only (not full ticket collections).
*   [ ] Database migrations created and tested.
*   [ ] Acceptance Criteria verified.

## 11. Assumptions and Decisions
*   **Decision (Dashboard UI):** The Requester Dashboard deviates from the 4-card handout mockup. We implemented a 5-card dashboard because 'Waiting for Requester' requires explicit user action, so it was decoupled from 'In Progress' for better visibility, fulfilling FR-04 and BR-09 logically.
*   **Decision (Public Categories):** `/api/categories` and `/api/related-systems` remain entirely public because they contain zero personal data or security implications, which reduces auth overhead for the frontend shell.
*   **Decision (Database OCC):** Implemented Optimistic Concurrency Control using an integer `version` field tracked on `Ticket`, avoiding heavy distributed locks.
*   **Decision (Database Deletion):** Attachment removal uses soft deletion (`isRemoved: true`) instead of hard row deletes to preserve historical audit logs for IT Staff.
*   **How earlier increments are preserved:** 
    *   Legacy Lab 3 `Admin/System` closing rules are preserved: Requesters cannot transition a ticket from Resolved to Closed; only IT Staff or Administrators may perform this transition.
    *   Legacy Lab 3 `404` security pattern is preserved: `verifyTicketOwnership` continues to return HTTP 404 (instead of 403) for non-owners to prevent ticket enumeration attacks.
    *   The orphaned `<DevelopmentRequesterSelection />` component is strictly preserved on-disk and undocumented in the router purely to allow legacy Lab 2 tests to continue passing without regressions.
*   **Decision:** We will use a standard HTTP 409 Conflict status code for concurrency errors. The UI will simply notify the user to refresh and reapply their changes, rather than building a complex merge-conflict resolution tool.
*   **Assumption:** Dashboard metric calculations will be performed efficiently by the database engine (e.g., via aggregations) and do not require a separate caching infrastructure for this sprint.


### Zen Green Theme Consolidation
- All inline palette constants have been refactored to use a single source of truth in client/src/theme.ts.
- The new palette uses ZEN primary #006B3C and has been integrated into 9 existing component files and 5 missing screens.
- Bootstrap background colors (bg-primary, bg-warning, etc.) have been overridden with style={{ backgroundColor: ZEN.primary }} maintaining the Zen Green Theme across the application.
