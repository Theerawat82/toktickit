# Lab 3 API Specification: TokTickIT

This document details the RESTful API endpoints required for Authentication, IT Staff operations, Comments/Notes, and Admin User Management.

---

## 1. Authentication Endpoints

### 1.1 Login
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Responses**:
  * `200 OK`: Successful login.
    ```json
    {
      "user": { 
        "id": 1, 
        "email": "user@example.com", 
        "role": "IT Staff", 
        "mustChangePassword": false 
      },
      "token": "eyJhbG..."
    }
    ```
  * `400 Bad Request`: Missing required fields.
  * `401 Unauthorized`: Invalid credentials.
    ```json
    { "error": "Invalid email or password." }
    ```
  * `403 Forbidden`: Account inactive.
    ```json
    { "error": "Account is inactive. Please contact your administrator." }
    ```

### 1.2 Logout
* **Method**: `POST`
* **Path**: `/api/auth/logout`
* **Access**: Authenticated (Any Role)
* **Responses**:
  * `200 OK`: Successfully logged out.
    ```json
    { "message": "Logged out successfully." }
    ```
  * `401 Unauthorized`: Not authenticated.

### 1.3 Get Current User (Me)
* **Method**: `GET`
* **Path**: `/api/auth/me`
* **Access**: Authenticated (Any Role)
* **Responses**:
  * `200 OK`: Returns current user session details.
    ```json
    {
      "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "role": "IT Staff",
        "isActive": true,
        "mustChangePassword": false
      }
    }
    ```
  * `401 Unauthorized`: Not authenticated.

### 1.4 Change Password
* **Method**: `POST`
* **Path**: `/api/auth/change-password`
* **Access**: Authenticated (Any Role)
* **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```
* **Responses**:
  * `200 OK`: Password updated successfully. `mustChangePassword` is set to `false`.
    ```json
    { "message": "Password changed successfully." }
    ```
  * `400 Bad Request`: Validation failure (e.g., complexity rules not met, new password same as old password).
    ```json
    {
      "errors": [
        { "field": "newPassword", "message": "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character." }
      ]
    }
    ```
  * `401 Unauthorized`: Current password incorrect.

---

## 2. IT Staff Ticket Queue & Operations Endpoints

### 2.1 Get Staff Ticket Queue
* **Method**: `GET`
* **Path**: `/api/tickets/queue`
* **Access**: IT Staff, Administrator
* **Query Params**:
  * `search` (string, optional)
  * `category` (string, optional)
  * `status` (string, optional)
  * `priority` (string, optional)
  * `itPriority` (string, optional)
  * `ownerId` (number, optional)
  * `sort` (string, optional, e.g., "createdAt")
  * `order` (string, optional, "asc" or "desc")
  * `page` (number, default: 1)
  * `pageSize` (number, default: 20)
* **Responses**:
  * `200 OK`:
    ```json
    {
      "data": [
        {
          "id": 101,
          "title": "Network connectivity issues",
          "category": "Network",
          "status": "Open",
          "requestedPriority": "High",
          "itPriority": "High",
          "requester": { "id": 10, "name": "Alice Smith" },
          "owner": { "id": 5, "name": "Bob IT" },
          "createdAt": "2023-10-27T10:00:00Z",
          "updatedAt": "2023-10-27T11:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 45,
        "totalPages": 3
      }
    }
    ```
  * `400 Bad Request`: Invalid pagination or sorting parameters.
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient role permissions.
  * `500 Internal Server Error`: Server error.

### 2.2 Get Ticket Detail (Staff/Admin View)
* **Method**: `GET`
* **Path**: `/api/tickets/:id`
* **Access**: IT Staff, Administrator
* **Responses**:
  * `200 OK`:
    ```json
    {
      "id": 101,
      "title": "Network connectivity issues",
      "description": "Cannot connect to the office VPN from home.",
      "category": "Network",
      "status": "Open",
      "requestedPriority": "High",
      "itPriority": "High",
      "requester": { "id": 10, "name": "Alice Smith", "email": "alice@example.com" },
      "owner": { "id": 5, "name": "Bob IT", "email": "bob@example.com" },
      "attachments": [
        { "id": 1, "fileName": "error_screenshot.png", "url": "/uploads/error_screenshot.png" }
      ],
      "publicCommentsCount": 2,
      "internalNotesCount": 1,
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T11:00:00Z"
    }
    ```
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient permissions.
  * `404 Not Found`: Ticket does not exist.
  * `500 Internal Server Error`: Server error.

### 2.3 Assign / Claim Ticket Ownership
* **Method**: `PATCH`
* **Path**: `/api/tickets/:id/owner`
* **Access**: IT Staff, Administrator
* **Request Body**:
  ```json
  {
    "ticketOwnerId": 5
  }
  ```
  *(Pass `null` to unassign)*
* **Responses**:
  * `200 OK`:
    ```json
    {
      "message": "Ticket owner updated successfully.",
      "ticket": { "id": 101, "ticketOwnerId": 5 }
    }
    ```
  * `400 Bad Request`: Target user is not active, lacks correct role (must be IT Staff or Admin), or invalid payload.
    ```json
    { "error": "User with ID 5 is not an active IT Staff or Administrator." }
    ```
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient permissions.
  * `404 Not Found`: Ticket not found.
  * `500 Internal Server Error`: Server error.

### 2.4 Update IT Priority
* **Method**: `PATCH`
* **Path**: `/api/tickets/:id/priority`
* **Access**: IT Staff, Administrator
* **Request Body**:
  ```json
  {
    "itPriority": "High"
  }
  ```
  *Allowed values: "Low", "Medium", "High", "Urgent"*
* **Responses**:
  * `200 OK`:
    ```json
    {
      "message": "IT priority updated successfully.",
      "ticket": { "id": 101, "itPriority": "High" }
    }
    ```
  * `400 Bad Request`: Invalid priority value.
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient permissions.
  * `404 Not Found`: Ticket not found.
  * `500 Internal Server Error`: Server error.

### 2.5 Update Ticket Status
* **Method**: `PATCH`
* **Path**: `/api/tickets/:id/status`
* **Access**: IT Staff, Administrator
* **Request Body**:
  ```json
  {
    "status": "In Progress"
  }
  ```
  *Allowed values: "New", "Open", "In Progress", "Waiting for Requester", "Resolved", "Closed", "Reopened", "Cancelled"*
* **Responses**:
  * `200 OK`:
    ```json
    {
      "message": "Status updated successfully.",
      "ticket": { "id": 101, "status": "In Progress" }
    }
    ```
  * `400 Bad Request`: Invalid status string.
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient permissions.
  * `404 Not Found`: Ticket not found.
  * `409 Conflict`: Invalid status transition based on lifecycle matrix (e.g., transitioning directly from "New" to "Closed").
    ```json
    { "error": "Invalid status transition from New to Closed." }
    ```
  * `500 Internal Server Error`: Server error.

---

## 3. Comments & Internal Notes Endpoints

### 3.1 Post Public Comment
* **Method**: `POST`
* **Path**: `/api/tickets/:id/comments`
* **Access**: Requester (only if owner of the ticket), IT Staff, Administrator
* **Request Body**:
  ```json
  {
    "content": "I have restarted my computer, but the issue persists."
  }
  ```
* **Responses**:
  * `201 Created`:
    ```json
    {
      "id": 1,
      "ticketId": 101,
      "authorId": 10,
      "content": "I have restarted my computer, but the issue persists.",
      "createdAt": "2023-10-27T10:15:00Z"
    }
    ```
  * `400 Bad Request`: Content is empty or exceeds length limits.
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Requester trying to comment on a ticket they do not own.
  * `404 Not Found`: Ticket not found.
  * `500 Internal Server Error`: Server error.

### 3.2 Get Public Comments
* **Method**: `GET`
* **Path**: `/api/tickets/:id/comments`
* **Access**: Requester (only if owner of the ticket), IT Staff, Administrator
* **Responses**:
  * `200 OK`:
    ```json
    [
      {
        "id": 1,
        "content": "I have restarted my computer, but the issue persists.",
        "createdAt": "2023-10-27T10:15:00Z",
        "author": { "id": 10, "name": "Alice Smith", "role": "Requester" }
      }
    ]
    ```
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Requester trying to access comments on another user's ticket.
  * `404 Not Found`: Ticket not found.
  * `500 Internal Server Error`: Server error.

### 3.3 Post Internal Note
* **Method**: `POST`
* **Path**: `/api/tickets/:id/internal-notes`
* **Access**: IT Staff, Administrator ONLY
* **Request Body**:
  ```json
  {
    "content": "Contacted the network team. They are looking into the router configuration."
  }
  ```
* **Responses**:
  * `201 Created`:
    ```json
    {
      "id": 1,
      "ticketId": 101,
      "authorId": 5,
      "content": "Contacted the network team. They are looking into the router configuration.",
      "createdAt": "2023-10-27T10:30:00Z"
    }
    ```
  * `400 Bad Request`: Content is empty.
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Accessed by Requester (or 404 if hiding existence of the ticket itself).
  * `404 Not Found`: Ticket not found.
  * `500 Internal Server Error`: Server error.

### 3.4 Get Internal Notes
* **Method**: `GET`
* **Path**: `/api/tickets/:id/internal-notes`
* **Access**: IT Staff, Administrator ONLY
* **Responses**:
  * `200 OK`:
    ```json
    [
      {
        "id": 1,
        "content": "Contacted the network team. They are looking into the router configuration.",
        "createdAt": "2023-10-27T10:30:00Z",
        "author": { "id": 5, "name": "Bob IT", "role": "IT Staff" }
      }
    ]
    ```
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Accessed by Requester.
  * `404 Not Found`: Ticket not found.
  * `500 Internal Server Error`: Server error.

---

## 4. Admin User Management Endpoints

### 4.1 List Users
* **Method**: `GET`
* **Path**: `/api/admin/users`
* **Access**: Administrator ONLY
* **Query Params**:
  * `search` (string, optional)
  * `role` (string, optional)
  * `isActive` (boolean, optional)
  * `page` (number, default: 1)
  * `pageSize` (number, default: 20)
* **Responses**:
  * `200 OK`:
    ```json
    {
      "data": [
        {
          "id": 10,
          "name": "Alice Smith",
          "email": "alice@example.com",
          "role": "Requester",
          "isActive": true,
          "createdAt": "2023-01-15T08:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 150,
        "totalPages": 8
      }
    }
    ```
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient role permissions.
  * `500 Internal Server Error`: Server error.

### 4.2 Create User
* **Method**: `POST`
* **Path**: `/api/admin/users`
* **Access**: Administrator ONLY
* **Request Body**:
  ```json
  {
    "name": "Jane Tech",
    "email": "jane@example.com",
    "role": "IT Staff",
    "password": "InitialPassword123!"
  }
  ```
* **Responses**:
  * `201 Created`: User created successfully with `mustChangePassword` set to true.
    ```json
    {
      "id": 11,
      "name": "Jane Tech",
      "email": "jane@example.com",
      "role": "IT Staff",
      "isActive": true,
      "mustChangePassword": true
    }
    ```
  * `400 Bad Request`: Missing required fields, invalid email format, or invalid role.
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient role permissions.
  * `409 Conflict`: Email already exists.
    ```json
    { "error": "User with this email already exists." }
    ```
  * `500 Internal Server Error`: Server error.

### 4.3 Update User
* **Method**: `PATCH`
* **Path**: `/api/admin/users/:id`
* **Access**: Administrator ONLY
* **Request Body**:
  ```json
  {
    "name": "Jane Advanced Tech",
    "role": "Administrator",
    "isActive": true
  }
  ```
  *(All fields are optional)*
* **Responses**:
  * `200 OK`:
    ```json
    {
      "id": 11,
      "name": "Jane Advanced Tech",
      "email": "jane@example.com",
      "role": "Administrator",
      "isActive": true
    }
    ```
  * `400 Bad Request`: Validation failure (e.g., self-deactivation, deactivating last admin).
    ```json
    { "error": "Cannot deactivate the last active Administrator account." }
    ```
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient role permissions.
  * `404 Not Found`: User not found.
  * `409 Conflict`: Email already in use by another user.
  * `500 Internal Server Error`: Server error.

### 4.4 Reset User Password
* **Method**: `POST`
* **Path**: `/api/admin/users/:id/reset-password`
* **Access**: Administrator ONLY
* **Request Body**:
  ```json
  {
    "newInitialPassword": "TempPassword123!"
  }
  ```
* **Responses**:
  * `200 OK`: Password reset successfully, `mustChangePassword` set to true for the user.
    ```json
    { "message": "User password reset successfully." }
    ```
  * `400 Bad Request`: Missing new password or does not meet minimum complexity.
  * `401 Unauthorized`: Not authenticated.
  * `403 Forbidden`: Insufficient role permissions.
  * `404 Not Found`: User not found.
  * `500 Internal Server Error`: Server error.
