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
*(Note: Executed serially via `fileParallelism: false` in vitest.config.ts to prevent DB dropping issues)*

2. **Client Component Tests**
```bash
cd client
npm test
```

3. **End-to-End (E2E) Tests (Playwright)**
```bash
npx playwright test
```


4. **Generating Evidence Screenshots & Metrics**
The project includes automated scripts to capture layout evidence and verify dashboard metrics across viewports.
```bash
# Capture screenshots for UI layout (outputs to artifacts/lab-04/screenshots/)
npx playwright test e2e/lab-04/evidence-screenshots.spec.ts e2e/lab-04/ticket-detail-screenshots.spec.ts

# Run dashboard metrics verification
npx tsx scripts/verify-dashboard-metrics.ts
```

---

## 🎭 Step-by-Step Demo Script (Presentation Order)

To demonstrate the full IT Service Management workflow from end to end:

1. **Requester Flow**
   - Log in as `requester1@toktickit.com` (password: `Password123!`).
   - Go to **Create Ticket**. Submit a new issue (e.g., "Cannot connect to VPN").
   - View the created ticket in **My Tickets**.
2. **IT Staff Flow & Action Taken**
   - Log out, then log in as `staff1@toktickit.com`.
   - View the **Staff Dashboard** and open the **Staff Ticket Queue**.
   - Claim the newly created ticket (change status to **In Progress**).
   - Scroll down to **Actions Taken** and click **Add Action Taken**. Document what was fixed and submit.
   - Change the ticket status to **Resolved**. (Notice that *Business Rule BR-08* prevents resolution unless at least one Action Taken exists, which you just satisfied).
3. **Dashboards**
   - Navigate back to the **Staff Dashboard** to see live metrics update based on your resolution.
4. **Administrator**
   - Log out, then log in as `admin@toktickit.com`.
   - View the **Staff Dashboard** to see elevated system-wide metrics (User Account counts, overall ticket statistics).

---

## 🛠️ Troubleshooting

### Docker Container Not Running After Restart
If Docker Desktop was just started and your backend fails to connect to the database:
1. Run `docker ps` to verify the container is actually running.
2. If it is not running, start it using:
   ```bash
   cd server
   docker compose up -d
   ```
3. Wait a few seconds for PostgreSQL to initialize before running `npm run dev`.

### PostgreSQL Port (5435) Check
This session's `docker-compose.yml` configures the database on **port 5435** to avoid conflicts.
- Ensure your `server/.env` uses `5435`:
  `DATABASE_URL="postgresql://postgres:password@localhost:5435/toktickit"`
- Test the database connection by running `npx prisma migrate status` inside `server/`. If you see "could not translate host name", ensure Docker Desktop is running and the port is correctly mapped.
