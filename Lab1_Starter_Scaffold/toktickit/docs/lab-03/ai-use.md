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

## My Reflection
**ประเด็นเรียนรู้สำคัญจากการใช้งาน:**

* **Schema Evolution & Zero Data Loss:** การปรับปรุง Database Structure จากโมเดล `Requester` ไปเป็น `User` พร้อมระบบบทบาท (Roles) เรียนรู้การเขียน Custom Migration SQL เพื่อจัดการ Foreign Key Constraints และคุมไม่ให้เกิด Data Loss กับข้อมูลตั๋วเดิม 21 รายการในระบบ
* **Regression Testing Focus:** การเปลี่ยนชื่อฟิลด์หรือโครงสร้าง Table ใน Prisma ส่งผลกระทบต่อ API Routes เดิม (`requesters.ts`, `tickets.ts`) การรัน `npm test` เพื่อตรวจสอบและใช้ AI ช่วย refactor โค้ดจุดที่พังจากการอ้างอิง `prisma.requester` ช่วยให้ตรวจพบและแก้ไข Bug ได้ครอบคลุมทุกเคส
* **Idempotency & Data Integrity:** การออกแบบ Seed Script ร่วมกับ AI โดยใช้แนวคิด `upsert` ทำให้รันคำสั่ง Seed ซ้ำกี่ครั้งก็ได้โดยไม่เกิดปัญหา Unique Key Violation หรือข้อมูลขยะซ้ำซ้อน