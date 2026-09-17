import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("Authorization (Cross-Cutting)", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  
  const generateToken = (id: number) => jwt.sign({ id }, JWT_SECRET);

  const mockRequester = {
    id: 1,
    email: "requester@example.com",
    role: "Requester",
    isActive: true,
    mustChangePassword: false,
  };

  const mockITStaff = {
    id: 2,
    email: "itstaff@example.com",
    role: "IT Staff",
    isActive: true,
    mustChangePassword: false,
  };

  const mockAdmin = {
    id: 3,
    email: "admin@example.com",
    role: "Administrator",
    isActive: true,
    mustChangePassword: false,
  };

  const mockInactiveUser = {
    ...mockRequester,
    id: 4,
    isActive: false,
  };

  const mockNewUser = {
    ...mockRequester,
    id: 5,
    mustChangePassword: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Global Middleware (requireAuth)", () => {
    it("should return 401 Unauthenticated when no token is provided", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
    });

    it("should return 401 on invalid token", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    it("should return 403 Forbidden for Inactive Account", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockInactiveUser) },
      });

      const token = generateToken(mockInactiveUser.id);
      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Account is inactive");
    });

    it("should return 403 if mustChangePassword is true on restricted endpoints", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockNewUser) },
      });

      const token = generateToken(mockNewUser.id);
      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.mustChangePassword).toBe(true);
    });
  });

  describe("AC-03: Session-Driven Identity", () => {
    it("should ignore injected requesterId in body and use session user ID", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        category: { findUnique: vi.fn().mockResolvedValue({ id: 1 }) },
        relatedSystem: { findUnique: vi.fn().mockResolvedValue({ id: 1 }) },
        $transaction: vi.fn().mockImplementation(async (cb) => {
           // Simulate tx context
           const tx = {
             ticket: {
               findFirst: vi.fn().mockResolvedValue(null),
               create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 1 }))
             }
           };
           return cb(tx);
        })
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${token}`)
        .send({
          summary: "Help",
          description: "Long enough description here",
          categoryId: 1,
          systemId: 1,
          requestedPriority: "Low",
          requesterId: 999 // Attacker trying to spoof
        });

      expect(res.status).toBe(201);
      // The created ticket should use mockRequester.id (1), not 999
      expect(res.body.requesterId).toBe(1);
    });
  });

  describe("AC-06: Internal Notes Access & Role Separation", () => {
    it("should allow IT Staff to post internal note", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        internalNote: { create: vi.fn().mockResolvedValue({ id: 1, content: "Secret note" }) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .post("/api/tickets/1/internal-notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Secret note" });

      expect(res.status).toBe(201);
    });

    it("should return 403 Forbidden when Requester tries to access internal note", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .post("/api/tickets/1/internal-notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Secret note" });

      expect(res.status).toBe(403);
    });
  });

  describe("Cross-Requester Access (Information Leakage Protection)", () => {
    it("should return 404 when Requester tries to fetch someone else's ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue({ id: 99, requesterId: 2 }) // Ticket belongs to someone else
        }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/99")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404); // Specifically 404, not 403
    });

    it("should allow IT Staff to fetch any ticket", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue({ id: 99, requesterId: 2 })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .get("/api/tickets/99")
        .set("Authorization", `Bearer ${token}`);

      // Assuming the GET /:id also needs a ticket to be returned, in our mock it returns {id: 99}
      expect(res.status).toBe(200); 
    });
  });

  describe("BR-11: Direct API Status Changes", () => {
    it("should return 403 if Requester tries to change status to Resolved", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, requesterId: mockRequester.id })
        }
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Resolved" });

      expect(res.status).toBe(403);
    });

    it("should allow IT Staff to change status to Resolved", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, requesterId: mockRequester.id, currentStatus: "Open" }),
          update: vi.fn().mockResolvedValue({ id: 1, currentStatus: "Resolved" })
        }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Resolved" });

      expect(res.status).toBe(200);
    });
  });
});
