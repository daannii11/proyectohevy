/**
 * Base URL for the Express API.
 * - Development: `/api` is proxied by Vite to `http://localhost:3000` (same origin → fewer connection/CORS issues).
 * - Production: set `VITE_API_URL` (e.g. `https://api.example.com`).
 */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  return "http://localhost:3000";
}
