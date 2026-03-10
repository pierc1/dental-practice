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

describe("API: appointment types and service catalog", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("loads appointment types from appointment_types", async () => {
    const appointmentTypes = [
      { id: 1, name: "Cleaning", duration_minutes: 60 },
      { id: 2, name: "Consultation", duration_minutes: 30 },
      { id: 3, name: "Whitening", duration_minutes: 60 },
      { id: 4, name: "Emergency Exam", duration_minutes: 30 },
    ];
    queryMock.mockResolvedValue({ rowCount: appointmentTypes.length, rows: appointmentTypes });

    const response = await request(app).get("/api/appointment-types");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(appointmentTypes);

    const [sql] = queryMock.mock.calls[0];
    const normalized = normalizeSql(sql);
    expect(normalized).toContain("from appointment_types");
    expect(normalized).not.toContain("inner join services");
  });

  it("loads catalog rows with appointment type mapping and supports featured filter", async () => {
    const featuredRows = [
      {
        id: 10,
        name: "Dental Cleaning",
        description: "Professional cleaning",
        category: "General Dentistry",
        duration_minutes: 60,
        price_range: "$120-$180",
        image_url: "https://example.com/cleaning.jpg",
        appointment_type_id: 1,
        appointment_type_name: "Cleaning",
        display_order: 10,
        is_featured: true,
      },
    ];
    queryMock.mockResolvedValue({ rowCount: featuredRows.length, rows: featuredRows });

    const response = await request(app).get("/api/services/catalog?featured=1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(featuredRows);

    const [sql] = queryMock.mock.calls[0];
    const normalized = normalizeSql(sql);
    expect(normalized).toContain("from service_catalog");
    expect(normalized).toContain("inner join appointment_types");
    expect(normalized).toContain("sc.is_active = true");
    expect(normalized).toContain("sc.is_featured = true");
  });
});
