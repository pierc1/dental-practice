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

describe("API: blocked periods", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sendStaffNotificationMock.mockReset();
    sendPatientConfirmationMock.mockReset();
  });

  const loginAgent = async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/admin/login")
      .send({ password: "unit-test-admin-password" });

    expect(loginResponse.status).toBe(200);

    return agent;
  };

  it("rejects unauthorized GET/POST/DELETE", async () => {
    const getResponse = await request(app).get("/api/blocked-periods");
    expect(getResponse.status).toBe(401);

    const postResponse = await request(app).post("/api/blocked-periods").send({});
    expect(postResponse.status).toBe(401);

    const deleteResponse = await request(app).delete("/api/blocked-periods/1");
    expect(deleteResponse.status).toBe(401);
  });

  it("rejects missing or invalid blocked period payload", async () => {
    const agent = await loginAgent();

    const missingValues = await agent.post("/api/blocked-periods").send({});
    expect(missingValues.status).toBe(400);
    expect(missingValues.body.message).toMatch(/required/i);

    const invertedRange = await agent.post("/api/blocked-periods").send({
      startTime: "2030-01-10T14:00:00.000Z",
      endTime: "2030-01-10T13:00:00.000Z",
    });
    expect(invertedRange.status).toBe(400);
    expect(invertedRange.body.message).toMatch(/after/i);
  });

  it("returns 409 when range conflicts with an existing appointment", async () => {
    const agent = await loginAgent();

    queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 999 }] });

    const response = await agent.post("/api/blocked-periods").send({
      startTime: "2030-01-10T13:00:00.000Z",
      endTime: "2030-01-10T14:00:00.000Z",
      reason: "Meeting",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/appointment already exists/i);
  });

  it("returns 409 when range conflicts with an existing blocked period", async () => {
    const agent = await loginAgent();

    queryMock
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 888 }] });

    const response = await agent.post("/api/blocked-periods").send({
      startTime: "2030-01-10T13:00:00.000Z",
      endTime: "2030-01-10T14:00:00.000Z",
      reason: "Meeting",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already blocked/i);
  });

  it("returns 404 when deleting a missing blocked period", async () => {
    const agent = await loginAgent();

    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const response = await agent.delete("/api/blocked-periods/123");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  it("creates and deletes blocked periods for an authorized admin", async () => {
    const agent = await loginAgent();

    queryMock
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 41,
            start_time: "2030-01-10T13:00:00.000Z",
            end_time: "2030-01-10T14:00:00.000Z",
            reason: "Meeting",
            created_at: "2030-01-01T00:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 41 }] });

    const createResponse = await agent.post("/api/blocked-periods").send({
      startTime: "2030-01-10T13:00:00.000Z",
      endTime: "2030-01-10T14:00:00.000Z",
      reason: "Meeting",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.id).toBe(41);

    const deleteResponse = await agent.delete("/api/blocked-periods/41");

    expect(deleteResponse.status).toBe(204);
  });
});
