// Every production build uses the same-origin proxy, independent of Vercel
// system environment variables. Local Vite development calls the API directly.
export const API_BASE_URL = import.meta.env?.PROD
  ? "/api/backend"
  : (import.meta.env?.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
