"use client";

import { useMutation } from "@tanstack/react-query";

import { createAdminContentSuggestion } from "../api/admin-menu-api";

export function useAdminContentSuggestion() {
  return useMutation({
    mutationFn: createAdminContentSuggestion,
  });
}
