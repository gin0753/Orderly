/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { SiteHeader } from "@/components/layout/site-header";
import { AccountNavigation } from "@/features/customer-auth/components/account-navigation";
import { CustomerPasswordForm } from "@/features/customer-auth/components/customer-password-form";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { bootstrapCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { makeStore } from "@/store/store";

let pathname = "/account";
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { logout: jest.fn() } }));
const customer = { id: "one", email: "customer@example.test", name: "Customer", phone: null, authMethods: { password: true, google: false } };
beforeEach(() => {
  jest.clearAllMocks(); pathname = "/account"; window.location.hash = "";
  window.matchMedia = jest.fn().mockImplementation(() => ({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  jest.mocked(customerAuthApi.logout).mockResolvedValue(undefined);
});
function show() {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("test", undefined));
  store.dispatch(bootstrapCustomer.fulfilled(customer, "test", undefined));
  render(<Provider store={store}><SiteHeader /><button>Outside</button></Provider>);
  return store;
}

it("keeps guest tracking primary and hides desktop logout until disclosure opens", async () => {
  show();
  const primary = within(screen.getByRole("navigation", { name: "Primary navigation" }));
  expect(primary.getAllByRole("link").map((link) => link.textContent)).toEqual(["Menu", "Track order"]);
  expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  const trigger = screen.getByRole("button", { name: "Account options" });
  await userEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/account#profile");
  await userEvent.keyboard("{ArrowDown}");
  expect(screen.getByRole("link", { name: "Account" })).toHaveFocus();
  await userEvent.keyboard("{End}");
  expect(screen.getByRole("button", { name: "Sign out" })).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  expect(screen.getByRole("link", { name: "Account" })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(trigger).toHaveFocus(); expect(trigger).toHaveAttribute("aria-expanded", "false");
});

it("opens with keyboard, closes outside, and lets Tab leave without trapping", async () => {
  show(); const trigger = screen.getByRole("button", { name: "Account options" });
  trigger.focus(); await userEvent.keyboard("{ArrowUp}");
  await waitFor(() => expect(screen.getByRole("button", { name: "Sign out" })).toHaveFocus());
  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Open cart" })).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(trigger); await userEvent.click(screen.getByRole("button", { name: "Outside" }));
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(trigger);
  const orders = screen.getByRole("link", { name: "Orders" });
  orders.addEventListener("click", (event) => event.preventDefault(), { once: true });
  await userEvent.click(orders);
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

it("keeps failed sign out visible and authenticated; successful retry uses existing flow", async () => {
  const store = show(); jest.mocked(customerAuthApi.logout).mockRejectedValueOnce(new Error("offline"));
  await userEvent.click(screen.getByRole("button", { name: "Account options" }));
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("We couldn’t reach your account");
  expect(store.getState().customerAuth.status).toBe("authenticated");
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(store.getState().customerAuth.status).toBe("unauthenticated"));
  expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
});

it("marks account sections and focuses hash headings without changing routes", async () => {
  render(<><AccountNavigation /><h2 id="security-heading" tabIndex={-1}>Security</h2></>);
  expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "location");
  act(() => { window.location.hash = "#security"; fireEvent(window, new Event("hashchange")); });
  await waitFor(() => expect(screen.getByRole("heading", { name: "Security" })).toHaveFocus());
  expect(screen.getByRole("link", { name: "Sign-in & Security" })).toHaveAttribute("aria-current", "location");
});

it("keeps password controls hidden until native disclosure is activated", async () => {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("next", undefined)); store.dispatch(bootstrapCustomer.fulfilled(customer, "next", undefined));
  render(<Provider store={store}><CustomerPasswordForm collapsible /></Provider>);
  expect(screen.getByLabelText("Current password")).not.toBeVisible();
  await userEvent.click(document.querySelector("summary")!);
  expect(screen.getByRole("button", { name: "Change password" })).toBeVisible();
});
