/** @jest-environment jsdom */

type ApiFetchModule = typeof import("@/lib/api-fetch");

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? "Unauthorized" : "OK",
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function emptyResponse(status = 204) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "No Content",
    json: jest.fn(),
  } as unknown as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe("apiFetch authentication behavior", () => {
  let api: ApiFetchModule;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    jest.resetModules();
    global.Headers = class {
      private readonly values = new Map<string, string>();

      constructor(initial?: HeadersInit) {
        if (initial && !Array.isArray(initial) && !(initial instanceof Headers)) {
          Object.entries(initial).forEach(([name, value]) => this.set(name, value));
        }
      }

      has(name: string) {
        return this.values.has(name.toLowerCase());
      }

      set(name: string, value: string) {
        this.values.set(name.toLowerCase(), value);
      }
    } as unknown as typeof Headers;
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    api = await import("@/lib/api-fetch");
  });

  it("includes cookie credentials and returns a successful request without refreshing", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "order-1" }));

    await expect(
      api.apiFetch<{ id: string }>("/admin/orders", { auth: "required" }),
    ).resolves.toEqual({ id: "order-1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/admin/orders",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("refreshes once and retries the original request once after a 401", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(jsonResponse({ id: "order-1" }));

    await expect(
      api.apiFetch<{ id: string }>("/admin/orders", { auth: "required" }),
    ).resolves.toEqual({ id: "order-1" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://localhost:4000/api/auth/refresh",
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "http://localhost:4000/api/admin/orders",
    );
  });

  it("shares one in-flight refresh across concurrent unauthorized requests", async () => {
    const refresh = deferred<Response>();
    const refreshStarted = deferred<void>();
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      const callsForUrl = fetchMock.mock.calls.filter(
        ([calledInput]) => String(calledInput) === url,
      ).length;

      if (url.endsWith("/auth/refresh")) {
        refreshStarted.resolve();
        return refresh.promise;
      }
      if (callsForUrl === 1) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }
      return jsonResponse({ url });
    });

    const requests = ["/admin/orders", "/admin/menu/categories"].map((path) =>
      api.apiFetch<{ url: string }>(path, { auth: "required" }),
    );

    await refreshStarted.promise;
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith("/auth/refresh"),
      ),
    ).toHaveLength(1);

    refresh.resolve(emptyResponse());
    await expect(Promise.all(requests)).resolves.toHaveLength(2);

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("surfaces session expiry and notifies once when refresh is unauthorized", async () => {
    const onExpired = jest.fn();
    api.registerAuthenticationFailureHandler(onExpired);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401));

    await expect(
      api.apiFetch("/admin/orders", { auth: "required" }),
    ).rejects.toMatchObject({ status: 401, message: expect.stringContaining("expired") });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("does not retry indefinitely when the post-refresh retry is unauthorized", async () => {
    const onExpired = jest.fn();
    api.registerAuthenticationFailureHandler(onExpired);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401));

    await expect(
      api.apiFetch("/admin/orders", { auth: "required" }),
    ).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("surfaces a public 401 without attempting refresh", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Not found" }, 401));

    await expect(api.apiFetch("/orders/track")).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
