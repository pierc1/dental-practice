import { resolveApiBaseUrl } from "./resolveApiBaseUrl";

const API_URL = resolveApiBaseUrl();

export const fetchPublicJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload;
};

export const getPublicApiUrl = (path) => `${API_URL}${path}`;
