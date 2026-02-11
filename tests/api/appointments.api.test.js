/** @vitest-environment node */

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, sendStaffNotificationMock, sendPatientConfirmationMock } =
  vi.hoisted(() => ({
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
process.env.ADMIN_PASSWORD = "local-test-admin-password";

const { app } = await import("../../server/index.js");

const nextWeekdayAtTenAmIso = () => {
  const now = new Date();
  const next = new Date(now.getTime());
  next.setDate(next.getDate() + 1);
  next.setHours(10, 0, 0, 0);
  return next.toISOString();
};

const normalizeSql = (sql) =>
  String(sql)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

describe("API smoke: appointments", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sendStaffNotificationMock.mockReset();
    sendPatientConfirmationMock.mockReset();
  });

  it("returns health payload", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      service: "appointments-api",
    });
  });

  it("rejects create appointment when required fields are missing", async () => {
    const response = await request(app).post("/api/appointments").send({
      serviceId: 1,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/required/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("creates an appointment and includes email observability fields", async () => {
    const startTime = nextWeekdayAtTenAmIso();
    const endTime = new Date(new Date(startTime).getTime() + 60 * 60000).toISOString();

    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);

      if (
        normalized.includes("from services where id = $1 and is_active = true")
      ) {
        return {
          rowCount: 1,
          rows: [{ id: 1, name: "Cleaning", duration_minutes: 60 }],
        };
      }

      if (normalized.includes("from exceptions where exception_date = $1")) {
        return { rowCount: 0, rows: [] };
      }

      if (
        normalized.includes(
          "from availability where day_of_week = $1 order by start_time"
        )
      ) {
        return {
          rowCount: 1,
          rows: [
            {
              start_time: "09:00:00",
              end_time: "17:00:00",
              slot_length_minutes: 30,
            },
          ],
        };
      }

      if (
        normalized.includes("from appointments") &&
        normalized.includes("status <> 'cancelled'") &&
        normalized.includes("limit 1")
      ) {
        return { rowCount: 0, rows: [] };
      }

      if (
        normalized.includes("from blocked_periods") &&
        normalized.includes("limit 1")
      ) {
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("insert into appointments")) {
        return {
          rowCount: 1,
          rows: [{ id: 123, start_time: startTime, end_time: endTime }],
        };
      }

      throw new Error(`Unhandled SQL in test mock: ${normalized}`);
    });

    sendStaffNotificationMock.mockResolvedValue({
      recipient: "staff",
      status: "sent",
      messageId: "msg_staff_123",
      reason: null,
      error: null,
    });

    sendPatientConfirmationMock.mockResolvedValue({
      recipient: "patient",
      status: "skipped",
      messageId: null,
      reason: "missing_patient_email",
      error: null,
    });

    const response = await request(app).post("/api/appointments").send({
      serviceId: 1,
      startTime,
      firstName: "Ada",
      lastName: "Lovelace",
      contactEmail: "ada@example.com",
      contactPhone: "+1 212-555-1234",
      notes: "UI smoke booking",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 123,
      startTime,
      endTime,
      emailStatus: {
        staff: {
          recipient: "staff",
          status: "sent",
          messageId: "msg_staff_123",
        },
        patient: {
          recipient: "patient",
          status: "skipped",
          reason: "missing_patient_email",
        },
      },
    });

    expect(sendStaffNotificationMock).toHaveBeenCalledTimes(1);
    expect(sendPatientConfirmationMock).toHaveBeenCalledTimes(1);
  });

  it("protects admin appointments route when not authenticated", async () => {
    const response = await request(app).get("/api/appointments");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/unauthorized/i);
  });
});
