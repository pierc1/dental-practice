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

vi.mock("@/api/base44Client", () => ({
  base44: {
    entities: {
      Service: {
        list: vi.fn().mockResolvedValue([]),
      },
      Dentist: {
        list: vi.fn().mockResolvedValue([]),
      },
      Appointment: {
        create: vi.fn(),
      },
    },
  },
}));

import App from "../../src/App.jsx";

describe("UI: admin appointments", () => {
  beforeEach(() => {
    checkAdminSessionMock.mockReset();
    loginAdminMock.mockReset();
    logoutAdminMock.mockReset();
    fetchAdminJsonMock.mockReset();
  });

  it("redirects unauthorized users to /admin", async () => {
    checkAdminSessionMock.mockRejectedValueOnce(new Error("Unauthorized."));

    renderWithAppProviders(<App />, { initialEntries: ["/admin/appointments"] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /admin access/i })).toBeInTheDocument();
    });
  });

  it("updates appointment query when filters change", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockResolvedValue([]);

    renderWithAppProviders(<App />, { initialEntries: ["/admin/appointments"] });

    await screen.findByRole("heading", { name: /appointments admin/i });

    const searchInput = screen.getByLabelText(/search/i);
    fireEvent.change(searchInput, { target: { value: "ada" } });

    await waitFor(() => {
      const calledUrls = fetchAdminJsonMock.mock.calls.map(([url]) => String(url));
      expect(calledUrls.some((url) => url.includes("/api/appointments?"))).toBe(true);
      expect(calledUrls.some((url) => url.includes("q=ada"))).toBe(true);
    });
  });

  it("handles CSV button enable/disable based on rows", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockResolvedValueOnce([]);

    renderWithAppProviders(<App />, { initialEntries: ["/admin/appointments"] });

    await screen.findByRole("heading", { name: /appointments admin/i });

    const exportButton = screen.getByRole("button", { name: /export csv/i });
    expect(exportButton).toBeDisabled();
  });

  it("enables CSV export when appointments exist", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockResolvedValueOnce([
      {
        id: 1,
        start_time: "2030-01-01T14:00:00.000Z",
        end_time: "2030-01-01T15:00:00.000Z",
        first_name: "Ada",
        last_name: "Lovelace",
        service_name: "Cleaning",
        status: "booked",
      },
    ]);

    renderWithAppProviders(<App />, { initialEntries: ["/admin/appointments"] });

    await screen.findByRole("heading", { name: /appointments admin/i });

    const exportButton = screen.getByRole("button", { name: /export csv/i });
    await waitFor(() => {
      expect(exportButton).toBeEnabled();
    });
  });

  it("logs out and returns to /admin", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockResolvedValue([]);
    logoutAdminMock.mockResolvedValue({ ok: true });

    renderWithAppProviders(<App />, { initialEntries: ["/admin/appointments"] });

    await screen.findByRole("heading", { name: /appointments admin/i });

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /admin access/i })).toBeInTheDocument();
    });
  });
});
