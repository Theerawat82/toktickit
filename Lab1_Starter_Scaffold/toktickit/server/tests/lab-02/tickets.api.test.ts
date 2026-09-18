import { bearer } from "../helpers/auth.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, validPayload } = vi.hoisted(() => {
  const validPayload = {
    summary: "Need access to ERP system",
    description: "Please grant access to the ERP system for account department.",
    categoryId: 1,
    systemId: 1,
    relatedSystemId: 1,
    requestedPriority: "Medium",
  };

  const mockData = {
    id: 1,
    ticketNumber: "TIK-00001",
    summary: validPayload.summary,
    description: validPayload.description,
    currentStatus: "New",
    status: "New",
    categoryId: 1,
    relatedSystemId: 1,
    requesterId: 1,
    userId: 1,
    name: "Test Requester",
    email: "requester@example.com",
    role: "Requester",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 1, name: "Account", isActive: true },
    relatedSystem: { id: 1, name: "ERP", isActive: true },
    requester: { id: 1, userId: 1, name: "Test Requester" },
    user: { id: 1, email: "requester@example.com", role: "Requester", isActive: true },
  };

  const createModelHandler = () => ({
    findUnique: vi.fn().mockResolvedValue(mockData),
    findFirst: vi.fn().mockResolvedValue(mockData),
    findMany: vi.fn().mockResolvedValue([mockData]),
    create: vi.fn().mockResolvedValue(mockData),
    update: vi.fn().mockResolvedValue(mockData),
    upsert: vi.fn().mockResolvedValue(mockData),
    delete: vi.fn().mockResolvedValue(mockData),
    count: vi.fn().mockResolvedValue(1),
  });

  const targetObj: Record<string, any> = {};

  const mockPrisma: any = new Proxy(targetObj, {
    get: (target, prop: string) => {
      if (prop === "$transaction") {
        return vi.fn().mockImplementation((args: any) => {
          if (Array.isArray(args)) return Promise.all(args);
          if (typeof args === "function") return args(mockPrisma);
          return Promise.resolve(args);
        });
      }
      if (prop === "$connect" || prop === "$disconnect") {
        return vi.fn().mockResolvedValue(undefined);
      }
      if (!(prop in target)) {
        target[prop] = createModelHandler();
      }
      return target[prop];
    },
  });

  return { mockPrisma, validPayload };
});

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => mockPrisma,
  prisma: mockPrisma,
  default: mockPrisma,
}));

import request from "supertest";
import { app } from "../../src/app.js";

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 Created and ticket JSON when payload is valid", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", bearer(1))
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body.ticketNumber).toMatch(/^TIK-\d{5}$/);
    expect(res.body.summary).toBe(validPayload.summary);
    expect(res.body.currentStatus).toBe("New");
  });

  it("should return 400 Bad Request when summary is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", bearer(1))
      .send({ ...validPayload, summary: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Summary");
  });

  it("should return 400 Bad Request when summary exceeds 200 characters", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", bearer(1))
      .send({ ...validPayload, summary: "a".repeat(201) });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Summary");
  });

  it("should return 400 Bad Request when description is less than 20 characters", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", bearer(1))
      .send({ ...validPayload, description: "too short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Description");
  });
});