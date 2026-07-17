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
