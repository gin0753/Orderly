import { customerOrdersHref, parseCustomerOrdersQuery } from "@/features/customer-orders/order-history-url";

test("order filters, sort, and page round-trip through the URL", () => {
  const query = parseCustomerOrdersQuery(new URLSearchParams("status=COMPLETED&sort=amount_high&page=2"));
  expect(query).toEqual({ status: "COMPLETED", sort: "amount_high", page: 2, pageSize: 10 });
  expect(customerOrdersHref(query)).toBe("/account/orders?status=COMPLETED&sort=amount_high&page=2");
  expect(customerOrdersHref({ ...query, status: "PENDING", page: 1 })).toBe("/account/orders?status=PENDING&sort=amount_high");
  expect(customerOrdersHref({ ...query, sort: "oldest", page: 1 })).toBe("/account/orders?status=COMPLETED&sort=oldest");
});

test("default and invalid copied URLs settle on safe list state", () => {
  expect(parseCustomerOrdersQuery(new URLSearchParams())).toEqual({ status: "all", sort: "newest", page: 1, pageSize: 10 });
  expect(parseCustomerOrdersQuery(new URLSearchParams("status=HIDDEN&sort=private&page=-9"))).toEqual({ status: "all", sort: "newest", page: 1, pageSize: 10 });
  expect(parseCustomerOrdersQuery(new URLSearchParams("page=999999999999999999999"))).toMatchObject({ page: 1 });
  expect(customerOrdersHref(parseCustomerOrdersQuery(new URLSearchParams()))).toBe("/account/orders");
});
