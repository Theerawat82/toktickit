# Lab 4: Sprint 4 - Test Plan

| Test ID | Type | Requirement/AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | API | FR-01, AC-01 | IT Staff creating an Action Taken | Record is saved, linked to ticket, `performedById` is securely derived from session. | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-02** | API | BR-04, AC-02 | Validation: `followUpRequired` true but `followUpNote` missing | Request is rejected with 400 Bad Request error. | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-03** | API | FR-02, BR-05, AC-03 | Role rejection: Requester attempts to create an Action Taken | Request is rejected with 403 Forbidden. | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **TEST-04** | UI | FR-01, FR-02, AC-03 | Action Taken UI visibility based on roles | IT Staff see creation form; Requesters only see read-only list. | `client/tests/lab-04/TicketDetail.test.tsx` | Pass |
| **TEST-05** | API | FR-06, BR-07, AC-05 | Ticket Workflow: Concurrent updates to a Ticket | Second update with stale `version` is rejected with 409 Conflict. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **TEST-06** | API | FR-05, BR-06, AC-04 | Resolution Gate: Requester marks issue as resolved | `requesterConfirmedResolved` is set to true, `currentStatus` is unchanged. | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **TEST-07** | E2E | FR-05, BR-06 | Resolution Gate UI flow for Requesters | Resolving via UI sets flag, shows success message, but ticket status remains unaffected. | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **TEST-08** | API | FR-03, AC-06 | IT Staff Dashboard metrics calculation | Returns correct aggregated counts for unassigned, assigned, status, and priority. | `server/tests/lab-04/dashboards.api.test.ts` | Pass |
| **TEST-09** | API | FR-04 | Requester Dashboard metrics scoping | Returns aggregate counts *only* for the authenticated requester's tickets. | `server/tests/lab-04/dashboards.api.test.ts` | Pass |
| **TEST-10** | UI | FR-03, AC-06 | IT Staff Dashboard rendering | Metric cards and recent tickets table render correctly with mock data. | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **TEST-11** | UI | FR-04 | Requester Dashboard rendering | Metric cards render correctly and omit IT Staff specific elements. | `client/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| **TEST-12** | E2E | FR-01, FR-03 | Full Actions Taken and Dashboard Flow (Staff) | Creating an action taken correctly updates the relevant dashboard metrics for IT Staff. | `e2e/lab-04/staff-workflow.spec.ts` | Pass |
| **TEST-13** | Regress | Labs 1-3 | Authentication & Authorization | Users can login, logout, and access control remains intact for endpoints. | `e2e/regression/auth.spec.ts` | Pass |
| **TEST-14** | Regress | Labs 1-3 | Public Comments & Internal Notes | Comments/Notes can still be added and are correctly scoped by user roles. | `e2e/regression/ticket-comments.spec.ts` | Pass |
| **TEST-15** | Regress | Labs 1-3 | Ticket Attachments | File uploads and downloads continue to function correctly. | `e2e/regression/ticket-attachments.spec.ts` | Pass |

| **TEST-16** | E2E | BR-09, Issue 6 | Duplicate Form Submission Protection | Double-clicking submit creates only one ticket/action. | `e2e/lab-04/regression-smoke.spec.ts` | Pass |
| **TEST-17** | E2E | Form Integrity | Form Data Protection on Network Error | Values remain in form fields if the network fails or API returns 400/500. | `e2e/lab-04/regression-smoke.spec.ts` | Pass |
| **TEST-18** | API | Issue 6 | Duplicate DB Submit Lock (`pg_advisory_xact_lock`) | Concurrent API requests for the same payload result in one 201 and one 200. | `server/tests/lab-04/actions-duplicate.test.ts` | Pass |
| **TEST-19** | API | Issue 6 | Performance Smoke Test (N+1 Prevention) | Fetching tickets queue takes < 1000ms. | `server/tests/lab-04/performance-smoke.test.ts` | Pass |
| **TEST-20** | API | Issue 6 | Migration Integrity Test | The database can be wiped and seeded repeatedly without failure. | `server/tests/lab-04/migration-integrity.test.ts` | Pass |
