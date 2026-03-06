export const resolveApiBaseUrl = (env = import.meta.env) => {
  const configured =
    typeof env?.VITE_API_URL === "string" ? env.VITE_API_URL.trim() : "";

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (env?.PROD) {
    return "";
  }

  return "http://localhost:5050";
};

