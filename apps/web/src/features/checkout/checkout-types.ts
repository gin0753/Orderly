export type FulfillmentType = "pickup" | "delivery";

export type CheckoutFormState = {
  fulfillmentType: FulfillmentType;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  postcode: string;
  orderNotes: string;
};

export type CheckoutFieldErrors = Partial<
  Record<keyof CheckoutFormState, string>
>;
