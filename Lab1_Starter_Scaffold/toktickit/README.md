# TokTickIT 

โปรเจกต์โครงสร้างพื้นฐานสำหรับเว็บแอปพลิเคชัน (Full-stack Starter Template) สำหรับวิชา CPE334 / SE Lab 1

## ข้อกำหนดเบื้องต้นที่ต้องมีในเครื่อง (Prerequisites)
* Node.js (เวอร์ชัน 18 ขึ้นไป)
* Docker Desktop (สำหรับรันฐานข้อมูล PostgreSQL)

## การตั้งค่า Environment Variables
1. คัดลอกไฟล์ `.env.example` ไปเป็น `.env` สำหรับทั้งฝั่ง Client และ Server:
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env