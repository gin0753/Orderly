import type { Metadata } from "next";
import { CustomerOrderDetailPage } from "@/features/customer-orders/customer-order-detail-page";

export const metadata: Metadata = { title: "Order details" };
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerOrderDetailPage orderId={id} />;
}
