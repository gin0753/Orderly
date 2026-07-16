import type { AdminMenuPaginatedResponse } from "./admin-menu.types";

export type AdminCategoryStatusFilter = "active" | "inactive";

export interface AdminCategoriesQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AdminCategoryStatusFilter;
}

export interface AdminCategoryListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoriesSummary {
  total: number;
  active: number;
  inactive: number;
}

export type AdminCategoriesResponse = AdminMenuPaginatedResponse<
  AdminCategoryListItem,
  AdminCategoriesSummary
>;
