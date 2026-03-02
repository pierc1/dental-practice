import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("UI: routing", () => {
  it("renders admin login at /admin", async () => {
    checkAdminSessionMock.mockRejectedValueOnce(new Error("Unauthorized."));

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /admin access/i })).toBeInTheDocument();
    });
  });

  it("falls back to home for unknown routes", async () => {
    renderWithAppProviders(<App />, { initialEntries: ["/not-a-real-route"] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /because your smile/i })).toBeInTheDocument();
    });
  });
});
