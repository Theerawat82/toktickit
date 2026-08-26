# AI Assistance Log & Reflection

## LLM Tools Used
- ChatGPT / Claude / Gemini

## Key Prompts Table
| No. | Purpose | Prompt Summary | Output Quality / Action Taken |
|---|---|---|---|
| 1 | Spec DD | "Generate Business Rules for Ticket Soft Removal" | Used as base for BR-04 |
| 2 | API Spec | "Design GET /api/tickets pagination schema" | Applied to api-spec.md |
| 3 | Architecture & Docs | "Act as Senior System Analyst & Software Architect. Generate complete 4 technical spec files: specification.md, api-spec.md, ui-spec.md, tests.md without placeholders." | Successfully generated complete initial specification files in docs/lab-02/. |
| 4 |Database & Seed|"Execute tasks for Issue #10: Branch setup, Prisma Schema update (5 models with indexes/soft-delete), Migration init_lab2, and Idempotent seed.ts."|Implemented schema, migration, and verified idempotent seeding logic on PostgreSQL.|
| 5 |Seed Fix & Commit|"Fix categories array in seed.ts to include 4 required items, solve upsert loop syntax errors, test double seeding, and commit/push branch."|Resolved seed syntax issues, passed double-seed execution without errors, and pushed branch.|

## My Reflection
**ประเด็นเรียนรู้สำคัญจากการใช้งาน:**
- **Engineering Workflow:** การแบ่งบทบาทชัดเจนระหว่างการวางแผนคำสั่งกับ Gemini และการให้ Antigravity จัดการ Git Branch / Migration ช่วยให้การคุม Git Workflow เป็นไปตามข้อกำหนดของอาจารย์ และตรงตาม Definition of Done (DoD)
- **Architecture & Specification (Issue 1):** การสั่งให้ AI ร่างเอกสารทางเทคนิคครบทั้ง 4 ไฟล์ (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) ช่วยให้เห็นภาพรวมของ Business Rules, Acceptance Criteria และ Schema Design ตั้งแต่ก่อนเริ่มเขียนโค้ดจริง ลดเวลาการลองผิดลองถูก
- **Database & Execution Verification (Issue 2):** แม้ AI จะสามารถเจเนอเรต Prisma Schema และ Seed Script ได้ตรงตามฟีเจอร์ แต่ยังพบ Bug ทางไวยากรณ์ (Syntax Error) ในลูป `upsert` ของไฟล์ `seed.ts` การทำ Code Review และสั่ง Refine Prompt ช่วยแก้ไขให้การรัน Seed มีคุณสมบัติ Idempotency (รันซ้ำ 2 รอบติดกันได้โดยไม่ Crash)
