import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithAppProviders } from "./testUtils";

const { checkAdminSessionMock, loginAdminMock, logoutAdminMock, fetchAdminJsonMock } =
  vi.hoisted(() => ({
    checkAdminSessionMock: vi.fn(),
    loginAdminMock: vi.fn(),
    logoutAdminMock: vi.fn(),
    fetchAdminJsonMock: vi.fn(),
  }));

vi.mock("@/api/adminClient", () => ({
  checkAdminSession: checkAdminSessionMock,
  loginAdmin: loginAdminMock,
  logoutAdmin: logoutAdminMock,
  fetchAdminJson: fetchAdminJsonMock,
  getApiUrl: (path) => path,
}));

import App from "../../src/App.jsx";

describe("UI: admin blocked periods", () => {
  beforeEach(() => {
    checkAdminSessionMock.mockReset();
    loginAdminMock.mockReset();
    logoutAdminMock.mockReset();
    fetchAdminJsonMock.mockReset();
  });

  it("redirects unauthorized users to /admin", async () => {
    checkAdminSessionMock.mockRejectedValue(new Error("Unauthorized."));

    renderWithAppProviders(<App />, { initialEntries: ["/admin/blocked-periods"] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /admin access/i })).toBeInTheDocument();
    });
  });

  it("shows client validation for invalid date/time range", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockResolvedValue([]);

    renderWithAppProviders(<App />, { initialEntries: ["/admin/blocked-periods"] });

    await screen.findByRole("heading", { name: /blocked time manager/i });

    fireEvent.change(screen.getByLabelText(/^start time$/i), { target: { value: "14:00" } });
    fireEvent.change(screen.getByLabelText(/^end time$/i), { target: { value: "13:00" } });

    fireEvent.click(screen.getByRole("button", { name: /block time range/i }));

    expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
  });

  it("submits create blocked period payload", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockImplementation((url, options) => {
      if (options?.method === "POST") {
        return Promise.resolve({
          id: 101,
          start_time: "2030-01-10T14:00:00.000Z",
          end_time: "2030-01-10T15:00:00.000Z",
          reason: "Lunch",
        });
      }
      return Promise.resolve([]);
    });

    renderWithAppProviders(<App />, { initialEntries: ["/admin/blocked-periods"] });

    await screen.findByRole("heading", { name: /blocked time manager/i });

    fireEvent.change(screen.getByLabelText(/^start date$/i), { target: { value: "2030-01-10" } });
    fireEvent.change(screen.getByLabelText(/^end date$/i), { target: { value: "2030-01-10" } });
    fireEvent.change(screen.getByLabelText(/^start time$/i), { target: { value: "14:00" } });
    fireEvent.change(screen.getByLabelText(/^end time$/i), { target: { value: "15:00" } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Lunch" } });

    fireEvent.click(screen.getByRole("button", { name: /block time range/i }));

    await waitFor(() => {
      const createCall = fetchAdminJsonMock.mock.calls.find(
        ([url, options]) => String(url).includes("/api/blocked-periods") && options?.method === "POST"
      );
      expect(createCall).toBeTruthy();

      const [, options] = createCall;
      const payload = JSON.parse(options.body);
      expect(payload).toMatchObject({
        reason: "Lunch",
      });
      expect(payload.startTime).toContain("2030-01-10");
      expect(payload.endTime).toContain("2030-01-10");
    });
  });

  it("calls delete endpoint for remove action", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockImplementation((url, options) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({});
      }
      return Promise.resolve([
        {
          id: 55,
          start_time: "2030-01-10T14:00:00.000Z",
          end_time: "2030-01-10T15:00:00.000Z",
          reason: "Lunch",
        },
      ]);
    });

    renderWithAppProviders(<App />, { initialEntries: ["/admin/blocked-periods"] });

    await screen.findByRole("heading", { name: /blocked time manager/i });
    const removeButton = await screen.findByRole("button", { name: /remove/i });

    fireEvent.click(removeButton);

    await waitFor(() => {
      const deleteCall = fetchAdminJsonMock.mock.calls.find(
        ([url, options]) => String(url).includes("/api/blocked-periods/55") && options?.method === "DELETE"
      );
      expect(deleteCall).toBeTruthy();
    });
  });

  it("logs out and returns to /admin", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockResolvedValue([]);
    logoutAdminMock.mockResolvedValue({ ok: true });

    renderWithAppProviders(<App />, { initialEntries: ["/admin/blocked-periods"] });

    await screen.findByRole("heading", { name: /blocked time manager/i });

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /admin access/i })).toBeInTheDocument();
    });
  });
});
