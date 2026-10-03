import { test, expect, describe, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { PrismaClient, TicketStatus, ITPriority } from "@prisma/client";

// Define a separate prisma client that logs queries so we can count them
const prismaWithLogging = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }]
});

describe("Issue 6: Performance Smoke Test (N+1)", () => {
  let adminToken: string;
  let reqToken: string;
  let staffToken: string;
  let testTicketId: number;

  afterAll(async () => {
    await prismaWithLogging.$disconnect();
  });

  test("Dashboard and Actions endpoints should avoid N+1 queries when volume increases", async () => {
    // 1. Get tokens dynamically
    const adminUser = await prismaWithLogging.user.findFirst({ where: { role: "Administrator" } });
    const reqUser = await prismaWithLogging.user.findFirst({ where: { role: "Requester" } });
    const staffUser = await prismaWithLogging.user.findFirst({ where: { role: "IT_Staff" } });
    
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "fallback-secret-for-development";
    adminToken = jwt.sign({ id: adminUser!.id, role: adminUser!.role }, secret);
    reqToken = jwt.sign({ id: reqUser!.id, role: reqUser!.role }, secret);
    staffToken = jwt.sign({ id: staffUser!.id, role: staffUser!.role }, secret);

    const ticket = await prismaWithLogging.ticket.findFirst();
    testTicketId = ticket!.id;

    // Shared counter and listener setup
    let globalQueryCount = 0;
    // @ts-ignore
    prismaWithLogging.$on('query', (e: any) => {
      if (!e.query.includes('BEGIN') && !e.query.includes('COMMIT')) {
        globalQueryCount++;
      }
    });

    // Helper to count queries
    const countQueries = async (method: "get", url: string, token: string) => {
      globalQueryCount = 0; // reset
      const start = Date.now();
      const res = await request(app)[method](url).set("Authorization", `Bearer ${token}`);
      const duration = Date.now() - start;
      const queryCount = globalQueryCount;
      return { status: res.status, queryCount, duration };
    };

    // Baseline queries
    const staffDashBase = await countQueries("get", "/api/dashboard/staff", staffToken);
    const reqDashBase = await countQueries("get", "/api/dashboard/requester", reqToken);
    const actionsBase = await countQueries("get", `/api/tickets/${testTicketId}/actions`, staffToken);
    
    expect(staffDashBase.status).toBe(200);
    expect(reqDashBase.status).toBe(200);
    expect(actionsBase.status).toBe(200);
    
    expect(staffDashBase.duration).toBeLessThan(1500);
    expect(reqDashBase.duration).toBeLessThan(1500);
    expect(actionsBase.duration).toBeLessThan(1500);

    // Now insert ~3x more tickets
    const cat = await prismaWithLogging.category.findFirst();
    const sys = await prismaWithLogging.relatedSystem.findFirst();
    
    const newTickets = [];
    for(let i=0; i<30; i++) {
        newTickets.push({
            ticketNumber: `PERF-${Date.now()}-${i}`,
            summary: "Perf test",
            categoryId: cat!.id,
            relatedSystemId: sys!.id,
            requesterId: reqUser!.id,
            currentStatus: "New",
            status: TicketStatus.New,
            requestedPriority: ITPriority.Low
        });
    }
    await prismaWithLogging.ticket.createMany({ data: newTickets });

    // Also add multiple actions to the test ticket
    const newActions = [];
    for(let i=0; i<15; i++) {
        newActions.push({
            ticketId: testTicketId,
            actionDescription: "Perf action " + i,
            result: "Done",
            performedById: staffUser!.id
        });
    }
    await prismaWithLogging.actionTaken.createMany({ data: newActions });

    // Measure again
    const staffDashAfter = await countQueries("get", "/api/dashboard/staff", staffToken);
    const reqDashAfter = await countQueries("get", "/api/dashboard/requester", reqToken);
    const actionsAfter = await countQueries("get", `/api/tickets/${testTicketId}/actions`, staffToken);

    // The query count should remain relatively constant (O(1) queries), not scale with N
    expect(staffDashAfter.queryCount).toBeLessThanOrEqual(staffDashBase.queryCount + 2);
    expect(reqDashAfter.queryCount).toBeLessThanOrEqual(reqDashBase.queryCount + 2);
    expect(actionsAfter.queryCount).toBeLessThanOrEqual(actionsBase.queryCount + 2);
    
    expect(staffDashAfter.duration).toBeLessThan(1500);
    expect(reqDashAfter.duration).toBeLessThan(1500);
    expect(actionsAfter.duration).toBeLessThan(1500);
    
    // Cleanup
    await prismaWithLogging.ticket.deleteMany({ where: { summary: "Perf test" } });
    await prismaWithLogging.actionTaken.deleteMany({ where: { actionDescription: { startsWith: "Perf action" } } });
  });
});
