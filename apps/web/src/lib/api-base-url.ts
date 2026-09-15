// Production requests stay on the frontend origin so auth cookies are first-party.
export const API_BASE_URL = (
  process.env.NODE_ENV === "production"
    ? typeof window === "undefined"
      ? "https://orderly-production-1ac4.up.railway.app/api"
      : "/api"
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api")
).replace(/\/$/, "");
