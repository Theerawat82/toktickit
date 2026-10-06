import { test, expect, describe, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("Issue 6: Validation & Safe Errors (3D)", () => {
  let adminToken: string;

  test("Get admin token", async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin@toktickit.com', password: 'Password123!' });
    adminToken = loginRes.body.token;
  });

  test("400 for non-numeric path IDs", async () => {
    const res = await request(app)
      .get(`/api/tickets/abc/actions`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("400 for negative path IDs", async () => {
    const res = await request(app)
      .get(`/api/tickets/-5/actions`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  test("400 for malformed JSON", async () => {
    const res = await request(app)
      .post(`/api/tickets/1/actions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send('{"actionDescription": "test", "result": '); // Broken JSON
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("Forced 500 does not leak SQL/stack trace", async () => {
    vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({ id: 1 } as any); vi.spyOn(prisma.actionTaken, 'findMany').mockRejectedValueOnce(new Error("Prisma SQL Error: SELECT * FROM X"));
    const res = await request(app)
      .get(`/api/tickets/1/actions`)
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
    // Prove it's generic and doesn't leak internals
    expect(res.body.error).not.toMatch(/Prisma/i);
    expect(res.body.error).not.toMatch(/SQL/i);
    expect(res.body.error).not.toMatch(/SELECT \*/i);
    expect(JSON.stringify(res.body)).not.toContain("Prisma SQL Error");
    
    vi.restoreAllMocks();
  });
});
