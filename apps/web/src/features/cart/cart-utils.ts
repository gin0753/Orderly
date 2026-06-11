import {
  CartAddOn,
  CartItem,
  CartProductSnapshot,
  CartSelectedSize,
} from "./cart-types";

export const PRODUCT_SIZE_OPTIONS: {
  id: CartSelectedSize;
  label: string;
  caption: string;
  priceDeltaCents: number;
}[] = [
  {
    id: "small",
    label: "Small",
    caption: "10”",
    priceDeltaCents: -100,
  },
  {
    id: "medium",
    label: "Medium",
    caption: "12”",
    priceDeltaCents: 0,
  },
  {
    id: "large",
    label: "Large",
    caption: "14”",
    priceDeltaCents: 200,
  },
];

export const PRODUCT_ADD_ON_OPTIONS: CartAddOn[] = [
  {
    id: "extra-cheese",
    name: "Extra Cheese",
    priceDeltaCents: 200,
  },
  {
    id: "olives",
    name: "Olives",
    priceDeltaCents: 150,
  },
  {
    id: "mushrooms",
    name: "Mushrooms",
    priceDeltaCents: 150,
  },
];

export function buildCartItemKey(params: {
  productId: string;
  selectedSize: CartSelectedSize;
  selectedAddOnIds: string[];
}) {
  const sortedAddOnIds = [...params.selectedAddOnIds].sort();

  return [
    params.productId,
    params.selectedSize,
    sortedAddOnIds.join("-") || "no-addons",
  ].join("__");
}

export function getUnitPriceCents(params: {
  product: CartProductSnapshot;
  selectedSize: CartSelectedSize;
  selectedAddOns: CartAddOn[];
}) {
  const sizeOption = PRODUCT_SIZE_OPTIONS.find(
    (option) => option.id === params.selectedSize,
  );

  const sizeDeltaCents = sizeOption?.priceDeltaCents ?? 0;

  const addOnsDeltaCents = params.selectedAddOns.reduce(
    (total, addOn) => total + addOn.priceDeltaCents,
    0,
  );

  return Math.max(
    0,
    params.product.priceCents + sizeDeltaCents + addOnsDeltaCents,
  );
}

export function createCartItem(params: {
  product: CartProductSnapshot;
  selectedSize: CartSelectedSize;
  selectedAddOns: CartAddOn[];
  quantity: number;
}): CartItem {
  const unitPriceCents = getUnitPriceCents({
    product: params.product,
    selectedSize: params.selectedSize,
    selectedAddOns: params.selectedAddOns,
  });

  return {
    key: buildCartItemKey({
      productId: params.product.id,
      selectedSize: params.selectedSize,
      selectedAddOnIds: params.selectedAddOns.map((addOn) => addOn.id),
    }),
    product: params.product,
    selectedSize: params.selectedSize,
    selectedAddOns: params.selectedAddOns,
    quantity: params.quantity,
    unitPriceCents,
  };
}

export function getCartSubtotalCents(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0,
  );
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSizeLabel(size: CartSelectedSize) {
  const option = PRODUCT_SIZE_OPTIONS.find((option) => option.id === size);

  if (!option) {
    return size;
  }

  return `${option.label} ${option.caption}`;
}
