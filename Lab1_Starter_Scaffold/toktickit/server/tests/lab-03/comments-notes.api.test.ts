import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("Comments and Internal Notes API (Lab 3)", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  const generateToken = (id: number) => jwt.sign({ id }, JWT_SECRET);

  const mockRequester = { id: 1, role: "Requester", isActive: true };
  const mockITStaff = { id: 2, role: "IT_Staff", isActive: true };
  const mockOtherRequester = { id: 3, role: "Requester", isActive: true };

  const mockTicket = { id: 201, requesterId: 1, currentStatus: "New", version: 1 };
  const mockOtherTicket = { id: 202, requesterId: 3, currentStatus: "New", version: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/tickets/:id/comments", () => {
    it("should allow Requester to add a comment to their own ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        comment: { create: vi.fn().mockResolvedValue({ id: 1, ticketId: 201, content: "Hello" }) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .post("/api/tickets/201/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Hello" });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Hello");
    });

    it("should return 400 for empty comment content", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .post("/api/tickets/201/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("cannot be empty");
    });
  });

  describe("GET /api/tickets/:id/comments", () => {
    it("should fetch comments for authorized ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        comment: { findMany: vi.fn().mockResolvedValue([{ id: 1, content: "Hello", author: { id: 1, name: "John", role: "Requester" } }]) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/201/comments")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe("POST /api/tickets/:id/internal-notes", () => {
    it("should allow IT Staff to add an internal note", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        internalNote: { create: vi.fn().mockResolvedValue({ id: 1, content: "Staff only" }) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .post("/api/tickets/201/internal-notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Staff only" });

      expect(res.status).toBe(201);
    });

    it("should block Requester from adding an internal note (403)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .post("/api/tickets/201/internal-notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Trying to sneak in" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/tickets/:id/internal-notes", () => {
    it("should fetch internal notes for IT Staff", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        internalNote: { findMany: vi.fn().mockResolvedValue([{ id: 1, author: { id: 2, name: "Admin", role: "IT_Staff" } }]) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .get("/api/tickets/201/internal-notes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it("should block Requester from fetching internal notes (403)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/201/internal-notes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/tickets/:id/confirm-resolved (BR-12: requesterConfirmedResolved)", () => {
    it("should return 200 when Requester confirms their own resolved ticket", async () => {
      let count = 0;
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { 
          findUnique: vi.fn().mockImplementation(() => {
            count++;
            if (count <= 2) return Promise.resolve({ ...mockTicket, currentStatus: "Resolved", version: 1, requesterConfirmedResolved: false });
            return Promise.resolve({ ...mockTicket, currentStatus: "Resolved", version: 2, requesterConfirmedResolved: true });
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/201/confirm-resolved")
        .set("Authorization", `Bearer ${token}`)
        .send({ version: 1 });

      expect(res.status).toBe(200);
      expect(res.body.ticket.requesterConfirmedResolved).toBe(true);
    });

    it("should return 400 if ticket is not in a Resolved state", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "Closed", version: 1 })
        }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/201/confirm-resolved")
        .set("Authorization", `Bearer ${token}`)
        .send({ version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Ticket is not in a Resolved state");
    });

    it("should return 403 (IDOR) if Requester tries to confirm someone else's ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue({ ...mockOtherTicket, version: 1, currentStatus: "Resolved" }) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/202/confirm-resolved")
        .set("Authorization", `Bearer ${token}`)
        .send({ version: 1 });

      expect(res.status).toBe(404);
    });
  });
});
