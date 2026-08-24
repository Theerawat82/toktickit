# Lab 2 REST API Contract Specification

## Overview
เอกสารระบุข้อตกลงการเชื่อมต่อ REST API ระหว่าง Frontend และ Backend สำหรับ Lab 02 (MVP Ticketing System)

---

## API Endpoints

### 1. GET /api/requesters/active
- **Purpose:** ดึงรายชื่อ Development Requesters ที่มีสถานะ Active สำหรับแสดงผลในตัวเลือก (Dev Selector)
- **Method:** `GET`
- **Headers:** `Content-Type: application/json`
- **Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer@example.com",
    "department": "Engineering"
  }
]