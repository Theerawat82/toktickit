import { bearer, mockRequester } from "../helpers/auth.js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// Mock prisma
vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("GET /api/tickets/:id", () => {
  const mockTicket = {
    id: 1,
    ticketNumber: "TIK-00001",
    summary: "Test Ticket",
    requesterId: 1,
    requesterUserId: 1,
    category: { id: 1, name: "Hardware" },
    requesterUser: { id: 1, name: "Alice" },
    attachments: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Case: Unauthenticated -> 401
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/tickets/1");
    expect(res.status).toBe(401);
  });

  // 2. Case: Ticket Not Found -> 404 (คืนค่า null จาก DB)
  it("should return 404 when ticket is not found", async () => {
    (getPrisma as any).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
      ticket: {
        findUnique: vi.fn().mockResolvedValue(null), // <--- คืนค่า null เพื่อจำลองหาไม่เจอ
      },
    });

    const res = await request(app)
      .get("/api/tickets/999")
      .set("Authorization", bearer(1));
    
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  // 3. Case: Not Owner -> 404 (User 2 พยายามเข้าดู Ticket ของ User 1)
  it("should return 404 when user does not own the ticket", async () => {
    (getPrisma as any).mockReturnValue({
      // User ที่ยิง request เข้ามาคือ User 2
      user: { findUnique: vi.fn().mockResolvedValue({ ...mockRequester, id: 2 }) },
      // เจ้าของ Ticket คือ User 1
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicket),
      },
    });

    const res = await request(app)
      .get("/api/tickets/1")
      .set("Authorization", bearer(2)); // <--- ส่ง Token ของ User 2
    
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  // 4. Case: Success -> 200 (User 1 เข้าดู Ticket ของ User 1)
  it("should return 200 and ticket details when user owns the ticket", async () => {
    (getPrisma as any).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicket), // <--- ส่ง mockTicket คืนกลับไป
      },
    });

    const res = await request(app)
      .get("/api/tickets/1")
      .set("Authorization", bearer(1));
    
    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBe("TIK-00001");
  });
});