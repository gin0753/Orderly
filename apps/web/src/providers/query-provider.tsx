"use client";

import { ApiError } from "@/lib/api-fetch";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";

type QueryProviderProps = PropsWithChildren;

function shouldRetryRequest(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }

  return failureCount < 1;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: shouldRetryRequest,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
