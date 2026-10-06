import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";

type TestPrismaClient = {
  customerSession: {
    deleteMany: (args: { where: { customerUser: { email: string } } }) => Promise<unknown>;
  };
  storeSettings: {
    findUniqueOrThrow: (args: {
      where: { id: string };
      select: { isAcceptingOrders: true };
    }) => Promise<{ isAcceptingOrders: boolean }>;
    update: (args: {
      where: { id: string };
      data: { isAcceptingOrders: boolean };
    }) => Promise<unknown>;
  };
  category: {
    findMany: (args: {
      select: { id: true; isActive: true };
    }) => Promise<Array<{ id: string; isActive: boolean }>>;
    updateMany: (args: {
      data: { isActive: boolean };
    }) => Promise<unknown>;
    update: (args: {
      where: { id: string };
      data: { isActive: boolean };
    }) => Promise<unknown>;
  };
  $disconnect: () => Promise<void>;
};

const requireFromBrowserTest = createRequire(__filename);
const { PrismaClient } = requireFromBrowserTest(
  "../../../api/node_modules/@prisma/client",
) as {
  PrismaClient: new (options: {
    datasources: { db: { url: string } };
  }) => TestPrismaClient;
};

const CUSTOMER_NAME = "Taylor Browser";
const CUSTOMER_EMAIL = "taylor.browser@example.com";
const ACCOUNT_EMAIL = "account.browser@example.com";
const ACCOUNT_PASSWORD = "Browser account password 123!";
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
  ).toBeVisible({ timeout: 25_000 });
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
  await expect(page.getByRole("main")).toHaveCount(1);

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

  await acceptButton.click();

  await expect(acceptButton).toBeHidden();

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

test("customer registration survives reload and logout preserves public browsing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/register/);
  await page.getByLabel("Name").fill("Account Browser");
  await page.getByLabel("Email").fill(ACCOUNT_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ACCOUNT_PASSWORD);
  await page.getByLabel("Confirm password").fill(ACCOUNT_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Email")).toHaveValue(ACCOUNT_EMAIL);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Golden Path Pizza" })).toBeVisible();
});

test("customer login survives reload and restores a protected return path", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACCOUNT_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ACCOUNT_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.reload();
  await expect(page.getByLabel("Email")).toHaveValue(ACCOUNT_EMAIL);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount$/);
  await page.getByLabel("Email").fill(ACCOUNT_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ACCOUNT_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
});

test("revoked customer session exits protected state while preserving the cart", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
  await dialog.getByRole("radio", { name: "Large" }).click();
  await dialog.getByRole("button", { name: /^Add to cart/ }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACCOUNT_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ACCOUNT_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);

  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required for browser tests.");
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    await prisma.customerSession.deleteMany({ where: { customerUser: { email: ACCOUNT_EMAIL } } });
  } finally {
    await prisma.$disconnect();
  }
  await page.reload();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount$/);
  await page.goto("/");
  await page.getByRole("button", { name: "Open cart" }).click();
  await expect(page.getByRole("dialog", { name: "Your Cart" }).getByText("Golden Path Pizza", { exact: true })).toBeVisible();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`customer auth pages fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ["/login", "/register"]) {
      await page.goto(path);
      await expect(page.locator("form")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
}

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

test("homepage ordering entry point remains usable at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const runtimeErrors = captureUnexpectedRuntimeErrors(page);

  await page.goto("/");

  const browseMenu = page.getByRole("link", { name: "Browse menu" });
  const trackOrder = page
    .getByRole("main")
    .getByRole("link", { name: "Track order" });
  const categories = page.locator("#menu");

  await expect(page.getByText("Orderly Browser Test")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Golden Path Pizza" }),
  ).toBeVisible();
  await expect(browseMenu).toBeVisible();
  await expect(trackOrder).toHaveAttribute("href", "/track-order");
  await expect(categories).toBeVisible();

  for (const action of [browseMenu, trackOrder]) {
    const box = await action.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect((await categories.boundingBox())?.y).toBeLessThan(720);

  await browseMenu.click();
  await expect(page).toHaveURL(/#menu$/);
  await expect
    .poll(async () => (await categories.boundingBox())?.y)
    .toBeGreaterThanOrEqual(63);

  const pizzaButton = categories.getByRole("button", { name: /Pizza/ });
  await pizzaButton.click();
  await expect(pizzaButton).toHaveAttribute("aria-pressed", "true");

  const categoryBox = await categories.boundingBox();
  const selectedCategoryHeading = page
    .locator('section[id^="menu-section-"] h2')
    .first();
  await expect(selectedCategoryHeading).toHaveText(/Pizza/);
  const pizzaHeadingBox = await selectedCategoryHeading.boundingBox();
  expect(pizzaHeadingBox?.y).toBeGreaterThanOrEqual(
    (categoryBox?.y ?? 0) + (categoryBox?.height ?? 0),
  );

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(async () => (await categories.boundingBox())?.y)
    .toBeGreaterThanOrEqual(63);

  await trackOrder.click();
  await expect(page).toHaveURL(/\/track-order$/);
  expect(runtimeErrors).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 720 },
]) {
  test(`customer shell and 404 remain sound at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const runtimeErrors = captureUnexpectedRuntimeErrors(page);

    await page.goto("/track-order");
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    const footerNavigation = page.getByRole("navigation", {
      name: "Footer navigation",
    });
    await expect(footerNavigation.getByRole("link")).toHaveCount(2);
    await expect(
      footerNavigation.getByRole("link", { name: "Menu" }),
    ).toHaveAttribute("href", "/");
    await expect(
      footerNavigation.getByRole("link", { name: "Track order" }),
    ).toHaveAttribute("href", "/track-order");
    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(runtimeErrors).toEqual([]);

    await page.goto("/missing-stage-12-5-4-route");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Browse menu" }),
    ).toHaveAttribute("href", "/");
    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(runtimeErrors).toEqual([
      "console: Failed to load resource: the server responded with a status of 404 (Not Found)",
    ]);
  });
}

test("empty and paused ordering use guarded local StoreSettings fixtures", async ({
  page,
}) => {
  const runtimeErrors = captureUnexpectedRuntimeErrors(page);
  const prisma = createGuardedTestPrisma();
  const storeSettings = await prisma.storeSettings.findUniqueOrThrow({
    where: { id: "default" },
    select: { isAcceptingOrders: true },
  });
  const categories = await prisma.category.findMany({
    select: { id: true, isActive: true },
  });

  try {
    await prisma.category.updateMany({ data: { isActive: false } });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Menu coming soon" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Refresh menu" }).click();
    await expect(
      page.getByRole("heading", { name: "Menu coming soon" }),
    ).toBeVisible();

    await Promise.all(
      categories.map((category) =>
        prisma.category.update({
          where: { id: category.id },
          data: { isActive: category.isActive },
        }),
      ),
    );
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: { isAcceptingOrders: true },
    });

    await page.goto("/");
    const productOpener = page.getByRole("button", {
      name: "View Golden Path Pizza",
    });
    await productOpener.click();
    const productDialog = page.getByRole("dialog", {
      name: "Golden Path Pizza",
    });
    await productDialog.getByRole("radio", { name: "Large" }).click();
    await productDialog.getByRole("button", { name: /^Add to cart/ }).click();
    await page.getByRole("button", { name: "Close cart" }).click();

    await prisma.storeSettings.update({
      where: { id: "default" },
      data: { isAcceptingOrders: false },
    });
    await page.reload();

    await expect(
      page.getByRole("heading", { name: "Ordering is paused" }),
    ).toBeVisible();
    await expect(productOpener).toBeEnabled();
    await expect(page.getByRole("button", { name: "Paused" })).toBeDisabled();
    await productOpener.click();
    await expect(
      page.getByRole("button", { name: "Ordering paused" }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Open cart" }).click();
    await expect(
      page.getByRole("button", { name: "Ordering paused" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Close cart" }).click();

    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Preserved Customer");
    for (const submitButton of await page
      .getByRole("button", { name: "Ordering paused" })
      .all()) {
      await expect(submitButton).toBeDisabled();
    }
    await page.getByRole("button", { name: "Edit cart" }).click();
    await page.getByRole("button", { name: "Close cart" }).click();
    await expect(page.getByLabel("Full name")).toHaveValue(
      "Preserved Customer",
    );
    expect(runtimeErrors).toEqual([]);
  } finally {
    await Promise.all(
      categories.map((category) =>
        prisma.category.update({
          where: { id: category.id },
          data: { isActive: category.isActive },
        }),
      ),
    );
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: { isAcceptingOrders: storeSettings.isAcceptingOrders },
    });
    await prisma.$disconnect();
  }
});

test("native product and cart dialogs preserve keyboard focus and modal behavior", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const runtimeErrors = captureUnexpectedRuntimeErrors(page);
  await page.goto("/");

  const productOpener = page.getByRole("button", {
    name: "View Golden Path Pizza",
  });
  await productOpener.click();
  const productDialog = page.getByRole("dialog", {
    name: "Golden Path Pizza",
  });
  const productClose = productDialog.getByRole("button", {
    name: "Close product details",
  });
  await expect(productDialog).toBeVisible();
  await expect(productClose).toBeFocused();
  await productDialog.getByRole("radio", { name: "Large" }).click();
  expect(
    await productDialog.evaluate((dialog) => dialog.matches(":modal")),
  ).toBe(true);

  await page.getByRole("button", { name: "Open cart" }).focus();
  expect(
    await productDialog.evaluate((dialog) => dialog.contains(document.activeElement)),
  ).toBe(true);

  const addButton = productDialog.getByRole("button", { name: /^Add to cart/ });
  await addButton.focus();
  await page.keyboard.press("Tab");
  await expect(productClose).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(addButton).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(productDialog).toBeHidden();
  await expect(productOpener).toBeFocused();

  await productOpener.click();
  const reopenedDialog = page.getByRole("dialog", {
    name: "Golden Path Pizza",
  });
  await reopenedDialog.getByRole("radio", { name: "Large" }).click();
  await reopenedDialog.getByRole("button", { name: /^Add to cart/ }).click();

  const cartDialog = page.getByRole("dialog", { name: "Your Cart" });
  const cartClose = cartDialog.getByRole("button", { name: "Close cart" });
  await expect(cartDialog).toBeVisible();
  await expect(cartClose).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await cartClose.click();
  await expect(cartDialog).toBeHidden();
  await expect(productOpener).toBeFocused();

  const headerCartOpener = page.getByRole("button", { name: "Open cart" });
  await headerCartOpener.click();
  await expect(cartDialog).toBeVisible();
  await expect(cartClose).toBeFocused();
  const clearCart = cartDialog.getByRole("button", { name: "Clear cart" });
  await clearCart.focus();
  await page.keyboard.press("Tab");
  await expect(cartClose).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(clearCart).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(cartDialog).toBeHidden();
  await expect(headerCartOpener).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileCartOpener = page.getByRole("button", { name: /View cart/ });
  await mobileCartOpener.click();
  await expect(cartDialog).toBeVisible();
  await cartClose.click();
  await expect(mobileCartOpener).toBeFocused();

  await productOpener.click();
  await expect(reopenedDialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(reopenedDialog).toBeHidden();
  await expect(productOpener).toBeFocused();
  expect(runtimeErrors).toEqual([]);
});

test("reduced-motion preference disables application and utility animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const motionStyles = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "animate-pulse animate-orderly-slide-up";
    document.body.append(probe);
    const styles = window.getComputedStyle(probe);
    const result = {
      animationName: styles.animationName,
      scrollBehavior: window.getComputedStyle(document.documentElement)
        .scrollBehavior,
    };
    probe.remove();
    return result;
  });

  expect(motionStyles.animationName).toBe("none");
  expect(motionStyles.scrollBehavior).toBe("auto");
});

function captureUnexpectedRuntimeErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    const isExpectedUnauthenticatedBootstrap =
      message.text() ===
      "Failed to load resource: the server responded with a status of 401 (Unauthorized)";
    const isRateLimitedAnonymousBootstrap =
      message.text() ===
        "Failed to load resource: the server responded with a status of 429 (Too Many Requests)" &&
      message.location().url.includes("/api/customer/auth/refresh");

    if (message.type() === "error" && !isExpectedUnauthenticatedBootstrap && !isRateLimitedAnonymousBootstrap) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`page: ${error.message}`);
  });

  return errors;
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
}

function createGuardedTestPrisma() {
  const databaseUrl = process.env.TEST_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for browser fixtures.");
  }

  const target = new URL(databaseUrl);
  const databaseName = target.pathname.replace(/^\//, "");
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(
    target.hostname,
  );

  if (!isLoopback || databaseName !== "orderly_test") {
    throw new Error("Browser fixtures require the loopback orderly_test database.");
  }

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}
