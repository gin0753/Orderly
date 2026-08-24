import type { CartItem } from "@/features/cart/cart-types";

import type { CreateOrderRequest } from "./api/create-order";
import type { CheckoutFormState } from "./checkout-types";

type BuildCreateOrderRequestParams = {
  form: CheckoutFormState;
  cartItems: CartItem[];
};

export function buildCreateOrderRequest({
  form,
  cartItems,
}: BuildCreateOrderRequestParams): CreateOrderRequest {
  return {
    fulfillmentType: form.fulfillmentType === "pickup" ? "PICKUP" : "DELIVERY",

    customer: {
      name: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    },

    address:
      form.fulfillmentType === "delivery"
        ? {
            addressLine1: form.address.trim(),
            addressLine2: form.apartment.trim() || undefined,
            city: form.city.trim(),
            state: form.state.trim(),
            postcode: form.postcode.trim(),
          }
        : undefined,

    notes: form.orderNotes.trim() || undefined,

    items: cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedOptionIds: [
        ...new Set(item.selectedOptions.map((option) => option.id)),
      ],
    })),
  };
}
