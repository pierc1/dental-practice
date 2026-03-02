import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

export const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const renderWithAppProviders = (
  ui,
  { initialEntries = ["/"], queryClient = createTestQueryClient() } = {}
) => ({
  queryClient,
  ...render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} future={routerFuture}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  ),
});
