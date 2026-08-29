import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/related-systems", () => {
  it("should return 200 OK and an array", async () => {
    const res = await request(app).get("/api/related-systems");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return items with id and name fields", async () => {
    const res = await request(app).get("/api/related-systems");

    if (res.body.length > 0) {
      for (const system of res.body) {
        expect(system).toHaveProperty("id");
        expect(system).toHaveProperty("name");
        expect(typeof system.id).toBe("number");
        expect(typeof system.name).toBe("string");
      }
    }
  });
});
