import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("Staff Ticket Detail API (Lab 3)", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  const generateToken = (id) => jwt.sign({ id }, JWT_SECRET);

  const mockRequester = { id: 1, role: "Requester", isActive: true };
  const mockITStaff = { id: 2, role: "IT_Staff", isActive: true };
  const mockInactiveStaff = { id: 3, role: "IT_Staff", isActive: false };
  const mockAdmin = { id: 4, role: "Administrator", isActive: true };

  const mockTicket = { id: 101, currentStatus: "New", itPriority: "Low", requesterId: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH /api/tickets/:id/assign", () => {
    it("should allow IT Staff to assign ticket to another active IT Staff", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === mockITStaff.id) return Promise.resolve(mockITStaff);
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            return Promise.resolve(null);
          })
        },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue(mockTicket),
          update: vi.fn().mockResolvedValue({ ...mockTicket, ticketOwnerId: mockAdmin.id })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/assign")
        .set("Authorization", `Bearer ${token}`)
        .send({ ticketOwnerId: mockAdmin.id });

      expect(res.status).toBe(200);
      expect(res.body.ticket.ticketOwnerId).toBe(mockAdmin.id);
    });

    it("should return 400 when assigning to an inactive user (BR-10)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === mockITStaff.id) return Promise.resolve(mockITStaff);
            if (where.id === mockInactiveStaff.id) return Promise.resolve(mockInactiveStaff);
            return Promise.resolve(null);
          })
        },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/assign")
        .set("Authorization", `Bearer ${token}`)
        .send({ ticketOwnerId: mockInactiveStaff.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("is not active");
    });

    it("should return 400 when assigning to a Requester (BR-10)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === mockITStaff.id) return Promise.resolve(mockITStaff);
            if (where.id === mockRequester.id) return Promise.resolve(mockRequester);
            return Promise.resolve(null);
          })
        },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/assign")
        .set("Authorization", `Bearer ${token}`)
        .send({ ticketOwnerId: mockRequester.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not an active IT Staff or Administrator");
    });
  });

  describe("PATCH /api/tickets/:id/priority", () => {
    it("should allow IT Staff to update priority to High", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue(mockTicket),
          update: vi.fn().mockResolvedValue({ ...mockTicket, itPriority: "High" })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/priority")
        .set("Authorization", `Bearer ${token}`)
        .send({ itPriority: "High" });

      expect(res.status).toBe(200);
      expect(res.body.ticket.itPriority).toBe("High");
    });

    it("should return 400 for invalid priority", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/priority")
        .set("Authorization", `Bearer ${token}`)
        .send({ itPriority: "SuperCritical" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid priority value");
    });
  });

  describe("PATCH /api/tickets/:id/status (BR-11 Matrix Validation)", () => {
    it("should allow transition from New to Open", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "New" }),
          update: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "Open" })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Open" });

      expect(res.status).toBe(200);
    });

    it("should reject transition from New to Closed with 409 Conflict", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "New" }),
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Closed" });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Invalid status transition from New to Closed");
    });

    it("should reject transition from Open to Closed with 409 Conflict", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "Open" }),
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Closed" });

      expect(res.status).toBe(409);
    });

    it("should allow transition from Open to Resolved", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "Open" }),
          update: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "Resolved" })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Resolved" });

      expect(res.status).toBe(200);
    });
  });
});
