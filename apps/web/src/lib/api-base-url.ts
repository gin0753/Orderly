// Production requests stay on the frontend origin so auth cookies are first-party.
function productionServerApiOrigin() {
  if (!process.env.ORDERLY_API_ORIGIN) {
    throw new Error("ORDERLY_API_ORIGIN is required on the production web server.");
  }
  return process.env.ORDERLY_API_ORIGIN;
}

export const API_BASE_URL = (
  process.env.NODE_ENV === "production"
    ? typeof window === "undefined"
      ? `${productionServerApiOrigin()}/api`
      : "/api"
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api")
).replace(/\/$/, "");
