const configuredApiBaseUrl = (import.meta.env?.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

// Vercel builds use a same-origin server-side proxy, including for HTTP backends.
export const API_BASE_URL = import.meta.env?.VITE_USE_API_PROXY === "true"
  ? "/api/backend"
  : configuredApiBaseUrl;
