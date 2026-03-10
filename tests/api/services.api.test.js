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

const { app } = await import("../../server/index.js");

const normalizeSql = (sql) =>
  String(sql)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

describe("API: services", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("queries only active services sorted by name", async () => {
    const services = [
      { id: 1, name: "Cleaning", duration_minutes: 60 },
      { id: 2, name: "Consultation", duration_minutes: 30 },
      { id: 4, name: "Emergency Exam", duration_minutes: 30 },
      { id: 3, name: "Whitening", duration_minutes: 60 },
    ];

    queryMock.mockResolvedValue({ rowCount: services.length, rows: services });

    const response = await request(app).get("/api/services");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(services);

    const [sql] = queryMock.mock.calls[0];
    const normalized = normalizeSql(sql);
    expect(normalized).toContain("from appointment_types");
    expect(normalized).toContain("where is_active = true");
    expect(normalized).toContain("order by display_order, name");
  });

  it("returns unique names in standard seeded response", async () => {
    const services = [
      { id: 1, name: "Cleaning", duration_minutes: 60 },
      { id: 2, name: "Consultation", duration_minutes: 30 },
      { id: 4, name: "Emergency Exam", duration_minutes: 30 },
      { id: 3, name: "Whitening", duration_minutes: 60 },
    ];

    queryMock.mockResolvedValue({ rowCount: services.length, rows: services });

    const response = await request(app).get("/api/services");

    expect(response.status).toBe(200);
    const names = response.body.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
