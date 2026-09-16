import { OrderTrackingResult } from "@/features/order-tracking/components/result/order-tracking-result";

type TrackOrderDetailPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export const metadata = {
  title: "Order Tracking | Orderly",
  description: "Track your Orderly order status.",
};

export default async function TrackOrderDetailPage({
  params,
}: TrackOrderDetailPageProps) {
  const { orderNumber } = await params;

  return <OrderTrackingResult orderNumber={decodeURIComponent(orderNumber)} />;
}
