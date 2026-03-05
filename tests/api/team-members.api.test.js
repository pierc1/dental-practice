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

describe("API: team members", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns active team members sorted by display order", async () => {
    const teamMembers = [
      {
        id: "d1",
        full_name: "Dr. Martin Rodriguez",
        title: "DDS, MS",
        specialty: "Orthodontics",
        bio: "Bio",
        photo_url: "https://example.com/d1.jpg",
        education: "Harvard",
        years_experience: 10,
        available_days: ["Tuesday", "Wednesday"],
        available_hours: "9:00 AM - 5:00 PM",
      },
      {
        id: "d2",
        full_name: "Dr. Sarah Williams",
        title: "DDS",
        specialty: "Cosmetic Dentistry",
        bio: "Bio",
        photo_url: "https://example.com/d2.jpg",
        education: "Columbia",
        years_experience: 15,
        available_days: ["Monday"],
        available_hours: "9:00 AM - 5:00 PM",
      },
    ];

    queryMock.mockResolvedValue({ rowCount: teamMembers.length, rows: teamMembers });

    const response = await request(app).get("/api/team-members");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(teamMembers);

    const [sql] = queryMock.mock.calls[0];
    const normalized = normalizeSql(sql);
    expect(normalized).toContain("from team_members");
    expect(normalized).toContain("where is_active = true");
    expect(normalized).toContain("order by display_order asc, full_name asc");
  });

  it("returns 500 when the query fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    queryMock.mockRejectedValueOnce(new Error("db down"));

    const response = await request(app).get("/api/team-members");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Failed to load team members." });
    errorSpy.mockRestore();
  });
});
