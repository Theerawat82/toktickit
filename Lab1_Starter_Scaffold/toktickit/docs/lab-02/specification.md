# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
ส่งมอบระบบ MVP Ticketing สำหรับ Requester ในการสร้าง ดู และจัดการคำร้อง IT Support พร้อมระบบจำลอง Development Requester และโครงสร้างดีไซน์ Zen Green Theme

## 2. Stakeholder Request Interpretation
สรุปความต้องการ: ระบบต้องรองรับการเลือกตัวละครจำลอง (Development Requester), การแจ้งเรื่อง (Create Ticket), การดูรายการคำร้อง (My Tickets), การดูรายละเอียด (Ticket Detail) และการจัดการไฟล์แนบ (Soft-removal attachments) โดยห้ามไม่ให้ Requester เห็นข้อมูลของผู้อื่น

## 3. Scope
- **Included:** Create Ticket, My Tickets, Ticket Detail, Attachment Lifecycle (Soft Delete), Search/Filter/Sort/Pagination, Ownership Enforcement (backend validation)
- **Excluded:** Authentication/Session จริง (ใช้ Dev Selector แทน), IT Staff Workflow, Comments/Internal Notes, Ticket Status Updates (หลังสร้างเสร็จ)

## 4. Functional Requirements
- FR-01: ระบบต้องสร้าง Ticket Number อัตโนมัติจาก backend
- FR-02: Requester สามารถค้นหา และกรอง Ticket ของตัวเองได้
- FR-03: รองรับการแนบไฟล์ JPG, PNG, WEBP, PDF ขนาดไม่เกิน 5MB สูงสุด 5 ไฟล์

## 5. Business Rules
- BR-01: Official Ticket Number สร้างจาก Backend และต้องไม่ซ้ำกัน
- BR-02: Ticket ใหม่เริ่มต้นที่ Status = "New"
- BR-03: Development Requester selector ใช้สำหรับ Testing ใน Lab 2 เท่านั้น (ไม่ใช่ Auth)
- BR-04: ไฟล์แนบที่ถูกลบ (Soft Remove) จะซ่อนปุ่ม Download/Preview แต่ยังคง Metadata ไว้

## 6. UI Specification Summary
อ้างอิงดีไซน์ Zen Green Theme (#006B3C, #0B7A46, #EAF6EF) พร้อม Responsive Layout (Desktop/Tablet/Mobile)

## 7. Data Changes
- Model: `RequesterUser`, `Ticket`, `Attachment`, `Category`, `RelatedSystem`
- Seed Data: 4 Categories, 6 Related Systems, 4 Active Requesters, 1 Inactive Requester

## 8. API Contract
- `GET /api/requesters/active`
- `POST /api/tickets`
- `GET /api/tickets` (Query params: search, filter, sort, page)
- `POST /api/tickets/:id/attachments`
- `DELETE /api/attachments/:id` (Soft Delete with reason)

## 9. Acceptance Criteria
- AC-01: Given ข้อมูล Ticket ถูกต้อง, When ผู้ใช้กด Submit, Then ระบบบันทึก Ticket และคืนค่า Ticket Number
- AC-02: Given ยังไม่ได้เลือก Dev Requester, When เข้าหน้า My Tickets, Then ระบบจะ Redirect ไปหน้า Dev Selector

## 10. Definition of Done
- Test ทั้งหมด (Unit, API, UI, E2E) รันผ่าน 100%
- ผ่าน Peer Review และไม่มี Skipped Tests

## 11. Assumptions and Decisions
- ใช้ Soft Delete แทน Hard Delete สำหรับ Attachments เพื่อรักษา History