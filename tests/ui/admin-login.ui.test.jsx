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

import App from "../../src/App.jsx";

describe("UI: admin login", () => {
  it("shows validation error for empty username/password", async () => {
    checkAdminSessionMock.mockRejectedValueOnce(new Error("Unauthorized."));

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    const continueButton = await screen.findByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    expect(screen.getByText(/please enter both admin username and password/i)).toBeInTheDocument();
  });

  it("shows API error on invalid login", async () => {
    checkAdminSessionMock.mockRejectedValueOnce(new Error("Unauthorized."));
    loginAdminMock.mockRejectedValueOnce(new Error("Invalid admin credentials."));

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    const usernameInput = await screen.findByLabelText(/admin username/i);
    const passwordInput = await screen.findByLabelText(/admin password/i);
    fireEvent.change(usernameInput, { target: { value: "admin1" } });
    fireEvent.change(passwordInput, { target: { value: "bad-pass" } });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid admin credentials/i)).toBeInTheDocument();
    });
  });

  it("navigates to appointments on successful login", async () => {
    checkAdminSessionMock
      .mockRejectedValueOnce(new Error("Unauthorized."))
      .mockResolvedValue(undefined);
    loginAdminMock.mockResolvedValueOnce({ ok: true });
    fetchAdminJsonMock.mockResolvedValue([]);

    renderWithAppProviders(<App />, { initialEntries: ["/admin"] });

    const usernameInput = await screen.findByLabelText(/admin username/i);
    const passwordInput = await screen.findByLabelText(/admin password/i);
    fireEvent.change(usernameInput, { target: { value: "admin1" } });
    fireEvent.change(passwordInput, { target: { value: "valid-pass" } });

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
