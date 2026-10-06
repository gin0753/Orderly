/** @jest-environment jsdom */

import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { customerClient } from "@/features/customer-auth/api/customer-api-fetch";
import { bootstrapCustomer, loginCustomer, logoutCustomer, registerCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { ApiError } from "@/lib/api-fetch";
import { makeStore } from "@/store/store";

jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { me: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn() } }));
jest.mock("@/features/customer-auth/api/customer-api-fetch", () => ({ customerClient: { invalidate: jest.fn() } }));
jest.mock("@/features/customer-auth/lib/session-events", () => ({ publishCustomerSessionEvent: jest.fn() }));

const customer = { id: "customer-1", email: "ada@example.test", name: "Ada", phone: null, authMethods: { password: true, google: false } };
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;

beforeEach(() => jest.clearAllMocks());

it("models authenticated, unauthenticated and recoverable-error bootstrap outcomes", async () => {
  const store = makeStore();
  api.me.mockResolvedValueOnce({ user: customer });
  await store.dispatch(bootstrapCustomer());
  expect(store.getState().customerAuth).toMatchObject({ status: "authenticated", customer });
  api.me.mockRejectedValueOnce(new ApiError(401, "Unauthorized"));
  await store.dispatch(bootstrapCustomer());
  expect(store.getState().customerAuth).toMatchObject({ status: "unauthenticated", customer: null, error: null });
  api.me.mockRejectedValueOnce(new ApiError(503, "Unavailable"));
  await store.dispatch(bootstrapCustomer());
  expect(store.getState().customerAuth).toMatchObject({ status: "error", customer: null });
});

it("hydrates identity on login and registration without storing credentials", async () => {
  const store = makeStore();
  api.login.mockResolvedValue({ user: customer });
  await store.dispatch(loginCustomer({ email: customer.email, password: "secret password" }));
  expect(store.getState().customerAuth.customer).toEqual(customer);
  expect(JSON.stringify(store.getState().customerAuth)).not.toContain("secret password");
  api.register.mockResolvedValue({ user: { ...customer, id: "customer-2" } });
  await store.dispatch(registerCustomer({ name: "Ada", email: customer.email, password: "another password" }));
  expect(store.getState().customerAuth.customer?.id).toBe("customer-2");
  expect(customerClient.invalidate).toHaveBeenCalledTimes(2);
});

it("keeps the cart while logout clears customer identity", async () => {
  const store = makeStore();
  api.login.mockResolvedValue({ user: customer });
  await store.dispatch(loginCustomer({ email: customer.email, password: "password" }));
  store.dispatch({ type: "cart/addItem", payload: { key: "pizza", product: { id: "pizza", name: "Pizza", priceCents: 1000 }, selectedOptions: [], quantity: 1, unitPriceCents: 1000 } });
  api.logout.mockResolvedValue(undefined);
  await store.dispatch(logoutCustomer());
  expect(store.getState().customerAuth).toMatchObject({ status: "unauthenticated", customer: null });
  expect(store.getState().cart.items).toHaveLength(1);
  expect(store.getState().auth.status).toBe("checking");
});

it("keeps authenticated state on a nonterminal logout failure", async () => {
  const store = makeStore();
  api.login.mockResolvedValue({ user: customer });
  await store.dispatch(loginCustomer({ email: customer.email, password: "password" }));
  api.logout.mockRejectedValue(new ApiError(503, "Unavailable"));
  await store.dispatch(logoutCustomer());
  expect(store.getState().customerAuth).toMatchObject({ status: "authenticated", customer, error: "We couldn’t reach your account. Please try again." });
});
