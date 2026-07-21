import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import {
  getAdminCategories,
  getAdminProduct,
  getAdminProducts,
} from "../api/admin-menu-api";
import type { AdminCategoriesQuery } from "../types/admin-category.types";
import type { AdminProductsQuery } from "../types/admin-product.types";
import {
  adminMenuQueryKeys,
  normalizeAdminCategoriesQuery,
  normalizeAdminProductsQuery,
} from "./admin-menu-query-keys";

export const adminMenuQueryOptions = {
  categories(query: AdminCategoriesQuery = {}) {
    const normalizedQuery = normalizeAdminCategoriesQuery(query);

    return queryOptions({
      queryKey: adminMenuQueryKeys.categoryList(normalizedQuery),
      queryFn: () => getAdminCategories(normalizedQuery),
    });
  },

  products(query: AdminProductsQuery = {}) {
    const normalizedQuery = normalizeAdminProductsQuery(query);

    return queryOptions({
      queryKey: adminMenuQueryKeys.productList(normalizedQuery),
      queryFn: () => getAdminProducts(normalizedQuery),
      placeholderData: keepPreviousData,
    });
  },

  product(productId: string) {
    return queryOptions({
      queryKey: adminMenuQueryKeys.productDetail(productId),
      queryFn: () => getAdminProduct(productId),
    });
  },
};
