import { SiteHeader } from "@/components/layout/site-header";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { Providers } from "./providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orderly",
  description: "Production-grade restaurant ordering platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          {children}
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
