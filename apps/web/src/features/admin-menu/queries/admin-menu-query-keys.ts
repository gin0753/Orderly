import {
  ADMIN_MENU_DEFAULT_PAGE,
  ADMIN_MENU_DEFAULT_PAGE_SIZE,
} from "../types/admin-menu.types";
import type { AdminCategoriesQuery } from "../types/admin-category.types";
import type { AdminProductsQuery } from "../types/admin-product.types";

export function normalizeAdminCategoriesQuery(
  query: AdminCategoriesQuery = {},
) {
  const search = query.search?.trim();

  return {
    page: query.page ?? ADMIN_MENU_DEFAULT_PAGE,
    pageSize: query.pageSize ?? ADMIN_MENU_DEFAULT_PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
}

export function normalizeAdminProductsQuery(query: AdminProductsQuery = {}) {
  const search = query.search?.trim();

  return {
    page: query.page ?? ADMIN_MENU_DEFAULT_PAGE,
    pageSize: query.pageSize ?? ADMIN_MENU_DEFAULT_PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.availability ? { availability: query.availability } : {}),
  };
}

export const adminMenuQueryKeys = {
  all: ["admin-menu"] as const,

  categories: () => [...adminMenuQueryKeys.all, "categories"] as const,

  categoryLists: () => [...adminMenuQueryKeys.categories(), "list"] as const,

  categoryList: (query: ReturnType<typeof normalizeAdminCategoriesQuery>) =>
    [...adminMenuQueryKeys.categoryLists(), query] as const,

  products: () => [...adminMenuQueryKeys.all, "products"] as const,

  productLists: () => [...adminMenuQueryKeys.products(), "list"] as const,

  productList: (query: ReturnType<typeof normalizeAdminProductsQuery>) =>
    [...adminMenuQueryKeys.productLists(), query] as const,

  productDetails: () => [...adminMenuQueryKeys.products(), "detail"] as const,

  productDetail: (productId: string) =>
    [...adminMenuQueryKeys.productDetails(), productId] as const,
};
