/** @vitest-environment node */

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, sendStaffNotificationMock, sendPatientConfirmationMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  sendStaffNotificationMock: vi.fn(),
  sendPatientConfirmationMock: vi.fn(),
}));

vi.mock("../../server/db.js", () => ({
  query: queryMock,
  default: { end: vi.fn() },
}));

vi.mock("../../server/email.js", () => ({
  sendStaffNotification: sendStaffNotificationMock,
  sendPatientConfirmation: sendPatientConfirmationMock,
}));

process.env.NODE_ENV = "test";
process.env.ADMIN_PASSWORD = "unit-test-admin-password";
process.env.ALLOWED_ORIGINS = "http://allowed.test";

const { app } = await import("../../server/index.js");

describe("API: security middleware", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("allows configured CORS origin", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://allowed.test");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("http://allowed.test");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("rejects disallowed CORS origin", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://not-allowed.test");

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/origin not allowed by cors/i);
  });

  it("applies rate limiter on admin login", async () => {
    let rateLimitedResponse = null;

    for (let i = 0; i < 20; i += 1) {
      const response = await request(app)
        .post("/api/admin/login")
        .send({ password: "wrong-password" });

      if (response.status === 429) {
        rateLimitedResponse = response;
        break;
      }

      expect(response.status).toBe(401);
    }

    expect(rateLimitedResponse).toBeTruthy();
    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedResponse.body.message).toMatch(/too many requests/i);
    expect(rateLimitedResponse.headers["retry-after"]).toBeTruthy();
  });
});
