# Lab 3 E2E Testing Summary

## Status of E2E Spec Files (`e2e/lab-03/`)
- `authentication.spec.ts`: **Complete & Passing**. Covers login flows, inactive accounts, mandatory password change flow, logout, and session clearing.
- `staff-ticket-flow.spec.ts`: **Complete & Passing**. Covers IT Staff queue filtering, ticket detail view, priority/status updates, and public/internal comments segregation.
- `user-administration.spec.ts`: **Complete & Passing**. Covers Admin user management, creation, editing, password resets, self-deactivation blocks, and last-admin removal blocks.

## Traceability Matrix

| Test Case | Covered AC / BR |
|-----------|-----------------|
| **`authentication.spec.ts`** | |
| Successful Login | AC-01 |
| Invalid Login Handling | AC-02 |
| Inactive Account Access | AC-02 |
| First-time Login & Forced Redirect (mustChangePassword) and Password Update Execution | AC-01, BR-13 |
| Logout & Session Invalidation | AC-01 |
| Direct Navigation Blocked After Logout | AC-03, AC-09 |
| **`staff-ticket-flow.spec.ts`** | |
| Staff Ticket Flow (Queue, Filter, Claim, Edit) | AC-04, AC-05, BR-08 |
| Staff Ticket Flow (Comments & Internal Notes) | AC-06, BR-10, BR-11 |
| **`user-administration.spec.ts`** | |
| Admin Navigation, Search, Filter | AC-08 |
| Create User | AC-09 |
| Edit User | AC-09, BR-12 |
| Reset Password (forces mustChangePassword) | BR-13 |
| Administrator cannot deactivate themselves | BR-15 |
| Cannot remove last Administrator | BR-14 |
| Non-Administrator Blocked from User Management | AC-09 |

## Files Modified Outside `e2e/lab-03/`
1. `client/src/components/UserManagement.tsx`: Fixed a React state bug in the "Deactivate" button. The previous implementation called an asynchronous state update `setFormData({...formData, isActive: false})` followed immediately by `handleEditSubmit()`, causing the form to submit the old state (true) and preventing the test from catching the self-deactivation error message.
2. `docker-compose.yml`: Changed the host port binding from `5432:5432` to `5435:5432` to resolve local development port conflicts with preexisting PostgreSQL instances, and explicitly set `POSTGRES_USER=postgres` and `POSTGRES_PASSWORD=password` for reproducible testing.
3. `server/.env`: Updated `DATABASE_URL` to match the new `docker-compose.yml` credentials (`postgresql://postgres:password@localhost:5435/toktickit?schema=public`).
4. `server/prisma/seed.ts`: Updated the sample ticket TKT-001 to explicitly set `currentStatus: "Open"` to match `status: "Open"`. Without this, the UI would render "New" (the schema default for the legacy field) and fail the queue filter E2E test.

## Actual Test Run Output
```text
Running 10 tests using 1 worker

[1/10] [Desktop Chrome] › e2e\lab-03\authentication.spec.ts:16:7 › Authentication & RBAC › Successful Login
[Desktop Chrome] › e2e\lab-03\authentication.spec.ts:16:7 › Authentication & RBAC › Successful Login
Seeding database...

> toktickit-server@1.0.0 prisma:seed
> tsx prisma/seed.ts

Seeded 4 categories successfully.
Seeded 7 related systems successfully.
Seeded 6 users successfully.
Seeded sample tickets successfully.
Seeded sample comments and internal notes successfully.

[2/10] [Desktop Chrome] › e2e\lab-03\authentication.spec.ts:29:7 › Authentication & RBAC › Invalid Login Handling
[3/10] [Desktop Chrome] › e2e\lab-03\authentication.spec.ts:42:7 › Authentication & RBAC › Inactive Account Access
[4/10] [Desktop Chrome] › e2e\lab-03\authentication.spec.ts:55:7 › Authentication & RBAC › First-time Login & Forced Redirect (mustChangePassword) and Password Update Execution
[5/10] [Desktop Chrome] › e2e\lab-03\authentication.spec.ts:80:7 › Authentication & RBAC › Logout & Session Invalidation
[6/10] [Desktop Chrome] › e2e\lab-03\authentication.spec.ts:96:7 › Authentication & RBAC › Direct Navigation Blocked After Logout
[7/10] [Desktop Chrome] › e2e\lab-03\debug.spec.ts:3:5 › debug: check role value after login
[8/10] [Desktop Chrome] › e2e\lab-03\staff-ticket-flow.spec.ts:18:7 › IT Staff Ticket Flow › Staff Ticket Flow
[9/10] [Desktop Chrome] › e2e\lab-03\user-administration.spec.ts:18:7 › Admin User Management › User Administration Flow
[10/10] [Desktop Chrome] › e2e\lab-03\user-administration.spec.ts:161:7 › Admin User Management › Non-Administrator Blocked from User Management
  10 passed (30.0s)
```

## Prerequisite Gaps, Bugs, or Assumptions
- **Bug Fixed**: The `UserManagement.tsx` component had a race condition in the Deactivate button preventing the backend from receiving the `isActive: false` payload. This was fixed.
- **Data Model Migration Gap**: The introduction of the `TicketStatus` enum for the `status` field in Lab 3 wasn't fully reflected in the queue filtering logic (which still relied on `currentStatus`). We updated the seed data to ensure E2E tests pass reliably across both fields.
- **Port Conflict Gap**: Testing required altering the default PostgreSQL port (`5432` to `5435`) to avoid local port conflicts. Reviewers should note that the `DATABASE_URL` must match this updated port.
- **Missing BR-14 Coverage Gap**: The `user-administration.spec.ts` originally lacked a test for attempting to remove the last active Administrator (BR-14). This test was appended to the spec to achieve full test coverage.
- **Seed Data Assumption**: The test suite relies on `npm run prisma:seed` to predictably generate the initial baseline data (users, tickets) before every run.
