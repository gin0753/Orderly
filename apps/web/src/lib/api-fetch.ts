const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

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

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status} ${response.statusText}`;

    try {
      const error = (await response.json()) as ApiErrorResponse;
      message = getErrorMessage(error);
    } catch {
      // Keep fallback message if response body is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
