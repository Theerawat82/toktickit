import { test, expect, describe, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
const generateToken = (payload: any) => jwt.sign(payload, JWT_SECRET);

describe("Issue 6: Authorization Matrix", () => {
  let tokens: Record<string, string> = {};
  let validTicketId: number;
  let otherTicketId: number;
  let userIds: number[] = [];
  let reqOwnUser: any;
  let reqOtherUser: any;
  let itStaffUser: any;
  let catId: number;
  let sysId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const pwd = await bcrypt.hash("Password123!", 10);

    const reqOwn = await prisma.user.create({ data: { name: "ReqOwn", email: "reqown_mat4@test.com", password: pwd, role: "Requester", mustChangePassword: false } });
    const reqOther = await prisma.user.create({ data: { name: "ReqOther", email: "reqother_mat4@test.com", password: pwd, role: "Requester", mustChangePassword: false } });
    const itStaff = await prisma.user.create({ data: { name: "Staff", email: "staff_matrix4@test.com", password: pwd, role: "IT_Staff", mustChangePassword: false } });
    const admin = await prisma.user.create({ data: { name: "Admin", email: "admin_matrix4@test.com", password: pwd, role: "Administrator", mustChangePassword: false } });
    const inactive = await prisma.user.create({ data: { name: "Inactive", email: "inactive_matrix4@test.com", password: pwd, role: "Requester", isActive: false, mustChangePassword: false } });
    const mustChange = await prisma.user.create({ data: { name: "MustChange", email: "mustchange4@test.com", password: pwd, role: "Requester", mustChangePassword: true } });

    reqOwnUser = reqOwn;
    reqOtherUser = reqOther;
    itStaffUser = itStaff;

    userIds = [reqOwn.id, reqOther.id, itStaff.id, admin.id, inactive.id, mustChange.id];

    tokens = {
      unauth: "",
      reqOwn: generateToken({ id: reqOwn.id, role: reqOwn.role }),
      reqOther: generateToken({ id: reqOther.id, role: reqOther.role }),
      itStaff: generateToken({ id: itStaff.id, role: itStaff.role }),
      admin: generateToken({ id: admin.id, role: admin.role }),
      inactive: generateToken({ id: inactive.id, role: inactive.role }),
      mustChange: generateToken({ id: mustChange.id, role: mustChange.role })
    };

    const cat = await prisma.category.findFirst() || await prisma.category.create({ data: { name: "MatrixCat4" } });
    const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({ data: { name: "MatrixSys4" } });
    catId = cat.id;
    sysId = sys.id;

    const ticket1 = await prisma.ticket.create({
      data: { ticketNumber: "MAT-201", summary: "T1", requestedPriority: "Low", categoryId: cat.id, relatedSystemId: sys.id, requesterId: reqOwn.id, currentStatus: "New", status: "New", version: 1 }
    });
    validTicketId = ticket1.id;

    const ticket2 = await prisma.ticket.create({
      data: { ticketNumber: "MAT-301", summary: "T2", requestedPriority: "Low", categoryId: cat.id, relatedSystemId: sys.id, requesterId: reqOther.id, currentStatus: "New", status: "New", version: 1 }
    });
    otherTicketId = ticket2.id;
  });

  afterAll(async () => {
    const prisma = getPrisma();
    await prisma.ticket.deleteMany({ where: { requesterId: { in: [reqOwnUser.id, reqOtherUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  const matrixTest = async (
    method: "get" | "post" | "patch",
    urlFn: (id: string | number) => string,
    payloadFn: (ticketId: number) => any,
    expected: Record<string, number | number[]>,
    setupFreshTicket?: () => Promise<{ ownedId: number, otherId: number }>
  ) => {
    const roles = ["unauth", "reqOwn", "reqOther", "itStaff", "admin", "inactive", "mustChange"];
    
    for (const role of roles) {
      let currentOwnedId = validTicketId;
      let currentOtherId = otherTicketId;

      if (setupFreshTicket) {
        const freshIds = await setupFreshTicket();
        currentOwnedId = freshIds.ownedId;
        currentOtherId = freshIds.otherId;
      }

      let idToUse = role === "reqOther" ? currentOtherId : currentOwnedId;
      if (!urlFn(idToUse).includes("/api/dashboard") && !urlFn(idToUse).includes("/api/health")) {
         if (role === "reqOther") idToUse = currentOwnedId; // unowned ticket
      }

      const req = request(app)[method](urlFn(idToUse));
      if (tokens[role]) req.set("Authorization", `Bearer ${tokens[role]}`);
      if (payloadFn) req.send(payloadFn(idToUse));

      const res = await req;
      
      const expectedCode = expected[role];
      if (Array.isArray(expectedCode)) {
        expect(expectedCode).toContain(res.status);
      } else {
        expect(res.status, `Failed for ${method.toUpperCase()} ${urlFn(idToUse)} with role ${role} - got ${res.status} expected ${expectedCode}`).toBe(expectedCode);
      }
    }

    if (urlFn("invalid").includes("invalid") && expected.invalidId) {
      const resInvalid = await request(app)[method](urlFn("invalid")).set("Authorization", `Bearer ${tokens.admin}`).send(payloadFn ? payloadFn(-1) : null);
      const ex = expected.invalidId;
      if (Array.isArray(ex)) expect(ex).toContain(resInvalid.status);
      else expect(resInvalid.status).toBe(ex);
    }
    
    if (urlFn(99999).includes("99999") && expected.nonexistentId) {
      const resMissing = await request(app)[method](urlFn(99999)).set("Authorization", `Bearer ${tokens.admin}`).send(payloadFn ? payloadFn(-1) : null);
      const ex = expected.nonexistentId;
      if (Array.isArray(ex)) expect(ex).toContain(resMissing.status);
      else expect(resMissing.status).toBe(ex);
    }
  };

  test("GET /api/health", async () => {
    await matrixTest("get", () => "/api/health", () => null, {
      unauth: 200, reqOwn: 200, reqOther: 200, itStaff: 200, admin: 200, inactive: 200, mustChange: 200
    });
  });

  test("GET /api/dashboard/requester", async () => {
    await matrixTest("get", () => "/api/dashboard/requester", () => null, {
      unauth: 401, reqOwn: 200, reqOther: 200, itStaff: 403, admin: 403, inactive: 403, mustChange: 403
    });
  });

  test("GET /api/dashboard/staff", async () => {
    await matrixTest("get", () => "/api/dashboard/staff", () => null, {
      unauth: 401, reqOwn: 403, reqOther: 403, itStaff: 200, admin: 200, inactive: 403, mustChange: 403
    });
  });

  test("GET /api/tickets/:id/actions", async () => {
    await matrixTest("get", (id) => `/api/tickets/${id}/actions`, () => null, {
      unauth: 401, reqOwn: 200, reqOther: 404, itStaff: 200, admin: 200, inactive: 403, mustChange: 403,
      invalidId: 400, nonexistentId: 404
    });
  });

  test("POST /api/tickets/:id/actions", async () => {
    await matrixTest("post", (id) => `/api/tickets/${id}/actions`, () => ({ actionDescription: "Test " + Math.random(), result: "Test", followUpRequired: false }), {
      unauth: 401, reqOwn: 403, reqOther: 403, itStaff: 201, admin: 201, inactive: 403, mustChange: 403,
      invalidId: 400, nonexistentId: 404
    });
  });

  const setupStatusFresh = async () => {
    const prisma = getPrisma();
    const tOwned = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T1", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOwnUser.id, currentStatus: "New", status: "New", version: 1 } });
    const tOther = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T2", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOtherUser.id, currentStatus: "New", status: "New", version: 1 } });
    return { ownedId: tOwned.id, otherId: tOther.id };
  };

  test("PATCH /api/tickets/:id/status", async () => {
    await matrixTest("patch", (id) => `/api/tickets/${id}/status`, () => ({ status: "Open", version: 1 }), {
      unauth: 401, reqOwn: 403, reqOther: 404, itStaff: 200, admin: 200, inactive: 403, mustChange: 403,
      invalidId: 400, nonexistentId: 404
    }, setupStatusFresh);
  });

  const setupConfirmFresh = async () => {
    const prisma = getPrisma();
    const tOwned = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T1", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOwnUser.id, currentStatus: "Resolved", status: "Resolved", version: 1 } });
    const tOther = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T2", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOtherUser.id, currentStatus: "Resolved", status: "Resolved", version: 1 } });
    return { ownedId: tOwned.id, otherId: tOther.id };
  };

  test("PATCH /api/tickets/:id/confirm-resolved", async () => {
    await matrixTest("patch", (id) => `/api/tickets/${id}/confirm-resolved`, () => ({ version: 1 }), {
      unauth: 401, reqOwn: 200, reqOther: 404, itStaff: 403, admin: 403, inactive: 403, mustChange: 403,
      invalidId: 400, nonexistentId: 404
    }, setupConfirmFresh);
  });

  const setupOwnerFresh = async () => {
    const prisma = getPrisma();
    const tOwned = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T1", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOwnUser.id, currentStatus: "New", status: "New", version: 1 } });
    const tOther = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T2", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOtherUser.id, currentStatus: "New", status: "New", version: 1 } });
    return { ownedId: tOwned.id, otherId: tOther.id };
  };

  test("PATCH /api/tickets/:id/owner", async () => {
    await matrixTest("patch", (id) => `/api/tickets/${id}/owner`, () => ({ ticketOwnerId: itStaffUser.id, version: 1 }), {
      unauth: 401, reqOwn: 403, reqOther: 403, itStaff: 200, admin: 200, inactive: 403, mustChange: 403,
      invalidId: 400, nonexistentId: 404
    }, setupOwnerFresh);
  });

  const setupPriorityFresh = async () => {
    const prisma = getPrisma();
    const tOwned = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T1", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOwnUser.id, currentStatus: "New", status: "New", version: 1 } });
    const tOther = await prisma.ticket.create({ data: { ticketNumber: "M-" + Math.random().toString(36).substring(2, 9), summary: "T2", requestedPriority: "Low", categoryId: catId, relatedSystemId: sysId, requesterId: reqOtherUser.id, currentStatus: "New", status: "New", version: 1 } });
    return { ownedId: tOwned.id, otherId: tOther.id };
  };

  test("PATCH /api/tickets/:id/priority", async () => {
    await matrixTest("patch", (id) => `/api/tickets/${id}/priority`, () => ({ itPriority: "High", version: 1 }), {
      unauth: 401, reqOwn: 403, reqOther: 403, itStaff: 200, admin: 200, inactive: 403, mustChange: 403,
      invalidId: 400, nonexistentId: 404
    }, setupPriorityFresh);
  });
});
