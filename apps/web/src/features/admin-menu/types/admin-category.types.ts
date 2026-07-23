export type QueryParameterValue = string | number | null | undefined;

export type AdminCategoryStatusFilter = "active" | "inactive";

export interface AdminCategoriesQuery {
  search?: string;
  status?: AdminCategoryStatusFilter;
}

export interface AdminCategoryListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoriesSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface AdminCategoriesResponse {
  data: AdminCategoryListItem[];
  summary: AdminCategoriesSummary;
}

export interface ReorderAdminCategoriesRequest {
  categoryIds: string[];
}

export interface ReorderAdminCategoriesRequest {
  categoryIds: string[];
}

export interface CreateAdminCategoryRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateAdminCategoryRequest {
  name?: string;
  description?: string | null;
}

export interface UpdateAdminCategoryAvailabilityRequest {
  isActive: boolean;
}

export interface UpdateAdminCategoryParameters {
  categoryId: string;
  request: UpdateAdminCategoryRequest;
}

export interface UpdateAdminCategoryAvailabilityParameters {
  categoryId: string;
  request: UpdateAdminCategoryAvailabilityRequest;
}
