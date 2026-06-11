export type CartProductSnapshot = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
};

export type CartSelectedSize = "small" | "medium" | "large";

export type CartAddOn = {
  id: string;
  name: string;
  priceDeltaCents: number;
};

export type CartItem = {
  key: string;
  product: CartProductSnapshot;
  selectedSize: CartSelectedSize;
  selectedAddOns: CartAddOn[];
  quantity: number;
  unitPriceCents: number;
};

export type CartState = {
  items: CartItem[];
  isCartOpen: boolean;
  hasHydrated: boolean;
};
