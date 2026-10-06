import { DEFAULT_CUSTOMER_RETURN_PATH, safeCustomerReturnPath } from "@/features/customer-auth/lib/return-path";

it.each([
  ["/checkout", "/checkout"],
  ["/account/orders?page=2&status=COMPLETED&sort=amount_high", "/account/orders?page=2&status=COMPLETED&sort=amount_high"],
  ["/track-order/123", "/track-order/123"],
  ["/track-order?orderNumber=123&next=https://attacker.test", "/track-order?orderNumber=123"],
])("allows and normalizes customer return path %s", (input, expected) => {
  expect(safeCustomerReturnPath(input)).toBe(expected);
});

it.each([
  null, "", "https://attacker.test", "//attacker.test", "/admin/orders", "/api/customer/auth/me",
  "/account/../admin/orders", "/account%2F..%2Fadmin", "/login", "/register", "/account/orders/not-a-uuid",
])("rejects unsafe return path %s", (input) => {
  expect(safeCustomerReturnPath(input)).toBe(DEFAULT_CUSTOMER_RETURN_PATH);
});
