# TokTickIT - Full IT Service Management System (Lab 3)

เว็บแอปพลิเคชันระบบแจ้งซ่อมและจัดการตั๋วบริการ IT แบบครบวงจร (Requester, IT Staff, Administrator)  
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
```

**รายการ Environment Variables สำคัญ (`server/.env`):**
* `DATABASE_URL`: Connection string สำหรับ PostgreSQL Database (เช่น `postgresql://postgres:postgres@localhost:5432/toktickit_dev`)
* `JWT_SECRET`: Secret Key สำหรับการ Sign และ Verify JWT Authentication Token
* `PORT`: Port สำหรับ Backend API Server (เช่น `3001`)

---

## 🗄️ การจัดการฐานข้อมูล (Database Setup)
1. สตาร์ท PostgreSQL บน Docker:
```bash
cd server
docker compose up -d
```

2. รัน Database Migration และ Seed ข้อมูลเริ่มต้น (User Accounts, Roles, Categories, Systems, Tickets):
```bash
npx prisma migrate dev
npx prisma db seed
```

*(ตัวเลือก) สร้าง Prisma Client ใหม่หากมีการปรับเปลี่ยน Schema:*
```bash
npx prisma generate
```

---

## 🔑 Seeded Credentials สำหรับทดสอบระบบ (Dev Credentials)
ระบบจัดเตรียมบัญชีผู้ใช้เริ่มต้นสำหรับทดสอบระบบแยกตามบทบาทไว้ดังนี้ (รหัสผ่านเริ่มต้นคือ `Password123!` ทุกบัญชี):

| Role | Email | Default Password | Initial Status |
|---|---|---|---|
| **Administrator** | `admin@toktickit.com` | `Password123!` | Active |
| **IT Staff** | `staff1@toktickit.com` | `Password123!` | Active |
| **IT Staff (Force Reset)** | `newstaff@toktickit.com` | `Password123!` | Must Change Password |
| **Requester** | `requester1@toktickit.com` | `Password123!` | Active |

---

## 🚀 การสั่งรันโปรเจกต์ (Running the Application)
1. **ฝั่ง Backend (Server)**
```bash
cd server
npm install
npm run dev
```

2. **ฝั่ง Frontend (Client)**
```bash
cd client
npm install
npm run dev
```

---

## 🧪 การสั่งรันชุดทดสอบ (Running Automated Tests)
1. **Server Unit & API Tests**
```bash
cd server
npm test
```

2. **Client Component Tests**
```bash
cd client
npm test
```

3. **End-to-End (E2E) Tests (Playwright)**
```bash
npx playwright test
```