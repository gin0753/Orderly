import Image from "next/image";
import type { ButtonHTMLAttributes } from "react";

export function GoogleLogo() {
  return <Image src="/images/brand/google-g.png" unoptimized width={20} height={20} alt="" aria-hidden="true" className="size-5 shrink-0 bg-white" />;
}

// Unmodified pre-approved Google PNG: no font download, SDK or remote asset request.
export function GoogleAuthButton({ busy, disabled, onClick }: Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "onClick"> & { busy: boolean }) {
  return <><button type="button" disabled={disabled} onClick={onClick} aria-label={busy ? "Connecting to Google…" : "Continue with Google"}
    aria-busy={busy} className="mt-5 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[4px] bg-white transition-shadow duration-[var(--motion-feedback)] hover:shadow-[var(--shadow-surface)] disabled:cursor-not-allowed disabled:opacity-50">
    <Image src="/images/brand/google-sign-in-light.png" unoptimized alt="" width={180} height={40} className="h-auto w-[180px] max-w-full" />
  </button>{busy ? <p role="status" className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">Connecting to Google…</p> : null}</>;
}
