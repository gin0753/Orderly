import type { ReactNode } from "react";
import { CustomerRouteGuard } from "@/features/customer-auth/components/customer-route-guard";
import { AccountNavigation } from "@/features/customer-auth/components/account-navigation";
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <CustomerRouteGuard><div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-10">
    <div className="mb-6 lg:mb-0"><AccountNavigation /></div><div className="min-w-0">{children}</div>
  </div></CustomerRouteGuard>;
}
