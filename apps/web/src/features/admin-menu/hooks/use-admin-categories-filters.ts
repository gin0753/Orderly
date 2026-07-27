"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type { AdminCategoryStatusFilter } from "../types/admin-category.types";

const SEARCH_DEBOUNCE_MS = 300;

type SearchParameterValue = string | null | undefined;

function parseStatus(
  value: string | null,
): AdminCategoryStatusFilter | undefined {
  return value === "active" || value === "inactive" || value === "archived"
    ? value
    : undefined;
}

export function useAdminCategoriesFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search")?.trim() ?? "";
  const status = parseStatus(searchParams.get("status"));
  const [searchInput, setSearchInputState] = useState(() => search);

  const normalizedSearchInput = searchInput.trim();

  const debouncedSearch = useDebouncedValue(
    normalizedSearchInput,
    SEARCH_DEBOUNCE_MS,
  );

  const updateSearchParams = useCallback(
    (updates: Record<string, SearchParameterValue>) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") {
          nextSearchParams.delete(key);
          continue;
        }

        nextSearchParams.set(key, value);
      }

      const queryString = nextSearchParams.toString();

      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === search) {
      return;
    }

    updateSearchParams({
      search: debouncedSearch || null,
    });
  }, [debouncedSearch, search, updateSearchParams]);

  const setSearchInput = useCallback((value: string) => {
    setSearchInputState(value);
  }, []);

  const setStatus = useCallback(
    (nextStatus: AdminCategoryStatusFilter | undefined) => {
      updateSearchParams({
        status: nextStatus,
      });
    },
    [updateSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchInputState("");

    updateSearchParams({
      search: null,
      status: null,
    });
  }, [updateSearchParams]);

  return {
    search,
    searchInput,
    status,

    hasActiveFilters: Boolean(normalizedSearchInput || status),

    setSearchInput,
    setStatus,
    resetFilters,
  };
}
