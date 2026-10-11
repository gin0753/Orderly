/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { CustomerDetailsForm } from "@/features/checkout/components/customer-details-form";
import { DeliveryAddressForm } from "@/features/checkout/components/delivery-address-form";
import { OrderNotesField } from "@/features/checkout/components/order-notes-field";
import type { CheckoutFormState } from "@/features/checkout/checkout-types";

const form: CheckoutFormState = {
  fulfillmentType: "delivery", fullName: "", phone: "", email: "", address: "", apartment: "",
  city: "", state: "", postcode: "", orderNotes: "",
};

it("names optional notes and associates its instructions and character limit", () => {
  render(<OrderNotesField form={form} onChange={jest.fn()} />);
  const notes = screen.getByRole("textbox", { name: "Order notes" });
  expect(notes).toHaveAccessibleDescription(/special instructions.*0\/200 characters/);
  expect(notes).toHaveAttribute("maxlength", "200");
});

it("keeps contact names stable and associates each invalid field with its own error", () => {
  const onChange = jest.fn();
  const { rerender } = render(<CustomerDetailsForm form={form} errors={{ fullName: "Enter your name", phone: "Enter your phone", email: "Enter your email" }} onChange={onChange} />);
  for (const [label, error] of [["Full name", "Enter your name"], ["Phone number", "Enter your phone"], ["Email address", "Enter your email"]]) {
    const field = screen.getByRole("textbox", { name: label });
    expect(field).toHaveAccessibleDescription(error);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(label).closest("label")).toHaveAttribute("for", field.id);
  }
  rerender(<CustomerDetailsForm form={form} errors={{}} onChange={onChange} />);
  for (const field of screen.getAllByRole("textbox")) {
    expect(field).not.toHaveAttribute("aria-describedby");
    expect(field).toHaveAttribute("aria-invalid", "false");
  }
});

it("associates address and select errors without adding errors to their accessible names", () => {
  render(<DeliveryAddressForm form={form} errors={{ address: "Enter an address", city: "Enter a city", state: "Choose a state", postcode: "Enter a postcode" }} onChange={jest.fn()} disabled={false} />);
  for (const [label, error] of [["Address", "Enter an address"], ["City", "Enter a city"], ["State", "Choose a state"], ["Postcode", "Enter a postcode"]]) {
    const field = screen.getByLabelText(label, { exact: true });
    expect(field).toHaveAccessibleName(label);
    expect(field).toHaveAccessibleDescription(error);
    expect(field).toHaveAttribute("aria-invalid", "true");
  }
  expect(screen.getByLabelText("Apt, suite, etc. optional")).not.toHaveAttribute("aria-invalid", "true");
});

it("keeps field IDs unique when form sections render more than once", () => {
  render(<><CustomerDetailsForm form={form} errors={{ fullName: "Required" }} onChange={jest.fn()} /><CustomerDetailsForm form={form} errors={{ fullName: "Required" }} onChange={jest.fn()} /></>);
  const fields = screen.getAllByRole("textbox", { name: "Full name" });
  expect(fields[0].id).not.toBe(fields[1].id);
  expect(fields[0].getAttribute("aria-describedby")).not.toBe(fields[1].getAttribute("aria-describedby"));
});
