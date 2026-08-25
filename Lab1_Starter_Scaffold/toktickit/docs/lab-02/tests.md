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