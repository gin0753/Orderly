/** @jest-environment jsdom */
import { act, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { QueryProvider } from "@/providers/query-provider";
import { CustomerAuthBootstrap } from "@/features/customer-auth/components/customer-auth-bootstrap";
import { loginCustomer, logoutCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { makeStore } from "@/store/store";

let mockSessionEvent: (event: "changed" | "ended") => void;
jest.mock("@/features/customer-auth/lib/session-events", () => ({
  publishCustomerSessionEvent: jest.fn(),
  subscribeCustomerSessionEvents: jest.fn((listener) => {
    mockSessionEvent = listener;
    return jest.fn();
  }),
}));
const fetchMock = jest.fn();
const customer = { id: "customer", email: "ada@example.test", name: "Ada", phone: null, authMethods: { password: true, google: false } };
function response(status: number, body: object = { user: customer }) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
function mount() {
  const store = makeStore();
  render(<Provider store={store}><QueryProvider><CustomerAuthBootstrap /></QueryProvider></Provider>);
  return store;
}
function paths() {
  return fetchMock.mock.calls.map(([url]) => String(url).replace(/^.*\/customer\/auth\//, ""));
}
async function focus() {
  await act(async () => { window.dispatchEvent(new Event("focus")); });
}
beforeEach(() => {
  fetchMock.mockReset();
  Object.defineProperty(global, "fetch", { configurable: true, writable: true, value: fetchMock });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  Object.defineProperty(window, "BroadcastChannel", { configurable: true, value: jest.fn() });
});

it("settles anonymous bootstrap after terminal 401 and makes no focus, visibility or online retries", async () => {
  fetchMock.mockImplementation(async () => response(401));
  const store = mount();
  await waitFor(() => expect(store.getState().customerAuth).toMatchObject({ status: "unauthenticated", operation: null }));
  expect(paths()).toEqual(["me", "me", "refresh"]);
  await focus();
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("online"));
  });
  expect(paths()).toEqual(["me", "me", "refresh"]);
  expect(store.getState().customerAuth.status).toBe("unauthenticated");
});

it("continues validating authenticated sessions on focus and settles terminal expiry without another bootstrap", async () => {
  fetchMock.mockImplementation(async () => response(200));
  const store = mount();
  await waitFor(() => expect(store.getState().customerAuth.status).toBe("authenticated"));
  await focus();
  expect(paths()).toEqual(["me", "me"]);
  fetchMock.mockImplementation(async () => response(401));
  await focus();
  await waitFor(() => expect(store.getState().customerAuth).toMatchObject({ status: "unauthenticated", operation: null, customer: null }));
  expect(paths()).toEqual(["me", "me", "me", "me", "refresh"]);
  await focus();
  expect(paths()).toHaveLength(5);
});

it("hydrates successful login after anonymous bootstrap and leaves logout stable", async () => {
  fetchMock.mockImplementation(async () => response(401));
  const store = mount();
  await waitFor(() => expect(store.getState().customerAuth.status).toBe("unauthenticated"));
  fetchMock.mockImplementation(async (url: string) => response(url.endsWith("logout") ? 204 : 200));
  await act(async () => { await store.dispatch(loginCustomer({ email: customer.email, password: "fixture-password" })); });
  expect(store.getState().customerAuth.customer).toEqual(customer);
  await focus();
  expect(paths()).toEqual(["me", "me", "refresh", "login", "me"]);
  await act(async () => { await store.dispatch(logoutCustomer()); });
  await focus();
  expect(paths()).toEqual(["me", "me", "refresh", "login", "me", "logout"]);
  expect(store.getState().customerAuth.status).toBe("unauthenticated");
});

it("bootstraps a cross-tab changed event even from anonymous state and invalidates ended events without requests", async () => {
  fetchMock.mockImplementation(async () => response(401));
  const store = mount();
  await waitFor(() => expect(store.getState().customerAuth.status).toBe("unauthenticated"));
  fetchMock.mockImplementation(async () => response(200));
  await act(async () => { mockSessionEvent("changed"); });
  expect(store.getState().customerAuth.customer).toEqual(customer);
  expect(paths()).toEqual(["me", "me", "refresh", "me"]);
  await act(async () => { mockSessionEvent("ended"); });
  await focus();
  expect(paths()).toHaveLength(4);
  expect(store.getState().customerAuth.status).toBe("unauthenticated");
});

it("bootstraps a refreshable session with one successful refresh and one final identity retry", async () => {
  let refreshed = false;
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("refresh")) { refreshed = true; return response(200); }
    return response(refreshed ? 200 : 401);
  });
  const store = mount();
  await waitFor(() => expect(store.getState().customerAuth.status).toBe("authenticated"));
  expect(paths()).toEqual(["me", "me", "refresh", "me"]);
  expect(store.getState().customerAuth.customer).toEqual(customer);
});

it("preserves focus discovery when cross-tab BroadcastChannel support is unavailable", async () => {
  Reflect.deleteProperty(window, "BroadcastChannel");
  fetchMock.mockImplementation(async () => response(401));
  const store = mount();
  await waitFor(() => expect(store.getState().customerAuth.status).toBe("unauthenticated"));
  fetchMock.mockImplementation(async () => response(200));
  await focus();
  expect(paths()).toEqual(["me", "me", "refresh", "me"]);
  expect(store.getState().customerAuth.customer).toEqual(customer);
});
