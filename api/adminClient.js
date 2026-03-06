import { resolveApiBaseUrl } from "./resolveApiBaseUrl";

const API_URL = resolveApiBaseUrl();

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }
  return payload;
};

export const fetchAdminJson = (url, options = {}) => {
  const mergedHeaders = { ...(options.headers || {}) };
  return fetchJson(url, {
    ...options,
    credentials: "include",
    headers: mergedHeaders,
  });
};

export const getApiUrl = (path) => `${API_URL}${path}`;

export const checkAdminSession = () => fetchAdminJson(getApiUrl("/api/admin/session"));

export const loginAdmin = (password) =>
  fetchAdminJson(getApiUrl("/api/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

export const logoutAdmin = () =>
  fetchAdminJson(getApiUrl("/api/admin/logout"), {
    method: "POST",
  });
