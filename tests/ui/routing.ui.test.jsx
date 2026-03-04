import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { renderWithAppProviders, routerFuture } from "./testUtils";

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
import ScrollToTop from "../../src/components/ScrollToTop.jsx";

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

  it("scrolls to top on route navigation", async () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    renderWithAppProviders(<App />, { initialEntries: ["/"] });

    const servicesLink = screen
      .getAllByRole("link", { name: /^services$/i })
      .find((link) => link.getAttribute("href") === "/services");

    expect(servicesLink).toBeTruthy();

    fireEvent.click(servicesLink);

    await waitFor(() => {
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    });
  });

  it("does not force top when navigating to a hash route", async () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/"]} future={routerFuture}>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={<Link to="/services#faq" aria-label="go-to-hash">Go to hash</Link>}
          />
          <Route path="/services" element={<h1>Services hash page</h1>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: /go-to-hash/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /services hash page/i })).toBeInTheDocument();
    });

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
