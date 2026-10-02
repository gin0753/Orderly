/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";
import { AdminRouteGuard } from "@/features/auth/components/admin-route-guard";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { AppHeaderShell } from "@/components/layout/app-header-shell";
import { sessionExpired } from "@/features/auth/store/auth-slice";

const replaceMock = jest.fn();
let pathname = "/admin/menu/products";
let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
}));

beforeEach(() => {
  pathname = "/admin/menu/products";
  searchParams = new URLSearchParams();
  window.history.replaceState(null, "", "/");
});

it("preserves filter queries through login without rendering protected content", async () => {
  const query = "?search=chips%20%26%20dip&categoryId=pizza&page=2";
  window.history.replaceState(null, "", `${pathname}${query}`);
  const store = makeStore();
  store.dispatch(sessionExpired());
  const view = render(<Provider store={store}><AdminRouteGuard><p>Protected content</p></AdminRouteGuard></Provider>);
  await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(
    `/admin/login?next=${encodeURIComponent(`${pathname}${query}`)}`,
  ));
  expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  const loginUrl = new URL(replaceMock.mock.calls[0][0], window.location.origin);
  searchParams = loginUrl.searchParams;
  view.unmount();
  store.dispatch({ type: "auth/loginAdmin/fulfilled", payload: { id: "admin", email: "admin@example.com" } });
  render(<Provider store={store}><AdminLoginForm /></Provider>);
  await waitFor(() => expect(replaceMock).toHaveBeenLastCalledWith(`${pathname}${query}`));
});

it("renders authorized content without redirecting", () => {
  const store = makeStore();
  store.dispatch({ type: "auth/loginAdmin/fulfilled", payload: { id: "admin", email: "admin@example.com" } });
  render(<Provider store={store}><AdminRouteGuard><p>Protected content</p></AdminRouteGuard></Provider>);
  expect(screen.getByText("Protected content")).toBeInTheDocument();
  expect(replaceMock).not.toHaveBeenCalled();
});

it("marks an exact page and a parent section with appropriate current semantics", () => {
  const links = [{ label: "Orders", href: "/track-order" }, { label: "Menu", href: "/" }];
  pathname = "/track-order";
  const view = render(<AppHeaderShell logoHref="/" navLinks={links} rightSlot={null} />);
  expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Menu" })).not.toHaveAttribute("aria-current");
  pathname = "/track-order/ORD-123";
  view.rerender(<AppHeaderShell logoHref="/" navLinks={links} rightSlot={null} />);
  expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "location");
});
