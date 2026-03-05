import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithAppProviders } from "./testUtils";

const { fetchPublicJsonMock, getPublicApiUrlMock } = vi.hoisted(() => ({
  fetchPublicJsonMock: vi.fn(),
  getPublicApiUrlMock: vi.fn((path) => path),
}));

vi.mock("@/api/publicClient", () => ({
  fetchPublicJson: fetchPublicJsonMock,
  getPublicApiUrl: getPublicApiUrlMock,
}));

import Team from "../../Pages/Team.jsx";

describe("UI: team page", () => {
  beforeEach(() => {
    fetchPublicJsonMock.mockReset();
    getPublicApiUrlMock.mockClear();
  });

  it("renders loading skeleton state while team members are loading", async () => {
    fetchPublicJsonMock.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = renderWithAppProviders(<Team />);

    await waitFor(() => {
      expect(getPublicApiUrlMock).toHaveBeenCalledWith("/api/team-members");
      expect(fetchPublicJsonMock).toHaveBeenCalledWith("/api/team-members");
    });

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders team cards from /api/team-members", async () => {
    fetchPublicJsonMock.mockResolvedValueOnce([
      {
        id: "d1",
        full_name: "Dr. Martin Rodriguez",
        title: "DDS, MS",
        specialty: "Orthodontics",
        bio: "Bio 1",
        photo_url: "",
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
        bio: "Bio 2",
        photo_url: "",
        education: "Columbia",
        years_experience: 15,
        available_days: ["Monday", "Friday"],
        available_hours: "9:00 AM - 5:00 PM",
      },
    ]);

    renderWithAppProviders(<Team />);

    expect(await screen.findByText(/dr\. martin rodriguez/i)).toBeInTheDocument();
    expect(await screen.findByText(/dr\. sarah williams/i)).toBeInTheDocument();
    expect(screen.getByText(/orthodontics/i)).toBeInTheDocument();
    expect(screen.getByText(/cosmetic dentistry/i)).toBeInTheDocument();
  });

  it("renders empty state when API returns no team members", async () => {
    fetchPublicJsonMock.mockResolvedValueOnce([]);

    renderWithAppProviders(<Team />);

    expect(await screen.findByText(/our amazing team/i)).toBeInTheDocument();
    expect(screen.getByText(/currently updating our team profiles/i)).toBeInTheDocument();
  });
});
