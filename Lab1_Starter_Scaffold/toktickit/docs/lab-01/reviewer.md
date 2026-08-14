# Lab 1 — Peer Review Record  (fill this in)

**Author:** ธีรวัฒญ์ — 67070507206 — GitHub: @Theerawat82
**Peer reviewer:** ภูรินท์ — 67070507214 — GitHub: @
meebotsompurin-stack

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|    | feature/1-project-foundation |  Approve|
|    | feature/2-health-check |  |
|    | feature/3-category-seed |  |
|    | feature/4-category-list |  |

Reviewer comment I received: <Thanks for the solid project foundation — this looks like a good start. A few important items to address before merging:

Prisma schema: add a Category model (e.g. id Int @id @default(autoincrement()), name String @unique, createdAt DateTime @default(now())). Consider adding updatedAt @updatedat and think about case-insensitive uniqueness (citext or normalized column) if needed.
Seed: implement prisma upsert in prisma/seed.ts so seeding is idempotent (create or upsert the four categories).
API: implement GET /api/categories to return the categories (ordered by id) and include safe error handling (500 with non-sensitive message on DB failure).
Tests: server/tests/lab-01/categories.test.ts is TODO — add a test that validates the 4 seeded categories after migrate+seed.
Migrations / Prisma client: after updating schema, run npx prisma migrate dev --name init and npx prisma generate (document this in README or scripts).
Imports/extensions: imports use .js extensions (intentional for ESM/tsx) — ensure the chosen dev/runtime (tsx or built node) supports this consistently.
Configuration & secrets:
.env.example currently contains example credentials — replace with placeholders or document they are examples.
docker-compose.yml hardcodes POSTGRES_PASSWORD — prefer env substitution or docker secrets and document required env vars.
Confirm no real .env or secrets were committed; if any real credentials were committed, rotate them immediately.
.gitignore: present and covers many items — consider adding explicit entries for client/server node_modules, cache dirs, coverage/, .tsbuildinfo, and any bundler caches.
Minor: keep API response shapes consistent (e.g. { status: "...", service: "..." } or an array for categories) and ensure errors do not leak internal details.>

<br><br>How I responded: < reply : สิ่งที่แก้
                <br>1. Prisma Schema:
                       <br>Added the Category model to schema.prisma with id, name (unique), createdAt, and updatedAt.
                <br>2. Idempotent Seeding:
                       <br>Updated seed.ts to use prisma.category.upsert() for the four required categories. This ensures running the                          
                       seed command repeatedly will not create duplicates.
                <br>3. API Implementation:  
                       - Implemented GET /api/categories in app.ts to read the categories directly from the database and return                              
                       them in ID order.
                       <br>- Wrapped the route in a try...catch block to safely catch database errors and return a 500 Internal server  
                       error without leaking internal details.                                                                                                                                                             
                4. Tests:
                       <br>Implemented the assertion inside categories.test.ts to ensure the API returns 200 with exactly the 4 seeded 
                       categories in ID order. I ran the test suite and confirmed it passes successfully!
                <br>5. Migrations & Documentation:
                       <br>- Successfully ran npx prisma migrate dev --name init and npx prisma generate to sync the database 
                       schema and initialize the Prisma Client. 
                       <br>- I've also added these setup steps to the README.md to help other developers easily configure the DB.
                <br>6. Configuration & Secrets:
                       <br>- Stripped the hardcoded credentials in .env.example in favor of <USER>:<PASSWORD> placeholders. I 
                       verified no .env credentials have been accidentally committed to Git.
                       <br>- Updated docker-compose.yml to use environment variable substitution for credentials (e.g. 
                       ${POSTGRES_PASSWORD:-...}).
                <br>7. Gitignore Extensions:
                       <br>Added specific ignore directives to .gitignore covering client/node_modules/, server/node_modules/, 
                       .tsbuildinfo, coverage/, and .vite/.>

## Pull Requests I reviewed for my partner
My comment: <สภาพปัจจุบัน (ตามไฟล์ใน PR #5)

PR ตอนนี้เพิ่มไฟล์เพียง: client/package-lock.json และ server/package-lock.json
ผมไม่พบไฟล์คอนฟิก/ซอร์สหลักอื่น ๆ ในการเปลี่ยนแปลงของ PR นี้ ดังนั้นไม่สามารถยืนยันว่าแต่ละข้อเป็นไปตาม Acceptance Criteria ได้
Checklist ตาม Acceptance Criteria

Frontend (React + TypeScript + Vite) และ Bootstrap
❌ ไม่ผ่าน — ไม่มีหลักฐานของ client/package.json, tsconfig.json, vite.config.* หรือ src/ (React app) ที่แสดงการติดตั้ง React+TS+Vite/Bootstrap
Backend (Node.js + Express + TypeScript)
❌ ไม่ผ่าน — ไม่มี server/package.json, tsconfig.json, src/index.ts (หรือไฟล์ Express) หรือสคริปต์ start/build ที่ชัดเจน
Prisma และ PostgreSQL (.env.example / docker-compose)
❌ ไม่ผ่าน — ไม่มี prisma/schema.prisma, .env.example, หรือ docker-compose.yml ในการเปลี่ยนแปลง
Vitest และ Supertest
❌ ไม่ผ่าน — ไม่มี vitest.config.ts, ไฟล์ทดสอบ หรือ scripts ใน package.json สำหรับ vitest/supertest
.gitignore และ .env.example
❌ ไม่ผ่าน — ไม่มี .gitignore หรือ .env.example ถูกเพิ่ม/เปลี่ยนใน PR นี้ (สำคัญเพื่อกัน node_modules และ secrets)
README.md พร้อม Setup instructions
❌ ไม่ผ่าน — ไม่มี README.md หรือคำแนะนำการตั้งค่า (setup) ใน PR นี้
ข้อเสนอแนะที่ชัดเจน (เพื่อแก้ PR ให้ตรงตาม Acceptance Criteria)

เพิ่ม/ยืนยันไฟล์ในฝั่ง client:
package.json (ระบุ dependencies: react, react-dom, typescript, vite, bootstrap)
tsconfig.json
vite.config.ts (หรือ vite.config.js)
src/ (ตัวอย่าง App/entry) และ package.json scripts (dev, build)
เพิ่ม/ยืนยันไฟล์ในฝั่ง server:
package.json (express, typescript, ts-node/build scripts)
tsconfig.json
src/index.ts (ตัวอย่าง Express server)
scripts (start, dev, build, test)
เพิ่ม Prisma & DB:
prisma/schema.prisma
.env.example (DATABASE_URL placeholder)
docker-compose.yml (postgres service + optional adminer)
เพิ่มการตั้งค่าเทสต์:
vitest.config.ts
ตัวอย่าง test ที่ใช้ supertest สำหรับ API
scripts test ใน package.json
เพิ่ม .gitignore (node_modules, .env) และ README.md (ขั้นตอน setup, run, test, db migration)
ถ้า package-lock.json ถูกเพิ่มโดยไม่มี package.json ให้แน่ใจว่า package.json ถูก commit ด้วย (ไม่ควรมีแค่ lock file)><br><br>
Partner's response: <แก้ไขเรียบร้อยแล้วครับ>
