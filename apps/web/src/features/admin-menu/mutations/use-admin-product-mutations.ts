"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createAdminProduct, updateAdminProduct } from "../api/admin-menu-api";
import { adminMenuQueryKeys } from "../queries/admin-menu-query-keys";

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminProduct,

    onSuccess: async (product) => {
      queryClient.setQueryData(
        adminMenuQueryKeys.productDetail(product.id),
        product,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminMenuQueryKeys.products(),
        }),
        queryClient.invalidateQueries({
          queryKey: adminMenuQueryKeys.categories(),
        }),
      ]);
    },
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminProduct,

    onSuccess: async (product) => {
      queryClient.setQueryData(
        adminMenuQueryKeys.productDetail(product.id),
        product,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminMenuQueryKeys.productLists(),
        }),
        queryClient.invalidateQueries({
          queryKey: adminMenuQueryKeys.categories(),
        }),
      ]);
    },
  });
}
