export const DEFAULT_ADMIN_NEXT_PATH = "/admin/orders";

export function getSafeAdminNextPath(nextPath: string | null): string {
  if (!nextPath) {
    return DEFAULT_ADMIN_NEXT_PATH;
  }

  const isAdminRoute = nextPath === "/admin" || nextPath.startsWith("/admin/");

  const isLoginRoute =
    nextPath === "/admin/login" || nextPath.startsWith("/admin/login?");

  const isExternalProtocolRelativePath = nextPath.startsWith("//");

  if (
    !nextPath.startsWith("/") ||
    !isAdminRoute ||
    isLoginRoute ||
    isExternalProtocolRelativePath
  ) {
    return DEFAULT_ADMIN_NEXT_PATH;
  }

  return nextPath;
}
