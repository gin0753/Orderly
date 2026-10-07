import { Suspense } from "react";
import { CustomerAuthForm } from "@/features/customer-auth/components/customer-auth-form";

export const metadata = { title: "Create account | Orderly" };
export default function RegisterPage() {
  return <Suspense fallback={<p role="status" className="p-6 text-center">Loading registration…</p>}><CustomerAuthForm mode="register" /></Suspense>;
}
