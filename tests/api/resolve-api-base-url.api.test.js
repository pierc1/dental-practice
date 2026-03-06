/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "../../api/resolveApiBaseUrl.js";

describe("resolveApiBaseUrl", () => {
  it("uses configured VITE_API_URL in production", () => {
    const baseUrl = resolveApiBaseUrl({
      PROD: true,
      VITE_API_URL: "https://dental-practice.onrender.com/",
    });

    expect(baseUrl).toBe("https://dental-practice.onrender.com");
  });

  it("falls back to same-origin in production when VITE_API_URL is unset", () => {
    const baseUrl = resolveApiBaseUrl({
      PROD: true,
      VITE_API_URL: "",
    });

    expect(baseUrl).toBe("");
  });

  it("uses configured VITE_API_URL in development", () => {
    const baseUrl = resolveApiBaseUrl({
      PROD: false,
      VITE_API_URL: "https://preview-api.example.com",
    });

    expect(baseUrl).toBe("https://preview-api.example.com");
  });

  it("falls back to localhost in development when VITE_API_URL is unset", () => {
    const baseUrl = resolveApiBaseUrl({
      PROD: false,
      VITE_API_URL: "   ",
    });

    expect(baseUrl).toBe("http://localhost:5050");
  });
});

