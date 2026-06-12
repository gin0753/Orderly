import type {
  CheckoutFieldErrors,
  CheckoutFormState,
  FulfillmentType,
} from "./checkout-types";

export const DELIVERY_FEE_CENTS = 399;
export const SERVICE_FEE_CENTS = 120;
export const FREE_DELIVERY_THRESHOLD_CENTS = 5000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;
const POSTCODE_PATTERN = /^[A-Za-z0-9\s-]{3,10}$/;

const NAME_PATTERN = /^[\p{L}\p{M}' .-]+$/u;
const HAS_LETTER_PATTERN = /\p{L}/u;
const MAX_NAME_LENGTH = 80;

type RequiredField = {
  key: keyof CheckoutFormState;
  message: string;
};

const CUSTOMER_REQUIRED_FIELDS: RequiredField[] = [
  {
    key: "fullName",
    message: "Full name is required",
  },
  {
    key: "phone",
    message: "Phone number is required",
  },
  {
    key: "email",
    message: "Email address is required",
  },
];

const DELIVERY_REQUIRED_FIELDS: RequiredField[] = [
  {
    key: "address",
    message: "Address is required",
  },
  {
    key: "city",
    message: "City is required",
  },
  {
    key: "state",
    message: "State is required",
  },
  {
    key: "postcode",
    message: "Postcode is required",
  },
];

export function getDeliveryFeeCents(
  subtotalCents: number,
  fulfillmentType: FulfillmentType,
) {
  if (fulfillmentType === "pickup") {
    return 0;
  }

  if (subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS) {
    return 0;
  }

  return DELIVERY_FEE_CENTS;
}

export function getCheckoutTotalCents({
  subtotalCents,
  fulfillmentType,
}: {
  subtotalCents: number;
  fulfillmentType: FulfillmentType;
}) {
  return (
    subtotalCents +
    getDeliveryFeeCents(subtotalCents, fulfillmentType) +
    SERVICE_FEE_CENTS
  );
}

export function getCheckoutFieldErrors(
  form: CheckoutFormState,
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  const requiredFields =
    form.fulfillmentType === "delivery"
      ? [...CUSTOMER_REQUIRED_FIELDS, ...DELIVERY_REQUIRED_FIELDS]
      : CUSTOMER_REQUIRED_FIELDS;

  requiredFields.forEach((field) => {
    const value = form[field.key];

    if (typeof value === "string" && !value.trim()) {
      errors[field.key] = field.message;
    }
  });

  const fullName = form.fullName.trim();

  if (fullName) {
    if (fullName.length < 2) {
      errors.fullName = "Enter your full name";
    } else if (fullName.length > MAX_NAME_LENGTH) {
      errors.fullName = "Name must be 80 characters or fewer";
    } else if (!HAS_LETTER_PATTERN.test(fullName)) {
      errors.fullName = "Name must include at least one letter";
    } else if (!NAME_PATTERN.test(fullName)) {
      errors.fullName =
        "Name can only include letters, spaces, hyphens, apostrophes, and periods";
    }
  }

  const email = form.email.trim();

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address";
  }

  const phone = form.phone.trim();

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a valid phone number";
  }

  const postcode = form.postcode.trim();

  if (
    form.fulfillmentType === "delivery" &&
    postcode &&
    !POSTCODE_PATTERN.test(postcode)
  ) {
    errors.postcode = "Enter a valid postcode";
  }

  return errors;
}

export function hasCheckoutFieldErrors(errors: CheckoutFieldErrors) {
  return Object.keys(errors).length > 0;
}
