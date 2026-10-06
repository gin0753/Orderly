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
jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { googleConnect: jest.fn() } }));
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;

function show(methods: { password: boolean; google: boolean }) {
  const store = makeStore();
  store.dispatch(bootstrapCustomer.pending("request", undefined));
  store.dispatch(bootstrapCustomer.fulfilled({ id: "one", email: "customer@example.test", name: "Customer", phone: null, authMethods: methods }, "request", undefined));
  render(<Provider store={store}><CustomerGoogleMethods /></Provider>);
}

beforeEach(() => { jest.clearAllMocks(); });

it("requires current password before starting explicit Google linking", async () => {
  api.googleConnect.mockResolvedValue({ authorizationUrl: "https://accounts.google.com/authorize" });
  show({ password: true, google: false });
  expect(screen.getByText("Not connected")).toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Connect Google" });
  expect(button).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Current password to connect Google"), "current password");
  await userEvent.click(button);
  await waitFor(() => expect(api.googleConnect).toHaveBeenCalledWith("current password"));
  expect(mockNavigateToGoogle).toHaveBeenCalledWith("https://accounts.google.com/authorize");
});

it("shows connected methods without an unlink or password-creation action", () => {
  show({ password: false, google: true });
  expect(screen.getByText("Not configured")).toBeInTheDocument();
  expect(screen.getByText("Connected")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Connect Google" })).not.toBeInTheDocument();
});
