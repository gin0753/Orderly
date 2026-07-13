export type MenuOptionGroupKind = "SIZE" | "MODIFIER" | "ADD_ON";

export type MenuOptionGroupType = "SINGLE" | "MULTIPLE";

export type MenuProductOption = {
  id: string;
  name: string;
  priceDelta: string;
  priceDeltaCents: number;
  isAvailable: boolean;
  isDefault: boolean;
};

export type MenuProductOptionGroup = {
  id: string;
  name: string;
  kind: MenuOptionGroupKind;
  type: MenuOptionGroupType;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: MenuProductOption[];
};

export type MenuProduct = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  isAvailable: boolean;
  optionGroups: MenuProductOptionGroup[];
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  products: MenuProduct[];
};

export type MenuStore = {
  name: string;
  isAcceptingOrders: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  estimatedPreparationMinutes: number;
  deliveryFee: string;
  minimumOrderAmount: string;
};

export type MenuResponse = {
  store: MenuStore | null;
  categories: MenuCategory[];
};
