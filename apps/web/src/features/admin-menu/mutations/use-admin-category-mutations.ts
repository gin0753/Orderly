"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  archiveAdminCategory,
  createAdminCategory,
  updateAdminCategory,
  updateAdminCategoryAvailability,
} from "../api/admin-menu-api";
import { adminMenuQueryKeys } from "../queries/admin-menu-query-keys";

async function invalidateCategoryDependencies(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: adminMenuQueryKeys.categories(),
    }),
    queryClient.invalidateQueries({
      queryKey: adminMenuQueryKeys.products(),
    }),
  ]);
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminCategory,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminMenuQueryKeys.categories(),
      });
    },
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminCategory,

    onSuccess: async () => {
      await invalidateCategoryDependencies(queryClient);
    },
  });
}

export function useUpdateAdminCategoryAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminCategoryAvailability,

    onSuccess: async () => {
      await invalidateCategoryDependencies(queryClient);
    },
  });
}

export function useArchiveAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveAdminCategory,

    onSuccess: async () => {
      await invalidateCategoryDependencies(queryClient);
    },
  });
}
