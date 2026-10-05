# Issue 6 Phase 1: Regression & Hardening Report

## Overview
This report verifies that the TokTickIT system remains fully functional after the changes introduced in Lab 4 (Sprint 4). All earlier increments (Lab 2 and Lab 3) have been executed alongside the newly developed Lab 4 features (Dashboards, Actions Taken, Concurrency Control, and Resolution Gate) to ensure no regressions occurred.

## 1. Test Suite Execution Summary
The automated test suites span the server (API), client (React UI), and end-to-end (Playwright) domains. 

| Suite | Previous Total (Lab 3) | New Total (Lab 4) | Result |
| :--- | :--- | :--- | :--- |
| Server API | ~70 | 128 | PASS (128/128) |
| Client UI | ~30 | 74 | PASS (74/74) |
| E2E | ~20 | 44 | PASS (44/44) |

### Key Regression Metrics
- No legacy tests were deleted.
- All mocked, vacuous, or comment-only tests were identified, rewritten into legitimate assertions, and verified.
- The `migration-integrity.test.ts` dynamically wiped and re-seeded the database into an isolated schema, verifying that structural data idempotency works.

## 2. Hardening and Security Summary
*   **IDOR Prevention Validation:**
    *   Attachment IDOR tests were created to strictly enforce ownership and role barriers. Requester B receives a 404 when attempting to download or delete Requester A's attachments.
    *   Legacy tests asserting 403 on unowned tickets were updated to reflect the superior 404 security practice implemented during Lab 3.
*   **Endpoint Role Restrictions:**
    *   The `GET /api/requesters` endpoint (originally public in Lab 2) was locked down to `IT_Staff` and `Administrator`.
*   **Authorization Matrix:**
    *   A rigorous 9x7 test suite (`authorization-matrix.api.test.ts`) algorithmically iterates over all 9 Lab 4 endpoints against 7 distinct user states, asserting exact status codes, and proving there are no unprotected backdoors or unintended role escalations.

## 3. Data Integrity & Concurrency
*   **Optimistic Concurrency Control (OCC):** The system reliably returns a `409 Conflict` across multiple tests (Actions Taken edits, Status transitions, confirm-resolved updates, owner, priority).
*   **Form Data Protection:** The Playwright smoke tests successfully abort the network offline, ensuring the user's typed data in the Create Ticket form survives the `fetch` failure without navigating away or losing context.

*Note: See the repository for exact git commits mapping back to the functional requirements.*
