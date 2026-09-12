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
    requesterUserId: 1,
    category: { id: 1, name: "Hardware" },
    requesterUser: { id: 1, name: "Alice" },
    attachments: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 403 when x-requester-id header is missing", async () => {
    const res = await request(app).get("/api/tickets/1");
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Missing or invalid");
  });

  it("should return 404 when ticket is not found", async () => {
    (getPrisma as any).mockReturnValue({
      ticket: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    });

    const res = await request(app)
      .get("/api/tickets/999")
      .set("x-requester-id", "1");
    
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("should return 404 when user does not own the ticket", async () => {
    (getPrisma as any).mockReturnValue({
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicket),
      },
    });

    const res = await request(app)
      .get("/api/tickets/1")
      .set("x-requester-id", "2"); // Different requester ID
    
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("should return 200 and ticket details when user owns the ticket", async () => {
    (getPrisma as any).mockReturnValue({
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicket),
      },
    });

    const res = await request(app)
      .get("/api/tickets/1")
      .set("x-requester-id", "1");
    
    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBe("TIK-00001");
  });
});
