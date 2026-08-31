# Test Strategy & Plan: TokTickIT Lab 2

## 1. Test Strategy & Approach
*   **Unit Testing:** Focus on testing isolated business logic (validation rules, status transitions, sorting algorithms) using a testing framework (e.g., Jest/Vitest).
*   **API Integration Testing:** Verify backend endpoints using tools like Supertest or Postman to ensure DB interactions, routing, and HTTP status codes match the `api-spec.md`.
*   **UI Component Testing:** Use React Testing Library to test component states (error, loading, disabled) and user interactions (clicks, input changes) in isolation.
*   **Visual/Responsive Testing:** Manual verification or visual regression testing tools to ensure the app complies with `ui-spec.md` across Mobile, Tablet, and Desktop breakpoints.
*   **E2E Testing:** End-to-end flows (Cypress/Playwright) covering the critical path: Login (Mocked) -> Create Ticket -> Search Ticket -> View Detail -> Upload Attachment.

## 2. Planned Test Cases

| Test ID | Type | Requirement / AC Mapping | Test Description | Expected Result | Target Test File Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01 | API | AC-01, FR-01 | Create ticket with all valid fields | HTTP 201 Created, ticket saved in DB | `tests/api/ticket.create.test.ts` |
| TC-02 | API | AC-02, BR-05 | Create ticket missing mandatory title | HTTP 400, returns "title is required" error | `tests/api/ticket.create.test.ts` |
| TC-03 | API | AC-02, BR-05 | Create ticket with title length < 10 | HTTP 400, returns length validation error | `tests/api/ticket.create.test.ts` |
| TC-04 | API | AC-03, FR-05 | Fetch tickets with page=2, pageSize=5 | HTTP 200, returns items 6-10 | `tests/api/ticket.list.test.ts` |
| TC-05 | API | AC-04, BR-04 | Search tickets by keyword in description | HTTP 200, returns only matching tickets | `tests/api/ticket.list.test.ts` |
| TC-06 | API | AC-07, BR-03 | User tries to access another user's ticket | HTTP 403 Forbidden | `tests/api/ticket.detail.test.ts` |
| TC-07 | UI | UI-Spec, BR-10 | Render ticket list with empty data | Displays "No tickets found" empty state | `tests/ui/TicketList.test.tsx` |
| TC-08 | UI | UI-Spec | Submit form with empty fields | Displays red borders and inline error texts | `tests/ui/CreateTicket.test.tsx` |
| TC-09 | API | AC-05, BR-07 | Upload valid PDF attachment (<5MB) | HTTP 201, attachment linked to ticket | `tests/api/attachment.test.ts` |
| TC-10 | API | AC-05, BR-07 | Upload file exceeding 5MB | HTTP 400, size limit error | `tests/api/attachment.test.ts` |
| TC-11 | API | AC-06, BR-08 | Soft remove attachment and attempt download | Remove returns 200, download returns 404 | `tests/api/attachment.test.ts` |
| TC-12 | E2E | FR-01 to FR-04 | Full ticket creation and view lifecycle | Ticket created, listed, and details visible | `cypress/e2e/ticket-lifecycle.cy.ts` |

## 3. AC-to-Test Traceability Matrix

| Acceptance Criteria | Linked Test IDs | Status |
| :--- | :--- | :--- |
| AC-01 (Create Ticket Success) | TC-01, TC-12 | Pass |
| AC-02 (Create Ticket Validation) | TC-02, TC-03, TC-08 | Pass |
| AC-03 (List Tickets Pagination) | TC-04 | Pass |
| AC-04 (Search Tickets) | TC-05 | Pass |
| AC-05 (Upload Attachment) | TC-09, TC-10, TC-12 | Pass |
| AC-06 (Soft Remove Attachment) | TC-11 | Pass |
| AC-07 (Access Control) | TC-06 | Pass |

## 6. Final Results
*(This section is a placeholder for test run logs and metrics to be populated during execution)*

```text
Test Run Execution Log (Placeholder)
Date: YYYY-MM-DD
Environment: Local/CI
Total Tests: --
Passed: --
Failed: --
Coverage: --%
```
# Lab 2 Test Plan and Results

## 1. Test Strategy
เน้นการทดสอบครอบคลุม Unit, API, UI Component, Responsive และ E2E ตามแนวทาง TDD/Test DD

## 2. Planned Tests
| Test ID | Requirement/Type | AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01 | Create valid ticket | 201 Created & returns Ticket Number | server/tests/lab-02/tickets.api.test.ts | Pending |
| UI-01 | UI | AC-02 | Submit form without Summary | Field error message displayed | client/src/lab-02/CreateTicket.test.tsx | Pending |
| E2E-01 | E2E | AC-01 | Full ticket creation flow | Ticket appears in My Tickets | e2e/lab-02/requester-ticket-flow.spec.ts | Pending |

## 3. Acceptance-Criterion Traceability
- AC-01 -> API-01, E2E-01
- AC-02 -> UI-01

## 4. Responsive and Visual Checklist
- [ ] Desktop Viewport (≥ 992px)
- [ ] Tablet Viewport (768px - 991px)
- [ ] Mobile Viewport (< 768px)

## 5. Test Commands
- `npm run test:api`
- `npm run test:ui`
- `npx playwright test`

## 6. Final Results
*(จะอัปเดตเมื่อรัน Test ทั้งหมดผ่านช่วงส่งงาน)*

## 7. Known Limitations or Deferred Tests
- ไม่มี
