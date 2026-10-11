"use client";

import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
};
export function useLocationHash() {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => "");
}

export function navigateAccountSection(event: { preventDefault: () => void; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }, pathname: string, href: string) {
  if (pathname !== "/account" || !["/account#profile", "/account#security"].includes(href)
    || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const hash = href.slice(href.indexOf("#"));
  // Native hash navigation emits hashchange and preserves browser history/drafts.
  window.location.hash = hash;
  requestAnimationFrame(() => {
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    document.getElementById(`${hash.slice(1)}-heading`)?.focus({ preventScroll: true });
  });
}
