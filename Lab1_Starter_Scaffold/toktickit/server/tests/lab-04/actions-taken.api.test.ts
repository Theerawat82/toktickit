import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

const prisma = getPrisma();

describe("Issue 3: Actions Taken API", () => {
  let adminToken: string;
  let staffToken: string;
  let requesterToken: string;
  let testTicket: any;
  let adminUser: any;
  let staffUser: any;
  let reqUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: "Administrator" } });
    if (!adminUser) {
      adminUser = await prisma.user.create({ data: { name: "Admin", email: "admin@test.com", password: "pwd", role: "Administrator" } });
    }
    staffUser = await prisma.user.findFirst({ where: { role: "IT_Staff" } });
    reqUser = await prisma.user.findFirst({ where: { role: "Requester" } });

    adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    staffToken = jwt.sign({ id: staffUser.id, role: staffUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    requesterToken = jwt.sign({ id: reqUser.id, role: reqUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");

    const category = await prisma.category.findFirst();
    const system = await prisma.relatedSystem.findFirst();

    testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: "TEST-ACT-001",
        summary: "Test for actions",
        requestedPriority: "Low",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requesterId: reqUser.id,
      }
    });
  });

  afterAll(async () => {
    await prisma.actionTaken.deleteMany({ where: { ticketId: testTicket.id } });
    await prisma.ticket.delete({ where: { id: testTicket.id } });
  });

  describe("POST /api/tickets/:id/actions", () => {
    it("should reject Requester (403)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ actionDescription: "test", result: "test", followUpRequired: false });
      expect(res.status).toBe(403);
    });

    it("should reject if followUpRequired is true but no note provided", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ actionDescription: "test", result: "test", followUpRequired: true });
      expect(res.status).toBe(400);
    });

    it("should ignore performedById from client", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ actionDescription: "test", result: "test", followUpRequired: false, performedById: 999 });
      expect(res.status).toBe(400); // Because we implemented strict rejection in the API
    });

    it("should create action successfully and bump Ticket.updatedAt", async () => {
      const beforeTicket = await prisma.ticket.findUnique({ where: { id: testTicket.id } });
      
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ actionDescription: "Did something", result: "Fixed", followUpRequired: false });
      
      expect(res.status).toBe(201);
      expect(res.body.actionDescription).toBe("Did something");
      expect(res.body.performedById).toBe(staffUser.id);
      expect(res.body.version).toBe(1);

      const afterTicket = await prisma.ticket.findUnique({ where: { id: testTicket.id } });
      expect(afterTicket!.updatedAt.getTime()).toBeGreaterThan(beforeTicket!.updatedAt.getTime());
    });
  });

  describe("PATCH /api/tickets/:id/actions/:actionId", () => {
    let actionId: number;

    beforeAll(async () => {
      const action = await prisma.actionTaken.create({
        data: {
          ticketId: testTicket.id,
          actionDescription: "Initial",
          result: "Pending",
          performedById: adminUser.id,
        }
      });
      actionId = action.id;
    });

    it("should reject Requester (403)", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${actionId}`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ actionDescription: "Edited", result: "Done", followUpRequired: false, version: 1 });
      expect(res.status).toBe(403);
    });

    it("should reject attempts to change read-only fields", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${actionId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ actionDescription: "Edited", result: "Done", followUpRequired: false, version: 1, performedById: 999 });
      expect(res.status).toBe(400);
    });

    it("should return 409 Conflict if version is stale", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${actionId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ actionDescription: "Edited Stale", result: "Done", followUpRequired: false, version: 99 });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Conflict/);
      expect(res.body.currentServerRow).toBeDefined();
    });

    it("should edit action successfully, increment version, and bump Ticket.updatedAt", async () => {
      const beforeTicket = await prisma.ticket.findUnique({ where: { id: testTicket.id } });
      
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${actionId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ actionDescription: "Edited Success", result: "Finished", followUpRequired: false, version: 1 });
      
      expect(res.status).toBe(200);
      expect(res.body.actionDescription).toBe("Edited Success");
      expect(res.body.version).toBe(2);

      const afterTicket = await prisma.ticket.findUnique({ where: { id: testTicket.id } });
      expect(afterTicket!.updatedAt.getTime()).toBeGreaterThan(beforeTicket!.updatedAt.getTime());
    });
  });

  describe("GET /api/tickets/:id/actions", () => {
    it("should return empty array for zero actions", async () => {
      await prisma.ticket.deleteMany({ where: { ticketNumber: "TEST-ACT-EMPTY" } });
      const emptyTicket = await prisma.ticket.create({
        data: {
          ticketNumber: "TEST-ACT-EMPTY",
          summary: "Empty",
          requestedPriority: "Low",
          categoryId: testTicket.categoryId,
          relatedSystemId: testTicket.relatedSystemId,
          requesterId: reqUser.id,
        }
      });

      const res = await request(app)
        .get(`/api/tickets/${emptyTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);

      await prisma.ticket.delete({ where: { id: emptyTicket.id } });
    });

    it("should allow Requester to read their own tickets", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/actions`)
        .set("Authorization", `Bearer ${requesterToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
