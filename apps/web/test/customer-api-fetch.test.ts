/** @jest-environment jsdom */

import { createCustomerApiClient } from "@/features/customer-auth/api/customer-api-fetch";
import { ApiError } from "@/lib/api-fetch";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  Object.defineProperty(global, "fetch", { configurable: true, writable: true, value: fetchMock });
  Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
});

function json(status: number, body: object = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? "Unauthorized" : status >= 500 ? "Server Error" : "OK",
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

it("shares one in-tab refresh across simultaneous protected 401s and retries each request once", async () => {
  const client = createCustomerApiClient();
  let refreshed = false;
  let refreshes = 0;
  let protectedCalls = 0;
  fetchMock.mockImplementation(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/customer/auth/me")) return json(401);
    if (url.endsWith("/customer/auth/refresh")) { refreshes += 1; refreshed = true; return json(200, { user: {} }); }
    protectedCalls += 1;
    return refreshed ? json(200, { ok: true }) : json(401);
  });
  await expect(Promise.all([
    client.request("/customer/private-a", { auth: "required" }),
    client.request("/customer/private-b", { auth: "required" }),
  ])).resolves.toEqual([{ ok: true }, { ok: true }]);
  expect(refreshes).toBe(1);
  expect(protectedCalls).toBe(4);
});

it("does not refresh public requests or loop after a terminal refresh failure", async () => {
  const client = createCustomerApiClient();
  let refreshes = 0;
  fetchMock.mockImplementation(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/customer/auth/refresh")) refreshes += 1;
    return json(401, { message: "Unauthorized" });
  });
  await expect(client.request("/public", { auth: "public" })).rejects.toMatchObject({ status: 401 });
  expect(refreshes).toBe(0);
  const listener = jest.fn();
  client.onSessionFailure(listener);
  await expect(client.request("/private", { auth: "required" })).rejects.toEqual(
    expect.objectContaining({ status: 401, message: expect.stringContaining("expired") }),
  );
  expect(refreshes).toBe(1);
  expect(listener).toHaveBeenCalledTimes(1);
  // protected, me, refresh: no recursive attempt to refresh the refresh endpoint
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it("adds the customer mutation contract while leaving GET requests unmodified", async () => {
  const client = createCustomerApiClient();
  fetchMock.mockResolvedValue(json(200, {}));
  await client.request("/customer/auth/logout", { method: "POST" });
  const mutation = fetchMock.mock.calls[0][1] as RequestInit;
  const mutationHeaders = new Headers(mutation.headers);
  expect(mutationHeaders.get("X-Orderly-Client")).toBe("customer-web");
  expect(mutationHeaders.get("Content-Type")).toBe("application/json");
  expect(mutation.body).toBe("{}");
  expect(mutation.credentials).toBe("include");
  await client.request("/menu");
  const getHeaders = new Headers((fetchMock.mock.calls[1][1] as RequestInit).headers);
  expect(getHeaders.has("X-Orderly-Client")).toBe(false);
  expect(getHeaders.has("Content-Type")).toBe(false);
});

it("distinguishes infrastructure failures from terminal authentication failures", async () => {
  const client = createCustomerApiClient();
  const listener = jest.fn();
  client.onSessionFailure(listener);
  fetchMock.mockRejectedValue(new TypeError("network down"));
  await expect(client.request("/private", { auth: "required" })).rejects.toThrow("network down");
  expect(listener).not.toHaveBeenCalled();
  fetchMock.mockReset().mockResolvedValue(json(503));
  await expect(client.request("/private", { auth: "required" })).rejects.toMatchObject({ status: 503 });
  expect(listener).not.toHaveBeenCalled();
});

it("uses a shared Web Lock so a waiting tab rechecks cookies instead of rotating again", async () => {
  let queue = Promise.resolve();
  const request = jest.fn(<T,>(_name: string, _options: LockOptions, callback: () => Promise<T>) => {
    const result = queue.then(callback);
    queue = result.then(() => undefined, () => undefined);
    return result;
  });
  Object.defineProperty(navigator, "locks", { configurable: true, value: { request } });
  const firstTab = createCustomerApiClient();
  const secondTab = createCustomerApiClient();
  let refreshed = false;
  let refreshes = 0;
  fetchMock.mockImplementation(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/customer/auth/me")) return refreshed ? json(200, { user: {} }) : json(401);
    if (url.endsWith("/customer/auth/refresh")) { refreshes += 1; refreshed = true; return json(200, { user: {} }); }
    return refreshed ? json(200, { ok: true }) : json(401);
  });
  await Promise.all([
    firstTab.request("/customer/private-a", { auth: "required" }),
    secondTab.request("/customer/private-b", { auth: "required" }),
  ]);
  expect(request).toHaveBeenCalledTimes(2);
  expect(refreshes).toBe(1);
});

it("fails closed on a cross-tab refresh race without Web Locks", async () => {
  const firstTab = createCustomerApiClient();
  const secondTab = createCustomerApiClient();
  const firstExpired = jest.fn();
  const secondExpired = jest.fn();
  firstTab.onSessionFailure(firstExpired);
  secondTab.onSessionFailure(secondExpired);
  let refreshCalls = 0;
  let orderCreates = 0;
  fetchMock.mockImplementation(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/customer/auth/me")) return json(401);
    if (url.endsWith("/customer/auth/refresh")) {
      refreshCalls += 1;
      return refreshCalls === 1 ? json(200, { user: { id: "a" } }) : json(401);
    }
    if (url.endsWith("/orders")) {
      if (refreshCalls === 0) return json(401);
      orderCreates += 1;
      return json(201, { orderNumber: "10001" });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  const results = await Promise.allSettled([
    firstTab.request("/orders", { method: "POST", body: "{}", auth: "optional" }),
    secondTab.request("/orders", { method: "POST", body: "{}", auth: "optional" }),
  ]);
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  expect(orderCreates).toBe(1);
  expect(firstExpired.mock.calls.length + secondExpired.mock.calls.length).toBe(1);
});

it("rejects unsafe API paths before making a request", async () => {
  const client = createCustomerApiClient();
  await expect(client.request("https://attacker.test")).rejects.toThrow("relative API paths");
  await expect(client.request("//attacker.test")).rejects.toThrow("relative API paths");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(new ApiError(401, "x")).toBeInstanceOf(Error);
});

it("submits optional-auth orders as guests without a refresh", async () => {
  const client = createCustomerApiClient();
  fetchMock.mockResolvedValue(json(201, { orderNumber: "10001" }));
  await expect(client.request("/orders", { method: "POST", body: "{}", auth: "optional" }))
    .resolves.toEqual({ orderNumber: "10001" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const request = fetchMock.mock.calls[0][1] as RequestInit;
  expect(request.credentials).toBe("include");
  expect(new Headers(request.headers).get("X-Orderly-Client")).toBe("customer-web");
});

it("refreshes and retries an optional-auth order once before creating it", async () => {
  const client = createCustomerApiClient();
  let refreshed = false;
  let orderCalls = 0;
  fetchMock.mockImplementation(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/customer/auth/me")) return json(401);
    if (url.endsWith("/customer/auth/refresh")) { refreshed = true; return json(200); }
    orderCalls += 1;
    return refreshed ? json(201, { orderNumber: "10002" }) : json(401);
  });
  await expect(client.request("/orders", { method: "POST", body: "{}", auth: "optional" }))
    .resolves.toEqual({ orderNumber: "10002" });
  expect(orderCalls).toBe(2);
  expect(fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/customer/auth/refresh"))).toHaveLength(1);
});

it("never downgrades a terminal optional-auth failure into a guest order", async () => {
  const client = createCustomerApiClient();
  const expired = jest.fn();
  client.onSessionFailure(expired);
  fetchMock.mockResolvedValue(json(401));
  await expect(client.request("/orders", { method: "POST", body: "{}", auth: "optional" }))
    .rejects.toMatchObject({ status: 401 });
  expect(fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/orders"))).toHaveLength(1);
  expect(expired).toHaveBeenCalledTimes(1);
});

it("keeps optional-auth infrastructure failures distinct from terminal expiry", async () => {
  const client = createCustomerApiClient();
  const expired = jest.fn();
  client.onSessionFailure(expired);
  fetchMock.mockResolvedValue(json(503));
  await expect(client.request("/orders", { method: "POST", body: "{}", auth: "optional" }))
    .rejects.toMatchObject({ status: 503 });
  expect(expired).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
