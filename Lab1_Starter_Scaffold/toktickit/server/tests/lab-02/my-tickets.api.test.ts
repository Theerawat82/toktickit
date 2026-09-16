import { bearer } from "../helpers/auth.js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("GET /api/tickets (My Tickets)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockTickets = [
      {
        id: 1,
        ticketNumber: "TIK-00001",
        summary: "TIK Test Summary",
        requesterUserId: 1,
        requesterId: 1,
      },
    ];

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          email: "requester@example.com",
          role: "Requester",
          isActive: true,
        }),
      },
      requester: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, userId: 1 }),
        findFirst: vi.fn().mockResolvedValue({ id: 1, userId: 1 }),
      },
      category: {
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          if (where?.id === "invalid" || where?.name === "invalid") return null;
          return { id: 1, name: "Account" };
        }),
        findFirst: vi.fn().mockImplementation(({ where }: any) => {
          if (where?.id === "invalid" || where?.name === "invalid") return null;
          return { id: 1, name: "Account" };
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue(mockTickets),
        count: vi.fn().mockResolvedValue(1),
      },
      $transaction: vi.fn().mockImplementation((args: any) => {
        if (Array.isArray(args)) return Promise.all(args);
        if (typeof args === "function") return args(mockPrisma);
        return Promise.resolve(args);
      }),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/tickets/my");
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("token");
  });

  it("should return tickets belonging only to the specified requester", async () => {
    const res = await request(app).get("/api/tickets").set("Authorization", bearer(1));
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);

    res.body.data.forEach((ticket: any) => {
      expect(ticket.requesterUserId).toBe(1);
    });
  });

  it("should apply pagination correctly", async () => {
    const res = await request(app)
      .get("/api/tickets?page=1&limit=2")
      .set("Authorization", bearer(1));

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(2);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it("should apply search filtering correctly", async () => {
    const res = await request(app)
      .get("/api/tickets?search=TIK")
      .set("Authorization", bearer(1));

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket: any) => {
      const match = ticket.ticketNumber.includes("TIK") || ticket.summary.includes("TIK");
      expect(match).toBe(true);
    });
  });

  it("should return 400 Bad Request when category is invalid", async () => {
    const res = await request(app)
      .get("/api/tickets?category=invalid")
      .set("Authorization", bearer(1));

    expect(res.status).toBe(400);
  });
});