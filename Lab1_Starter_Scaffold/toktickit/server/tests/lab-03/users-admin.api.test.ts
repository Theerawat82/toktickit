import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("Admin User Management API (Lab 3)", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  const generateToken = (id: number) => jwt.sign({ id }, JWT_SECRET);

  const mockAdmin = { id: 1, role: "Administrator", isActive: true, email: "admin@example.com" };
  const mockITStaff = { id: 2, role: "IT_Staff", isActive: true, email: "it@example.com" };
  const mockRequester = { id: 3, role: "Requester", isActive: true, email: "req@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Access Control", () => {
    it("should return 401 for unauthenticated", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("should return 403 for non-Administrators", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) }
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/admin/users", () => {
    it("should list users with optional filters", async () => {
      const findManyMock = vi.fn().mockResolvedValue([mockRequester, mockITStaff]);
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockResolvedValue(mockAdmin),
          findMany: findManyMock
        }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .get("/api/admin/users?search=req&role=Requester&isActive=true")
        .set("Authorization", `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          OR: [
            { name: { contains: "req", mode: "insensitive" } },
            { email: { contains: "req", mode: "insensitive" } }
          ],
          role: "Requester",
          isActive: true
        }
      }));
    });
  });

  describe("POST /api/admin/users", () => {
    it("should create user and set mustChangePassword", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: { where: any }) => {
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            return Promise.resolve(null); // email not taken
          }),
          create: vi.fn().mockResolvedValue({ id: 4, email: "new@ex.com", mustChangePassword: true })
        }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New User",
          email: "new@ex.com",
          role: "Requester",
          password: "Password1!"
        });
      
      expect(res.status).toBe(201);
      expect(res.body.mustChangePassword).toBe(true);
    });

    it("should reject duplicate email", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: { where: any }) => {
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            if (where.email === "admin@example.com") return Promise.resolve(mockAdmin);
            return Promise.resolve(null);
          })
        }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New User",
          email: "admin@example.com",
          role: "Requester",
          password: "Password1!"
        });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toContain("already exists");
    });

    it("should reject invalid role", async () => {
      (getPrisma as any).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockAdmin) }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New",
          email: "new@ex.com",
          role: "SuperAdmin", // invalid
          password: "Password1!"
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid role");
    });
  });

  describe("PATCH /api/admin/users/:id", () => {
    it("should update basic fields (one role enforcement is implicit via schema enum mapping)", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: { where: any }) => {
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            if (where.id === mockRequester.id) return Promise.resolve(mockRequester);
            return Promise.resolve(null);
          }),
          update: vi.fn().mockResolvedValue({ ...mockRequester, role: "IT_Staff" })
        }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .patch(`/api/admin/users/${mockRequester.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "IT Staff" });
      
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("IT_Staff");
    });

    it("should block self-deactivation", async () => {
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockResolvedValue(mockAdmin)
        }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .patch(`/api/admin/users/${mockAdmin.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isActive: false });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot deactivate your own account");
    });

    it("should block deactivating the last active admin", async () => {
      const otherAdmin = { id: 99, role: "Administrator", isActive: true };
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: { where: any }) => {
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            if (where.id === otherAdmin.id) return Promise.resolve(otherAdmin);
            return Promise.resolve(null);
          }),
          count: vi.fn().mockResolvedValue(1) // only 1 active admin!
        }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .patch(`/api/admin/users/${otherAdmin.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isActive: false });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("last active Administrator");
    });
  });

  describe("POST /api/admin/users/:id/reset-password", () => {
    it("should reset password and set mustChangePassword", async () => {
      const updateMock = vi.fn().mockResolvedValue({});
      (getPrisma as any).mockReturnValue({
        user: { 
          findUnique: vi.fn().mockImplementation(({ where }: { where: any }) => {
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            if (where.id === mockRequester.id) return Promise.resolve(mockRequester);
            return Promise.resolve(null);
          }),
          update: updateMock
        }
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .post(`/api/admin/users/${mockRequester.id}/reset-password`)
        .set("Authorization", `Bearer ${token}`)
        .send({ newInitialPassword: "StrongPassword1!" });
      
      expect(res.status).toBe(200);
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ mustChangePassword: true })
      }));
    });
  });
});
