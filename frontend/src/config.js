// Empty in development (Vite proxies /api to localhost:8000).
// In production, set VITE_API_URL to your deployed backend, e.g. https://research-desk-api.onrender.com
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
