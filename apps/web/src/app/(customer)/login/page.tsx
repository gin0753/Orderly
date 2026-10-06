import { Suspense } from "react";
import { CustomerAuthForm } from "@/features/customer-auth/components/customer-auth-form";

export const metadata = { title: "Sign in | Orderly" };
export default function LoginPage() {
  return <Suspense fallback={<p role="status" className="p-6 text-center">Loading sign in…</p>}><CustomerAuthForm mode="login" /></Suspense>;
}
