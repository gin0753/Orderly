export type CartProductSnapshot = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
};

export type CartOptionGroupKind = "SIZE" | "MODIFIER" | "ADD_ON";

export type CartSelectedOption = {
  id: string;
  optionGroupId: string;
  optionGroupName: string;
  kind: CartOptionGroupKind;
  name: string;
  priceDeltaCents: number;
};

export type CartItem = {
  key: string;
  product: CartProductSnapshot;
  selectedOptions: CartSelectedOption[];
  quantity: number;

  /**
   * Used only for immediate cart UI rendering.
   * The backend recalculates the authoritative price from the database.
   */
  unitPriceCents: number;
};

export type CartState = {
  items: CartItem[];
  isCartOpen: boolean;
  hasHydrated: boolean;
};
