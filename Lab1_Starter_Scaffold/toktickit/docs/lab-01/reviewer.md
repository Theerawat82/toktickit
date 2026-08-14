# Lab 1 — Peer Review Record  (fill this in)

**Author:** ธีรวัฒญ์ — 67070507206 — GitHub: @Theerawat82
**Peer reviewer:** อภิวัชร์ — 67070507209 — GitHub: @apfirst13

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|    | feature/1-project-foundation |Approve|
|    | feature/2-health-check |  |
|    | feature/3-category-seed |  |
|    | feature/4-category-list |  |

Reviewer comment I received: <...>
How I responded: <...>

## Pull Requests I reviewed for my partner
### Issue 1
ภาพปัจจุบัน (ตามไฟล์ใน PR #5)

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
ถ้า package-lock.json ถูกเพิ่มโดยไม่มี package.json ให้แน่ใจว่า package.json ถูก commit ด้วย (ไม่ควรมีแค่ lock file)<br><br>
Partner's response: <>
