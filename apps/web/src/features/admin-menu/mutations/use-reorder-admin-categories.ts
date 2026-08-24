"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reorderAdminCategories } from "../api/admin-menu-api";
import { adminMenuQueryKeys } from "../queries/admin-menu-query-keys";

export function useReorderAdminCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderAdminCategories,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminMenuQueryKeys.categoryLists(),
      });
    },
  });
}
