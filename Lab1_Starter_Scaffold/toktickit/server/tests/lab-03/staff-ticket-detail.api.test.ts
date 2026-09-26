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
  const generateToken = (id: number) => jwt.sign({ id }, JWT_SECRET);

  const mockRequester = { id: 1, role: "Requester", isActive: true };
  const mockITStaff = { id: 2, role: "IT_Staff", isActive: true };
  const mockInactiveStaff = { id: 3, role: "IT_Staff", isActive: false };
  const mockAdmin = { id: 4, role: "Administrator", isActive: true };

  const mockTicket = { id: 101, currentStatus: "New", itPriority: "Low", requesterId: 1, version: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH /api/tickets/:id/owner", () => {
    it("should allow IT Staff to assign ticket to another active IT Staff", async () => {
      let findUniqueCallCount = 0;
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: any) => {
            if (where.id === mockITStaff.id) return Promise.resolve(mockITStaff);
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            return Promise.resolve(null);
          })
        },
        ticket: { 
          findUnique: vi.fn().mockImplementation(() => {
            findUniqueCallCount++;
            if (findUniqueCallCount === 1) return Promise.resolve({ ...mockTicket, version: 1 });
            return Promise.resolve({ ...mockTicket, ticketOwnerId: mockAdmin.id, version: 2 });
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/owner")
        .set("Authorization", `Bearer ${token}`)
        .send({ ticketOwnerId: mockAdmin.id, version: 1 });

      expect(res.status).toBe(200);
      expect(res.body.ticket.ticketOwnerId).toBe(mockAdmin.id);
    });

    it("should return 400 when assigning to an inactive user (BR-10)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: any) => {
            if (where.id === mockITStaff.id) return Promise.resolve(mockITStaff);
            if (where.id === mockInactiveStaff.id) return Promise.resolve(mockInactiveStaff);
            return Promise.resolve(null);
          })
        },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue(mockTicket),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/owner")
        .set("Authorization", `Bearer ${token}`)
        .send({ ticketOwnerId: mockInactiveStaff.id, version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("is not active");
    });

    it("should return 400 when assigning to a Requester (BR-10)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: any) => {
            if (where.id === mockITStaff.id) return Promise.resolve(mockITStaff);
            if (where.id === mockRequester.id) return Promise.resolve(mockRequester);
            return Promise.resolve(null);
          })
        },
        ticket: { 
          findUnique: vi.fn().mockResolvedValue(mockTicket),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/owner")
        .set("Authorization", `Bearer ${token}`)
        .send({ ticketOwnerId: mockRequester.id, version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not an active IT Staff");
    });
  });

  describe("PATCH /api/tickets/:id/priority", () => {
    it("should allow IT Staff to update priority to High", async () => {
      let count = 0;
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { 
          findUnique: vi.fn().mockImplementation(() => {
            count++;
            if (count === 1) return Promise.resolve({ ...mockTicket, version: 1 });
            return Promise.resolve({ ...mockTicket, itPriority: "High", version: 2 });
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/priority")
        .set("Authorization", `Bearer ${token}`)
        .send({ itPriority: "High", version: 1 });

      expect(res.status).toBe(200);
      expect(res.body.ticket.itPriority).toBe("High");
    });

    it("should return 400 for invalid priority", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/priority")
        .set("Authorization", `Bearer ${token}`)
        .send({ itPriority: "SuperCritical", version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid priority value");
    });
  });

  describe("PATCH /api/tickets/:id/status (BR-11 Matrix Validation)", () => {
    it("should allow transition from New to Open", async () => {
      let count = 0;
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { 
          findUnique: vi.fn().mockImplementation(() => {
            count++;
            if (count === 1) return Promise.resolve({ ...mockTicket, currentStatus: "New", version: 1 });
            return Promise.resolve({ ...mockTicket, currentStatus: "Open", version: 2 });
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Open", version: 1 });

      expect(res.status).toBe(200);
    });

    it("should reject transition from New to Closed with 400 Bad Request", async () => {
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
        .send({ status: "Closed", version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot transition from 'New' to 'Closed'");
    });

    it("should reject transition from Open to Closed with 400 Bad Request", async () => {
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
        .send({ status: "Closed", version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot transition from 'Open' to 'Closed'");
    });

    it("should allow transition from Open to Resolved", async () => {
      let count = 0;
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        actionTaken: {
          create: vi.fn().mockResolvedValue({ id: 1, actionDescription: "fix", result: "fixed", version: 1 }),
          count: vi.fn().mockResolvedValue(1)
        },
        ticket: { 
          findUnique: vi.fn().mockImplementation(() => {
            count++;
            if (count === 1) return Promise.resolve({ ...mockTicket, currentStatus: "Open", version: 1 });
            return Promise.resolve({ ...mockTicket, currentStatus: "Resolved", version: 2 });
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 })
        }
      });

      const token = generateToken(mockITStaff.id);
      
      // We POST ActionTaken to satisfy the lab requirements explicitly as asked by user
      await request(app)
        .post("/api/tickets/101/actions")
        .set("Authorization", `Bearer ${token}`)
        .send({ actionDescription: "fix", result: "fixed", version: 1 });

      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Resolved", version: 1 });

      expect(res.status).toBe(200);
    });
  });
});
