/** @jest-environment node */

describe("server API base URL", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    ["production", "/api", "https://api.orderly.example/api"],
    ["development", "http://localhost:4000/api/", "http://localhost:4000/api"],
    ["development", undefined, "http://localhost:4000/api"],
  ])("resolves %s with configured base %s", async (mode, configured, expected) => {
    process.env = { ...originalEnv, NODE_ENV: mode as "production" | "development" };
    if (mode === "production") process.env.ORDERLY_API_ORIGIN = "https://api.orderly.example";
    if (configured === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = configured;
    }
    jest.resetModules();
    const { API_BASE_URL } = await import("@/lib/api-base-url");
    expect(API_BASE_URL).toBe(expected);
  });

  it("fails closed without a production API origin", async () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.ORDERLY_API_ORIGIN;
    jest.resetModules();
    await expect(import("@/lib/api-base-url")).rejects.toThrow(
      "ORDERLY_API_ORIGIN is required",
    );
  });
});
