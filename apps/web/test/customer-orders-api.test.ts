import { customerApiFetch } from "@/features/customer-auth/api/customer-api-fetch";
import { customerOrderKeys, getCustomerOrder, getCustomerOrders } from "@/features/customer-orders/customer-orders-api";
import { QueryClient } from "@tanstack/react-query";
import { registerCustomerPrivateQueryClient } from "@/features/customer-auth/lib/private-data";
import { bootstrapCustomer, customerSessionExpired } from "@/features/customer-auth/store/customer-auth-slice";
import { makeStore } from "@/store/store";

jest.mock("@/features/customer-auth/api/customer-api-fetch", () => ({ customerApiFetch: jest.fn() }));
const request = customerApiFetch as jest.MockedFunction<typeof customerApiFetch>;

beforeEach(() => request.mockReset());

test("list and detail use required customer auth and private owner-scoped query keys", async () => {
  request.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } });
  const query = { page: 2, pageSize: 10, status: "COMPLETED" as const, sort: "amount_high" as const };
  await getCustomerOrders(query);
  expect(request).toHaveBeenCalledWith("/customer/orders?page=2&pageSize=10&sort=amount_high&status=COMPLETED", { auth: "required" });
  await getCustomerOrder("abc/def");
  expect(request).toHaveBeenLastCalledWith("/customer/orders/abc%2Fdef", { auth: "required" });
  expect(customerOrderKeys.list("customer-a", query)).toEqual(["customer-private", "orders", "customer-a", "list", query]);
  expect(customerOrderKeys.detail("customer-b", "order-id")).toEqual(["customer-private", "orders", "customer-b", "detail", "order-id"]);
});

test("session expiry removes order queries without clearing public menu data", () => {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("owner", undefined));
  store.dispatch(bootstrapCustomer.fulfilled({ id: "owner", email: "owner@example.test", name: "Owner", phone: null, authMethods: { password: true, google: false } }, "owner", undefined));
  const queries = new QueryClient();
  const unregister = registerCustomerPrivateQueryClient(queries);
  const key = customerOrderKeys.detail("owner", "order-id");
  queries.setQueryData(key, { orderNumber: "123" });
  queries.setQueryData(["menu", "products"], ["Pizza"]);
  store.dispatch(customerSessionExpired());
  expect(queries.getQueryData(key)).toBeUndefined();
  expect(queries.getQueryData(["menu", "products"])).toEqual(["Pizza"]);
  queries.setQueryData(key, { orderNumber: "123" });
  store.dispatch(bootstrapCustomer.pending("other", undefined));
  store.dispatch(bootstrapCustomer.fulfilled({ id: "other", email: "other@example.test", name: "Other", phone: null, authMethods: { password: true, google: false } }, "other", undefined));
  expect(queries.getQueryData(key)).toBeUndefined();
  expect(queries.getQueryData(["menu", "products"])).toEqual(["Pizza"]);
  unregister();
});
