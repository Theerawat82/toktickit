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
    *   'Requester Open' counts tickets owned by the user in NEW or OPEN states.
    *   'Requester In Progress' counts tickets owned by the user in IN PROGRESS or WAITING FOR REQUESTER states.
    *   'IT Staff Unassigned' counts tickets without a `ticketOwnerId`.
    *   'IT Staff My Assigned' counts tickets assigned to the logged-in user that are not RESOLVED or CLOSED.

### 5.1 Ticket Status-Transition Matrix
The complete valid status transitions for a ticket are:
`New -> Open -> In Progress <-> Waiting for Requester -> Resolved -> Closed`

## 6. UI Specification Summary
The UI introduces new Dashboard views tailored to user roles (IT Staff vs. Requester) focusing on aggregate data. The Ticket Detail view is expanded to include an Actions Taken list and a creation form for authorized users. States like Loading, Empty, and Forbidden must be handled gracefully, adhering to the "Zen Green" design language. For detailed mockups and requirements, refer to [ui-spec.md](./ui-spec.md).

## 7. Data Changes
*   **New Model: `ActionTaken`**
    *   Fields: `id`, `ticketId` (FK), `performedById` (FK), `actionDescription`, `result` (String, required), `attachmentNotes` (String, nullable), `followUpRequired` (boolean), `followUpNote` (string), `createdAt`.
*   **Modified Model: `Ticket`**
    *   Add `version` (integer, default 1) for optimistic concurrency control.
    *   Add `requesterConfirmedResolved` (boolean, default false) for the resolution gate.
*   **Migration/Backfill Strategy:**
    *   A database migration will create the `ActionTaken` table and add `version` and `requesterConfirmedResolved` columns to the `Ticket` table.
    *   Existing tickets will have their `version` initialized to 1 and `requesterConfirmedResolved` initialized to false.

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
*   **Decision:** We will use a standard HTTP 409 Conflict status code for concurrency errors. The UI will simply notify the user to refresh and reapply their changes, rather than building a complex merge-conflict resolution tool.
*   **Assumption:** Dashboard metric calculations will be performed efficiently by the database engine (e.g., via aggregations) and do not require a separate caching infrastructure for this sprint.
