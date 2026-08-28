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
## My Reflection
**ประเด็นเรียนรู้สำคัญจากการใช้งาน:**
- **Engineering Workflow:** การแบ่งบทบาทชัดเจนระหว่างการวางแผนคำสั่งกับ Gemini และการให้ Antigravity จัดการ Git Branch / Migration ช่วยให้การคุม Git Workflow เป็นไปตามข้อกำหนดของอาจารย์ และตรงตาม Definition of Done (DoD)
- **Architecture & Specification (Issue 1):** การสั่งให้ AI ร่างเอกสารทางเทคนิคครบทั้ง 4 ไฟล์ (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) ช่วยให้เห็นภาพรวมของ Business Rules, Acceptance Criteria และ Schema Design ตั้งแต่ก่อนเริ่มเขียนโค้ดจริง ลดเวลาการลองผิดลองถูก
- **Database & Execution Verification (Issue 2):** แม้ AI จะสามารถเจเนอเรต Prisma Schema และ Seed Script ได้ตรงตามฟีเจอร์ แต่ยังพบ Bug ทางไวยากรณ์ (Syntax Error) ในลูป `upsert` ของไฟล์ `seed.ts` การทำ Code Review และสั่ง Refine Prompt ช่วยแก้ไขให้การรัน Seed มีคุณสมบัติ Idempotency (รันซ้ำ 2 รอบติดกันได้โดยไม่ Crash)
**ประเด็นเรียนรู้สำคัญจากการใช้งาน:**
- **Engineering Workflow:** การแบ่งบทบาทชัดเจนระหว่างการวางแผนคำสั่งกับ Gemini และการให้ Antigravity จัดการ Git Branch / Migration ช่วยให้การควบคุม Git Workflow เป็นไปตามข้อกำหนดของอาจารย์ และตรงตาม Definition of Done (DoD)
- **Architecture & Specification (Issue 1):** การสั่งให้ AI ร่างเอกสารทางเทคนิคครบทั้ง 4 ไฟล์ (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) ช่วยให้เห็นภาพรวมของ Business Rules, Acceptance Criteria และ Schema Design ตั้งแต่ก่อนเริ่มเขียนโค้ดจริง ลดเวลาการลองผิดลองถูก
- **Database & Execution Verification (Issue 2):** แม้ AI จะสามารถเจเนอเรต Prisma Schema และ Seed Script ได้ตรงตามฟีเจอร์ แต่ยังพบ Bug ทางไวยากรณ์ (Syntax Error) ในลูป `upsert` ของไฟล์ `seed.ts` การทำ Code Review และสั่ง Refine Prompt ช่วยแก้ไขให้การรัน Seed มีคุณสมบัติ Idempotency (รันซ้ำ 2 รอบติดกันได้โดยไม่ Crash)
- **State & Test Integration (Issue 3):** การใช้ AI ช่วยสร้าง Context State สำหรับสลับตัวตนผู้ใช้ (Requester Context) ร่วมกับการทำ E2E Testing ด้วย Playwright ช่วยให้มั่นใจว่า UI และ API ทำงานสอดคล้องกันอย่างสมบูรณ์ พร้อมระบบบันทึก Screenshot ยืนยันผลการทดสอบอัตโนมัติ
- **Data Integrity & Edge Cases (Issue 4):** การระบุ Business Rules ชัดเจนใน Prompt (เช่น การเจน Ticket Number รูปแบบ `TIK-XXXXX` แบบ Atomic ด้วย Prisma Transaction และการคุม UI ธีม Zen Green `#006B3C`) ช่วยให้ AI ออกแบบโค้ดที่มี Type Safety สูง ป้องกันปัญหา Race Condition และครอบคลุม Validation ทั้งฝั่ง Client และ Server
- **Test Context & Environment Verification (Issue 5):** การรัน Unit Test และ TypeScript Check ต้องระบุ Directory Context แยกระหว่าง `client` และ `server` อย่างชัดเจน เพื่อป้องกันปัญหา Babel/Jest SyntaxError จาก TypeScript Type Annotation รวมถึงต้องตรวจสอบสถานะของ PostgreSQL Database และ Seed ข้อมูลก่อนรัน API Test เสมอ