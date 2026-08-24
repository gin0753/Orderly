import type {
  ProductOptionGroupKind,
  OptionGroupType,
} from "./admin-product.types";

export interface AdminProductOptionFormValues {
  id?: string;
  name: string;
  priceDelta: string;
  isAvailable: boolean;
  isDefault: boolean;
}

export interface AdminProductOptionGroupFormValues {
  id?: string;
  name: string;
  kind: ProductOptionGroupKind;
  type: OptionGroupType;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: AdminProductOptionFormValues[];
}

export interface AdminProductFormValues {
  name: string;
  description: string;
  categoryId: string;
  basePrice: string;
  imageUrl: string;
  optionGroups: AdminProductOptionGroupFormValues[];
}
