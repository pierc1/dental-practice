import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@vercel/speed-insights/react", () => ({
  SpeedInsights: () => null,
}));

import App from "../../src/App.jsx";

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

describe("UI smoke test", () => {
  it("renders the home route shell", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]} future={routerFuture}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      screen.getByRole("heading", { name: /because your smile/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book now/i })).toBeInTheDocument();
  });
});
