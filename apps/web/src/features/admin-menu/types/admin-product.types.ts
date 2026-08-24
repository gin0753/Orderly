import type { AdminMenuPaginatedResponse } from "./admin-menu.types";

export const PRODUCT_OPTION_GROUP_KIND = {
  SIZE: "SIZE",
  MODIFIER: "MODIFIER",
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

export type AdminProductAvailabilityFilter = "AVAILABLE" | "UNAVAILABLE";

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

export interface AdminProductCategoryFilterOption {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateAdminProductOptionRequest {
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
  isDefault: boolean;
}

export interface CreateAdminProductOptionGroupRequest {
  name: string;
  kind: ProductOptionGroupKind;
  type: OptionGroupType;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: CreateAdminProductOptionRequest[];
}

export interface UpdateAdminProductOptionRequest extends CreateAdminProductOptionRequest {
  id?: string;
}

export interface UpdateAdminProductOptionGroupRequest extends Omit<
  CreateAdminProductOptionGroupRequest,
  "options"
> {
  id?: string;
  options: UpdateAdminProductOptionRequest[];
}

export interface CreateAdminProductRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  basePriceCents: number;
  optionGroups: CreateAdminProductOptionGroupRequest[];
}

export interface UpdateAdminProductRequest {
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  basePriceCents: number;
  optionGroups: UpdateAdminProductOptionGroupRequest[];
}

export interface UpdateAdminProductParameters {
  productId: string;
  request: UpdateAdminProductRequest;
}

export interface AdminContentSuggestionRequest {
  name: string;
  categoryName: string;
  description?: string;
}

export interface AdminContentSuggestionResponse {
  description: string;
}
