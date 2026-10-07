import type { Metadata } from "next";

import { CheckoutPageClient } from "@/features/checkout/components/checkout-page-client";
import { getMenu } from "@/features/menu/api/get-menu";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Orderly Kitchen order.",
};

export default async function CheckoutPage() {
  const menu = await getMenu();

  return (
    <CheckoutPageClient
      initialIsAcceptingOrders={menu.store?.isAcceptingOrders ?? false}
    />
  );
}
