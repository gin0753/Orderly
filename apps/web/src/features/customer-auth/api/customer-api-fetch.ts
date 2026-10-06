import { ApiError } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-base-url";

export type CustomerAuthMode = "public" | "optional" | "required";
export type CustomerFetchOptions = RequestInit & { auth?: CustomerAuthMode };
type FailureListener = () => void;

// Each client owns its in-tab coordinator. Web Locks serialize customer cookie
// mutations across same-origin tabs without storing credentials in JS storage.
export function createCustomerApiClient() {
  let refreshPromise: Promise<void> | null = null;
  let generation = 0;
  const failureListeners = new Set<FailureListener>();

  async function send(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    const mutation = !["GET", "HEAD"].includes((options.method ?? "GET").toUpperCase());
    if (mutation) {
      headers.set("X-Orderly-Client", "customer-web");
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API_BASE_URL}${path}`, {
      ...options, body: mutation && options.body === undefined ? "{}" : options.body,
      credentials: "include", cache: "no-store", headers,
    });
  }

  async function sessionLock<T>(work: () => Promise<T>): Promise<T> {
    const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
    if (!locks) return work(); // In-tab mutex still applies; unsupported browsers fail closed on replay.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      return await locks.request("orderly-customer-session", { signal: controller.signal }, async () => {
        clearTimeout(timeout);
        return work();
      });
    } catch (error) {
      if (controller.signal.aborted) throw new ApiError(503, "Your session is busy in another tab. Please try again.");
      throw error;
    } finally { clearTimeout(timeout); }
  }

  async function refresh(): Promise<void> {
    if (!refreshPromise) {
      refreshPromise = sessionLock(async () => {
        // The waiting tab sees cookies set by the previous lock holder.
        const current = await send("/customer/auth/me");
        if (current.ok) return;
        if (current.status !== 401) throw await responseError(current);
        const result = await send("/customer/auth/refresh", { method: "POST" });
        if (!result.ok) throw await responseError(result);
      }).finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }

  async function request<T>(path: string, options: CustomerFetchOptions = {}): Promise<T> {
    if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Customer API paths must be relative API paths.");
    const { auth = "public", ...init } = options;
    if (auth !== "public" && typeof window === "undefined") throw new Error("Customer session requests must run in the browser.");
    const startedGeneration = generation;
    let result = await send(path, init);
    if (auth !== "public" && result.status === 401) {
      try {
        await refresh();
        if (generation !== startedGeneration) throw new ApiError(409, "Your customer session changed. Please try again.");
        result = await send(path, init);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          expire(startedGeneration);
          throw new ApiError(401, "Your session expired. Sign in again to continue.");
        }
        throw error;
      }
    }
    if (!result.ok) {
      const error = await responseError(result);
      if (auth !== "public" && error.status === 401) expire(startedGeneration);
      throw error;
    }
    if (auth !== "public" && generation !== startedGeneration) throw new ApiError(409, "Your customer session changed. Please try again.");
    return result.status === 204 ? undefined as T : result.json() as Promise<T>;
  }

  function expire(startedGeneration: number) {
    if (generation !== startedGeneration) return;
    generation += 1;
    failureListeners.forEach((listener) => listener());
  }

  return {
    request, sessionLock,
    invalidate() { generation += 1; },
    onSessionFailure(listener: FailureListener) { failureListeners.add(listener); return () => { failureListeners.delete(listener); }; },
  };
}

async function responseError(response: Response): Promise<ApiError> {
  let message = response.status >= 500 ? "We couldn’t reach your account. Please try again." : "The request could not be completed.";
  try {
    const body = await response.json() as { message?: unknown };
    if (typeof body.message === "string") message = body.message;
    else if (Array.isArray(body.message) && body.message.every((part) => typeof part === "string")) message = body.message.join(", ");
  } catch { /* Preserve the safe fallback for non-JSON infrastructure errors. */ }
  return new ApiError(response.status, message);
}

export const customerClient = createCustomerApiClient();
export const customerApiFetch = customerClient.request;
