/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { CustomerGoogleMethods } from "@/features/customer-auth/components/customer-google-methods";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { bootstrapCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { makeStore } from "@/store/store";

const mockNavigateToGoogle = jest.fn();
jest.mock("@/features/customer-auth/lib/google-navigation", () => ({ navigateToGoogle: (url: string) => mockNavigateToGoogle(url) }));
let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { googleConnect: jest.fn(), googleStatus: jest.fn() } }));
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;

function show(methods: { password: boolean; google: boolean }) {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("request", undefined));
  store.dispatch(bootstrapCustomer.fulfilled({ id: "one", email: "customer@example.test", name: "Customer", phone: null, authMethods: methods }, "request", undefined));
  render(<Provider store={store}><CustomerGoogleMethods /></Provider>);
}

beforeEach(() => { jest.clearAllMocks(); searchParams = new URLSearchParams(); api.googleStatus.mockResolvedValue({ enabled: true }); });

it("requires current password before starting explicit Google linking", async () => {
  api.googleConnect.mockResolvedValue({ authorizationUrl: "https://accounts.google.com/authorize" });
  show({ password: true, google: false });
  expect(screen.getByText("Not connected")).toBeInTheDocument();
  const button = await screen.findByRole("button", { name: "Connect Google" });
  expect(button).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Current password to connect Google"), "current password");
  await userEvent.click(button);
  await waitFor(() => expect(api.googleConnect).toHaveBeenCalledWith("current password"));
  expect(mockNavigateToGoogle).toHaveBeenCalledWith("https://accounts.google.com/authorize");
});

it("shows connected methods without an unlink or password-creation action", async () => {
  show({ password: false, google: true });
  expect(screen.getByText("Not configured")).toBeInTheDocument();
  expect(screen.getByText("Connected")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Connect Google" })).not.toBeInTheDocument();
  await waitFor(() => expect(api.googleStatus).toHaveBeenCalled());
});

it.each(["disabled", "unreachable"])("does not offer Google connection when the provider is %s", async (status) => {
  if (status === "disabled") api.googleStatus.mockResolvedValue({ enabled: false });
  else api.googleStatus.mockRejectedValue(new Error("Network failure"));
  show({ password: true, google: false });
  await waitFor(() => expect(api.googleStatus).toHaveBeenCalled());
  expect(screen.queryByRole("button", { name: "Connect Google" })).not.toBeInTheDocument();
  expect(screen.getByText("Google connection is currently unavailable.")).toBeInTheDocument();
  expect(api.googleConnect).not.toHaveBeenCalled();
});

it.each(["cancelled", "conflict", "failed"])("explains a %s Google connection callback", async (outcome) => {
  searchParams = new URLSearchParams(`google=${outcome}`);
  show({ password: true, google: false });
  expect(screen.getByRole("alert")).toHaveTextContent("Google connection did not complete");
  await screen.findByRole("button", { name: "Connect Google" });
});
