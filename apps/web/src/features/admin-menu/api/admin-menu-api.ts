import { apiFetch } from "@/lib/api-fetch";

import type {
  AdminCategoriesQuery,
  AdminCategoriesResponse,
  AdminCategoryListItem,
  CreateAdminCategoryRequest,
  QueryParameterValue,
  ReorderAdminCategoriesRequest,
  UpdateAdminCategoryAvailabilityParameters,
  UpdateAdminCategoryParameters,
} from "../types/admin-category.types";
import type {
  AdminProductDetail,
  AdminProductsQuery,
  AdminProductsResponse,
} from "../types/admin-product.types";

function buildQueryString(parameters: Record<string, QueryParameterValue>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export function getAdminCategories(query: AdminCategoriesQuery = {}) {
  const queryString = buildQueryString({
    search: query.search?.trim(),
    status: query.status,
  });

  return apiFetch<AdminCategoriesResponse>(
    `/admin/menu/categories${queryString}`,
    {
      auth: "required",
    },
  );
}

export function reorderAdminCategories(request: ReorderAdminCategoriesRequest) {
  return apiFetch<AdminCategoriesResponse>("/admin/menu/categories/reorder", {
    method: "PATCH",
    auth: "required",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
}

export function getAdminProducts(query: AdminProductsQuery = {}) {
  const queryString = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search?.trim(),
    categoryId: query.categoryId,
    availability: query.availability,
  });

  return apiFetch<AdminProductsResponse>(`/admin/menu/products${queryString}`, {
    auth: "required",
  });
}

export function getAdminProduct(productId: string) {
  return apiFetch<AdminProductDetail>(
    `/admin/menu/products/${encodeURIComponent(productId)}`,
    {
      auth: "required",
    },
  );
}

export function createAdminCategory(request: CreateAdminCategoryRequest) {
  return apiFetch<AdminCategoryListItem>("/admin/menu/categories", {
    method: "POST",
    auth: "required",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
}

export function updateAdminCategory({
  categoryId,
  request,
}: UpdateAdminCategoryParameters) {
  return apiFetch<AdminCategoryListItem>(
    `/admin/menu/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      auth: "required",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );
}

export function updateAdminCategoryAvailability({
  categoryId,
  request,
}: UpdateAdminCategoryAvailabilityParameters) {
  return apiFetch<AdminCategoryListItem>(
    `/admin/menu/categories/${encodeURIComponent(categoryId)}/availability`,
    {
      method: "PATCH",
      auth: "required",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );
}

export function archiveAdminCategory(categoryId: string) {
  return apiFetch<AdminCategoryListItem>(
    `/admin/menu/categories/${encodeURIComponent(categoryId)}/archive`,
    {
      method: "PATCH",
      auth: "required",
    },
  );
}
