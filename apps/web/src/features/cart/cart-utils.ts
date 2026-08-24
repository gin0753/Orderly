import {
  CartItem,
  CartProductSnapshot,
  CartSelectedOption,
} from "./cart-types";

export function buildCartItemKey(params: {
  productId: string;
  selectedOptionIds: string[];
}) {
  const sortedOptionIds = [...new Set(params.selectedOptionIds)].sort();

  return [params.productId, sortedOptionIds.join("-") || "no-options"].join(
    "__",
  );
}

export function getUnitPriceCents(params: {
  product: CartProductSnapshot;
  selectedOptions: CartSelectedOption[];
}) {
  const optionPriceDeltaCents = params.selectedOptions.reduce(
    (total, option) => total + option.priceDeltaCents,
    0,
  );

  return Math.max(0, params.product.priceCents + optionPriceDeltaCents);
}

export function createCartItem(params: {
  product: CartProductSnapshot;
  selectedOptions: CartSelectedOption[];
  quantity: number;
}): CartItem {
  const selectedOptionIds = params.selectedOptions.map((option) => option.id);

  return {
    key: buildCartItemKey({
      productId: params.product.id,
      selectedOptionIds,
    }),
    product: params.product,
    selectedOptions: params.selectedOptions,
    quantity: params.quantity,
    unitPriceCents: getUnitPriceCents({
      product: params.product,
      selectedOptions: params.selectedOptions,
    }),
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

export function getCartItemSize(item: CartItem) {
  return item.selectedOptions.find((option) => option.kind === "SIZE");
}

export function getCartItemModifiers(item: CartItem) {
  return item.selectedOptions.filter((option) => option.kind === "MODIFIER");
}

export function getCartItemAddOns(item: CartItem) {
  return item.selectedOptions.filter((option) => option.kind === "ADD_ON");
}

export function getCartItemOptionSummary(item: CartItem) {
  return item.selectedOptions.map((option) => option.name).join(" · ");
}
