import type { Metadata } from "next";
import { RegistrationVerification } from "@/features/customer-auth/components/registration-verification";

export const metadata: Metadata = { title: "Verify email | Orderly", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function VerifyEmailPage() { return <RegistrationVerification />; }
