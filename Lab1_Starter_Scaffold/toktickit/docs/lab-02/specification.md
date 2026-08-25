# Lab 2: TokTickIT Technical Specification

## 1. Sprint Goal & Stakeholder Request
**Stakeholder Request:** The IT Support team needs a robust ticketing system where employees (requesters) can submit support requests with attachments, and agents can view, search, filter, and manage these tickets efficiently.
**Sprint Goal:** Deliver the core ticketing lifecycle management feature, including ticket creation, listing, detailed view, and attachment handling, with solid validation, business rules, and responsive UI design.

## 2. Scope Included / Scope Excluded
**Included:**
*   Ticket creation (with fields like category, related system, priority, description, attachments).
*   Ticket listing with search, filtering (category, priority, status), sorting, and pagination.
*   Ticket detail view (read-only for requesters, editable state preparation for agents).
*   Attachment management (upload, download, soft-remove).
*   Requester switching (acting on behalf of another user).

**Excluded:**
*   Authentication & Authorization (to be mocked/bypassed for this sprint).
*   Email notifications.
*   SLA (Service Level Agreement) tracking.
*   Advanced reporting dashboards.

## 3. Functional Requirements
*   **FR-01: Create Ticket:** Users can create a new support ticket by providing mandatory details (title, description, category, priority) and optional attachments.
*   **FR-02: List Tickets:** Users can view a paginated list of tickets.
*   **FR-03: Ticket Detail:** Users can view the full details of a specific ticket, including its history and associated attachments.
*   **FR-04: Attachments:** Users can attach files to a ticket, download existing attachments, and soft-remove attachments they uploaded.
*   **FR-05: Search/Filter/Sort/Pagination:** The ticket list supports keyword search on title/description, filtering by status/priority/category, sorting by creation date or priority, and offset-based pagination.
*   **FR-06: Ownership:** Tickets belong to a specific requester. Agents can create tickets on behalf of a requester (switching).

## 4. Business Rules
*   **BR-01 (Defaults):** New tickets default to `Status = Open`. Priority defaults to `Medium` if not specified.
*   **BR-02 (Requester Selection/Switching):** The system must allow selecting a requester when creating a ticket. If not selected, it defaults to the current logged-in user.
*   **BR-03 (Ownership Enforcement):** Only the ticket requester or an authorized agent can view or modify a ticket.
*   **BR-04 (Search/Filter/Sort Rules):** Search should perform a case-insensitive partial match on title and description. Multiple filters apply via logical AND.
*   **BR-05 (Validation/Duplicates):** Ticket title must be between 10 and 100 characters. Description must be at least 20 characters. Duplicate titles from the same requester within 24 hours should be flagged or rejected.
*   **BR-06 (Failure Behavior):** If attachment upload fails, the ticket creation should still proceed, but user must be warned. If DB insertion fails, transaction must rollback.
*   **BR-07 (Attachment Upload):** Maximum file size is 5MB per file. Allowed extensions: .pdf, .png, .jpg, .docx. Maximum 5 attachments per ticket.
*   **BR-08 (Attachment Download/Soft-remove):** Soft-remove sets `is_deleted = true` instead of physical deletion. Soft-removed files cannot be downloaded.
*   **BR-09 (Inactive Requester Constraints):** Tickets cannot be created on behalf of inactive requesters.
*   **BR-10 (Empty/No-result States):** The UI must display a clear "No tickets found" message when lists are empty or search yields no results.
*   **BR-11 (Ticket Detail Access Control):** Users attempting to access a ticket they do not own will receive a 403 Forbidden error. (Lab 3 transition hooks: prepare role-based checks).

## 5. Data Changes
**Overview of Schema Entities:**
*   **Requester:** `id`, `name`, `email`, `department`, `is_active`.
*   **Ticket:** `id`, `title`, `description`, `status`, `priority`, `category_id`, `system_id`, `requester_id`, `created_at`, `updated_at`.
*   **Attachment:** `id`, `ticket_id`, `file_name`, `file_path`, `file_size`, `mime_type`, `uploaded_by`, `is_deleted`, `uploaded_at`.
*   **Category:** `id`, `name`, `description`, `is_active`.
*   **RelatedSystem:** `id`, `name`, `description`, `is_active`.

## 6. API Contract Overview
*   `GET /api/requesters`: Fetch active requesters.
*   `GET /api/categories`: Fetch ticket categories.
*   `GET /api/related-systems`: Fetch related systems.
*   `POST /api/tickets`: Create a new ticket.
*   `GET /api/tickets`: Retrieve a list of tickets (with filters).
*   `GET /api/tickets/:id`: Retrieve a single ticket by ID.
*   `POST /api/tickets/:id/attachments`: Upload an attachment.
*   `GET /api/attachments/:id`: Get attachment metadata.
*   `GET /api/attachments/:id/download`: Download attachment file.
*   `POST /api/attachments/:id/remove`: Soft-remove attachment.

## 7. Data Design Decisions & Indexes justification
*   **Decisions:** Use UUIDs for `Ticket.id` and `Attachment.id` to prevent ID enumeration. Soft deletion for attachments ensures auditability.
*   **Indexes:**
    *   Index on `Ticket.requester_id` for fast filtering by user.
    *   Index on `Ticket.status` and `Ticket.priority` to optimize list filtering.
    *   Full-text index (or trigram index) on `Ticket.title` and `Ticket.description` for search performance.

## 8. Acceptance Criteria
*   **AC-01 (Create Ticket Success):** Given a valid ticket payload, When I submit a POST to `/api/tickets`, Then a new ticket is created and I receive a 201 Created response.
*   **AC-02 (Create Ticket Validation):** Given a payload missing the `title`, When I submit a POST to `/api/tickets`, Then I receive a 400 Bad Request with a validation error message.
*   **AC-03 (List Tickets Pagination):** Given 25 tickets in the database, When I request `/api/tickets?page=2&pageSize=10`, Then I receive tickets 11-20.
*   **AC-04 (Search Tickets):** Given tickets with titles "Login Issue" and "Hardware Failure", When I request `/api/tickets?search=Login`, Then I only receive the "Login Issue" ticket.
*   **AC-05 (Upload Attachment):** Given a valid PNG file under 5MB, When I upload it to a specific ticket, Then I receive a 201 Created and the file metadata is returned.
*   **AC-06 (Soft Remove Attachment):** Given an existing attachment, When I POST to its remove endpoint, Then its `is_deleted` flag becomes true and subsequent downloads return 404.
*   **AC-07 (Access Control):** Given I am logged in as User A, When I try to GET a ticket belonging to User B, Then I receive a 403 Forbidden.

## 9. Assumptions & Architectural Decisions
*   **Assumptions:** The client will handle multi-part form data for attachments correctly. Current user context is provided via a mock header (e.g., `X-Mock-User-Id`) for this lab.
*   **Architecture:** Layered architecture (Controller -> Service -> Repository). REST API for backend communication. React-based frontend using a defined design system.

## 10. Out of Scope / Deferred Items
*   Real-time WebSocket notifications for ticket updates (Deferred to Lab 4).
*   Integration with Active Directory for Requester sync (Out of Scope).
*   Automated ticket assignment routing rules (Deferred).

## 11. Definition of Done (DoD)
*   All code implemented and peer-reviewed.
*   Unit tests written and passing (>80% coverage).
*   API integration tests passing.
*   UI components match the design specification and are responsive.
*   No critical or high-severity bugs open.
*   Documentation (these specifications) is up-to-date and accurate.
