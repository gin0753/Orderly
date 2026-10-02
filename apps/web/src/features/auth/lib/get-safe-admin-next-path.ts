export const DEFAULT_ADMIN_NEXT_PATH = "/admin/orders";

const RETURN_URL_BASE = "https://orderly.invalid";
const PROTECTED_ADMIN_PATH =
  /^\/admin\/(?:orders|menu(?:\/(?:categories|products(?:\/(?:new|[a-zA-Z0-9_-]+\/edit))?))?)$/;

export function getSafeAdminNextPath(nextPath: string | null): string {
  if (
    !nextPath?.startsWith("/") ||
    nextPath.startsWith("//") ||
    /[\\\s]/.test(nextPath)
  ) {
    return DEFAULT_ADMIN_NEXT_PATH;
  }

  try {
    const url = new URL(nextPath, RETURN_URL_BASE);
    const pathname = url.pathname.replace(/\/$/, "");

    if (url.origin !== RETURN_URL_BASE || !PROTECTED_ADMIN_PATH.test(pathname)) {
      return DEFAULT_ADMIN_NEXT_PATH;
    }

    // Keep filter queries, but discard fragments and normalize trailing slashes.
    return `${pathname}${url.search}`;
  } catch {
    return DEFAULT_ADMIN_NEXT_PATH;
  }
}
