/** @vitest-environment node */

import request from "supertest";
import bcrypt from "bcryptjs";
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

const TEST_ADMIN_USERNAME = "admin1";
const TEST_ADMIN_HASH = bcrypt.hashSync("unit-test-admin-password", 10);

process.env.NODE_ENV = "test";
process.env.ALLOWED_ORIGINS = "http://allowed.test";

const { app } = await import("../../server/index.js");

describe("API: security middleware", () => {
  beforeEach(() => {
    queryMock.mockReset();

    queryMock.mockImplementation(async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, " ").toLowerCase();
      if (normalized.includes("from admin_users")) {
        const username = String(params[0] || "");
        if (username === TEST_ADMIN_USERNAME) {
          return {
            rowCount: 1,
            rows: [
              {
                id: 1,
                username: TEST_ADMIN_USERNAME,
                password_hash: TEST_ADMIN_HASH,
                role: "admin",
              },
            ],
          };
        }
        return { rowCount: 0, rows: [] };
      }

      throw new Error(`Unhandled SQL in mock: ${normalized}`);
    });
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
        .send({ username: TEST_ADMIN_USERNAME, password: "wrong-password" });

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
