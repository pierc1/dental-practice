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

const { app } = await import("../../server/index.js");

describe("API: admin auth/session", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sendStaffNotificationMock.mockReset();
    sendPatientConfirmationMock.mockReset();
  });

  it("logs in with valid password and sets cookie + no-store", async () => {
    const response = await request(app)
      .post("/api/admin/login")
      .send({ password: "unit-test-admin-password" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.sessionTtlMinutes).toBeGreaterThan(0);
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
      .send({ password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/invalid admin password/i);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("rejects missing admin password", async () => {
    const response = await request(app).post("/api/admin/login").send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/invalid admin password/i);
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
      .send({ password: "unit-test-admin-password" });

    const cookie = loginResponse.headers["set-cookie"]?.[0];
    expect(cookie).toBeTruthy();

    const sessionResponse = await request(app)
      .get("/api/admin/session")
      .set("Cookie", cookie);

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body).toMatchObject({ authenticated: true });
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
      .send({ password: "unit-test-admin-password" });
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
