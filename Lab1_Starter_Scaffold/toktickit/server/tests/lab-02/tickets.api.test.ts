import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("POST /api/tickets", () => {
  const validPayload = {
    summary: "Test Ticket Summary",
    description: "This is a valid description that is at least 20 characters long.",
    categoryId: 1,
    systemId: 1,
    requestedPriority: "High",
    requesterId: 1
  };

  it("should return 201 Created and ticket JSON when payload is valid", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body.ticketNumber).toMatch(/^TIK-\d{5}$/);
    expect(res.body.summary).toBe(validPayload.summary);
    expect(res.body.currentStatus).toBe("New");
  });

  it("should return 400 Bad Request when summary is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...validPayload, summary: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Summary");
  });

  it("should return 400 Bad Request when summary exceeds 200 characters", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...validPayload, summary: "a".repeat(201) });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Summary");
  });

  it("should return 400 Bad Request when description is less than 20 characters", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...validPayload, description: "too short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Description");
  });
});
