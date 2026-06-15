import { SiteHeader } from "@/components/layout/site-header";
import { CartDrawer } from "@/features/cart/components/cart-drawer/cart-drawer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      {children}
      <CartDrawer />
    </>
  );
}
