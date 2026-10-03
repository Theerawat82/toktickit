import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { bearer } from "../helpers/auth.js";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("GET /api/requesters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = () => {
    (getPrisma as any).mockReturnValue({
      user: { 
        findUnique: vi.fn().mockResolvedValue({ id: 2, role: "IT_Staff", isActive: true }),
        findMany: vi.fn().mockResolvedValue([{ id: 1, name: "Req", email: "req@req", isActive: true }]) 
      }
    });
  };

  it("should return 200 OK and an array of active requesters", async () => {
    setupMock();
    const res = await request(app).get("/api/requesters?active=true").set("Authorization", bearer(2));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    for (const requester of res.body) {
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
      expect(requester.isActive).toBe(true);
    }
  });

  it("should return all requesters when no filter is applied", async () => {
    setupMock();
    const res = await request(app).get("/api/requesters").set("Authorization", bearer(2));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
