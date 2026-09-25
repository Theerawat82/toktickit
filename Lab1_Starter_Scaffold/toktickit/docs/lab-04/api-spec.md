# Lab 4: Sprint 4 - API Specification

## 1. Actions Taken

### `POST /api/tickets/:id/actions`
Creates a new Action Taken for a specific ticket.
*   **Authorization:** IT Staff and Admins only.
*   **Request Payload:**
    ```json
    {
      "actionDescription": "Restarted the primary database server.",
      "result": "Server is online and responding normally.",
      "attachmentNotes": "See attached server_logs.txt for details.",
      "followUpRequired": true,
      "followUpNote": "Monitor CPU usage for the next 24 hours."
    }
    ```
    *   *Critical Rule:* The `performedById` must NOT be accepted in the payload. The backend must derive this securely from the authenticated user's session token.
*   **Response (201 Created):** Returns the created ActionTaken object.
*   **Validation Errors (400 Bad Request):** Returned if validation fails (e.g., if `followUpRequired` is true but `followUpNote` is missing).

### `GET /api/tickets/:id/actions`
Retrieves a list of Actions Taken for a specific ticket.
*   **Authorization:**
    *   IT Staff/Admins: Can view actions for any ticket.
    *   Requesters: Can ONLY view actions for tickets where they are the owner/creator.
*   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "ticketId": 123,
        "performedById": 45,
        "actionDescription": "Restarted the primary database server.",
        "result": "Server is online and responding normally.",
        "attachmentNotes": "See attached server_logs.txt for details.",
        "followUpRequired": true,
        "followUpNote": "Monitor CPU usage for the next 24 hours.",
        "createdAt": "2023-10-27T10:00:00Z"
      }
    ]
    ```

## 2. Ticket Updates & Concurrency

### `PATCH /api/tickets/:id/status`
Updates the status (and potentially other fields) of a ticket. This endpoint enforces Optimistic Concurrency Control.
*   **Request Payload:** Must include the `version` field the client currently possesses.
    ```json
    {
      "status": "In Progress",
      "version": 2
    }
    ```
*   **Response (200 OK):** Returns the updated ticket with the incremented version.
*   **Error (409 Conflict):** Returned if the provided `version` does not match the current version in the database, indicating a concurrent update occurred.

### `PATCH /api/tickets/:id/confirm-resolved`
Allows a Requester to confirm their issue is resolved (Resolution Gate).
*   **Authorization:** Requesters only (and only for their own tickets).
*   **Request Payload:** Empty.
*   **Backend Logic:** Updates the `requesterConfirmedResolved` boolean flag to `true`. It DOES NOT modify the `currentStatus` field.
*   **Response (200 OK):** Returns the updated ticket.

## 3. Dashboards
These endpoints must return summarized metrics and counts, NOT full arrays of ticket objects.

### `GET /api/dashboard/staff`
Retrieves aggregated metrics for the IT Staff dashboard.
*   **Authorization:** IT Staff and Admins.
*   **Query Logic:** Aggregates counts across all active tickets in the system.
*   **Response Shape (200 OK):**
    ```json
    {
      "unassignedCount": 12,
      "myAssignedCount": 5,
      "statusBreakdown": {
        "Open": 8,
        "InProgress": 9
      },
      "priorityBreakdown": {
        "High": 2,
        "Critical": 1
      }
    }
    ```

### `GET /api/dashboard/requester`
Retrieves aggregated metrics for the Requester dashboard.
*   **Authorization:** Requesters.
*   **Query Logic:** Aggregates counts ONLY for tickets created by the authenticated requester.
*   **Response Shape (200 OK):**
    ```json
    {
      "myTickets": {
        "Open": 2,
        "InProgress": 1,
        "Resolved": 0,
        "Closed": 5
      }
    }
    ```
