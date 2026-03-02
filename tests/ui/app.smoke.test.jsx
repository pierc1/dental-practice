import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithAppProviders } from "./testUtils";

import App from "../../src/App.jsx";

describe("UI smoke test", () => {
  it("renders the home route shell", () => {
    renderWithAppProviders(<App />, { initialEntries: ["/"] });

    expect(
      screen.getByRole("heading", { name: /because your smile/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book now/i })).toBeInTheDocument();
  });
});
