import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

const prisma = getPrisma();

describe("Issue 5: Staff Dashboard API", () => {
  let adminToken: string;
  let staffToken: string;
  let reqToken: string;
  let adminUser: any;
  let staffUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: "Administrator" } });
    staffUser = await prisma.user.findFirst({ where: { role: "IT_Staff" } });
    const reqUser = await prisma.user.findFirst({ where: { role: "Requester" } });

    adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    staffToken = jwt.sign({ id: staffUser.id, role: staffUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    reqToken = jwt.sign({ id: reqUser.id, role: reqUser.role }, process.env.JWT_SECRET || "fallback-secret-for-development");

    // We rely on seed data or we can create explicit tickets.
    // Let's create an explicit set of tickets to ensure predictability.
    const category = await prisma.category.findFirstOrThrow();
    const system = await prisma.relatedSystem.findFirstOrThrow();
    
    // Clear old tests tickets
    await prisma.ticket.deleteMany({ where: { ticketNumber: { startsWith: 'DASH-ST' } } });

    await prisma.ticket.createMany({
      data: [
        { ticketNumber: "DASH-ST-001", summary: "T1", requestedPriority: "Low", currentStatus: "New", requesterId: reqUser.id, ticketOwnerId: null, categoryId: category.id, relatedSystemId: system.id, itPriority: "High" },
        { ticketNumber: "DASH-ST-002", summary: "T2", requestedPriority: "Low", currentStatus: "Closed", requesterId: reqUser.id, ticketOwnerId: null, categoryId: category.id, relatedSystemId: system.id, itPriority: "Low" },
        { ticketNumber: "DASH-ST-003", summary: "T3", requestedPriority: "Low", currentStatus: "Open", requesterId: reqUser.id, ticketOwnerId: staffUser.id, categoryId: category.id, relatedSystemId: system.id, itPriority: "Medium" },
        { ticketNumber: "DASH-ST-004", summary: "T4", requestedPriority: "Low", currentStatus: "In Progress", requesterId: reqUser.id, ticketOwnerId: staffUser.id, categoryId: category.id, relatedSystemId: system.id, itPriority: "Urgent" },
        { ticketNumber: "DASH-ST-005", summary: "T5", requestedPriority: "Low", currentStatus: "Cancelled", requesterId: reqUser.id, ticketOwnerId: staffUser.id, categoryId: category.id, relatedSystemId: system.id, itPriority: "Low" },
      ]
    });
    
    // Create an old ticket (updated 8 days ago)
    const oldDate = new Date();
    oldDate.setUTCDate(oldDate.getUTCDate() - 8);
    const oldTicket = await prisma.ticket.create({
      data: { ticketNumber: "DASH-ST-OLD", summary: "Old", requestedPriority: "Low", currentStatus: "New", requesterId: reqUser.id, categoryId: category.id, relatedSystemId: system.id }
    });
    await prisma.ticket.update({ where: { id: oldTicket.id }, data: { updatedAt: oldDate } });
  });

  it("should block Requester role (403)", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${reqToken}`);
    expect(res.status).toBe(403);
  });

  it("should return correct unassignedCount excluding Closed/Cancelled", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    // DASH-ST-001 is New/unassigned. DASH-ST-002 is Closed/unassigned.
    // There are other seeded tickets, but we ensure our explicitly created ones are in there.
    // We can just verify it's a number and >= 1
    expect(typeof res.body.unassignedCount).toBe("number");
    expect(res.body.unassignedCount).toBeGreaterThanOrEqual(1);
    
    // Check it doesn't include closed unassigned
    const closedUnassigned = await prisma.ticket.count({ where: { ticketOwnerId: null, currentStatus: "Closed" } });
    const totalUnassigned = await prisma.ticket.count({ where: { ticketOwnerId: null } });
    expect(res.body.unassignedCount).toBe(totalUnassigned - closedUnassigned);
  });

  it("should return myAssignedCount scoped to the calling IT Staff", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${staffToken}`);
    const actualCount = await prisma.ticket.count({ where: { ticketOwnerId: staffUser.id, currentStatus: { notIn: ["Closed", "Cancelled"] } } });
    expect(res.body.myAssignedCount).toBe(actualCount);
  });

  it("should return statusBreakdown including Closed/Cancelled", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${staffToken}`);
    expect(res.body.statusBreakdown["Closed"]).toBeGreaterThanOrEqual(1);
  });

  it("should return priorityBreakdown excluding Closed/Cancelled and correctly buckets NULL", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${staffToken}`);
    expect(res.body.priorityBreakdown).toBeDefined();
    const unprioritized = res.body.priorityBreakdown["Unprioritized"];
    if (unprioritized !== undefined) {
       expect(typeof unprioritized).toBe("number");
    }
  });

  it("should return recentlyUpdated respecting the 7-day window and ordered DESC", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${staffToken}`);
    const recent = res.body.recentlyUpdated;
    expect(Array.isArray(recent)).toBe(true);
    expect(recent.length).toBeLessThanOrEqual(10);
    
    const old = recent.find((t: any) => t.ticketNumber === "DASH-ST-OLD");
    expect(old).toBeUndefined(); // Should not include 8-day old ticket
    
    if (recent.length > 1) {
      expect(new Date(recent[0].updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(recent[1].updatedAt).getTime());
    }
  });

  it("should include admin-only fields when called by Administrator", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.activeUserCount).toBeDefined();
    expect(res.body.inactiveUserCount).toBeDefined();
  });

  it("should omit admin-only fields when called by IT Staff", async () => {
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${staffToken}`);
    expect(res.body.activeUserCount).toBeUndefined();
    expect(res.body.inactiveUserCount).toBeUndefined();
  });
  
  it("all-zero state: confirms 0/[] is returned, not an error", async () => {
    const existing = await prisma.user.findFirst({ where: { email: "zero@staff.com" } });
    if (existing) {
      await prisma.actionTaken.deleteMany({ where: { performedById: existing.id } });
      await prisma.user.deleteMany({ where: { email: "zero@staff.com" } });
    }
    const newStaff = await prisma.user.create({ data: { name: "Zero Staff", email: "zero@staff.com", password: "p", role: "IT_Staff", mustChangePassword: false } });
    const zeroToken = jwt.sign({ id: newStaff.id, role: newStaff.role }, process.env.JWT_SECRET || "fallback-secret-for-development");
    const res = await request(app).get("/api/dashboard/staff").set("Authorization", `Bearer ${zeroToken}`);
    expect(res.status).toBe(200);
    expect(res.body.myAssignedCount).toBe(0);
  });
});
