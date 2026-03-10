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

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDateKeyFromNow = (daysAhead) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysAhead);
  return formatDateKey(date);
};

const dayOfWeekForDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
};

const isoForDateTime = (dateKey, timeValue) => new Date(`${dateKey}T${timeValue}:00`).toISOString();

describe("API: availability", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sendStaffNotificationMock.mockReset();
    sendPatientConfirmationMock.mockReset();
  });

  it("rejects invalid range when end < start", async () => {
    const response = await request(app).get(
      "/api/availability?start=2030-01-10&end=2030-01-01"
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/end date must be after start date/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects invalid serviceId", async () => {
    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);
      if (normalized.includes("select duration_minutes from appointment_types")) {
        return { rowCount: 0, rows: [] };
      }
      throw new Error(`Unhandled SQL: ${normalized}`);
    });

    const response = await request(app).get(
      "/api/availability?start=2030-01-01&end=2030-01-03&appointmentTypeId=999"
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid appointmenttypeid/i);
  });

  it("rejects non-numeric appointmentTypeId with 400", async () => {
    const response = await request(app).get(
      "/api/availability?start=2030-01-01&end=2030-01-03&appointmentTypeId=abc"
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid appointmenttypeid/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects non-numeric legacy serviceId alias with 400", async () => {
    const response = await request(app).get(
      "/api/availability?start=2030-01-01&end=2030-01-03&serviceId=abc"
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid appointmenttypeid/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("excludes slots for closed exceptions", async () => {
    const dateKey = buildDateKeyFromNow(7);
    const dayOfWeek = dayOfWeekForDateKey(dateKey);

    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);

      if (normalized.includes("from availability")) {
        return {
          rowCount: 1,
          rows: [
            {
              day_of_week: dayOfWeek,
              start_time: "09:00:00",
              end_time: "10:00:00",
              slot_length_minutes: 30,
            },
          ],
        };
      }

      if (normalized.includes("from exceptions where exception_date between")) {
        return {
          rowCount: 1,
          rows: [
            {
              exception_date: dateKey,
              is_closed: true,
              start_time: null,
              end_time: null,
            },
          ],
        };
      }

      if (normalized.includes("from appointments") || normalized.includes("from blocked_periods")) {
        return { rowCount: 0, rows: [] };
      }

      throw new Error(`Unhandled SQL: ${normalized}`);
    });

    const response = await request(app).get(`/api/availability?start=${dateKey}&end=${dateKey}`);

    expect(response.status).toBe(200);
    expect(response.body.slots).toEqual([]);
  });

  it("uses custom-hours exception window", async () => {
    const dateKey = buildDateKeyFromNow(8);
    const dayOfWeek = dayOfWeekForDateKey(dateKey);

    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);

      if (normalized.includes("from availability")) {
        return {
          rowCount: 1,
          rows: [
            {
              day_of_week: dayOfWeek,
              start_time: "09:00:00",
              end_time: "17:00:00",
              slot_length_minutes: 30,
            },
          ],
        };
      }

      if (normalized.includes("from exceptions where exception_date between")) {
        return {
          rowCount: 1,
          rows: [
            {
              exception_date: dateKey,
              is_closed: false,
              start_time: "13:00:00",
              end_time: "14:00:00",
            },
          ],
        };
      }

      if (normalized.includes("from appointments") || normalized.includes("from blocked_periods")) {
        return { rowCount: 0, rows: [] };
      }

      throw new Error(`Unhandled SQL: ${normalized}`);
    });

    const response = await request(app).get(`/api/availability?start=${dateKey}&end=${dateKey}`);

    expect(response.status).toBe(200);
    expect(response.body.slots).toHaveLength(2);

    const slotTimes = response.body.slots.map((slot) => slot.time);
    expect(slotTimes).toEqual(["13:00", "13:30"]);
  });

  it("excludes past slots", async () => {
    const today = buildDateKeyFromNow(0);
    const dayOfWeek = dayOfWeekForDateKey(today);

    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);

      if (normalized.includes("from availability")) {
        return {
          rowCount: 1,
          rows: [
            {
              day_of_week: dayOfWeek,
              start_time: "00:00:00",
              end_time: "00:30:00",
              slot_length_minutes: 30,
            },
          ],
        };
      }

      if (normalized.includes("from exceptions where exception_date between")) {
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("from appointments") || normalized.includes("from blocked_periods")) {
        return { rowCount: 0, rows: [] };
      }

      throw new Error(`Unhandled SQL: ${normalized}`);
    });

    const response = await request(app).get(`/api/availability?start=${today}&end=${today}`);

    expect(response.status).toBe(200);
    expect(response.body.slots).toEqual([]);
  });

  it("excludes slots overlapping existing appointments", async () => {
    const dateKey = buildDateKeyFromNow(9);
    const dayOfWeek = dayOfWeekForDateKey(dateKey);

    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);

      if (normalized.includes("from availability")) {
        return {
          rowCount: 1,
          rows: [
            {
              day_of_week: dayOfWeek,
              start_time: "09:00:00",
              end_time: "11:00:00",
              slot_length_minutes: 30,
            },
          ],
        };
      }

      if (normalized.includes("from exceptions where exception_date between")) {
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("from appointments")) {
        return {
          rowCount: 1,
          rows: [
            {
              start_time: isoForDateTime(dateKey, "09:30"),
              end_time: isoForDateTime(dateKey, "10:00"),
            },
          ],
        };
      }

      if (normalized.includes("from blocked_periods")) {
        return { rowCount: 0, rows: [] };
      }

      throw new Error(`Unhandled SQL: ${normalized}`);
    });

    const response = await request(app).get(`/api/availability?start=${dateKey}&end=${dateKey}`);

    expect(response.status).toBe(200);

    const slotTimes = response.body.slots.map((slot) => slot.time);
    expect(slotTimes).toContain("09:00");
    expect(slotTimes).not.toContain("09:30");
  });

  it("excludes slots overlapping blocked periods", async () => {
    const dateKey = buildDateKeyFromNow(10);
    const dayOfWeek = dayOfWeekForDateKey(dateKey);

    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);

      if (normalized.includes("from availability")) {
        return {
          rowCount: 1,
          rows: [
            {
              day_of_week: dayOfWeek,
              start_time: "09:00:00",
              end_time: "11:00:00",
              slot_length_minutes: 30,
            },
          ],
        };
      }

      if (normalized.includes("from exceptions where exception_date between")) {
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("from appointments")) {
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("from blocked_periods")) {
        return {
          rowCount: 1,
          rows: [
            {
              start_time: isoForDateTime(dateKey, "10:00"),
              end_time: isoForDateTime(dateKey, "10:30"),
            },
          ],
        };
      }

      throw new Error(`Unhandled SQL: ${normalized}`);
    });

    const response = await request(app).get(`/api/availability?start=${dateKey}&end=${dateKey}`);

    expect(response.status).toBe(200);

    const slotTimes = response.body.slots.map((slot) => slot.time);
    expect(slotTimes).toContain("09:30");
    expect(slotTimes).not.toContain("10:00");
  });

  it("enforces slot alignment and service-duration window fit", async () => {
    const dateKey = buildDateKeyFromNow(11);
    const dayOfWeek = dayOfWeekForDateKey(dateKey);

    queryMock.mockImplementation(async (sql) => {
      const normalized = normalizeSql(sql);

      if (normalized.includes("select duration_minutes from appointment_types")) {
        return { rowCount: 1, rows: [{ duration_minutes: 45 }] };
      }

      if (normalized.includes("from availability")) {
        return {
          rowCount: 1,
          rows: [
            {
              day_of_week: dayOfWeek,
              start_time: "09:00:00",
              end_time: "10:00:00",
              slot_length_minutes: 30,
            },
          ],
        };
      }

      if (normalized.includes("from exceptions where exception_date between")) {
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("from appointments") || normalized.includes("from blocked_periods")) {
        return { rowCount: 0, rows: [] };
      }

      throw new Error(`Unhandled SQL: ${normalized}`);
    });

    const response = await request(app).get(
      `/api/availability?start=${dateKey}&end=${dateKey}&appointmentTypeId=1`
    );

    expect(response.status).toBe(200);
    expect(response.body.slots).toHaveLength(1);

    const onlySlot = response.body.slots[0];
    expect(onlySlot.time).toBe("09:00");

    const slotStartMs = new Date(onlySlot.start).getTime();
    const slotEndMs = new Date(onlySlot.end).getTime();
    expect(slotEndMs - slotStartMs).toBe(45 * 60 * 1000);
  });
});
