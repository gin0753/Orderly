"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminAiCapability } from "../api/admin-menu-api";

export function useAdminAiAvailability() {
  const enabled = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === "true";
  const capability = useQuery({
    queryKey: ["admin-menu", "ai-capability"],
    queryFn: getAdminAiCapability,
    enabled,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  return enabled && capability.isSuccess && capability.data?.available === true;
}
