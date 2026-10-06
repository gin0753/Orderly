import type { ReactNode } from "react";
import { CustomerRouteGuard } from "@/features/customer-auth/components/customer-route-guard";
export default function AccountLayout({ children }: { children: ReactNode }) { return <CustomerRouteGuard>{children}</CustomerRouteGuard>; }
