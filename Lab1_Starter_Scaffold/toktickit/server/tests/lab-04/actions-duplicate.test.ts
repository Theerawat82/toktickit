import { test, expect, describe, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("Issue 6: Duplicate Submit Action POST", () => {
  let itStaffToken: string;
  let testTicketId: number;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'staff1@toktickit.com', password: 'Password123!' });
    itStaffToken = loginRes.body.token;
    
    const ticket = await prisma.ticket.findFirst();
    testTicketId = ticket!.id;
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("Promise.all concurrent identical POSTs -> exactly one row in DB", async () => {
    const payload = {
      actionDescription: "Concurrent test action " + Date.now(),
      result: "Done",
      followUpRequired: false
    };

    const req1 = request(app).post(`/api/tickets/${testTicketId}/actions`).set("Authorization", `Bearer ${itStaffToken}`).send(payload);
    const req2 = request(app).post(`/api/tickets/${testTicketId}/actions`).set("Authorization", `Bearer ${itStaffToken}`).send(payload);

    const [res1, res2] = await Promise.all([req1, req2]);
    expect([res1.status, res2.status].sort()).toEqual([200, 201]);

    const rowCount = await prisma.actionTaken.count({
      where: { ticketId: testTicketId, actionDescription: payload.actionDescription }
    });
    expect(rowCount).toBe(1);
  });

  test("Sequential identical POSTs -> exactly one row in DB", async () => {
    const payload = {
      actionDescription: "Sequential test action " + Date.now(),
      result: "Done",
      followUpRequired: false
    };

    const res1 = await request(app).post(`/api/tickets/${testTicketId}/actions`).set("Authorization", `Bearer ${itStaffToken}`).send(payload);
    const res2 = await request(app).post(`/api/tickets/${testTicketId}/actions`).set("Authorization", `Bearer ${itStaffToken}`).send(payload);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(200);

    const rowCount = await prisma.actionTaken.count({
      where: { ticketId: testTicketId, actionDescription: payload.actionDescription }
    });
    expect(rowCount).toBe(1);
  });

  test("Identical POSTs after 10 seconds -> exactly TWO rows in DB", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    
    const payload = {
      actionDescription: "Delay test action " + Date.now(),
      result: "Done",
      followUpRequired: false
    };

    // First request
    const res1 = await request(app).post(`/api/tickets/${testTicketId}/actions`).set("Authorization", `Bearer ${itStaffToken}`).send(payload);
    expect(res1.status).toBe(201);

    // Fast-forward 11 seconds (11000 ms)
    vi.advanceTimersByTime(11000);

    // Second request
    const res2 = await request(app).post(`/api/tickets/${testTicketId}/actions`).set("Authorization", `Bearer ${itStaffToken}`).send(payload);
    expect(res2.status).toBe(201); // Should be 201 because the window expired!

    const rowCount = await prisma.actionTaken.count({
      where: { ticketId: testTicketId, actionDescription: payload.actionDescription }
    });
    expect(rowCount).toBe(2);
    
    vi.useRealTimers();
  });
});
