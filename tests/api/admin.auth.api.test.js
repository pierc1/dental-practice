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
const TEST_ADMIN_PASSWORD = "unit-test-admin-password";
const TEST_ADMIN_HASH = bcrypt.hashSync(TEST_ADMIN_PASSWORD, 10);
const TEST_ADMIN_2_USERNAME = "admin2";
const TEST_ADMIN_2_PASSWORD = "unit-test-admin-password-2";
const TEST_ADMIN_2_HASH = bcrypt.hashSync(TEST_ADMIN_2_PASSWORD, 10);

process.env.NODE_ENV = "test";

const { app } = await import("../../server/index.js");

describe("API: admin auth/session", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sendStaffNotificationMock.mockReset();
    sendPatientConfirmationMock.mockReset();

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
        if (username === TEST_ADMIN_2_USERNAME) {
          return {
            rowCount: 1,
            rows: [
              {
                id: 2,
                username: TEST_ADMIN_2_USERNAME,
                password_hash: TEST_ADMIN_2_HASH,
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

  it("logs in with valid password and sets cookie + no-store", async () => {
    const response = await request(app)
      .post("/api/admin/login")
      .send({ username: TEST_ADMIN_USERNAME, password: TEST_ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.sessionTtlMinutes).toBeGreaterThan(0);
    expect(response.body.user).toMatchObject({ username: TEST_ADMIN_USERNAME, role: "admin" });
    expect(response.headers["cache-control"]).toBe("no-store");

    const setCookie = response.headers["set-cookie"]?.[0] || "";
    expect(setCookie).toContain("admin_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");

    if (process.env.NODE_ENV === "production") {
      expect(setCookie).toContain("Secure");
    } else {
      expect(setCookie).not.toContain("Secure");
    }
  });

  it("rejects invalid admin password", async () => {
    const response = await request(app)
      .post("/api/admin/login")
      .send({ username: TEST_ADMIN_USERNAME, password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/invalid admin credentials/i);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("logs in with a second admin account", async () => {
    const response = await request(app)
      .post("/api/admin/login")
      .send({ username: TEST_ADMIN_2_USERNAME, password: TEST_ADMIN_2_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      user: { username: TEST_ADMIN_2_USERNAME, role: "admin" },
    });
  });

  it("rejects unknown username and does not create admin rows", async () => {
    const response = await request(app)
      .post("/api/admin/login")
      .send({ username: "made-up-admin", password: "any-password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/invalid admin credentials/i);

    const executedSql = queryMock.mock.calls.map(([sql]) =>
      String(sql).replace(/\s+/g, " ").toLowerCase()
    );
    expect(executedSql.some((sql) => sql.includes("insert into admin_users"))).toBe(false);
  });

  it("does not expose any admin-user creation endpoint", async () => {
    const response = await request(app).post("/api/admin/users").send({
      username: "should-not-work",
      password: "should-not-work",
    });

    expect(response.status).toBe(404);
  });

  it("rejects missing admin username or password", async () => {
    const response = await request(app).post("/api/admin/login").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/username and password are required/i);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("returns unauthorized for missing session cookie", async () => {
    const response = await request(app).get("/api/admin/session");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/unauthorized/i);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("returns unauthorized for invalid session cookie", async () => {
    const response = await request(app)
      .get("/api/admin/session")
      .set("Cookie", "admin_session=invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/unauthorized/i);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("returns authenticated=true for valid session", async () => {
    const loginResponse = await request(app)
      .post("/api/admin/login")
      .send({ username: TEST_ADMIN_USERNAME, password: TEST_ADMIN_PASSWORD });

    const cookie = loginResponse.headers["set-cookie"]?.[0];
    expect(cookie).toBeTruthy();

    const sessionResponse = await request(app)
      .get("/api/admin/session")
      .set("Cookie", cookie);

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body).toMatchObject({
      authenticated: true,
      user: { username: TEST_ADMIN_USERNAME, role: "admin" },
    });
    expect(sessionResponse.body.sessionTtlMinutes).toBeGreaterThan(0);
    expect(sessionResponse.headers["cache-control"]).toBe("no-store");
  });

  it("logout is best-effort with no active session", async () => {
    const response = await request(app).post("/api/admin/logout");

    expect(response.status).toBe(204);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("logout clears session cookie for active session", async () => {
    const loginResponse = await request(app)
      .post("/api/admin/login")
      .send({ username: TEST_ADMIN_USERNAME, password: TEST_ADMIN_PASSWORD });
    const cookie = loginResponse.headers["set-cookie"]?.[0];

    const logoutResponse = await request(app)
      .post("/api/admin/logout")
      .set("Cookie", cookie);

    expect(logoutResponse.status).toBe(204);
    expect(logoutResponse.headers["cache-control"]).toBe("no-store");

    const clearCookie = logoutResponse.headers["set-cookie"]?.[0] || "";
    expect(clearCookie).toContain("admin_session=");
  });
});
