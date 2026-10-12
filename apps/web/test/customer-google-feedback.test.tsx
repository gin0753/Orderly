/** @jest-environment jsdom */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { CustomerGoogleMethods } from "@/features/customer-auth/components/customer-google-methods";
import { customerAuthApi } from "@/features/customer-auth/api/customer-auth-api";
import { bootstrapCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { makeStore } from "@/store/store";
let search = new URLSearchParams();
const navigate = jest.fn();
jest.mock("next/navigation", () => ({ useSearchParams: () => search }));
jest.mock("@/features/customer-auth/lib/google-navigation", () => ({ navigateToGoogle: (url: string) => navigate(url) }));
jest.mock("@/features/customer-auth/api/customer-auth-api", () => ({ customerAuthApi: { googleStatus: jest.fn(), googleConnect: jest.fn() } }));
const api = customerAuthApi as jest.Mocked<typeof customerAuthApi>;
async function show(google = false) {
 const store=makeStore();
 store.dispatch(bootstrapCustomer.pending("fixture",undefined));
 store.dispatch(bootstrapCustomer.fulfilled({id:"fixture",email:"fixture@example.test",name:"Fixture",phone:null,authMethods:{password:true,google}},"fixture",undefined));
 await act(async()=>{render(<Provider store={store}><CustomerGoogleMethods /></Provider>);});
}
beforeEach(()=>{jest.resetAllMocks();search=new URLSearchParams();api.googleStatus.mockResolvedValue({enabled:true});});
it.each([
 ["failed","Google could not be connected. Please try again."],
 ["cancelled","Google authorization was not completed."],
 ["conflict","This Google account could not be linked"],
])("presents %s without claiming an unproven email mismatch", async (state,copy)=>{
 search=new URLSearchParams(`google=${state}`);await show();
 const alert=screen.getByRole("alert");expect(alert).toHaveTextContent("Google connection unsuccessful");expect(alert).toHaveTextContent(copy);
 expect(alert).toHaveClass("text-[var(--color-danger-strong)]","bg-[var(--color-danger-surface)]","border-[var(--color-danger-border)]");
 expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden","true");
 expect(alert).not.toHaveTextContent("Orderly email");expect(alert).not.toHaveFocus();
});
it("clears callback errors on retry and replaces a failed attempt with one safe alert",async()=>{
 const user=userEvent.setup();search=new URLSearchParams("google=conflict");await show();
 let reject!: (error: Error)=>void;
 api.googleConnect.mockImplementation(()=>new Promise((_,failure)=>{reject=failure;}));
 const password=screen.getByLabelText("Current password to connect Google");await user.type(password,"fixture password");
 const button=screen.getByRole("button",{name:"Connect Google"});await waitFor(()=>expect(button).toBeEnabled());await user.click(button);
 expect(screen.queryByRole("alert")).not.toBeInTheDocument();expect(screen.getByRole("button",{name:/Connecting/})).toBeDisabled();
 await act(async()=>{reject(new Error("private provider diagnostic"));});
 expect(await screen.findByRole("alert")).toHaveTextContent("Google could not be connected. Please try again.");expect(screen.getAllByRole("alert")).toHaveLength(1);
 expect(screen.queryByText(/private provider/)).not.toBeInTheDocument();expect(password).toHaveValue("fixture password");
 api.googleConnect.mockResolvedValue({authorizationUrl:"https://accounts.google.com/fixture"});await user.click(button);
 await waitFor(()=>expect(navigate).toHaveBeenCalled());expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it.each(["connected","unknown"])("does not announce an error for %s",async state=>{search=new URLSearchParams(`google=${state}`);await show();expect(screen.queryByRole("alert")).not.toBeInTheDocument();});
it("does not retain stale failure feedback once Google is connected",async()=>{search=new URLSearchParams("google=failed");await show(true);expect(screen.queryByRole("alert")).not.toBeInTheDocument();});
