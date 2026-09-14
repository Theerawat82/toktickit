import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

vi.mock("../../src/prisma.js", () => ({
  getPrisma: vi.fn(),
}));

describe("Comments & Internal Notes API (Lab 3)", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
  const generateToken = (id) => jwt.sign({ id }, JWT_SECRET);

  const mockRequester = {
    id: 1,
    email: "requester@example.com",
    name: "Alice Requester",
    role: "Requester",
    isActive: true,
    mustChangePassword: false,
  };

  const mockITStaff = {
    id: 2,
    email: "itstaff@example.com",
    name: "Bob IT",
    role: "IT Staff",
    isActive: true,
    mustChangePassword: false,
  };

  const mockAdmin = {
    id: 3,
    email: "admin@example.com",
    name: "Carol Admin",
    role: "Administrator",
    isActive: true,
    mustChangePassword: false,
  };

  const mockTicket = { id: 101, requesterId: 1, currentStatus: "Open" };
  const otherTicket = { id: 202, requesterId: 99, currentStatus: "Open" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/tickets/:id/comments", () => {
    it("should allow IT Staff to create a comment (201)", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        comment: {
          create: vi.fn().mockResolvedValue({
            id: 1,
            ticketId: 101,
            authorId: mockITStaff.id,
            content: "IT Staff comment",
            createdAt: new Date().toISOString(),
          }),
        },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "IT Staff comment" });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.authorId).toBe(mockITStaff.id);
      expect(res.body.content).toBe("IT Staff comment");
    });

    it("should allow a Requester who owns the ticket to create a comment (201)", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        comment: {
          create: vi.fn().mockResolvedValue({
            id: 2,
            ticketId: 101,
            authorId: mockRequester.id,
            content: "Requester comment",
            createdAt: new Date().toISOString(),
          }),
        },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Requester comment" });

      expect(res.status).toBe(201);
      expect(res.body.authorId).toBe(mockRequester.id);
    });

    it("should return 400 if content is empty (BR-09)", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/empty/i);
    });

    it("should return 400 if content is whitespace-only (BR-09)", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/empty/i);
    });

    it("should return 400 if content exceeds 2000 characters (BR-09)", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "x".repeat(2001) });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/2000/);
    });

    it("should return 404 (IDOR protection) if Requester tries to comment on another user ticket", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(otherTicket) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .post("/api/tickets/202/comments")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Sneaky comment" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/tickets/:id/comments", () => {
    it("should return 200 and comments array for IT Staff", async () => {
      const mockComments = [
        {
          id: 1,
          content: "First comment",
          createdAt: new Date().toISOString(),
          author: { id: mockITStaff.id, name: mockITStaff.name, role: mockITStaff.role },
        },
      ];

      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        comment: { findMany: vi.fn().mockResolvedValue(mockComments) },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .get("/api/tickets/101/comments")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].content).toBe("First comment");
      expect(res.body[0].author.id).toBe(mockITStaff.id);
    });

    it("should return 200 and comments for Requester who owns the ticket", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        comment: { findMany: vi.fn().mockResolvedValue([]) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/101/comments")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should return 404 (IDOR) if Requester tries to get comments on another ticket", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(otherTicket) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/202/comments")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/tickets/:id/internal-notes (AC-06 / BR-10)", () => {
    it("should return 403 Forbidden when Requester tries to access internal notes", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .get("/api/tickets/101/internal-notes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 200 and notes array for IT Staff", async () => {
      const mockNotes = [
        {
          id: 1,
          content: "Internal note",
          createdAt: new Date().toISOString(),
          author: { id: mockITStaff.id, name: mockITStaff.name, role: "IT Staff" },
        },
      ];

      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        internalNote: { findMany: vi.fn().mockResolvedValue(mockNotes) },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .get("/api/tickets/101/internal-notes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].content).toBe("Internal note");
    });

    it("should return 200 for Administrator", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockAdmin) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
        internalNote: { findMany: vi.fn().mockResolvedValue([]) },
      });

      const token = generateToken(mockAdmin.id);
      const res = await request(app)
        .get("/api/tickets/101/internal-notes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/tickets/:id/status (BR-12: problemAppearsResolved)", () => {
    it("should return 200 when Requester sets problemAppearsResolved on their own ticket", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
          update: vi.fn().mockResolvedValue({ id: 101, currentStatus: "Open", problemAppearsResolved: true }),
        },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ problemAppearsResolved: true });

      expect(res.status).toBe(200);
      expect(res.body.ticket.problemAppearsResolved).toBe(true);
    });

    it("should return 400 if ticket is already Resolved or Closed", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue({ ...mockTicket, currentStatus: "Resolved" }),
        },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ problemAppearsResolved: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Resolved");
    });

    it("should return 404 (IDOR) if Requester tries to set problemAppearsResolved on another user ticket", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(otherTicket) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/202/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ problemAppearsResolved: true });

      expect(res.status).toBe(404);
    });
    it("should allow IT Staff to set problemAppearsResolved via PATCH /status", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockITStaff) },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
          update: vi.fn().mockResolvedValue({ id: 101, currentStatus: "Open", problemAppearsResolved: true }),
        },
      });

      const token = generateToken(mockITStaff.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ problemAppearsResolved: true });

      expect(res.status).toBe(200);
      expect(res.body.ticket.problemAppearsResolved).toBe(true);
    });
  });

  describe("Status restrictions (BR-11 / BR-12 boundary)", () => {
    it("should return 403 if Requester tries to set Closed via PATCH /status", async () => {
      (getPrisma).mockReturnValue({
        user: { findUnique: vi.fn().mockResolvedValue(mockRequester) },
        ticket: { findUnique: vi.fn().mockResolvedValue(mockTicket) },
      });

      const token = generateToken(mockRequester.id);
      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Closed" });

      expect(res.status).toBe(403);
    });
  });
});
