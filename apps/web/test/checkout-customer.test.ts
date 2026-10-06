/** @jest-environment jsdom */
import { clearCheckoutReturnDraft, readCheckoutReturnDraft, saveCheckoutReturnDraft, withCustomerPrefill } from "@/features/checkout/checkout-customer";
import type { CheckoutFormState } from "@/features/checkout/checkout-types";
import type { PublicCustomer } from "@/features/customer-auth/types";

const blank: CheckoutFormState = {
  fulfillmentType: "pickup", fullName: "", email: "", phone: "", address: "", apartment: "", city: "", state: "", postcode: "", orderNotes: "",
};
const alice: PublicCustomer = { id: "alice", name: "Alice", email: "alice@example.test", phone: "+61 400 000 001", authMethods: { password: true, google: false } };
const bob: PublicCustomer = { ...alice, id: "bob", name: "Bob", email: "bob@example.test", phone: null };
const untouched = { fullName: false, email: false, phone: false };

beforeEach(() => sessionStorage.clear());

it("prefills only untouched contact fields after delayed identity bootstrap", () => {
  expect(withCustomerPrefill(blank, untouched, null)).toEqual(blank);
  expect(withCustomerPrefill(blank, untouched, alice)).toMatchObject({
    fullName: "Alice", email: "alice@example.test", phone: "+61 400 000 001",
  });
  const typed = { ...blank, phone: "User typed phone" };
  expect(withCustomerPrefill(typed, { ...untouched, phone: true }, alice)).toMatchObject({
    fullName: "Alice", email: "alice@example.test", phone: "User typed phone",
  });
});

it("clears or replaces account-derived values on logout and account switch without touching edits", () => {
  const edited = { ...blank, email: "work@example.test", address: "10 Example Street" };
  const touched = { ...untouched, email: true };
  expect(withCustomerPrefill(edited, touched, alice)).toMatchObject({ fullName: "Alice", email: "work@example.test", phone: alice.phone });
  expect(withCustomerPrefill(edited, touched, bob)).toMatchObject({ fullName: "Bob", email: "work@example.test", phone: "" });
  expect(withCustomerPrefill(edited, touched, null)).toMatchObject({ fullName: "", email: "work@example.test", phone: "", address: "10 Example Street" });
});

it("restores a short-lived per-tab draft once and never stores untouched account prefills", () => {
  const form = { ...blank, email: "manual@example.test", address: "10 Example Street" };
  const draft = { form, touched: { ...untouched, email: true } };
  saveCheckoutReturnDraft(draft);
  expect(readCheckoutReturnDraft()).toEqual(draft);
  expect(readCheckoutReturnDraft()).toEqual(draft);
  saveCheckoutReturnDraft(draft);
  clearCheckoutReturnDraft();
  expect(readCheckoutReturnDraft()).toBeNull();
});
