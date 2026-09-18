# AI Assistance Log & Reflection

## LLM Tools Used
- Claude / Gemini / Antigravity IDE

## Key Prompts Table

| No. | Purpose | Prompt Summary | Output Quality / Action Taken |
|---|---|---|---|
| 1 | Architecture & Docs (Issue 1) | "Generate and update technical specifications for Lab 3 including User, Comment, InternalNote models, and update docs/lab-03/specification.md." | Generated complete initial Lab 3 technical documentation and architectural design. |
| 2 | Database Schema & Migration (Issue 2) | "Update Prisma Schema to replace Requester with User model (Roles: Admin, Requester, Agent, Manager), add Comment and InternalNote models, write custom zero-data-loss migration SQL, and update seed.ts with idempotent logic." | Successfully expanded database schema, preserved 21 existing tickets via fallback user ID 1 migration SQL, and configured 6 seeded users with 2 initial tickets. |
| 3 | Documentation §7 Update (Issue 2) | "Update docs/lab-03/specification.md Section 7 to cover Foreign Key constraints, Indexes, and Migration Strategy." | Updated documentation §7.1, §7.2, and §7.3 completely matching the latest database schema. |
| 4 | Route Compatibility & Test Fix (Issue 2) | "Fix test failures in server/src/routes/requesters.ts and tickets.ts caused by Prisma schema migration (Replace prisma.requester with prisma.user and requesterUserId with requesterId)." | Fixed route handlers to support the new User schema while maintaining 100% backward compatibility for Lab 2 API contracts. All 25 regression tests passed. |
| 5 | Authentication API & Password Policy (Issue 3) | "Implement authentication endpoints (`/login`, `/logout`, `/me`), JWT/Cookie session handling, and mandatory initial password change policy enforcing password complexity rules." | Implemented secure auth routes and middleware. Enforced initial password change requirement with zero user enumeration on login errors. |
| 6 | Frontend Auth & App Shell (Issue 3) | "Create Login and Change Password screens in Zen Green style, integrate auth context, and update application shell to render current user identity, role badge, and logout action." | Successfully built responsive auth screens with clear validation and loading states. Implemented protected routing guards on the client. |
| 7 | Server-side RBAC Authorization Middleware (Issue 4) | "Create server-side role-based authorization middleware enforcing the spec matrix across endpoints. Ensure IDOR protection on tickets/attachments and suppress information leakage." | Implemented `requireRole` and ownership check middlewares. Enforced strict 403 Forbidden and safe 404 Not Found status codes across all protected endpoints. |
| 8 | Authorization Test Alignment & Traceability (Issue 4) | "Fix traceability references in `authorization.api.test.ts` and `tickets.ts` (AC-04 to AC-06, BR-05 to BR-11/BR-12 for status restrictions) and update `tests.md` traceability matrix." | Successfully aligned code comments and test block labels with `specification.md`. Maintained 100% green test suite (43 server + 37 client tests) without test regression. |
| 9 | IT Staff Ticket Operations & Notes (Issue 6/7) | "Implement IT Staff Ticket Detail endpoints and UI for claim/reassign ownership, IT Priority, status transitions matrix, and tabbed Public Comments vs visually distinct Internal Notes." | Successfully delivered IT Staff operational views, enforced status transition rules, and visually segregated public comments from private internal notes. |
| 10 | Admin User Management & Safety Guardrails (Issue 8) | "Build Admin User Management API and UI with search, role filters, user creation/edit, initial password reset, and safety constraints preventing self-deactivation and last Admin removal." | Implemented complete Admin control panel with Zen Green design system and robust server-side safety guardrails. All admin test cases passed. |

---

## My Reflection

**1. Reflection on Specification Agent:**
* **Spec Driven Development (Spec DD):** การใช้ AI ช่วยวางโครงสร้างเอกสาร Specification (`specification.md`, `ui-spec.md`, `api-spec.md`) ตั้งแต่ต้น ช่วยให้เห็นขอบเขตงาน (Scope), Business Rules (BR) และ Acceptance Criteria (AC) ที่ชัดเจนก่อนลงมือเขียนโค้ด
* **Traceability & Consistency:** AI ช่วยตรวจสอบความสอดคล้องระหว่างข้อกำหนดและแผนการทดสอบ (`tests.md`) ทำให้สามารถกำกับรหัสอ้างอิง (เช่น AC-01–AC-06 และ BR-01–BR-12) ให้ตรงกันแบบ 100% ทั้งในเอกสาร โค้ด และ Test Suites ลดความสับสนระหว่างพัฒนาและเตรียมการ Peer Review ได้อย่างมีประสิทธิภาพ

**2. Reflection on Coding Agent:**
* **Schema Migration & Zero Data Loss:** ได้เรียนรู้การสั่งงาน Coding Agent ให้ปรับปรุงโครงสร้าง Database จาก `Requester` ไปเป็น `User` พร้อมระบบบทบาท (Roles) ผ่าน Custom Migration SQL โดยไม่ทำให้ข้อมูลเดิมสูญหาย (Zero Data Loss)
* **Security Guardrails over UI Visibility:** ได้เรียนรู้ว่าการรักษาความปลอดภัยที่แท้จริงต้องควบคุมที่ Server-side Middleware (เช่น RBAC, IDOR Protection, Error Suppression) การซ่อน UI Elements เป็นเพียงเรื่อง UX ไม่ใช่มาตรการความปลอดภัย
* **Continuous Verification & Zero Regression:** การกำกับ AI เขียนโค้ดควบคู่กับการรัน Test Suite (ทั้ง Server, Client และ E2E) แบบต่อเนื่อง ช่วยตรวจจับและแก้ไข Breaking Changes ได้ทันที ส่งผลให้โปรเจกต์คงสถานะ All Pass ได้ตลอดทุก Issue