# TokTickIT - Requester Ticketing MVP (Lab 2)

เว็บแอปพลิเคชันระบบแจ้งซ่อมและติดตามสถานะตั๋วบริการ IT (Requester-facing Application)  
วิชา **CPE 334 / SE (Software Engineering)** ภาคเรียนที่ 1/2026

---

## 🛠️ ข้อกำหนดเบื้องต้น (Prerequisites)
* **Node.js**: เวอร์ชัน 18 ขึ้นไป
* **Docker Desktop**: สำหรับรันฐานข้อมูล PostgreSQL

---

## ⚙️ การตั้งค่า Environment Variables
คัดลอกไฟล์ตัวอย่าง `.env.example` เป็น `.env` ทั้งฝั่ง Client และ Server:
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
🗄️ การจัดการฐานข้อมูล (Database Setup)
สตาร์ท PostgreSQL บน Docker:

docker compose up -d
รัน Database Migration และ Seed ข้อมูลเริ่มต้น (Categories, Related Systems, Development Requesters):

npx prisma migrate dev
(ตัวเลือก) สร้าง Prisma Client ใหม่หากมีการปรับเปลี่ยน Schema:

npx prisma generate
🚀 การสั่งรันโปรเจกต์ (Running the Application)
1. ฝั่ง Backend (Server)

cd server
npm install
npm run dev
2. ฝั่ง Frontend (Client)

cd client
npm install
npm run dev
🧪 การสั่งรันชุดทดสอบ (Running Automated Tests)
1. API & Unit Tests

cd server
npm test
2. UI Component Tests

cd client
npm test
3. End-to-End (E2E) Tests (Playwright)

npx playwright test