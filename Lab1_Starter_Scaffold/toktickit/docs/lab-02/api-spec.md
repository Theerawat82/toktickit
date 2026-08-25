# API Specification: TokTickIT

## 1. Requester & Reference Data

### 1.1 Get Active Requesters
*   **Method:** GET
*   **URL:** `/api/requesters`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:** `active=true` (boolean, optional, default: true)
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:**
        ```json
        [
          {
            "id": "req-123",
            "name": "John Doe",
            "email": "john.doe@company.com",
            "department": "Engineering",
            "is_active": true
          }
        ]
        ```
    *   **403 Forbidden:** Unauthorized access.
    *   **500 Internal Server Error:** Server fault.

### 1.2 Get Categories
*   **Method:** GET
*   **URL:** `/api/categories`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:** None
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:**
        ```json
        [
          {
            "id": "cat-1",
            "name": "Hardware",
            "description": "Issues related to physical devices."
          }
        ]
        ```
    *   **500 Internal Server Error:** Server fault.

### 1.3 Get Related Systems
*   **Method:** GET
*   **URL:** `/api/related-systems`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:** None
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:**
        ```json
        [
          {
            "id": "sys-1",
            "name": "ERP System",
            "description": "Enterprise Resource Planning"
          }
        ]
        ```
    *   **500 Internal Server Error:** Server fault.

## 2. Ticket Endpoints

### 2.1 Create Ticket
*   **Method:** POST
*   **URL:** `/api/tickets`
*   **Auth/Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
*   **Query Params:** None
*   **Request Body Schema:**
    ```json
    {
      "title": "Cannot login to VPN",
      "description": "Getting error 403 when trying to connect to the US-East VPN server.",
      "priority": "High",
      "category_id": "cat-2",
      "system_id": "sys-3",
      "requester_id": "req-123"
    }
    ```
*   **Responses:**
    *   **201 Created:**
        ```json
        {
          "id": "tkt-999",
          "title": "Cannot login to VPN",
          "status": "Open",
          "created_at": "2023-10-25T10:00:00Z"
        }
        ```
    *   **400 Bad Request:**
        ```json
        {
          "error": "Validation Failed",
          "details": ["title must be at least 10 characters"]
        }
        ```
    *   **500 Internal Server Error:** Server fault.

### 2.2 List Tickets
*   **Method:** GET
*   **URL:** `/api/tickets`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:**
    *   `search` (string)
    *   `category` (string)
    *   `priority` (string: Low, Medium, High)
    *   `status` (string: Open, In Progress, Resolved, Closed)
    *   `sort` (string: created_at:desc, priority:asc, etc.)
    *   `page` (number, default 1)
    *   `pageSize` (number, default 10)
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:**
        ```json
        {
          "data": [
            {
              "id": "tkt-999",
              "title": "Cannot login to VPN",
              "status": "Open",
              "priority": "High",
              "requester_id": "req-123",
              "created_at": "2023-10-25T10:00:00Z"
            }
          ],
          "meta": {
            "page": 1,
            "pageSize": 10,
            "totalRecords": 45,
            "totalPages": 5
          }
        }
        ```
    *   **400 Bad Request:** Invalid query parameters.
    *   **500 Internal Server Error:** Server fault.

### 2.3 Get Ticket Detail
*   **Method:** GET
*   **URL:** `/api/tickets/:id`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:** None
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:**
        ```json
        {
          "id": "tkt-999",
          "title": "Cannot login to VPN",
          "description": "Getting error 403...",
          "status": "Open",
          "priority": "High",
          "category": { "id": "cat-2", "name": "Network" },
          "requester": { "id": "req-123", "name": "John Doe" },
          "attachments": [
             { "id": "att-1", "file_name": "error.png" }
          ],
          "created_at": "2023-10-25T10:00:00Z"
        }
        ```
    *   **403 Forbidden:** Requester does not own the ticket.
    *   **404 Not Found:** Ticket ID does not exist.
    *   **500 Internal Server Error:** Server fault.

## 3. Attachment Endpoints

### 3.1 Upload Attachment
*   **Method:** POST
*   **URL:** `/api/tickets/:id/attachments`
*   **Auth/Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
*   **Query Params:** None
*   **Request Body Schema:** `FormData` containing a `file` field.
*   **Responses:**
    *   **201 Created:**
        ```json
        {
          "id": "att-1",
          "file_name": "error.png",
          "file_size": 102400,
          "mime_type": "image/png",
          "uploaded_at": "2023-10-25T10:05:00Z"
        }
        ```
    *   **400 Bad Request:** File size exceeds 5MB or invalid format.
    *   **403 Forbidden:** Unauthorized to upload attachment to this ticket.
    *   **404 Not Found:** Ticket not found.
    *   **500 Internal Server Error:** Server fault.

### 3.2 Get Attachment Metadata
*   **Method:** GET
*   **URL:** `/api/attachments/:id`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:** None
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:**
        ```json
        {
          "id": "att-1",
          "ticket_id": "tkt-999",
          "file_name": "error.png",
          "file_size": 102400,
          "mime_type": "image/png"
        }
        ```
    *   **403 Forbidden:** Unauthorized access.
    *   **404 Not Found:** Attachment deleted or not found.
    *   **500 Internal Server Error:** Server fault.

### 3.3 Download Attachment
*   **Method:** GET
*   **URL:** `/api/attachments/:id/download`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:** None
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:** (Binary File Stream with `Content-Disposition: attachment; filename="error.png"`)
    *   **403 Forbidden:** Unauthorized access.
    *   **404 Not Found:** Attachment soft-removed or does not exist.
    *   **500 Internal Server Error:** Server fault.

### 3.4 Soft-Remove Attachment
*   **Method:** POST
*   **URL:** `/api/attachments/:id/remove`
*   **Auth/Headers:** `Authorization: Bearer <token>`
*   **Query Params:** None
*   **Request Body Schema:** None
*   **Responses:**
    *   **200 OK:**
        ```json
        {
          "message": "Attachment removed successfully",
          "id": "att-1"
        }
        ```
    *   **403 Forbidden:** Unauthorized to remove this attachment.
    *   **404 Not Found:** Attachment not found.
    *   **500 Internal Server Error:** Server fault.
