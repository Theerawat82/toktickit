# AI Assistance Log & Reflection

## LLM Tools Used
- Claude / Gemini / Antigravity IDE

## Key Prompts Table
| No. | Purpose | Prompt Summary | Output Quality / Action Taken |
|---|---|---|---|
| 1 | Spec DD | "Generate Business Rules for Ticket Soft Removal" | Used as base for BR-04 |
| 2 | API Spec | "Design GET /api/tickets pagination schema" | Applied to api-spec.md |
| 3 | Architecture & Docs | "Act as Senior System Analyst & Software Architect. Generate complete 4 technical spec files: specification.md, api-spec.md, ui-spec.md, tests.md without placeholders." | Successfully generated complete initial specification files in docs/lab-02/. |
| 4 |Database & Seed|"Execute tasks for Issue #10: Branch setup, Prisma Schema update (5 models with indexes/soft-delete), Migration init_lab2, and Idempotent seed.ts."|Implemented schema, migration, and verified idempotent seeding logic on PostgreSQL.|
| 5 |Seed Fix & Commit|"Fix categories array in seed.ts to include 4 required items, solve upsert loop syntax errors, test double seeding, and commit/push branch."|Resolved seed syntax issues, passed double-seed execution without errors, and pushed branch.|
| 6 | Requester Context (Issue 3) | "Implement Backend GET /api/requesters, Context State, RequesterSelector UI, and E2E Tests with Vitest & Playwright." | Successfully implemented RequesterContext, active filter logic, UI dropdown, and verified 100% test coverage with screenshot artifact. |
| 7 | Create Ticket Feature (Issue 4) | "Implement POST /api/tickets with validation rules (summary max 200, desc min 20), TIK-XXXXX auto-generation, Zen Green UI, and tests." | Implemented API using Prisma transaction for atomic TIK-XXXXX generation, client validation, Zen Green theme, and passed all unit/E2E tests. |
| 8 | My Tickets Feature (Issue 5) | "Implement Backend GET /api/tickets with ownership isolation, query filters, MyTickets UI with Zen Green theme, and unit/integration tests for both Client and Server." | Implemented ticket listing with search, category, priority, status filters, and pagination. Resolved Jest TypeScript SyntaxError and Prisma DB connection context issues. Passed 100% unit and UI tests. |
| 9 | Ticket Detail & Attachments (Issue 6) | "Implement Issue 6 [LAB2-06] Ticket Detail (Read-only UI) and Attachment Soft-Remove feature with ownership verification, file validation rules, and automated API/UI tests." | Implemented GET /api/tickets/:id ownership validation, attachment upload (max 5MB, limit 5, allowed types), download streaming, and soft-removal with reason. Built Zen Green Ticket Detail UI and passed all Vitest/Playwright tests. |
| 10 | E2E Testing & Release Integration (Issue 7) | "Implement Issue 7 [LAB2-07] E2E Testing with Playwright covering full Requester journey, visual inspection for Zen Green Theme & responsive layouts, artifact screenshots generation, and full code quality build check." | Implemented Playwright E2E full-flow tests in e2e/lab-02/full-flow.spec.ts, created visual inspection checklist in docs/lab-02/visual-inspection.md, generated test screenshots in artifacts/, and verified 100% pass rate on lint, typecheck, and full test suite. |
## My Reflection
**ประเด็นเรียนรู้สำคัญจากการใช้งาน:**

* **Spec-Driven & TDD Efficiency:** การใช้ AI ช่วยร่างเอกสาร Specification (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) และวางโครงสร้างโค้ดตามแนวคิด TDD ช่วยลดเวลาลองผิดลองถูก และกำหนดทิศทางการพัฒนาได้อย่างชัดเจน
* **Human Code Review:** แม้ AI จะช่วยเจนเนอเรตโค้ดได้รวดเร็ว แต่ยังคงต้องใช้การตรวจทานจากผู้พัฒนาเสมอ เช่น การแก้ไข Syntax Error ใน `seed.ts` เพื่อให้รันแบบ Idempotency และการคุม Type Safety ให้ตรงตาม Business Rules
* **End-to-End Quality Assurance:** การระบุเงื่อนไขด้าน Security, Access Control และ Validation ใน Prompt อย่างชัดเจน ร่วมกับการใช้ AI ช่วยทำ Playwright E2E Testing ทำให้มั่นใจว่าระบบฝั่ง Client, Server และ Database ทำงานสอดคล้องกันอย่างถูกต้องสมบูรณ์