import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

const prisma = getPrisma();

describe("Issue 5: Requester Dashboard API", () => {
  let staffToken: string;
  let req1Token: string;
  let req2Token: string;
  let reqUser1: any;
  let reqUser2: any;

  beforeAll(async () => {
    reqUser1 = await prisma.user.findFirst({ where: { email: "req1@toktickit.com" } });
    reqUser2 = await prisma.user.findFirst({ where: { email: "req2@toktickit.com" } }); // Zero ticket user
    const staffUser = await prisma.user.findFirst({ where: { role: "IT_Staff" } });

    req1Token = jwt.sign({ id: reqUser1.id, role: reqUser1.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    req2Token = jwt.sign({ id: reqUser2.id, role: reqUser2.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    staffToken = jwt.sign({ id: staffUser!.id, role: staffUser!.role }, process.env.JWT_SECRET || "fallback-secret-for-development");

    const category = await prisma.category.findFirstOrThrow();
    const system = await prisma.relatedSystem.findFirstOrThrow();
    
    await prisma.ticket.deleteMany({ where: { ticketNumber: { startsWith: 'DASH-REQ' } } });

    await prisma.ticket.createMany({
      data: [
        { ticketNumber: "DASH-REQ-001", summary: "Open 1", requestedPriority: "Low", currentStatus: "New", requesterId: reqUser1.id, categoryId: category.id, relatedSystemId: system.id },
        { ticketNumber: "DASH-REQ-002", summary: "Waiting 1", requestedPriority: "Low", currentStatus: "Waiting for Requester", requesterId: reqUser1.id, categoryId: category.id, relatedSystemId: system.id },
        { ticketNumber: "DASH-REQ-003", summary: "Resolved 1", requestedPriority: "Low", currentStatus: "Resolved", requesterId: reqUser1.id, categoryId: category.id, relatedSystemId: system.id, requesterConfirmedResolved: true },
        { ticketNumber: "DASH-REQ-004", summary: "Closed 1", requestedPriority: "Low", currentStatus: "Closed", requesterId: reqUser1.id, categoryId: category.id, relatedSystemId: system.id },
      ]
    });
    
    // Create an old resolved ticket (updated 8 days ago)
    const oldDate = new Date();
    oldDate.setUTCDate(oldDate.getUTCDate() - 8);
    const oldTicket = await prisma.ticket.create({
      data: { ticketNumber: "DASH-REQ-OLD", summary: "Old", requestedPriority: "Low", currentStatus: "Resolved", requesterId: reqUser1.id, categoryId: category.id, relatedSystemId: system.id }
    });
    await prisma.ticket.update({ where: { id: oldTicket.id }, data: { updatedAt: oldDate } });
  });

  it("should block IT Staff role (403)", async () => {
    const res = await request(app).get("/api/dashboard/requester").set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });

  it("should reject if requesterId is passed in query", async () => {
    const res = await request(app).get(`/api/dashboard/requester?requesterId=${reqUser2.id}`).set("Authorization", `Bearer ${req1Token}`);
    expect(res.status).toBe(400);
  });

  it("should return myOpenCount and waitingForRequesterCount correctly scoped", async () => {
    const res = await request(app).get("/api/dashboard/requester").set("Authorization", `Bearer ${req1Token}`);
    expect(res.status).toBe(200);
    
    const actualOpen = await prisma.ticket.count({ where: { requesterId: reqUser1.id, currentStatus: { notIn: ["Resolved", "Closed", "Cancelled"] } } });
    const actualWaiting = await prisma.ticket.count({ where: { requesterId: reqUser1.id, currentStatus: "Waiting for Requester" } });
    
    expect(res.body.myOpenCount).toBe(actualOpen);
    expect(res.body.waitingForRequesterCount).toBe(actualWaiting);
  });

  it("should return recentlyResolved only including Resolved/Closed tickets within 7 days", async () => {
    const res = await request(app).get("/api/dashboard/requester").set("Authorization", `Bearer ${req1Token}`);
    const resolved = res.body.recentlyResolved;
    expect(Array.isArray(resolved)).toBe(true);
    
    const old = resolved.find((t: any) => t.ticketNumber === "DASH-REQ-OLD");
    expect(old).toBeUndefined(); // Should exclude 8-day old ticket
    
    const allAreResolvedOrClosed = resolved.every((t: any) => ["Resolved", "Closed"].includes(t.currentStatus));
    expect(allAreResolvedOrClosed).toBe(true);
  });

  it("recentlyResolved rows should include requesterConfirmedResolved accurately", async () => {
    const res = await request(app).get("/api/dashboard/requester").set("Authorization", `Bearer ${req1Token}`);
    const resolved1 = res.body.recentlyResolved.find((t: any) => t.ticketNumber === "DASH-REQ-003");
    expect(resolved1).toBeDefined();
    expect(resolved1.requesterConfirmedResolved).toBe(true);
  });

  it("zero-ticket Requester gets all-zero/empty response, 200", async () => {
    // reqUser2 has zero tickets (seeded)
    const res = await request(app).get("/api/dashboard/requester").set("Authorization", `Bearer ${req2Token}`);
    expect(res.status).toBe(200);
    expect(res.body.myOpenCount).toBe(0);
    expect(res.body.waitingForRequesterCount).toBe(0);
    expect(res.body.recentlyUpdated).toEqual([]);
    expect(res.body.recentlyResolved).toEqual([]);
  });
});
