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

---

## My Reflection

**ประเด็นเรียนรู้สำคัญจากการใช้งาน AI Specification & Coding Agent:**

* **Schema Evolution & Zero Data Loss:** การปรับปรุงโครงสร้าง Database จากโมเดล `Requester` ไปเป็น `User` พร้อมระบบบทบาท (Roles) ได้เรียนรู้การกำกับ AI ในการเขียน Custom Migration SQL เพื่อจัดการ Foreign Key Constraints โดยเน้นไม่ให้เกิด Data Loss กับข้อมูลตั๋วเดิม 21 รายการในระบบ
* **Regression Testing & Continuous Verification:** การเปลี่ยนโครงสร้างระบบเข้าสู่ Authentication ส่งผลกระทบต่อ API Routes และ Test Suites เดิม การสั่งงาน AI ร่วมกับการรัน `npm test` เพื่อควบคุมคุณภาพแบบ Zero Test Regression ช่วยให้ตรวจพบและแก้ไข Bug ได้รวดเร็วและครอบคลุมทุก Edge Case
* **Security vs. UX Realization:** ได้เรียนรู้ว่ามาตรการความปลอดภัยที่แท้จริงต้องเกิดขึ้นที่ Server-side ผ่าน Middleware และ Authorization Matrix เสมอ การซ่อน UI Elements (เช่น ปุ่มกดหรือ Nav Links) เป็นเพียงการปรับปรุง UX ไม่ใช่การควบคุม Security
* **Traceability Integrity:** การควบคุมให้ Code Comments, Unit/API Tests และเอกสาร Specification (`specification.md`, `tests.md`) อ้างอิงเลข AC และ BR ตรงกันทุกจุด 100% ช่วยเพิ่มความโปร่งใส ป้องกันความเข้าใจผิดระหว่างพัฒนา และทำให้กระบวนการ Peer Review ผ่านไปได้อย่างมีประสิทธิภาพ