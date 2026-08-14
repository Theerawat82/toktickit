# Lab 1 — AI Use and Reflection  (fill this in)

**LLM/agent used:** <name>

## Selected key prompts (6–10)
| # | Prompt (summarised)| What I did with the result |
|---|--------------------|----------------------------|
| 1 |Issue 1 | Please setup and verify "Issue 1: Project Foundation" for this   repository based on these Acceptance Criteria: <br><br>1. React + TypeScript + Vite frontend starts successfully with Bootstrap visible.<br>2. Node.js + Express + TypeScript backend starts successfully.<br>3. PostgreSQL is reachable and Prisma is initialized.<br>4. Vitest and Supertest commands are configured properly.<br>5. Ensure .gitignore and .env.example exist, and test "npm run test" passes for Heading renders.<br><br>Check existing code first, create missing files or environment configs if needed, and run tests to confirm everything works. <br><br> Reflextion : พรอมต์ มีประสิทธิภาพมากขึ้นจากการระบุเกณฑ์การตรวจรับงานอย่างเป็นขั้นตอน ทำให้ได้ผลลัพธ์ที่ตรงสโคป อย่างไรก็ตาม เนื่องจากลืมสั่งให้พิมพ์อัพเดตไฟล์ใน README.MD ทำให้ต้องมานั่งพิมพ์เพิ่มตาม |  
| 2 |Issue 2 | Please implement "Issue 2: GET /api/health Endpoint" based on these exact Acceptance Criteria:<br><br>1. Express Backend: Ensure GET /api/health endpoint returns HTTP 200 status code.<br>2. Response Format: The endpoint must return a JSON response containing { "status": "ok", "service": "TokTickIT API" }.<br>3. Backend Testing: Supertest must pass, verifying the GET /api/health endpoint returns 200 with the correct JSON payload.<br>4. Frontend Integration: Update the React frontend page to fetch real status data from GET /api/health and display it on the UI.<br>5. Error Handling: Display a clear and useful error message on the React frontend whenever the backend is unavailable or offline.<br><br>Please check existing server routes and client components first, implement the necessary logic, and run tests to ensure all conditions are satisfied.<br><br>Reflextion : สำหรับการพัฒนา Issue 2 ได้ใช้ Prompt กำหนดเงื่อนไขทั้ง Backend, Testing และ Frontend ครอบคลุมทุก Acceptance Criteria โดย AI ได้ตรวจสอบและยืนยัน Endpoint GET /api/health บน Express ให้ส่งคืน HTTP 200 พร้อม JSON สถานะถูกต้อง และรัน Supertest ผ่านเรียบร้อย พร้อมกันนี้ได้อัปเดต React ใน api.ts และ App.tsx เพื่อเรียกใช้ API จริง จัดการ State ทั้งสถานะ Loading, แจ้งเตือนสีเขียวเมื่อ Online และแสดงข้อความ Error สีแดงเมื่อ Offline รวมถึงรัน Build ผ่านโดยไม่มีปัญหา TypeScript ทำให้ระบบทำงานสอดคล้องกันอย่างสมบูรณ์
 |
 | 3 |  |  |

## Reflection
Two or three sentences: what made your prompts better, and one place you had to
correct or reject what the agent produced.
