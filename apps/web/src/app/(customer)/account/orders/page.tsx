import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomerOrdersPage } from "@/features/customer-orders/customer-orders-page";

export const metadata: Metadata = { title: "Your orders" };
export default function OrdersPage() {
  return <Suspense fallback={<div role="status" className="mx-auto max-w-5xl px-4 py-12">Loading your orders…</div>}><CustomerOrdersPage /></Suspense>;
}
