import { OrderTrackingResult } from "@/features/order-tracking/components/result/order-tracking-result";

type TrackOrderDetailPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export const metadata = {
  title: "Order tracking",
  description: "View the latest status of your Orderly Kitchen order.",
};

export default async function TrackOrderDetailPage({
  params,
}: TrackOrderDetailPageProps) {
  const { orderNumber } = await params;

  return <OrderTrackingResult orderNumber={decodeURIComponent(orderNumber)} />;
}
