import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
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

describe("UI: admin login", () => {
  it("shows validation error for empty password", async () => {
    checkAdminSessionMock.mockRejectedValueOnce(new Error("Unauthorized."));

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    const continueButton = await screen.findByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    expect(screen.getByText(/please enter the admin password/i)).toBeInTheDocument();
  });

  it("shows API error on invalid login", async () => {
    checkAdminSessionMock.mockRejectedValueOnce(new Error("Unauthorized."));
    loginAdminMock.mockRejectedValueOnce(new Error("Invalid admin password."));

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    const input = await screen.findByLabelText(/admin password/i);
    fireEvent.change(input, { target: { value: "bad-pass" } });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid admin password/i)).toBeInTheDocument();
    });
  });

  it("navigates to appointments on successful login", async () => {
    checkAdminSessionMock
      .mockRejectedValueOnce(new Error("Unauthorized."))
      .mockResolvedValue(undefined);
    loginAdminMock.mockResolvedValueOnce({ ok: true });
    fetchAdminJsonMock.mockResolvedValue([]);

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    const input = await screen.findByLabelText(/admin password/i);
    fireEvent.change(input, { target: { value: "valid-pass" } });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /appointments admin/i })).toBeInTheDocument();
    });
  });

  it("auto-redirects when an admin session already exists", async () => {
    checkAdminSessionMock.mockResolvedValue(undefined);
    fetchAdminJsonMock.mockResolvedValue([]);

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /appointments admin/i })).toBeInTheDocument();
    });
  });
});
