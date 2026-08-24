"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type { AdminProductAvailabilityFilter } from "../types/admin-product.types";

const SEARCH_DEBOUNCE_MS = 300;

type SearchParameterValue = string | number | null | undefined;

function parsePage(value: string | null) {
  if (!value) {
    return 1;
  }

  const parsedPage = Number.parseInt(value, 10);

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function parseAvailability(
  value: string | null,
): AdminProductAvailabilityFilter | undefined {
  return value === "AVAILABLE" || value === "UNAVAILABLE" ? value : undefined;
}

export function useAdminProductsFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));
  const search = searchParams.get("search")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") || undefined;
  const availability = parseAvailability(searchParams.get("availability"));

  const [searchInput, setSearchInput] = useState(() => search);

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

        nextSearchParams.set(key, String(value));
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
      page: null,
    });
  }, [debouncedSearch, search, updateSearchParams]);

  const setCategoryId = useCallback(
    (nextCategoryId: string | undefined) => {
      updateSearchParams({
        categoryId: nextCategoryId,
        page: null,
      });
    },
    [updateSearchParams],
  );

  const setAvailability = useCallback(
    (nextAvailability: AdminProductAvailabilityFilter | undefined) => {
      updateSearchParams({
        availability: nextAvailability,
        page: null,
      });
    },
    [updateSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      updateSearchParams({
        page: nextPage > 1 ? nextPage : null,
      });
    },
    [updateSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchInput("");

    updateSearchParams({
      categoryId: null,
      availability: null,
      page: null,
    });
  }, [updateSearchParams]);

  return {
    page,
    search,
    searchInput,
    categoryId,
    availability,

    hasActiveFilters: Boolean(
      normalizedSearchInput || categoryId || availability,
    ),

    setSearchInput,
    setCategoryId,
    setAvailability,
    setPage,
    resetFilters,
  };
}
