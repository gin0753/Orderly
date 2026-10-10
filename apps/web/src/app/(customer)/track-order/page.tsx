import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { OrderLookupForm } from "@/features/order-tracking/components/lookup/order-lookup-form";

export const metadata = { title: "Track order", description: "View the latest status of your Orderly Kitchen order." };
type TrackOrderPageProps = { searchParams: Promise<{ orderNumber?: string }> };

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const params = await searchParams;
  return <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
    <div className="mb-6 max-w-xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand-text)]">Guest order tracking</p>
      <h1 className="text-[length:var(--text-page-title)] font-bold leading-[var(--leading-page-title)] tracking-tight">Check your order status</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">Enter your order number and the email or phone number used at checkout to view your latest order status.</p>
    </div>
    <div className="grid items-start gap-6 md:grid-cols-[1.2fr_1fr]">
      <Card variant="surface" className="p-5 sm:p-8">
        <h2 className="text-xl font-bold">Find your order</h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Your order number is shown on the confirmation page after checkout.</p>
        <OrderLookupForm initialOrderNumber={params.orderNumber ?? ""} />
      </Card>
      <aside className="space-y-5 p-2 md:p-5">
        <div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-[var(--color-brand-text)]" /><div><h2 className="font-semibold">Your order stays private</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">We only show orders that match your contact detail.</p></div></div>
        <div className="border-t border-[var(--color-border)] pt-5"><h2 className="font-semibold">Ordered while signed in?</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Find your signed-in orders in your account. Guest orders remain available here.</p><Link href="/account/orders" className={buttonStyles({ variant: "secondary", className: "mt-4" })}>Order history</Link></div>
      </aside>
    </div>
  </div>;
}
