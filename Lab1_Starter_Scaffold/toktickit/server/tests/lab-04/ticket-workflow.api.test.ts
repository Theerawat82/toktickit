import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

const prisma = getPrisma();

describe("Issue 4: Ticket Workflow API", () => {
  let adminToken: string;
  let staffToken: string;
  let requesterToken: string;
  let adminUser: any;
  let staffUser: any;
  let reqUser: any;
  let testTicket: any;
  let testTicket2: any;
  let category: any;
  let system: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: "Administrator" } });
    if (!adminUser) {
      adminUser = await prisma.user.create({ data: { name: "Admin", email: "admin2@test.com", password: "pwd", role: "Administrator" } });
    }
    staffUser = await prisma.user.findFirst({ where: { role: "IT_Staff" } });
    reqUser = await prisma.user.findFirst({ where: { role: "Requester" } });

    adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    staffToken = jwt.sign({ id: staffUser.id, role: staffUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    requesterToken = jwt.sign({ id: reqUser.id, role: reqUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");

    category = await prisma.category.findFirst();
    system = await prisma.relatedSystem.findFirst();

    testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: "TEST-WF-001",
        summary: "Test workflow",
        requestedPriority: "Low",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requesterId: reqUser.id,
        currentStatus: "New",
        status: "New"
      }
    });
    
    testTicket2 = await prisma.ticket.create({
      data: {
        ticketNumber: "TEST-WF-002",
        summary: "Test workflow 2",
        requestedPriority: "Low",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requesterId: reqUser.id,
        currentStatus: "Resolved",
        status: "Resolved"
      }
    });
  });

  afterAll(async () => {
    await prisma.actionTaken.deleteMany({ where: { ticketId: testTicket.id } });
    await prisma.actionTaken.deleteMany({ where: { ticketId: testTicket2.id } });
    await prisma.ticket.delete({ where: { id: testTicket.id } });
    await prisma.ticket.delete({ where: { id: testTicket2.id } });
  });

  describe("PATCH /api/tickets/:id/status", () => {
    it("should reject Requester (403)", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ status: "Open", version: testTicket.version });
      expect(res.status).toBe(403);
    });

    it("should reject invalid transition from New -> Resolved (400)", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "Resolved", version: testTicket.version });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot transition/);
    });

    it("should transition New -> Open successfully", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "Open", version: testTicket.version });
      if(res.status===403)console.log("BODY:",res.body);expect(res.status).toBe(200);
      expect(res.body.ticket.currentStatus).toBe("Open");
      expect(res.body.ticket.version).toBe(testTicket.version + 1);
      testTicket = res.body.ticket;
    });

    it("should return 409 if version is stale", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "In Progress", version: 1 }); // Stale version
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Conflict/);
      expect(res.body.currentServerRow).toBeDefined();
    });

    it("should reject transition to Resolved if no Action Taken exists (BR-08)", async () => {
      // First move to In Progress
      let res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "In Progress", version: testTicket.version });
      if(res.status===403)console.log("BODY:",res.body);expect(res.status).toBe(200);
      testTicket = res.body.ticket;

      // Try resolving
      res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "Resolved", version: testTicket.version });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Action Taken/);
    });

    it("should allow transition to Resolved after an Action Taken is added", async () => {
      // Add action taken
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicket.id,
          actionDescription: "Did something",
          result: "Done",
          performedById: staffUser.id
        }
      });

      const beforeTicket = await prisma.ticket.findUnique({ where: { id: testTicket.id } });

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "Resolved", version: testTicket.version });
      if(res.status===403)console.log("BODY:",res.body);expect(res.status).toBe(200);
      expect(res.body.ticket.currentStatus).toBe("Resolved");
      testTicket = res.body.ticket;
      expect(new Date(testTicket.updatedAt).getTime()).toBeGreaterThan(new Date(beforeTicket!.updatedAt).getTime());
    });
  });

  describe("PATCH /api/tickets/:id/confirm-resolved", () => {
    it("should reject IT Staff (403)", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/confirm-resolved`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ version: testTicket.version });
      expect(res.status).toBe(403);
    });

    it("should successfully confirm resolution for Requester and NOT change status", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/confirm-resolved`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ version: testTicket.version });
      if(res.status===403)console.log("BODY:",res.body);expect(res.status).toBe(200);
      expect(res.body.ticket.requesterConfirmedResolved).toBe(true);
      expect(res.body.ticket.currentStatus).toBe("Resolved"); // Unchanged
      testTicket = res.body.ticket;
    });

    it("should return 409 if version is stale on confirm-resolved", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/confirm-resolved`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ version: 1 });
      expect(res.status).toBe(409);
    });

    it("should reset requesterConfirmedResolved when status changes from Resolved to anything else", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "Reopened", version: testTicket.version });
      if(res.status===403)console.log("BODY:",res.body);expect(res.status).toBe(200);
      expect(res.body.ticket.currentStatus).toBe("Reopened");
      expect(res.body.ticket.requesterConfirmedResolved).toBe(false); // Reset to false
      testTicket = res.body.ticket;
    });

    it("should reject confirm-resolved if ticket is not Resolved", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/confirm-resolved`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ version: testTicket.version });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Resolved state/);
    });
  });

  describe("PATCH /api/tickets/:id/owner and priority", () => {
    it("should require version for owner and priority", async () => {
      let res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/owner`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ticketOwnerId: staffUser.id });
      expect(res.status).toBe(400);

      res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/priority`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ itPriority: "High" });
      expect(res.status).toBe(400);
    });

    it("should return 409 on stale version", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/priority`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ itPriority: "High", version: 1 });
      expect(res.status).toBe(409);
    });
  });
});
