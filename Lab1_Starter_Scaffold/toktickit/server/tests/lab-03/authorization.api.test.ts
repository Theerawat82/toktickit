import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("Authorization and Roles API (Lab 3)", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  const generateToken = (id: number) => jwt.sign({ id }, JWT_SECRET);

  const mockRequester = { id: 1, role: "Requester", isActive: true };
  const mockITStaff = { id: 2, role: "IT_Staff", isActive: true };
  const mockOtherRequester = { id: 3, role: "Requester", isActive: true };
  
  const mockTicket = { id: 101, requesterId: mockRequester.id, currentStatus: "New", version: 1 };
  const mockOtherTicket = { id: 102, requesterId: mockOtherRequester.id, currentStatus: "New", version: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Ticket Detail Ownership Protection", () => {
    it("should allow Requester to view their own ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/101")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(101);
    });

    it("should reject Requester from viewing someone else's ticket (404)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockOtherTicket) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/102")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("should allow IT Staff to view any ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockOtherTicket) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .get("/api/tickets/102")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(102);
    });
  });

  describe("API Role Enforcement (IT Staff / Admin only)", () => {
    it("should reject Requester from accessing IT Queue", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/queue")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should reject Requester from assigning a ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/101/owner")
        .set("Authorization", `Bearer ${token}`)
        .send({ ticketOwnerId: mockITStaff.id, version: 1 });

      expect(res.status).toBe(403);
    });

    it("should reject Requester from changing priority", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/101/priority")
        .set("Authorization", `Bearer ${token}`)
        .send({ itPriority: "High", version: 1 });

      expect(res.status).toBe(403);
    });

    it("should reject Requester from directly changing status", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Closed", version: 1 });

      expect(res.status).toBe(403);
    });
  });
});
