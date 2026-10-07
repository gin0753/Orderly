/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { CustomerAuthForm } from "@/features/customer-auth/components/customer-auth-form";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { customerSessionExpired } from "@/features/customer-auth/store/customer-auth-slice";
import { ApiError } from "@/lib/api-fetch";
import { makeStore } from "@/store/store";

const replaceMock = jest.fn();
let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
}));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { me: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn(), googleStatus: jest.fn(), googleStart: jest.fn(), googleConnect: jest.fn() } }));
const mockNavigateToGoogle = jest.fn();
jest.mock("@/features/customer-auth/lib/google-navigation", () => ({ navigateToGoogle: (url: string) => mockNavigateToGoogle(url) }));
jest.mock("@/features/customer-auth/api/customer-api-fetch", () => ({ customerClient: { invalidate: jest.fn() } }));
jest.mock("@/features/customer-auth/lib/session-events", () => ({ publishCustomerSessionEvent: jest.fn() }));

const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
const customer = { id: "customer", email: "ada@example.test", name: "Ada Lovelace", phone: null, authMethods: { password: true, google: false } };

beforeEach(() => {
  jest.clearAllMocks();
  searchParams = new URLSearchParams("returnTo=%2Fcheckout");
  api.googleStatus.mockResolvedValue({ enabled: false });
});

function renderForm(mode: "login" | "register") {
  const store = makeStore();
  store.dispatch(customerSessionExpired());
  render(<Provider store={store}><CustomerAuthForm mode={mode} /></Provider>);
  return store;
}

it("renders accessible login controls, submits generic credentials and restores the return path", async () => {
  renderForm("login");
  expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
  expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  api.login.mockResolvedValue({ user: customer });
  await userEvent.type(screen.getByLabelText("Email"), " ADA@EXAMPLE.TEST ");
  await userEvent.type(screen.getByLabelText("Password"), "password with spaces");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(api.login).toHaveBeenCalledWith({ email: "ada@example.test", password: "password with spaces" }));
  await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/checkout"));
});

it("uses a generic login error regardless of backend credential detail", async () => {
  renderForm("login");
  api.login.mockRejectedValue(new ApiError(401, "No customer exists for this email"));
  await userEvent.type(screen.getByLabelText("Email"), "missing@example.test");
  await userEvent.type(screen.getByLabelText("Password"), "wrong password");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
  expect(screen.getByRole("alert")).not.toHaveTextContent("No customer exists");
});

it("validates registration against the API character and UTF-8 byte constraints", async () => {
  renderForm("register");
  const name = screen.getByLabelText("Name");
  const email = screen.getByLabelText("Email");
  const password = screen.getByLabelText("Password");
  const confirmation = screen.getByLabelText("Confirm password");
  expect(password).toHaveAttribute("autocomplete", "new-password");
  await userEvent.type(name, "Ada");
  await userEvent.type(email, "ada@example.test");
  await userEvent.type(password, "😀".repeat(19));
  await userEvent.type(confirmation, "different password");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByText(/^Use a password no longer than 72 UTF-8 bytes/)).toBeInTheDocument();
  expect(screen.getByText("Your passwords don’t match.")).toBeInTheDocument();
  expect(api.register).not.toHaveBeenCalled();
});

it("creates an authenticated registration session and disables the form while submitting", async () => {
  renderForm("register");
  let resolve!: (value: { user: typeof customer }) => void;
  api.register.mockReturnValue(new Promise((done) => { resolve = done; }));
  await userEvent.type(screen.getByLabelText("Name"), customer.name!);
  await userEvent.type(screen.getByLabelText("Email"), customer.email);
  await userEvent.type(screen.getByLabelText("Password"), "long password value");
  await userEvent.type(screen.getByLabelText("Confirm password"), "long password value");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByRole("button", { name: "Creating account…" })).toBeDisabled();
  expect(screen.getByText("Creating your account")).toHaveAttribute("role", "status");
  resolve({ user: customer });
  await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/checkout"));
});

it("rejects unsafe return destinations before successful navigation", async () => {
  searchParams = new URLSearchParams("returnTo=https%3A%2F%2Fattacker.test");
  renderForm("login");
  api.login.mockResolvedValue({ user: customer });
  await userEvent.type(screen.getByLabelText("Email"), customer.email);
  await userEvent.type(screen.getByLabelText("Password"), "password value");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/account"));
});

it.each(["login", "register"] as const)("starts Google from %s with the validated return path", async (mode) => {
  api.googleStatus.mockResolvedValue({ enabled: true });
  api.googleStart.mockResolvedValue({ authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=test" });
  renderForm(mode);
  await userEvent.click(await screen.findByRole("button", { name: "Continue with Google" }));
  await waitFor(() => expect(api.googleStart).toHaveBeenCalledWith("/checkout"));
  expect(mockNavigateToGoogle).toHaveBeenCalledWith("https://accounts.google.com/o/oauth2/v2/auth?state=test");
});

it("shows the password-account conflict without exposing account details", () => {
  searchParams = new URLSearchParams("google=conflict");
  renderForm("login");
  expect(screen.getByRole("alert")).toHaveTextContent("Sign in with your password, then connect Google");
});
