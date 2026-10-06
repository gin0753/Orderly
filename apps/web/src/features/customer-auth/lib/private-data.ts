import type { QueryClient } from "@tanstack/react-query";

export const CUSTOMER_PRIVATE_QUERY_KEY = ["customer-private"] as const;
const cleanups = new Set<() => void>();

export function registerCustomerPrivateDataCleanup(cleanup: () => void) {
  cleanups.add(cleanup);
  return () => { cleanups.delete(cleanup); };
}

export function clearCustomerPrivateData() { cleanups.forEach((cleanup) => cleanup()); }

export function registerCustomerPrivateQueryClient(client: QueryClient) {
  return registerCustomerPrivateDataCleanup(() => {
    void client.cancelQueries({ queryKey: CUSTOMER_PRIVATE_QUERY_KEY });
    client.removeQueries({ queryKey: CUSTOMER_PRIVATE_QUERY_KEY });
  });
}
