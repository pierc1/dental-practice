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

const normalizeSql = (sql) =>
  String(sql)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const nextFutureIso = ({ dayOffset = 3, hour = 10, minute = 0 } = {}) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const setBookingQueryMocks = ({
  serviceExists = true,
  serviceDuration = 60,
  exception = null,
  availabilityRows = [
    {
      start_time: "09:00:00",
      end_time: "17:00:00",
      slot_length_minutes: 30,
    },
  ],
  appointmentConflict = false,
  blockedConflict = false,
  insertedId = 123,
} = {}) => {
  queryMock.mockImplementation(async (sql, values = []) => {
    const normalized = normalizeSql(sql);

    if (normalized.includes("from appointment_types where id = $1 and is_active = true")) {
      if (!serviceExists) {
        return { rowCount: 0, rows: [] };
      }
      return {
        rowCount: 1,
        rows: [{ id: 1, name: "Cleaning", duration_minutes: serviceDuration }],
      };
    }

    if (normalized.includes("from exceptions where exception_date = $1")) {
      return exception
        ? { rowCount: 1, rows: [exception] }
        : { rowCount: 0, rows: [] };
    }

    if (normalized.includes("from availability where day_of_week = $1 order by start_time")) {
      return { rowCount: availabilityRows.length, rows: availabilityRows };
    }

    if (normalized.includes("from appointments") && normalized.includes("limit 1")) {
      return appointmentConflict
        ? { rowCount: 1, rows: [{ id: 33 }] }
        : { rowCount: 0, rows: [] };
    }

    if (normalized.includes("from blocked_periods") && normalized.includes("limit 1")) {
      return blockedConflict
        ? { rowCount: 1, rows: [{ id: 44 }] }
        : { rowCount: 0, rows: [] };
    }

    if (normalized.includes("insert into appointments")) {
      return {
        rowCount: 1,
        rows: [{ id: insertedId, start_time: values[1], end_time: values[2] }],
      };
    }

    throw new Error(`Unhandled SQL in mock: ${normalized}`);
  });
};

const validPayload = (startTime = nextFutureIso()) => ({
  appointmentTypeId: 1,
  startTime,
  firstName: "Ada",
  lastName: "Lovelace",
  contactEmail: "ada@example.com",
  contactPhone: "+1 212-555-1234",
  notes: "Edge-case test",
});

describe("API: appointment validation + admin list", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sendStaffNotificationMock.mockReset();
    sendPatientConfirmationMock.mockReset();

    sendStaffNotificationMock.mockResolvedValue({
      recipient: "staff",
      status: "sent",
      messageId: "staff_msg_1",
      reason: null,
      error: null,
    });

    sendPatientConfirmationMock.mockResolvedValue({
      recipient: "patient",
      status: "sent",
      messageId: "patient_msg_1",
      reason: null,
      error: null,
    });
  });

  it("rejects invalid startTime", async () => {
    const response = await request(app).post("/api/appointments").send({
      ...validPayload(),
      startTime: "not-a-date",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid starttime/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects past startTime", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await request(app).post("/api/appointments").send(validPayload(yesterday));

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/in the future/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects invalid appointmentTypeId", async () => {
    setBookingQueryMocks({ serviceExists: false });

    const response = await request(app).post("/api/appointments").send(validPayload());

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid appointmenttypeid/i);
  });

  it("rejects times outside availability windows", async () => {
    const startTime = nextFutureIso({ dayOffset: 4, hour: 12, minute: 0 });

    setBookingQueryMocks({
      availabilityRows: [
        {
          start_time: "09:00:00",
          end_time: "10:00:00",
          slot_length_minutes: 30,
        },
      ],
    });

    const response = await request(app).post("/api/appointments").send(validPayload(startTime));

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/not available/i);
  });

  it("rejects misaligned slots", async () => {
    const startTime = nextFutureIso({ dayOffset: 4, hour: 9, minute: 15 });

    setBookingQueryMocks({
      serviceDuration: 30,
      availabilityRows: [
        {
          start_time: "09:00:00",
          end_time: "10:00:00",
          slot_length_minutes: 30,
        },
      ],
    });

    const response = await request(app).post("/api/appointments").send(validPayload(startTime));

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/not available/i);
  });

  it("returns 409 for overlapping appointment conflicts", async () => {
    setBookingQueryMocks({ appointmentConflict: true });

    const response = await request(app).post("/api/appointments").send(validPayload());

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already booked/i);
  });

  it("returns 409 for blocked-period conflicts", async () => {
    setBookingQueryMocks({ blockedConflict: true });

    const response = await request(app).post("/api/appointments").send(validPayload());

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/blocked by the admin/i);
  });

  it("keeps booking successful and reports email processing failure", async () => {
    setBookingQueryMocks({});

    sendStaffNotificationMock.mockRejectedValueOnce(new Error("mail provider down"));

    const response = await request(app).post("/api/appointments").send(validPayload());

    expect(response.status).toBe(201);
    expect(response.body.emailStatus).toMatchObject({
      staff: {
        recipient: "staff",
        status: "failed",
        reason: "unexpected_processing_error",
      },
      patient: {
        recipient: "patient",
        status: "failed",
        reason: "unexpected_processing_error",
      },
    });
  });

  it("protects admin appointments list when unauthenticated", async () => {
    const response = await request(app).get("/api/appointments");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/unauthorized/i);
  });

  it("applies admin list filters and caps limit safely", async () => {
    const agent = request.agent(app);
    const loginResponse = await agent
      .post("/api/admin/login")
      .send({ password: "unit-test-admin-password" });

    expect(loginResponse.status).toBe(200);

    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const response = await agent.get(
      "/api/appointments?q=ada&start=2030-01-01&end=2030-01-03&status=booked&serviceId=2&limit=9999"
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);

    const [sql, values] = queryMock.mock.calls[0];
    const normalized = normalizeSql(sql);

    expect(normalized).toContain("a.start_time >=");
    expect(normalized).toContain("a.start_time <");
    expect(normalized).toContain("a.status =");
    expect(normalized).toContain("a.appointment_type_id =");
    expect(normalized).toContain("a.first_name ilike");

    expect(values.at(-1)).toBe(500);
  });
});
