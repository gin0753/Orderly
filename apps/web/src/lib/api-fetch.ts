const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"
).replace(/\/$/, "");

export type ApiAuthMode = "none" | "required";

export type ApiFetchOptions = RequestInit & {
  auth?: ApiAuthMode;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

type AuthenticationFailureHandler = () => void;

let refreshPromise: Promise<void> | null = null;
let authenticationFailureHandler: AuthenticationFailureHandler | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function registerAuthenticationFailureHandler(
  handler: AuthenticationFailureHandler,
): () => void {
  authenticationFailureHandler = handler;

  return () => {
    if (authenticationFailureHandler === handler) {
      authenticationFailureHandler = null;
    }
  };
}

function notifyAuthenticationFailure() {
  authenticationFailureHandler?.();
}

function getErrorMessage(error: ApiErrorResponse) {
  if (Array.isArray(error.message)) {
    return error.message.join(", ");
  }

  if (typeof error.message === "string") {
    return error.message;
  }

  if (typeof error.error === "string") {
    return error.error;
  }

  return "Something went wrong.";
}

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function createHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers);

  if (!nextHeaders.has("Accept")) {
    nextHeaders.set("Accept", "application/json");
  }

  return nextHeaders;
}

async function sendRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(buildUrl(path), {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: createHeaders(init.headers),
  });
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = `API request failed: ${response.status} ${response.statusText}`;

  try {
    const error = (await response.json()) as ApiErrorResponse;

    return new ApiError(
      response.status,
      getErrorMessage(error) || fallbackMessage,
    );
  } catch {
    return new ApiError(response.status, fallbackMessage);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

async function refreshAdminAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = sendRequest("/auth/refresh", {
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await toApiError(response);
        }
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth = "none", ...requestInit } = options;

  if (auth === "required" && typeof window === "undefined") {
    throw new Error(
      "Authenticated admin requests must run in a Client Component.",
    );
  }

  let response = await sendRequest(path, requestInit);

  if (auth === "required" && response.status === 401) {
    try {
      await refreshAdminAccessToken();

      response = await sendRequest(path, requestInit);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        notifyAuthenticationFailure();

        throw new ApiError(
          401,
          "Your admin session has expired. Please sign in again.",
        );
      }

      throw error;
    }
  }

  if (!response.ok) {
    const error = await toApiError(response);

    if (auth === "required" && error.status === 401) {
      notifyAuthenticationFailure();
    }

    throw error;
  }

  return parseResponse<T>(response);
}
