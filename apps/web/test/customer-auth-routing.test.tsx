/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { CustomerRouteGuard } from "@/features/customer-auth/components/customer-route-guard";
import { bootstrapCustomer, customerSessionExpired } from "@/features/customer-auth/store/customer-auth-slice";
import { makeStore } from "@/store/store";

const replaceMock = jest.fn();
let pathname = "/account/orders";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: replaceMock }),
}));

beforeEach(() => {
  replaceMock.mockReset();
  pathname = "/account/orders";
  window.history.replaceState(null, "", "/account/orders?page=2&status=COMPLETED");
});

it("withholds private content while bootstrap is unresolved", () => {
  const store = makeStore();
  render(<Provider store={store}><CustomerRouteGuard><p>Private account data</p></CustomerRouteGuard></Provider>);
  expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
  expect(screen.queryByText("Private account data")).not.toBeInTheDocument();
  expect(replaceMock).not.toHaveBeenCalled();
});

it("renders protected content only for an authenticated customer", () => {
  const store = makeStore();
  const requestId = "authenticated";
  store.dispatch(bootstrapCustomer.pending(requestId, undefined));
  store.dispatch(bootstrapCustomer.fulfilled({ id: "customer", email: "customer@example.test", name: null, phone: null, authMethods: { password: true, google: false } }, requestId, undefined));
  render(<Provider store={store}><CustomerRouteGuard><p>Private account data</p></CustomerRouteGuard></Provider>);
  expect(screen.getByText("Private account data")).toBeInTheDocument();
});

it("redirects confirmed anonymous state with a validated query-preserving return path", async () => {
  const store = makeStore();
  store.dispatch(customerSessionExpired());
  render(<Provider store={store}><CustomerRouteGuard><p>Private account data</p></CustomerRouteGuard></Provider>);
  await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(
    `/login?returnTo=${encodeURIComponent("/account/orders?page=2&status=COMPLETED")}`,
  ));
  expect(screen.queryByText("Private account data")).not.toBeInTheDocument();
});

it("shows a recoverable error instead of redirecting after infrastructure failure", async () => {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("failure", undefined));
  store.dispatch(bootstrapCustomer.rejected(new Error("network"), "failure", undefined, { status: 503, message: "We couldn’t reach your account." }));
  render(<Provider store={store}><CustomerRouteGuard><p>Private account data</p></CustomerRouteGuard></Provider>);
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to check your session");
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  expect(replaceMock).not.toHaveBeenCalled();
});
