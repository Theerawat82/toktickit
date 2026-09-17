import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("Staff Queue API", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      ticket: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  const generateToken = (id: number) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback-secret-for-development");
  };

  const mockUser = (role: string = "IT_Staff", id: number = 1) => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id,
      role,
      isActive: true,
      mustChangePassword: false,
    });
  };

  it("should return 401 for unauthenticated users", async () => {
    // Tests that unauthenticated gets 401
    const res = await request(app).get("/api/tickets/queue");
    expect(res.status).toBe(401);
  });

  it("should return 403 for Requesters", async () => {
    // Tests that Requester gets 403
    mockUser("Requester");
    const token = generateToken(1);
    const res = await request(app)
      .get("/api/tickets/queue")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("should return 200 and paginated list for IT Staff (happy path)", async () => {
    mockUser("IT_Staff");
    const token = generateToken(1);
    
    mockPrisma.$transaction.mockResolvedValue([
      2, // total count
      [
        { id: 1, ticketNumber: "TIK-001", requesterId: 2, ticketOwner: { id: 1, name: "Staff" } },
        { id: 2, ticketNumber: "TIK-002", requesterId: 3, ticketOwner: null }
      ]
    ]);

    const res = await request(app)
      .get("/api/tickets/queue")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].owner.name).toBe("Staff");
    expect(res.body.data[1].owner).toBeNull();
    expect(res.body.pagination.totalItems).toBe(2);
  });

  it("should handle empty results", async () => {
    mockUser("Administrator");
    const token = generateToken(1);
    
    mockPrisma.$transaction.mockResolvedValue([0, []]);

    const res = await request(app)
      .get("/api/tickets/queue")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.totalItems).toBe(0);
  });

  it("should handle invalid query params gracefully", async () => {
    mockUser("IT_Staff");
    const token = generateToken(1);
    
    mockPrisma.$transaction.mockResolvedValue([0, []]);

    const res = await request(app)
      .get("/api/tickets/queue?category=invalid")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should handle out-of-range page", async () => {
    mockUser("IT_Staff");
    const token = generateToken(1);
    
    mockPrisma.$transaction.mockResolvedValue([1, []]);

    const res = await request(app)
      .get("/api/tickets/queue?page=99")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.page).toBe(99);
  });

  it("should not be swallowed by /:id handler (regression test)", async () => {
    mockUser("IT_Staff");
    const token = generateToken(1);
    
    mockPrisma.$transaction.mockResolvedValue([0, []]);

    const res = await request(app)
      .get("/api/tickets/queue")
      .set("Authorization", `Bearer ${token}`);
    
    // It should NOT be 400 (Invalid ticket ID)
    expect(res.status).not.toBe(400);
    expect(res.status).toBe(200);
  });
});
