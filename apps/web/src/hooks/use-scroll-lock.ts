import { useEffect } from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";

export function useScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    if (lockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      }
    };
  }, [isLocked]);
}
