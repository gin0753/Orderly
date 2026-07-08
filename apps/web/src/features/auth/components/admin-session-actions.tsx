"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  logoutAdmin,
  selectAuthUser,
  selectIsLoggingOut,
} from "@/features/auth/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";

export function AdminSessionActions() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector(selectAuthUser);
  const isLoggingOut = useAppSelector(selectIsLoggingOut);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, []);

  if (!user) {
    return null;
  }

  async function handleLogout() {
    const result = await dispatch(logoutAdmin());

    if (logoutAdmin.fulfilled.match(result)) {
      setIsOpen(false);
      router.replace("/admin/login");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label="Open administrator menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="cursor-pointer"
      >
        <UserRound className="size-4" />
      </Button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Administrator menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg"
        >
          <div className="border-b border-[var(--color-border-soft)] px-3 py-3">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {user.email}
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Administrator
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full cursor-pointer justify-start"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
