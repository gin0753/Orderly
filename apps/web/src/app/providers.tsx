"use client";

import { ReactNode } from "react";

import { StoreProvider } from "@/store/store-provider";

export function Providers({ children }: { children: ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
