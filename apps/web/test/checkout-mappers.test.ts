import { buildCreateOrderRequest } from "@/features/checkout/checkout-mappers";
import type { CheckoutFormState } from "@/features/checkout/checkout-types";
import type { CartItem } from "@/features/cart/cart-types";

const baseForm: CheckoutFormState = {
  fulfillmentType: "delivery",
  fullName: "  Taylor Guest  ",
  phone: "  0400 000 000  ",
  email: "  taylor@example.com  ",
  address: "  1 Main Street  ",
  apartment: "   ",
  city: "  Sydney  ",
  state: "  NSW  ",
  postcode: "  2000  ",
  orderNotes: "  Ring the bell  ",
};

const cartItems: CartItem[] = [
  {
    key: "pizza:size-large",
    product: { id: "product-1", name: "Pizza", priceCents: 1400 },
    selectedOptions: [
      {
        id: "option-1",
        optionGroupId: "group-1",
        optionGroupName: "Size",
        kind: "SIZE",
        name: "Large",
        priceDeltaCents: 400,
      },
      {
        id: "option-1",
        optionGroupId: "group-1",
        optionGroupName: "Size",
        kind: "SIZE",
        name: "Large",
        priceDeltaCents: 400,
      },
    ],
    quantity: 2,
    unitPriceCents: 1800,
  },
];

describe("buildCreateOrderRequest", () => {
  it("normalizes delivery details and maps cart selections without UI prices", () => {
    expect(buildCreateOrderRequest({ form: baseForm, cartItems })).toEqual({
      fulfillmentType: "DELIVERY",
      customer: {
        name: "Taylor Guest",
        phone: "0400 000 000",
        email: "taylor@example.com",
      },
      address: {
        addressLine1: "1 Main Street",
        addressLine2: undefined,
        city: "Sydney",
        state: "NSW",
        postcode: "2000",
      },
      notes: "Ring the bell",
      items: [
        {
          productId: "product-1",
          quantity: 2,
          selectedOptionIds: ["option-1"],
        },
      ],
    });
  });

  it("omits delivery address and blank notes for pickup", () => {
    const request = buildCreateOrderRequest({
      form: { ...baseForm, fulfillmentType: "pickup", orderNotes: "  " },
      cartItems,
    });

    expect(request.fulfillmentType).toBe("PICKUP");
    expect(request.address).toBeUndefined();
    expect(request.notes).toBeUndefined();
  });
});
