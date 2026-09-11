import { expect, test, type Page } from "@playwright/test";

const CUSTOMER_NAME = "Taylor Browser";
const CUSTOMER_EMAIL = "taylor.browser@example.com";
const ADMIN_EMAIL = "browser.admin@orderly.test";
const ADMIN_PASSWORD = "BrowserPassword123!";

test.describe.configure({ mode: "serial" });

test("customer checkout to admin acceptance to guest tracking", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const runtimeErrors = captureUnexpectedRuntimeErrors(page);

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Golden Path Pizza" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  const productDialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
  await expect(productDialog).toBeVisible();
  await productDialog.getByRole("radio", { name: "Large" }).click();
  await productDialog.getByRole("checkbox", { name: "Extra Cheese" }).click();
  await productDialog.getByRole("button", { name: /^Add to cart/ }).click();

  await page.getByRole("link", { name: "View Cart & Checkout" }).click();
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.getByRole("button", { name: /Delivery/ }).click();
  await page.getByLabel("Full name").fill(CUSTOMER_NAME);
  await page.getByLabel("Phone number").fill("0400 123 456");
  await page.getByLabel("Email address").fill(CUSTOMER_EMAIL);
  await page.getByLabel("Address", { exact: true }).fill("1 Browser Street");
  await page.getByLabel("City").fill("Sydney");
  await page.getByLabel("State").selectOption("NSW");
  await page.getByLabel("Postcode").fill("2000");
  await page.getByRole("button", { name: "Place Order", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Thanks, your order is in." }),
  ).toBeVisible();
  const orderNumberText = await page.getByText(/^#\d+$/).textContent();
  const orderNumber = orderNumberText?.replace("#", "");
  expect(orderNumber).toMatch(/^\d+$/);

  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?next=/);
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

  await page
    .getByPlaceholder("Search orders, customers or items")
    .fill(orderNumber ?? "");
  const orderCard = page.getByRole("button", {
    name: new RegExp(`#${orderNumber}.*${CUSTOMER_NAME}`, "s"),
  });
  await expect(orderCard).toBeVisible();
  await orderCard.click();

  const orderDetailHeading = page.getByRole("heading", {
    name: `Order #${orderNumber}`,
  });
  await expect(orderDetailHeading).toBeVisible();
  const detailCard = orderDetailHeading.locator(
    "xpath=ancestor::div[contains(@class, 'overflow-hidden')][1]",
  );
  await expect(
    detailCard.getByText(CUSTOMER_NAME, { exact: true }),
  ).toBeVisible();
  await expect(
    detailCard.getByText("Golden Path Pizza", { exact: true }),
  ).toBeVisible();
  await expect(
    detailCard.getByText("Delivery", { exact: true }).first(),
  ).toBeVisible();
  const acceptButton = detailCard.getByRole("button", {
    name: "Accept order",
  });

  await expect(acceptButton).toBeVisible();

  const acceptResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    const pathname = new URL(response.url()).pathname;

    return (
      request.method() === "PATCH" &&
      pathname.includes("/api/admin/orders/") &&
      pathname.endsWith("/status")
    );
  });

  await acceptButton.click();

  const acceptResponse = await acceptResponsePromise;

  expect(acceptResponse.ok()).toBe(true);

  await page.goto("/track-order");
  await page.getByLabel("Order number").fill(orderNumber ?? "");
  await page.getByLabel("Email or phone").fill(CUSTOMER_EMAIL);
  await page.getByRole("button", { name: "Track Order" }).click();

  await expect(page).toHaveURL(new RegExp(`/track-order/${orderNumber}$`), {
    timeout: 25_000,
  });
  await expect(
    page.getByRole("heading", { name: `Order #${orderNumber}` }),
  ).toBeVisible();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Restaurant confirmed your order", { exact: true }),
  ).toBeVisible();

  expect(runtimeErrors).toEqual([]);
});

test("protected admin route redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/admin/menu/products");

  await expect(page).toHaveURL(
    /\/admin\/login\?next=%2Fadmin%2Fmenu%2Fproducts$/,
  );
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test.describe("mobile customer smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("product dialog, keyboard close, cart drawer, and checkout remain usable", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
    await expect(
      page.getByRole("dialog", { name: "Golden Path Pizza" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
    const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
    await dialog.getByRole("radio", { name: "Large" }).click();
    await dialog.getByRole("button", { name: /^Add to cart/ }).click();
    await expect(
      page.getByRole("heading", { name: "Your Cart" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close cart", exact: true }).click();
    await expect(page.getByRole("button", { name: /View cart/ })).toBeVisible();
    await page.getByRole("button", { name: /View cart/ }).click();
    await page.getByRole("link", { name: "View Cart & Checkout" }).click();

    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Place Order/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});

function captureUnexpectedRuntimeErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    const isExpectedUnauthenticatedBootstrap =
      message.text() ===
      "Failed to load resource: the server responded with a status of 401 (Unauthorized)";

    if (message.type() === "error" && !isExpectedUnauthenticatedBootstrap) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`page: ${error.message}`);
  });

  return errors;
}
