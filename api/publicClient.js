const resolveApiUrl = () => {
  if (import.meta.env.PROD) {
    return "";
  }
  const configured = import.meta.env.VITE_API_URL?.trim();
  return configured || "http://localhost:5050";
};

const API_URL = resolveApiUrl();

export const fetchPublicJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload;
};

export const getPublicApiUrl = (path) => `${API_URL}${path}`;
