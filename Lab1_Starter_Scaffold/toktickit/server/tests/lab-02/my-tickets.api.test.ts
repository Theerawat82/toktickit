import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/tickets (My Tickets)", () => {
  it("should return 403 when x-requester-id header is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("x-requester-id");
  });

  it("should return tickets belonging only to the specified requester", async () => {
    // Requires some existing data (assuming seed data exists)
    // We will test with requesterId = 1
    const res = await request(app).get("/api/tickets").set("x-requester-id", "1");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    
    // Ensure all returned tickets belong to requester 1
    res.body.data.forEach((ticket: any) => {
      expect(ticket.requesterUserId).toBe(1);
    });
  });

  it("should apply pagination correctly", async () => {
    const res = await request(app)
      .get("/api/tickets?page=1&limit=2")
      .set("x-requester-id", "1");
    
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(2);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it("should apply search filtering correctly", async () => {
    const res = await request(app)
      .get("/api/tickets?search=TIK")
      .set("x-requester-id", "1");
    
    expect(res.status).toBe(200);
    res.body.data.forEach((ticket: any) => {
      const match = ticket.ticketNumber.includes("TIK") || ticket.summary.includes("TIK");
      expect(match).toBe(true);
    });
  });

  it("should return 400 Bad Request when category is invalid", async () => {
    const res = await request(app)
      .get("/api/tickets?category=invalid")
      .set("x-requester-id", "1");
    
    expect(res.status).toBe(400);
  });
});
