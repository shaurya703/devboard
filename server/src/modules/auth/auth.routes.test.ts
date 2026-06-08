import "../../test/prismaMock";
import request from "supertest";
import { createApp } from "../../app";

const app = createApp();

describe("auth HTTP plumbing", () => {
  it("GET /api/health returns the success envelope", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: "ok" } });
  });

  it("rejects registration with an invalid body (400 + field details)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "", email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toHaveProperty("email");
    expect(res.body.error.details).toHaveProperty("password");
  });

  it("GET /api/auth/me without a token returns 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("unknown routes return 404 in the failure envelope", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
