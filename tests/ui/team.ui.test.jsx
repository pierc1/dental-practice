import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithAppProviders } from "./testUtils";

import Team from "../../Pages/Team.jsx";

describe("UI: team page", () => {
  it("renders team cards from local data", () => {
    renderWithAppProviders(<Team />);

    expect(screen.getByText(/dr\. martin rodriguez/i)).toBeInTheDocument();
    expect(screen.getByText(/dr\. sarah williams/i)).toBeInTheDocument();
    expect(screen.getByText(/orthodontics/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cosmetic dentistry/i).length).toBeGreaterThan(0);
    expect(screen.getByAltText(/dr\. martin rodriguez/i)).toHaveAttribute(
      "src",
      "/team/Dr. Martin Rodriguez.jpg"
    );
    expect(screen.getByAltText(/dr\. sarah williams/i)).toHaveAttribute(
      "src",
      "/team/Dr. Sarah Williams.jpg"
    );
  });
});
