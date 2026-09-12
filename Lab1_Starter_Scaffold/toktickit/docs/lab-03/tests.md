# Lab 3 Test Strategy & Cases: TokTickIT

## 1. Test Strategy & Coverage
The testing strategy for Lab 3 focuses heavily on Authorization, RBAC boundaries, and data isolation. 
* **Unit Tests**: Focus on password hashing utilities, complex validation logic, and status transition matrices.
* **API Integration Tests**: Ensure endpoints correctly enforce role guards, rejecting Requesters from Staff endpoints, and validating data injection (Session ID vs Body payload).
* **UI Component Tests**: Verify role-based conditional rendering in the Navigation and layouts.
* **E2E Testing**: Cover the critical paths: First-time login forced password change, Admin user creation, and IT Staff ticket resolution workflows.

## 2. Planned Test Cases Table

| Test ID | Type | Req/AC Mapping | Test Description | Expected Result | Target Test File Path |
|---------|------|----------------|------------------|-----------------|-----------------------|
| T-001 | API | FR-01, AC-01, BR-01, BR-02 | Login with valid credentials | 200 OK, returns session token | `server/tests/lab-03/auth.test.ts` |
| T-002 | API | FR-01, AC-10, BR-03 | Login with invalid credentials or inactive user | 401/403, generic error message | `server/tests/lab-03/auth.test.ts` |
| T-003 | API | FR-02, AC-02 | API access with `mustChangePassword=true` | 403 Forbidden, prompt to change password | `server/tests/lab-03/auth.middleware.test.ts` |
| T-004 | API | FR-04, AC-03 | Submit ticket with explicit `requesterId` in body | API ignores body ID, uses Session ID | `server/tests/lab-03/ticket.creation.test.ts` |
| T-005 | API | FR-08, AC-06, BR-10 | Requester attempts to fetch internal notes | 403 Forbidden | `server/tests/lab-03/notes.auth.test.ts` |
| T-006 | API | FR-07, AC-05, BR-11 | IT Staff attempts invalid status transition (New to Closed) | 409 Conflict | `server/tests/lab-03/ticket.status.test.ts` |
| T-007 | API | FR-12, AC-09, BR-13, BR-14 | Admin deactivates last active Admin | 400 Bad Request, safety guard blocks | `server/tests/lab-03/admin.safety.test.ts` |
| T-008 | UI | FR-03 | Render Admin navigation for IT Staff user | Navigation links are not rendered | `client/src/tests/lab-03/Navigation.test.tsx` |
| T-009 | E2E | FR-02, AC-02, BR-05, BR-06 | E2E flow: First login forced password change | User cannot skip change screen, login completes after | `e2e/lab-03/auth.spec.ts` |
| T-010 | E2E | FR-05, FR-06, AC-03, AC-04, BR-08, BR-09 | E2E flow: IT Staff takes ownership of ticket | Ticket owner updates, UI reflects change | `e2e/lab-03/staff.queue.spec.ts` |
| T-011 | API | FR-09, AC-07, BR-07 | Requester posts public comment on their own ticket | 201 Created with comment object and author info | `server/tests/lab-03/comments-notes.api.test.ts` |
| T-012 | API | FR-11, AC-08, BR-12, BR-15 | Admin creates new IT Staff user with initial password | 201 Created with user object and mustChangePassword set to true | `server/tests/lab-03/users-admin.api.test.ts` |

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
* **BR-01 & BR-02** (Password Hashing & Auth Credentials): T-001
* **BR-03** (Inactive Account Login Prevention): T-002
* **BR-05 & BR-06** (MustChangePassword Enforcement & Session-Driven Identity): T-009
* **BR-07** (Public Comment Access): T-011
* **BR-08 & BR-09** (IT Staff Ticket Claiming & Priority Operations): T-010
* **BR-10** (Internal Notes Confidentiality - Staff/Admin Only): T-005
* **BR-11** (Ticket Status Lifecycle Matrix): T-006
* **BR-12 & BR-15** (Admin User Management & Default Credential Rules): T-012
* **BR-13 & BR-14** (Admin Safety Guards - Self-Deactivation & Last Admin Protection): T-007

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
