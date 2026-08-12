# TokTickIT

## Database Setup
After pulling the code or updating the schema, prepare your database by running:
1. `npx prisma migrate dev` (this will also generate the Prisma Client and run the seed)
2. `npx prisma generate` (if only the client needs regenerating) 

โปรเจกต์โครงสร้างพื้นฐานสำหรับเว็บแอปพลิเคชัน (Full-stack Starter Template) สำหรับวิชา CPE334 / SE Lab 1

## ข้อกำหนดเบื้องต้นที่ต้องมีในเครื่อง (Prerequisites)
* Node.js (เวอร์ชัน 18 ขึ้นไป)
* Docker Desktop (สำหรับรันฐานข้อมูล PostgreSQL)

## การตั้งค่า Environment Variables
1. คัดลอกไฟล์ `.env.example` ไปเป็น `.env` สำหรับทั้งฝั่ง Client และ Server:
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env