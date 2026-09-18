# Lab 3 Specification: TokTickIT (Users, Roles, IT Staff Ticketing, Admin Screens)

## 1. Sprint Goal & Stakeholder Request
The primary goal of Lab 3 is to evolve the TokTickIT system from a rudimentary single-actor prototype into a secure, multi-role enterprise ticketing platform. Stakeholders require the implementation of formal Authentication and Role-Based Access Control (RBAC) to support three distinct user types: Requesters, IT Staff, and Administrators. This sprint delivers the foundational IT Staff operational views (queues, assignment, priority management) and Administrator management interfaces, alongside secure session-based identity resolution, completely replacing the previous hardcoded development identity selectors. 

## 2. Scope Included / Scope Excluded

**Scope Included:**
* User authentication (login/logout) and session management.
* Mandatory password change workflow for first-time logins.
* Strict Role-Based Access Control (RBAC) routing and API guards for Requesters, IT Staff, and Administrators.
* Seamless identity injection into Requester operations based on active sessions.
* IT Staff comprehensive ticket queue with advanced filtering, sorting, and pagination.
* IT Staff ticket operations: Assignment/Ownership, IT Priority adjustments, and Status transitions.
* Public Comments system accessible by Requesters, IT Staff, and Admins.
* Internal Notes system restricted exclusively to IT Staff and Admins.
* Administrator User Management console (Create, Edit, Deactivate, Reset Password).
* Data migration strategy to convert Lab 2 Requesters into standardized system Users.

**Scope Excluded:**
* Single Sign-On (SSO) or third-party OAuth integrations (e.g., Azure AD, Google Auth).
* Email or SMS notifications for ticket updates.
* Advanced SLAs (Service Level Agreements) and automated escalations.
* Reporting and Analytics dashboards.
* Two-Factor Authentication (2FA / MFA).
* Bulk user import/export functionality.

## 3. Functional Requirements (FR)

* **FR-01: User Authentication & Session Management**: The system shall provide secure login, session creation, validation, and logout capabilities using HTTP-only cookies or secure tokens.
* **FR-02: Mandatory First-Login Password Change**: Users flagged with `mustChangePassword` shall be forced to update their password immediately upon their first successful authentication before accessing any other system features.
* **FR-03: Role-Based Authorization Guards**: The system shall enforce strict access control based on user roles (`Requester`, `IT Staff`, `Administrator`) at both the API and UI levels.
* **FR-04: Requester Identity Integration**: The system shall automatically derive the `requesterId` from the authenticated user's session for all ticket creation and modification actions, removing any manual identity selection interfaces.
* **FR-05: IT Staff Ticket Queue & Advanced Filtering/Sorting**: IT Staff shall have access to a dedicated ticket queue supporting dynamic filtering (status, category, priority, assignee) and column sorting.
* **FR-06: IT Staff Ticket Assignment & Ownership**: IT Staff shall be able to assign tickets to themselves or reassign them to other active IT Staff or Administrators.
* **FR-07: IT Staff IT Priority Overrides**: IT Staff shall be able to set and modify an internal "IT Priority" distinct from the user's "Requested Priority".
* **FR-08: IT Staff Ticket Status Transitions Matrix**: IT Staff shall be able to transition ticket statuses following a defined lifecycle matrix (e.g., New -> Open -> In Progress -> Resolved).
* **FR-09: Public Comments**: Requesters, IT Staff, and Admins shall be able to append public comments to a ticket.
* **FR-10: Internal Notes**: IT Staff and Admins shall be able to append internal notes to a ticket. Requesters must have no visibility or knowledge of these notes.
* **FR-11: Admin User Management**: Administrators shall be able to search for users, create new user accounts, modify existing user details (role, active status), and issue password resets.
* **FR-12: Data Migration & Seed Data**: The system must seamlessly convert existing Lab 2 "Requesters" into formal "User" records with appropriate default credentials, maintaining all existing ticket associations.

## 4. Business Rules (BR)

* **BR-01: Authentication Credential Validation & Password Hashing**: Passwords must be securely hashed using standard algorithms (bcrypt or argon2). Authentication failures must return generic error messages (e.g., "Invalid credentials") to prevent user enumeration attacks.
* **BR-02: Session Security & Expiration**: Sessions must be securely scoped and expire automatically after a predefined period of inactivity (e.g., 2 hours) or absolute time limit (e.g., 24 hours).
* **BR-03: First-Login & Reset Password Policy**: Newly created users or users who have had their password reset by an admin must have the `mustChangePassword` flag set to `true`. Passwords must meet complexity requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.
* **BR-04: Inactive Account Lockout**: Users with an `isActive` flag set to `false` are strictly prohibited from logging in or maintaining active sessions.
* **BR-05: Single Unique Email Constraint**: The system must enforce unique email addresses across all user accounts.
* **BR-06: Session-Driven Requester Identity**: APIs accepting ticket submissions must reject any requests containing an explicit `requesterId`. The identity must strictly map from the validated session token.
* **BR-07: Ticket Ownership & Assignment**: Tickets can only be assigned to users possessing the `IT Staff` or `Administrator` roles who are currently active (`isActive: true`).
* **BR-08: Dual Priority Model**: The `requestedPriority` is set by the Requester and remains immutable after submission. The `itPriority` is managed solely by IT Staff and dictates the actual queue ordering.
* **BR-09: Public Comments Rules**: Public comments are append-only. Once submitted, they cannot be edited or deleted. They cannot be empty.
* **BR-10: Internal Notes Confidentiality**: Internal notes are append-only. APIs serving internal notes must return a 403 Forbidden or 404 Not Found to Requesters, ensuring no leakage of internal operational metadata.
* **BR-11: Ticket Status Lifecycle & Transition Matrix**: Valid status flow must be enforced:
  * `New` -> `Open` (upon assignment or initial review)
  * `Open` -> `In Progress`
  * `In Progress` <-> `Waiting for Requester`
  * `In Progress` / `Open` -> `Resolved`
  * `Resolved` -> `Closed` (by Admin/System) or `Reopened` (if Requester contests resolution)
  * `New` / `Open` -> `Cancelled`
* **BR-12: Requester "Problem Appears Resolved" action**: Requesters can indicate resolution, but this action places the ticket in a specific intermediate state (e.g., `Resolved`) requiring final IT Staff/Admin verification before transitioning to `Closed`.
* **BR-13: Admin Safety Guard 1 (Self-deactivation prevention)**: An Administrator cannot set their own `isActive` flag to `false`.
* **BR-14: Admin Safety Guard 2 (Last active Administrator protection)**: The system must block any action (deactivation, role change, deletion) that would result in zero active Administrators in the system.
* **BR-15: Single Role Assignment per User**: A user can hold exactly one role at any given time (`Requester`, `IT Staff`, or `Administrator`).
* **BR-16: Admin Separation of Duties**: The `Administrator` role includes all `IT Staff` capabilities, but Admins do not bypass ticket assignment rules (they must assign a ticket to themselves to work on it).
* **BR-17: Soft-Removal Attachment rules**: Deleting an attachment only performs a soft-delete (flagged as removed), preserving the audit trail. (Carried over from Lab 2).
* **BR-18: Validation & Failure Handling**: All API endpoints must execute strict input validation and return standard 400 Bad Request responses with detailed field-level error arrays on failure.
* **BR-19: Backward Compatibility & Lab 2 Regression Safety**: Changes must not break the core ticket submission workflow established in Lab 2, aside from the identity integration modifications.
* **BR-20: Data Migration Integrity**: Existing tickets must retain their foreign keys mapped to the newly migrated User IDs. No data loss is permitted during the Requester-to-User schema transition.

## 5. Data Changes

**New Entities:**
* **`User`**: Replaces the isolated `Requester` concept. 
  * Fields: `id`, `email` (unique), `passwordHash`, `firstName`, `lastName`, `role` (enum), `isActive` (boolean), `mustChangePassword` (boolean), `createdAt`, `updatedAt`.
* **`Comment`** (Public): 
  * Fields: `id`, `ticketId` (FK), `authorId` (FK -> User), `content`, `createdAt`.
* **`InternalNote`** (Private):
  * Fields: `id`, `ticketId` (FK), `authorId` (FK -> User), `content`, `createdAt`.

**Modified Entities:**
* **`Ticket`**:
  * Modify: `requesterId` now references `User.id`.
  * Add: `ticketOwnerId` (FK -> User, nullable).
  * Add: `itPriority` (enum: Low, Medium, High, Critical, nullable/default).
  * Expand `status` enum to support new lifecycle states.

**Migration Strategy:**
A migration script will be required to seed initial admin accounts and transform existing Lab 2 `Requester` records into `User` records with the `Requester` role, generating default secure passwords and setting `mustChangePassword = true`.

## 6. API Contract Overview

* **Auth**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/change-password`
* **IT Staff Operations**:
  * Queue: `GET /api/tickets/queue` (Requires IT Staff/Admin)
  * Assignment: `PATCH /api/tickets/:id/owner`
  * Priority: `PATCH /api/tickets/:id/priority`
  * Status: `PATCH /api/tickets/:id/status`
* **Comments & Notes**:
  * `GET/POST /api/tickets/:id/comments` (Accessible by Requester/Staff/Admin)
  * `GET/POST /api/tickets/:id/internal-notes` (Accessible by Staff/Admin ONLY)
* **Admin Management**: `/api/admin/users` (CRUD operations, Reset Pass, Requires Admin)

## 7. Data Design Decisions, Indexes & Migration Strategy Justification

### 7.1 Foreign Key Relationships (FKs)
* **`Ticket.requesterId` -> `User.id`**: Mandatory relationship mapping ticket ownership to an active user (`onDelete: Restrict`).
* **`Ticket.ticketOwnerId` -> `User.id`**: Optional reference mapping assigned IT Staff or Administrator (`onDelete: SetNull`).
* **`Comment.ticketId` -> `Ticket.id` & `Comment.authorId` -> `User.id`**: Public comment threads linked to tickets and authors (`onDelete: Cascade` on ticket deletion).
* **`InternalNote.ticketId` -> `Ticket.id` & `InternalNote.authorId` -> `User.id`**: Staff-only internal notes linked to tickets and authors (`onDelete: Cascade` on ticket deletion).

### 7.2 Database Indexes Justification
* **`User(email)`**: Unique index for fast authentication lookups and duplicate account prevention.
* **`User(role)`**, **`User(isActive)`**: Performance optimization for filtered user list queries in Admin User Management.
* **`Ticket(requesterId)`**: Index optimizing "My Tickets" queries for Requesters.
* **`Ticket(ticketOwnerId)`**: Index optimizing "My Assigned Tickets" queue views for IT Staff.
* **`Ticket(currentStatus)`**, **`Ticket(itPriority)`**: Indexes supporting multi-column filtering and sorting on the IT Staff Ticket Queue.
* **`Comment(ticketId)`**, **`InternalNote(ticketId)`**: Indexes ensuring fast retrieval of conversation and note threads when loading ticket detail views.

### 7.3 Data Migration Strategy (Zero-Data-Loss Backfill)
To transition from Lab 2 to Lab 3 without breaking existing legacy data or foreign key constraints:
1. **Fallback User Creation**: Insert a default legacy user (`default_requester@toktickit.com`) with role `Requester`.
2. **Nullable Column Addition**: Temporarily add `requesterId` as a nullable column to the `Ticket` table.
3. **Legacy Data Backfill**: Run SQL `UPDATE` statement to associate all 21 pre-existing Lab 2 tickets with the fallback user ID.
4. **Constraint Enforcement**: Alter `requesterId` to `NOT NULL` and establish Foreign Key constraints and indexes.
5. **Idempotent Seeding**: Run `prisma/seed.ts` using `upsert` operations to populate Lab 3 accounts and sample data without corrupting or duplicating legacy records.

## 8. Acceptance Criteria (AC)

* **AC-01**: Given a user with valid credentials, When they attempt to log in, Then a secure session is established and they are routed to their role-specific dashboard.
* **AC-02**: Given a user flagged with `mustChangePassword`, When they successfully authenticate, Then they are strictly redirected to the Change Password screen and cannot access other API endpoints until completed.
* **AC-03**: Given a Requester submitting a ticket, When the API request is processed, Then the system automatically assigns their `User.id` from the session to the ticket's `requesterId`, ignoring any manually injected ID.
* **AC-04**: Given an active IT Staff member, When they view the Ticket Queue, Then they see a paginated list of tickets and can filter by Status, Priority, Category, and Assignee.
* **AC-05**: Given an IT Staff member viewing a ticket, When they update the `itPriority` or `ticketOwnerId`, Then the changes are saved and reflected immediately in the UI.
* **AC-06**: Given an IT Staff member, When they add an Internal Note to a ticket, Then it is saved successfully. Given a Requester viewing the same ticket, Then the Internal Note is completely invisible and API requests for notes return 403/404.
* **AC-07**: Given a Requester viewing their own ticket, When they submit a Public Comment, Then the comment is appended and visible to all parties.
* **AC-08**: Given an Administrator viewing the User Management screen, When they create a new user, Then the user is saved with a default password, correct role, and `mustChangePassword` set to true.
* **AC-09**: Given an Administrator attempting to deactivate the last active Admin account, When the request is sent, Then the system blocks the action and returns a 400 Bad Request error.
* **AC-10**: Given an inactive User, When they attempt to log in, Then they are denied access with an appropriate generic authentication failure message.

## 9. Assumptions & Architectural Decisions

* **Session Management**: We assume the use of standard secure HTTP-only cookies or Bearer JWTs depending on framework preferences, standardizing on stateless or redis-backed sessions.
* **Soft Deletes**: Users and Tickets are never hard-deleted from the database to preserve historical auditing; they are only marked inactive or closed.
* **Passwords**: Application will strictly avoid storing plaintext passwords; bcrypt with a salt rounds value of 10+ is assumed.

## 10. Out of Scope / Deferred Items

* Email notifications triggered by status changes or comments.
* Ticket merging or splitting.
* Granular permission sets (capabilities) beyond basic Role definitions.
* End-user profile picture uploads.

## 11. Definition of Done (DoD)

* All Functional Requirements are implemented and meet the defined Business Rules.
* Database schema migrations are written, tested, and execute without data loss.
* All specified API endpoints are implemented, documented (Swagger/OpenAPI or API Spec), and pass integration tests.
* The UI implements all mockups with adherence to the design system and responsive breakpoints.
* Unit, Integration, and E2E tests are written and passing, mapping back to the Traceability Matrix.
* Code is peer-reviewed, merged into the main branch, and deploys successfully to the staging environment.
