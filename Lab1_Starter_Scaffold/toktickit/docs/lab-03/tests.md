# Lab 3 Test Strategy & Cases: TokTickIT

## 1. Test Strategy & Coverage
The testing strategy for Lab 3 focuses heavily on Authorization, RBAC boundaries, and data isolation. 
* **Unit Tests**: Focus on password hashing utilities, complex validation logic, and status transition matrices.
* **API Integration Tests**: Ensure endpoints correctly enforce role guards, rejecting Requesters from Staff endpoints, and validating data injection (Session ID vs Body payload).
* **UI Component Tests**: Verify role-based conditional rendering in the Navigation and layouts.
* **E2E Testing**: Cover the critical paths: First-time login forced password change, Admin user creation, and IT Staff ticket resolution workflows.

## 2. Planned Test Cases Table

| Test ID | Type | Req / AC Mapping | Test Description | Expected Result | Target Test File Path | Final Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UT-01** | `Unit` | BR-01 | Password hashing & comparison logic | bcrypt Hash & Verify correctly | `server/src/utils/hash.test.ts` | Pass |
| **REG-01** | `Migration/Regression` | Sec 5.2 | Lab 2 Requester & Ticket data continuity | Existing tickets remain accessible after auth migration | `server/tests/lab-03/migration.api.test.ts` | Pass |
| **SEC-01** | `Security/Authorization` | BR-04, AC-04 | Access to Internal Notes without IT_Staff role | Return 403 Forbidden / 404 | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **UI-01** | `UI Style` | Sec 7 | Zen Green badge & color token consistency | Render correct status & priority badges | `client/src/components/Badge.test.tsx` | Pass |
| **RESP-01**| `Responsive` | Sec 7, Sec 8 | Navigation & Table layout on Mobile/Tablet | No horizontal overflow; responsive layout | `e2e/lab-03/responsive.spec.ts` | Pass |
| **T-001** | `Unit / API` | FR-01, AC-01, BR-01, BR-02 | Login with valid credentials | 200 OK, returns session JWT token | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **T-002** | `Migration/Regression` | FR-01, AC-10, BR-03, BR-04 | Login with invalid credentials or inactive user | 401 Unauthorized / 403 Forbidden | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **T-003** | `Security/Authorization` | FR-02, AC-02, BR-03 | API access with `mustChangePassword=true` | 403 Forbidden, prompt to change password | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **T-004** | `API` | FR-04, AC-03 | Submit ticket with explicit `requesterId` in body | API ignores body ID, uses Session ID | `server/tests/lab-03/ticket.creation.test.ts` | Pass |
| **T-005** | `API` | FR-08, AC-06, BR-10 | Requester attempts to fetch internal notes | 403 Forbidden / Hidden from API | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **T-006** | `API` | FR-07, AC-05, BR-11 | IT Staff attempts invalid status transition (New to Closed) | 409 Conflict | `server/tests/lab-03/ticket.status.test.ts` | Pass |
| **T-007** | `API` | FR-12, AC-09, BR-13, BR-14 | Admin deactivates last active Admin | 400 Bad Request, safety guard blocks | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **T-008** | `UI` | FR-03 | Render Admin navigation for IT Staff user | Navigation links are not rendered | `client/src/tests/lab-03/Navigation.test.tsx` | Pass |
| **T-009** | `E2E` | FR-02, AC-02, BR-03, BR-06 | E2E flow: First login forced password change | User cannot skip change screen, login completes after | `e2e/lab-03/authentication.spec.ts` | Pass |
| **T-010** | `E2E` | FR-05, FR-06, AC-03, AC-04, AC-05, BR-08, BR-09 | E2E flow: IT Staff takes ownership of ticket & filters queue | Ticket owner updates, UI reflects change | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **T-011** | `API` | FR-09, AC-07, BR-07 | Requester posts public comment on their own ticket | 201 Created with comment object and author info | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **T-012** | `API` | FR-11, AC-08, BR-12, BR-15 | Admin creates new IT Staff user with initial password | 201 Created with user object and mustChangePassword set to true | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **T-013** | `API` | FR-03 | Unauthenticated user accesses IT Staff queue | 401 Unauthorized | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **T-014** | `API` | FR-03 | Requester accesses IT Staff queue | 403 Forbidden | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **T-015** | `API` | FR-05, AC-04 | IT Staff fetches queue (happy path) | 200 OK, paginated list with owner mapped | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **T-016** | `API` | FR-05, AC-04 | IT Staff fetches empty queue | 200 OK, empty data array | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **T-017** | `API` | FR-05, AC-04 | IT Staff fetches queue with invalid query params | 200 OK, ignores invalid params | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **T-018** | `API` | FR-05, AC-04 | IT Staff fetches queue with out-of-range page | 200 OK, empty data array on specified page | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **T-019** | `API` | FR-05, AC-04 | Regression test: /queue is not swallowed by /:id | 200 OK, avoids 400 Invalid ticket ID | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **T-020** | `UI` | FR-05, AC-04 | StaffTicketQueue renders filters including Category and Owner | Filters are present in document | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **T-021** | `UI` | FR-05, AC-04 | StaffTicketQueue renders table rows with ticket data | Ticket row and summary displayed | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **T-022** | `UI` | FR-05, AC-04 | StaffTicketQueue displays empty state | "No tickets in queue" message rendered | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **T-023** | `UI` | FR-05, AC-04 | StaffTicketQueue displays no-results state | "No matching tickets" message rendered | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **T-024** | `UI` | FR-05, AC-04 | StaffTicketQueue displays error state | Error alert message rendered | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |

## 3. AC & BR Traceability Matrix

* **AC-01** (Login Success): T-001
* **AC-02** (Forced Password Change): T-003, T-009
* **AC-03** (Session Identity Injection): T-004
* **AC-04** (IT Staff Queue Filtering): T-010 (Implicit in Queue E2E)
* **AC-05** (IT Staff Updates): T-010
* **AC-06** (Internal Note Privacy): T-005
* **AC-07** (Public Comments): T-011
* **AC-08** (Admin Create User): T-012
* **AC-09** (Admin Safety Guard): T-007
* **AC-10** (Inactive Login Block): T-002

### Business Rules Traceability
* **BR-01 & BR-02** (Authentication Credential Validation & Password Hashing / Session Expiration): T-001, UT-01
* **BR-03 & BR-06** (First-Login Password Policy & Session-Driven Requester Identity): T-003, T-004, T-009
* **BR-04** (Inactive Account Lockout): T-002
* **BR-05** (Single Unique Email Constraint): T-012
* **BR-07** (Ticket Ownership & Active Staff/Admin Assignment): T-010
* **BR-08** (Dual Priority Model - Requested vs IT Priority): T-010
* **BR-09** (Public Comments Rules): T-011
* **BR-10** (Internal Notes Confidentiality): T-005, SEC-01
* **BR-11** (Ticket Status Lifecycle Matrix): T-006
* **BR-12** (Requester Intermediate Resolution Verification): T-010
* **BR-13** (Admin Safety Guard 1 - Self-Deactivation Prevention): T-007
* **BR-14** (Admin Safety Guard 2 - Last Active Administrator Protection): T-007
* **BR-15** (Single Role Assignment per User): T-008, T-012
* **BR-16** (Admin Separation of Duties & Assignment Rules): T-008, T-010
* **BR-17** (Soft-Removal Attachment Audit Trail): REG-01
* **BR-18** (Validation & Failure Handling - Standard 400 Bad Request): T-017, T-018
* **BR-19** (Backward Compatibility & Lab 2 Regression Safety): REG-01
* **BR-20** (Data Migration Integrity & Foreign Key Preservation): REG-01

## 4. Test File Directory Structure

**Backend (Server)**
* `server/tests/lab-03/auth.test.ts`
* `server/tests/lab-03/auth.middleware.test.ts`
* `server/tests/lab-03/ticket.creation.test.ts`
* `server/tests/lab-03/notes.auth.test.ts`
* `server/tests/lab-03/ticket.status.test.ts`
* `server/tests/lab-03/admin.safety.test.ts`

**Frontend (Client)**
* `client/src/tests/lab-03/Navigation.test.tsx`
* `client/src/tests/lab-03/AuthGuards.test.tsx`
* `client/src/tests/lab-03/StaffTicketDetail.test.tsx`

**End-to-End (Playwright/Cypress)**
* `e2e/lab-03/auth.spec.ts`
* `e2e/lab-03/staff.queue.spec.ts`
* `e2e/lab-03/admin.users.spec.ts`
