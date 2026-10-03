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


## 3. Dashboards

### `GET /api/dashboard/requester`
Retrieves dashboard metrics and recent tickets for the authenticated Requester.
*   **Authorization:** Requesters only.
*   **Response (200 OK):**
    ```json
    {
      "statusBreakdown": {
        "Open": 2,
        "InProgress": 1,
        "Resolved": 0,
        "Closed": 5
      },
      "myTickets": [
        { "id": 1, "ticketNumber": "INC-00001", "summary": "...", "currentStatus": "Open", "updatedAt": "..." }
      ]
    }
    ```
    *Note:* `Open` includes New, Open, Reopened statuses. `Closed` includes Closed, Cancelled.

### `GET /api/dashboard/staff`
Retrieves dashboard metrics and recent tickets for the authenticated IT Staff / Administrator.
*   **Authorization:** IT Staff and Admins.
*   **Response (200 OK):**
    ```json
    {
      "myAssignedCount": 3,
      "unassignedCount": 10,
      "statusBreakdown": {
        "New": 5, "Open": 2, "In Progress": 3, "Waiting for Requester": 0, 
        "Resolved": 1, "Closed": 10, "Reopened": 1, "Cancelled": 1
      },
      "recentlyUpdated": [
         { "id": 1, "ticketNumber": "INC-00001", "summary": "...", "currentStatus": "New", "updatedAt": "..." }
      ]
    }
    ```

## 4. Health Endpoint

### `GET /api/health`
Checks the status of the API and database connectivity.
*   **Authorization:** Public (Unauthenticated allowed).
*   **Response (200 OK):**
    ```json
    {
      "status": "ok",
      "service": "TokTickIT API"
    }
    ```
*   **Response (503 Service Unavailable):** Returned if the database query fails.

## 5. Authorization Matrix (Expected HTTP Status Codes)

| Endpoint | Method | Unauth | Req (Own) | Req (Other) | IT Staff | Admin | Inactive | MustChangePwd | NonExistent ID | Invalid ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/health` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | N/A | N/A |
| `/api/dashboard/requester`| GET | 401 | 200 | 200 | 403 | 403 | 403 | 403 | N/A | N/A |
| `/api/dashboard/staff` | GET | 401 | 403 | 403 | 200 | 200 | 403 | 403 | N/A | N/A |
| `/api/tickets/:id/actions` | GET | 401 | 200 | 404 | 200 | 200 | 403 | 403 | 404 | 400 |
| `/api/tickets/:id/actions` | POST | 401 | 403 | 403 | 201 | 201 | 403 | 403 | 404 | 400 |
| `/api/tickets/:id/actions/:actionId` | PATCH | 401 | 403 | 403 | 200 | 200 | 403 | 403 | 404 | 400 |
  | `/api/tickets/:id/status` | PATCH | 401 | 403 | 404 | 200 | 200 | 403 | 403 | 404 | 400 |
| `/api/tickets/:id/confirm-resolved` | PATCH | 401 | 200 | 404 | 403 | 403 | 403 | 403 | 404 | 400 |
| `/api/tickets/:id/owner` | PATCH | 401 | 403 | 403 | 200 | 200 | 403 | 403 | 404 | 400 |
| `/api/tickets/:id/priority` | PATCH | 401 | 403 | 403 | 200 | 200 | 403 | 403 | 404 | 400 |
