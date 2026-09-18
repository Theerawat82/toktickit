import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Mock prisma
vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    genSalt: vi.fn().mockResolvedValue("salt"),
    hash: vi.fn().mockResolvedValue("hashedPassword"),
  }
}));

describe("Authentication API", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    password: "hashedPassword123",
    role: "Requester",
    isActive: true,
    mustChangePassword: true,
  };

  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  const validToken = jwt.sign({ id: 1 }, JWT_SECRET);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and token on valid credentials", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it("should return 401 on invalid password", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Invalid email or password");
    });

    it("should return 403 when user is inactive", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue({ ...mockUser, isActive: false }) },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Account is inactive");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 200 and user details for valid token", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(1);
    });

    it("should return 401 if token is missing", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("should return 200 on valid password change", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockResolvedValue(mockUser),
          update: vi.fn().mockResolvedValue({ ...mockUser, mustChangePassword: false })
        },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ currentPassword: "password123", newPassword: "NewSecurePassword1!" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("successfully");
    });

    it("should return 400 if new password fails complexity requirements", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ currentPassword: "password123", newPassword: "weakpassword" });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain("least 8 characters");
    });
  });
});
