# TokTickIT - Full IT Service Management System (Lab 4)

ระบบ ระบบจัดการและติดตามตั๋วแจ้งซ่อม (Requester, IT Staff, Administrator)  
วิชา **CPE 334 / SE (Software Engineering)** ภาคการศึกษา 1/2026

---

## 📋 ข้อกำหนดเบื้องต้น (Prerequisites)
* **Node.js**: เวอร์ชัน 18 ขึ้นไป
* **Docker Desktop**: สำหรับรันฐานข้อมูล PostgreSQL

---

## 🛠 การตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env` ทั้งในฝั่ง Client และ Server:
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

**ตั้งค่า Environment Variables ที่สำคัญ (`server/.env`):**
* `DATABASE_URL`: Connection string สำหรับต่อ PostgreSQL Database (ให้ตรงกับ docker-compose ด้านล่างคือ `postgresql://postgres:password@localhost:5435/toktickit`)
* `JWT_SECRET`: Secret Key สำหรับทำ Sign และ Verify JWT Authentication Token
* `PORT`: Port สำหรับ Backend API Server (เช่น `3001`)

---

## 🗄 การเตรียมฐานข้อมูล (Database Setup, Migration & Seed)
1. **เปิดการทำงาน PostgreSQL ใน Docker:**
```bash
docker compose up -d
```
*(หมายเหตุ: รันคำสั่งนี้ที่โฟลเดอร์นอกสุดที่มีไฟล์ docker-compose.yml หรือในโฟลเดอร์ server ถ้าย้ายเข้าไป)*

2. **ทำ Database Migration และ Seed ข้อมูลเบื้องต้น (User Accounts, Roles, Categories, Systems, Tickets):**
```bash
cd server
npx prisma migrate dev
npm run prisma:seed
```

*(ถ้าจำเป็น) สั่งสร้าง Prisma Client ใหม่หลังจากอัปเดต Schema:*
```bash
npx prisma generate
```

---

## 🔄 การกู้คืนฐานข้อมูลและย้อนกลับ (Migration Rollback & Recovery)
หากเกิดข้อผิดพลาดในการทำ Migration หรือข้อมูลในฐานข้อมูลเสียหาย (อ้างอิงตามข้อ 5.2):

1. **การรีเซ็ตฐานข้อมูลทั้งหมด (Full Reset & Seed):**
   หากต้องการลบข้อมูลทั้งหมดแล้วสร้างโครงสร้างใหม่พร้อม Seed ข้อมูลกลับไปเป็นค่าเริ่มต้น:
   ```bash
   cd server
   npx prisma migrate reset
   ```
   *(คำสั่งนี้จะลบ Database, รัน Migration ทั้งหมดใหม่ตั้งแต่ต้น และรันไฟล์ Seed อัตโนมัติ)*

2. **การแก้ไขสถานะ Migration ที่ล้มเหลว (Resolve Failed Migration):**
   หาก Migration ทำงานไม่สำเร็จและค้างอยู่ในสถานะ Failed:
   - ตรวจสอบสถานะ: `npx prisma migrate status`
   - ทำเครื่องหมายว่า Rollback แล้ว (หากลบและแก้ไขใน DB ด้วยตัวเอง):
     ```bash
     npx prisma migrate resolve --rolled-back "ชื่อ_migration_ที่ล้มเหลว"
     ```
   - หรือทำเครื่องหมายว่าสำเร็จแล้ว (หากแก้ DB schema ให้ตรงแล้ว):
     ```bash
     npx prisma migrate resolve --applied "ชื่อ_migration_ที่ล้มเหลว"
     ```

---

## 🔑 Seeded Credentials สำหรับทดสอบระบบ (Dev Credentials)
ระบบจะสร้างบัญชีผู้ใช้เริ่มต้นไว้ให้สำหรับทดสอบแบ่งตาม Role ดังนี้ (รหัสผ่านเริ่มต้นคือ `Password123!` ทุกบัญชี):

| Role | Email | Default Password | Initial Status |
|---|---|---|---|
| **Administrator** | `admin@toktickit.com` | `Password123!` | Active |
| **IT Staff** | `staff1@toktickit.com` | `Password123!` | Active |
| **IT Staff (Force Reset)** | `newstaff@toktickit.com` | `Password123!` | Must Change Password |
| **Requester** | `requester1@toktickit.com` | `Password123!` | Active |

---

## 🚀 การรันแอปพลิเคชัน (Running the Application)
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

## 🧪 การรัน Automated Tests (Lab 4 Full Verification)
โปรเจกต์นี้ครอบคลุมการทดสอบทั้ง Unit, API, และ E2E โดยแยกการรันดังนี้:

1. **Server Unit & API Tests (รวมถึง Migration Integrity และ Performance Smoke Test)**
```bash
cd server
npm test
```
*(หมายเหตุ: รันแบบ Serial ด้วย `fileParallelism: false` ใน vitest.config.ts เพื่อป้องกันปัญหา DB ซ้อนทับกัน)*

2. **Client Component Tests**
```bash
cd client
npm test
```

3. **End-to-End (E2E) Tests (Playwright - ทดสอบครบ 118 Scenarios)**
```bash
# รัน E2E แบบเต็มรูปแบบจากโฟลเดอร์ Root
npx playwright test
```
การรัน Playwright จะครอบคลุม:
- การจำลองหน้าจอ Desktop, Tablet, และ Mobile (Responsive A11y & UI Consistency)
- ระบบ Dashboards Metrics Verification
- การตรวจสอบ XSS & Security Regression

---

## 🎯 Step-by-Step Demo Script (Lab 4 Workflows)

ในการนำเสนอระบบ End-to-End สำหรับ Lab 4 ให้ทำตามขั้นตอนดังนี้:

1. **Requester Flow**
   - Log in ด้วยบัญชี `requester1@toktickit.com` (password: `Password123!`).
   - ไปที่ **Create Ticket** ยื่นเรื่องแจ้งปัญหา (เช่น "หน้าเว็บโหลดไม่ขึ้น")
   - สามารถดูสถานะและประวัติตั๋วได้ใน **My Tickets**
   - ดูแดชบอร์ดสรุปจำนวนตั๋วของตนเองในหน้า **Requester Dashboard**
2. **IT Staff Flow & Action Taken**
   - Log out แล้ว Log in ด้วยบัญชี `staff1@toktickit.com`.
   - ดู **Staff Dashboard** ซึ่งจะแสดง Metrics การจ่ายงานแบบ Real-time และกดเข้าไปที่ Unassigned Tickets
   - รับเรื่องตั๋วที่เพิ่งสร้างโดยเปลี่ยนสถานะเป็น **In Progress**
   - ไปที่ **Actions Taken** และกด **Add Action Taken** บันทึกการแก้ไข (หากใส่ Script `<script>` ลงไป ระบบจะป้องกัน XSS ทันที)
   - อัปเดตสถานะเป็น **Resolved** (หากยังไม่ได้เพิ่ม Action Taken ระบบจะบล็อกตาม Business Rule BR-08)
3. **Dashboards & Administrator**
   - Log out แล้ว Log in ด้วย `admin@toktickit.com`.
   - เข้าดู **Staff Dashboard** เพื่อเห็นภาพรวม Metrics ทั่วทั้งระบบรวมถึง User Account Counts

---

## 🛠 Troubleshooting

### Docker Container ไม่ทำงานหลังรีสตาร์ทเครื่อง
หากเริ่ม Docker Desktop แล้ว Backend ต่อ DB ไม่ได้:
1. พิมพ์ `docker ps` เพื่อตรวจสอบว่า Container ทำงานอยู่หรือไม่
2. หากไม่รัน ให้สั่งสตาร์ทใหม่ด้วย:
   ```bash
   docker compose up -d
   ```
3. รอสักครู่ให้ PostgreSQL พร้อมแล้วจึงรัน `npm run dev`

### ตรวจสอบ PostgreSQL Port (5435)
ไฟล์ `docker-compose.yml` ถูกตั้งค่าพอร์ตเป็น **5435** (Host) แมปไปยัง 5432 (Container) เพื่อหลีกเลี่ยงการชนกับ Postgres ในเครื่อง:
- ตรวจสอบในไฟล์ `server/.env` ว่าเชื่อมต่อด้วยพอร์ต `5435` จริง:
  `DATABASE_URL="postgresql://postgres:password@localhost:5435/toktickit"`
- ทดสอบโดยรัน `npx prisma migrate status` ในโฟลเดอร์ `server/` หากขึ้น Error ให้ตรวจสอบว่า Docker Desktop ทำงานปกติ
