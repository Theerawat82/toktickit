import { bearer, mockRequester } from "../helpers/auth.js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import path from "path";
import fs from "fs";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...(actual as any),
    existsSync: vi.fn().mockReturnValue(true),
  };
});

describe("Attachments API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("IDOR Protection for Attachments (Issue 6)", () => {
    const setupIdorMock = () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockImplementation(({ where }: any) => {
          if (where.id === 1) return Promise.resolve({ id: 1, role: "Requester", isActive: true });
          if (where.id === 2) return Promise.resolve({ id: 2, role: "Requester", isActive: true });
          return Promise.resolve(null);
        })},
        attachment: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1, ticket: { requesterId: 2, requesterUserId: 2 }, isRemoved: false
          })
        }
      });
    };

    it("should prevent Requester 1 from downloading Requester 2's attachment (404 IDOR)", async () => {
      setupIdorMock();
      const res = await request(app).get("/api/attachments/1/download").set("Authorization", bearer(1));
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should prevent Requester 1 from reading Requester 2's attachment metadata (404 IDOR)", async () => {
      setupIdorMock();
      const res = await request(app).get("/api/attachments/1").set("Authorization", bearer(1));
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should prevent Requester 1 from removing Requester 2's attachment (404 IDOR)", async () => {
      setupIdorMock();
      const res = await request(app).post("/api/attachments/1/remove")
        .set("Authorization", bearer(1))
        .send({ removalReason: "Oops" });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });
  });

  describe("POST /api/tickets/:id/attachments", () => {
    it("should return 400 if file is too large", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, requesterUserId: 1, attachments: [] }),
        },
      });

      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      const res = await request(app)
        .post("/api/tickets/1/attachments")
        .set("Authorization", bearer(1))
        .attach("file", largeBuffer, "large.jpg");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("File too large");
    });

    it("should upload successfully when valid", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, requesterUserId: 1, attachments: [] }),
        },
        attachment: {
          create: vi.fn().mockResolvedValue({ id: 1, fileName: "test.png" }),
        }
      });

      const buffer = Buffer.from("fake image content");
      const res = await request(app)
        .post("/api/tickets/1/attachments")
        .set("Authorization", bearer(1))
        .attach("file", buffer, { filename: "test.png", contentType: "image/png" });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
    });
  });

  describe("POST /api/attachments/:id/remove", () => {
    it("should soft remove attachment", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        attachment: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1, ticket: { requesterUserId: 1 }, isRemoved: false
          }),
          update: vi.fn().mockResolvedValue({ id: 1 })
        }
      });

      const res = await request(app)
        .post("/api/attachments/1/remove")
        .set("Authorization", bearer(1))
        .send({ removalReason: "Uploaded wrong file" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("successfully");
    });
  });

  describe("GET /api/attachments/:id/download", () => {
    it("should return 404 if attachment is soft removed", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        attachment: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1, ticket: { requesterUserId: 1 }, isRemoved: true
          }),
        }
      });

      const res = await request(app)
        .get("/api/attachments/1/download")
        .set("Authorization", bearer(1));

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("removed");
    });
  });
});