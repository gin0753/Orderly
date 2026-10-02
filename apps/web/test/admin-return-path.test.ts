import { getSafeAdminNextPath } from "@/features/auth/lib/get-safe-admin-next-path";

describe("admin return destinations", () => {
  it.each([
    "/admin/orders",
    "/admin/menu",
    "/admin/menu/categories",
    "/admin/menu/products",
    "/admin/menu/products/new",
    "/admin/menu/products/550e8400-e29b-41d4-a716-446655440000/edit",
    "/admin/menu/products?search=chips%20%26%20dip&categoryId=pizza&page=2",
    "/admin/menu/categories?status=archived&search=Pizza",
  ])("preserves implemented protected destination %s", (path) => {
    expect(getSafeAdminNextPath(path)).toBe(path);
  });

  it.each([
    null, "", "/", "/checkout", "/track-order", "/admin",
    "/admin/customers", "/admin/reports", "/admin/settings",
    "/admin/orders/123", "/admin/menu/products/123", "/admin/menu/products/new/edit/extra",
    "/admin/login", "/admin/login/", "/admin/login?next=/admin/orders", "/admin/login#form",
    "https://evil.example/admin/orders", "https://orderly.invalid/admin/orders",
    "//evil.example/admin/orders", "/\\evil.example/admin/orders", "javascript:alert(1)",
    "/admin/../checkout", "/admin/%2e%2e/checkout", "/admin/menu/../login",
    "/admin/menu/products/%2e%2e/%2e%2e/login", "/admin/menu/products/%2fcheckout/edit",
    "/admin/menu/products/%252fcheckout/edit", "/admin/orders\n", "/admin/orders%00",
    "/admin/menu/products/%/edit", "/administrator/orders",
  ])("falls back for invalid destination %s", (path) => {
    expect(getSafeAdminNextPath(path)).toBe("/admin/orders");
  });

  it("validates the normalized path and retains query encoding", () => {
    expect(getSafeAdminNextPath("/admin/menu/./products/../categories/?search=a%2Bb#results"))
      .toBe("/admin/menu/categories?search=a%2Bb");
  });
});
