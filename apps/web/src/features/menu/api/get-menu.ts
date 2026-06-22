import { apiFetch } from "@/lib/api-fetch";
import type { MenuResponse } from "../types";

export function getMenu() {
  return apiFetch<MenuResponse>("/menu");
}
