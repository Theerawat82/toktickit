import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/categories", () => {
  it("should return 200 OK and an array", async () => {
    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return items with id and name fields", async () => {
    const res = await request(app).get("/api/categories");

    if (res.body.length > 0) {
      for (const category of res.body) {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("name");
        expect(typeof category.id).toBe("number");
        expect(typeof category.name).toBe("string");
      }
    }
  });
});
