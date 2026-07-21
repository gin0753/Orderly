"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type { AdminCategoryStatusFilter } from "../types/admin-category.types";

const SEARCH_DEBOUNCE_MS = 300;

type SearchParamValue = string | null | undefined;

function parseStatus(
  value: string | null,
): AdminCategoryStatusFilter | undefined {
  return value === "active" || value === "inactive" ? value : undefined;
}

export function useAdminCategoriesFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInput = searchParams.get("search") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);

  const updateSearchParams = useCallback(
    (updates: Record<string, SearchParamValue>) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") {
          nextSearchParams.delete(key);
        } else {
          nextSearchParams.set(key, value);
        }
      }

      const queryString = nextSearchParams.toString();

      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSearchInput = useCallback(
    (value: string) => {
      updateSearchParams({
        search: value || null,
      });
    },
    [updateSearchParams],
  );

  const setStatus = useCallback(
    (nextStatus: AdminCategoryStatusFilter | undefined) => {
      updateSearchParams({
        status: nextStatus,
      });
    },
    [updateSearchParams],
  );

  const resetFilters = useCallback(() => {
    updateSearchParams({
      search: null,
      status: null,
    });
  }, [updateSearchParams]);

  return {
    search,
    searchInput,
    status,
    hasActiveFilters: Boolean(searchInput.trim() || status),
    setSearchInput,
    setStatus,
    resetFilters,
  };
}
