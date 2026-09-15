/** @jest-environment node */

describe("server API base URL", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    ["production", "/api", "https://orderly-production-1ac4.up.railway.app/api"],
    ["development", "http://localhost:4000/api/", "http://localhost:4000/api"],
    ["development", undefined, "http://localhost:4000/api"],
  ])("resolves %s with configured base %s", async (mode, configured, expected) => {
    process.env = { ...originalEnv, NODE_ENV: mode as "production" | "development" };
    if (configured === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = configured;
    }
    jest.resetModules();
    const { API_BASE_URL } = await import("@/lib/api-base-url");
    expect(API_BASE_URL).toBe(expected);
  });
});
