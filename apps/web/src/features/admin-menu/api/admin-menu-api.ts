import { apiFetch } from "@/lib/api-fetch";

import type {
  AdminCategoriesQuery,
  AdminCategoriesResponse,
  ReorderAdminCategoriesRequest,
} from "../types/admin-category.types";
import type {
  AdminProductDetail,
  AdminProductsQuery,
  AdminProductsResponse,
} from "../types/admin-product.types";

type QueryParameterValue = string | number | null | undefined;

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
