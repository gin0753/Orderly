import type { AdminMenuPaginatedResponse } from "./admin-menu.types";

export const PRODUCT_OPTION_GROUP_KIND = {
  SIZE: "SIZE",
  ADD_ON: "ADD_ON",
} as const;

export type ProductOptionGroupKind =
  (typeof PRODUCT_OPTION_GROUP_KIND)[keyof typeof PRODUCT_OPTION_GROUP_KIND];

export const OPTION_GROUP_TYPE = {
  SINGLE: "SINGLE",
  MULTIPLE: "MULTIPLE",
} as const;

export type OptionGroupType =
  (typeof OPTION_GROUP_TYPE)[keyof typeof OPTION_GROUP_TYPE];

export type AdminProductAvailabilityFilter = "available" | "unavailable";

export interface AdminProductsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  availability?: AdminProductAvailabilityFilter;
}

export interface AdminProductCategorySummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface AdminProductListItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  isAvailable: boolean;
  sortOrder: number;
  category: AdminProductCategorySummary;
  optionGroupCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductOption {
  id: string;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface AdminProductOptionGroup {
  id: string;
  name: string;
  kind: ProductOptionGroupKind;
  type: OptionGroupType;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  sortOrder: number;
  options: AdminProductOption[];
}

export interface AdminProductDetail {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  isAvailable: boolean;
  sortOrder: number;
  category: AdminProductCategorySummary;
  optionGroups: AdminProductOptionGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductsSummary {
  total: number;
  available: number;
  unavailable: number;
}

export type AdminProductsResponse = AdminMenuPaginatedResponse<
  AdminProductListItem,
  AdminProductsSummary
>;
