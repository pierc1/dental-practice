/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_TRUST_PROXY = process.env.TRUST_PROXY;

const loadTrustProxySetting = async (trustProxyValue) => {
  if (trustProxyValue === undefined) {
    delete process.env.TRUST_PROXY;
  } else {
    process.env.TRUST_PROXY = trustProxyValue;
  }

  process.env.NODE_ENV = "test";
  vi.resetModules();

  const { app } = await import("../../server/index.js");
  return app.get("trust proxy");
};

describe("API: trust proxy configuration", () => {
  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;

    if (ORIGINAL_TRUST_PROXY === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = ORIGINAL_TRUST_PROXY;
    }
  });

  it("defaults to disabled trust proxy when TRUST_PROXY is unset", async () => {
    const trustProxySetting = await loadTrustProxySetting(undefined);
    expect(trustProxySetting).toBe(false);
  });

  it("enables one trusted proxy hop for TRUST_PROXY=true or 1", async () => {
    for (const trustProxyValue of ["true", "TRUE", "1"]) {
      const trustProxySetting = await loadTrustProxySetting(trustProxyValue);
      expect(trustProxySetting).toBe(1);
    }
  });

  it("keeps trust proxy disabled for falsey and invalid values", async () => {
    for (const trustProxyValue of ["false", "FALSE", "0", "", "random-value"]) {
      const trustProxySetting = await loadTrustProxySetting(trustProxyValue);
      expect(trustProxySetting).toBe(false);
    }
  });
});
