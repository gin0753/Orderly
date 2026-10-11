import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(__filename);
const { assertDestructiveTestDatabaseAllowed } = require("../../../api/test/test-database-url.cjs");
const { PrismaClient } = require("../../../api/node_modules/@prisma/client");
let originalImage: string | null;
let productId: string;
test.beforeAll(async () => {
  const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const product = await prisma.product.findFirstOrThrow({ where: { name: "Golden Path Pizza" } });
    originalImage = product.imageUrl;
    productId = product.id;
    await prisma.product.update({ where: { id: productId }, data: { imageUrl: "/images/menu/roasted-mushroom-pizza-v1.webp" } });
  } finally { await prisma.$disconnect(); }
});
test.afterAll(async () => {
  if (!productId) return;
  const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try { await prisma.product.update({ where: { id: productId }, data: { imageUrl: originalImage } }); }
  finally { await prisma.$disconnect(); }
});

const refined = process.env.ORDERLY_TRANSACTION_BASELINE !== "1";
const captureDir = process.env.ORDERLY_TRANSACTION_CAPTURE_DIR;
async function capture(page: Page, name: string, width: number) {
  if (!captureDir) return;
  await mkdir(captureDir, { recursive: true });
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => undefined)));
  });
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter((animation) => animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined)));
  });
  if (!name.startsWith("cart") && !name.endsWith("scrolled")) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.resolve(captureDir, `${name}-${width}.png`), fullPage: !name.startsWith("cart") && !name.endsWith("scrolled") });
}

test("cart removal, availability recovery and minimum/fee messaging", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  await page.getByRole("dialog", { name: "Golden Path Pizza" }).getByRole("button", { name: /^Add to cart/ }).click();
  const cart = page.getByRole("dialog", { name: "Your Cart" });
  await cart.getByRole("button", { name: "Close cart" }).click();
  await page.route("**/api/menu", async (route) => {
    const response = await route.fetch();
    const menu = await response.json();
    menu.store.isAcceptingOrders = false;
    await route.fulfill({ response, json: menu });
  });
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await expect(cart.getByRole("button", { name: "Ordering paused" })).toBeDisabled();
  await expect(cart.getByRole("button", { name: "Increase quantity for Golden Path Pizza" })).toBeEnabled();
  await capture(page, "cart-paused", 320);
  await cart.getByRole("button", { name: "Close cart" }).click();
  await page.unroute("**/api/menu");
  await page.route("**/api/menu", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test offline" }) }));
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await expect(cart.getByRole("button", { name: "Checkout unavailable" })).toBeDisabled();
  await capture(page, "cart-checkout-unavailable", 320);
  await cart.getByRole("button", { name: "Close cart" }).click();
  await page.unroute("**/api/menu");
  await page.route("**/api/menu", async (route) => {
    const response = await route.fetch();
    const menu = await response.json();
    menu.categories = [];
    await route.fulfill({ response, json: menu });
  });
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  if (refined) await expect(cart.getByText(/Item or selected option is currently unavailable/)).toBeVisible();
  await capture(page, "cart-item-unavailable", 320);
  await cart.getByRole("button", { name: "Remove Golden Path Pizza" }).click();
  if (refined) {
    await expect(cart.locator(".transaction-cart-feedback")).toHaveText(/Removed Golden Path Pizza/);
    await expect(cart.getByRole("button", { name: "Close cart" })).toBeFocused();
  }
  await expect(cart.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await capture(page, "cart-removed", 320);
  await cart.getByRole("button", { name: "Close cart" }).click();
  await page.unroute("**/api/menu");
  await page.reload();
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await expect(cart.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await cart.getByRole("button", { name: "Close cart" }).click();
  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  await page.getByRole("dialog", { name: "Golden Path Pizza" }).getByRole("button", { name: /^Add to cart/ }).click();
  await cart.getByRole("button", { name: "Close cart" }).click();
  const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const settings = await prisma.storeSettings.findUniqueOrThrow({ where: { id: "default" } });
  try {
    await prisma.storeSettings.update({ where: { id: "default" }, data: { minimumOrderAmount: "30.00", deliveryFee: "7.25" } });
    await page.goto("/checkout");
    await expect(page.getByText("Minimum order $30.00")).toBeVisible();
    await expect(page.getByText(/Add \$16.00 more/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Place Order/ }).filter({ visible: true })).toBeDisabled();
    await capture(page, "checkout-minimum", 320);
    await page.getByRole("button", { name: /Delivery/ }).click();
    await expect(page.getByText("$22.45").first()).toBeVisible();
    await page.getByRole("button", { name: "Edit cart" }).filter({ visible: true }).click();
    for (let count = 0; count < 3; count++) await cart.getByRole("button", { name: "Increase quantity for Golden Path Pizza" }).click();
    await cart.getByRole("button", { name: "Close cart" }).click();
    await expect(page.getByText("Minimum order $30.00")).toHaveCount(0);
    await expect(page.getByText("$57.20").first()).toBeVisible();
    await expect(page.getByText(/away from free delivery/)).toHaveCount(0);
    await capture(page, "checkout-free-delivery", 320);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Edit cart" }).filter({ visible: true }).click();
    if (refined) await expect(page.locator(".transaction-cart-panel")).toHaveCSS("animation-name", "none");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Edit cart" }).filter({ visible: true })).toBeFocused();
  } finally {
    await prisma.storeSettings.update({ where: { id: "default" }, data: { minimumOrderAmount: settings.minimumOrderAmount, deliveryFee: settings.deliveryFee } });
    await prisma.$disconnect();
  }
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`transaction presentation and recovery at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    const cart = page.getByRole("dialog", { name: "Your Cart" });
    await expect(cart.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
    await capture(page, "cart-empty", viewport.width);
    await cart.getByRole("button", { name: "Close cart" }).click();
    const opener = page.getByRole("button", { name: "View Golden Path Pizza" });
    async function addConfigured() {
      await opener.click();
      const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
      await product.getByRole("radio", { name: /^Large/ }).click();
      await product.getByRole("checkbox", { name: /^Extra Cheese/ }).click();
      await product.getByRole("button", { name: /^Add to cart/ }).click();
      await expect(cart.getByRole("button", { name: "Close cart" })).toBeFocused();
    }
    await addConfigured();
    if (refined) await expect(cart.locator(".transaction-cart-feedback")).toHaveText(/Added 1.*Golden Path Pizza.*1 in cart/);
    await expect(cart.getByText(/Large.*Extra Cheese/)).toBeVisible();
    await capture(page, "cart-populated", viewport.width);
    await cart.getByRole("button", { name: "Close cart" }).click();
    await expect(opener).toBeFocused();
    await addConfigured();
    if (refined) await expect(cart.locator(".transaction-cart-feedback")).toHaveText(/Added 1.*2 in cart/);
    await cart.getByRole("button", { name: "Increase quantity for Golden Path Pizza" }).click();
    if (refined) await expect(cart.locator(".transaction-cart-feedback")).toHaveText(/quantity 3/);
    await cart.getByRole("button", { name: "Decrease quantity for Golden Path Pizza" }).click();
    await cart.getByRole("button", { name: "Close cart" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    await expect(cart.getByText("$40.00").first()).toBeVisible();
    await cart.getByRole("link", { name: /Continue to checkout|View Cart & Checkout/ }).click();
    await expect(page.getByRole("heading", { name: "Checkout", exact: true })).toBeVisible();
    await capture(page, "checkout-pickup", viewport.width);
    const submit = page.getByRole("button", { name: /^Place Order/ }).filter({ visible: true });
    await submit.click();
    await expect(page.getByLabel("Full name", { exact: true })).toBeFocused();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveAttribute("aria-invalid", "true");
    if (refined && viewport.width < 1024) {
      const nameBox = await page.getByLabel("Full name", { exact: true }).boundingBox();
      const barBox = await page.locator(".transaction-checkout-action").boundingBox();
      expect(nameBox!.y).toBeGreaterThanOrEqual(64);
      expect(nameBox!.y + nameBox!.height).toBeLessThanOrEqual(barBox!.y);
      await capture(page, "checkout-invalid-scrolled", viewport.width);
    }
    await capture(page, "checkout-invalid", viewport.width);
    await page.getByRole("button", { name: /Delivery/ }).click();
    await page.getByLabel("Full name", { exact: true }).fill("Transaction Browser");
    await page.getByLabel("Phone number", { exact: true }).fill("0400 123 456");
    await page.getByLabel("Email address", { exact: true }).fill(`transaction${viewport.width}@example.test`);
    await page.getByLabel("Address", { exact: true }).fill("1 Browser Street");
    await page.getByLabel("City", { exact: true }).fill("Sydney");
    await page.getByLabel("State", { exact: true }).selectOption("NSW");
    await page.getByLabel("Postcode", { exact: true }).fill("2000");
    if (refined) await page.getByLabel("Order notes", { exact: true }).fill("Test order notes");
    await capture(page, "checkout-delivery", viewport.width);
    if (refined && viewport.width < 1024) {
      await page.getByRole("complementary", { name: "Order review" }).scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await expect.poll(async () => {
        const summary = await page.getByRole("complementary", { name: "Order review" }).boundingBox();
        const bar = await page.locator(".transaction-checkout-action").boundingBox();
        return summary!.y + summary!.height - bar!.y;
      }).toBeLessThanOrEqual(0);
      await expect(submit).toBeInViewport();
      await capture(page, "checkout-scrolled", viewport.width);
    }
    let releaseFailure!: () => void;
    let failureAttempts = 0;
    const failureGate = new Promise<void>((resolve) => { releaseFailure = resolve; });
    await page.route("**/api/orders", async (route) => {
      if (route.request().method() === "POST") {
        failureAttempts++;
        await failureGate;
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test temporary failure" }) });
      }
      else await route.continue();
    });
    await submit.click();
    try {
      const busyButton = page.getByRole("button", { name: /Placing/ }).filter({ visible: true });
      await expect(busyButton).toBeDisabled();
      if (refined) {
        await expect(busyButton).toHaveAttribute("aria-busy", "true");
        await expect(page.getByRole("status").filter({ hasText: "Placing your order. Please wait." })).toHaveCount(1);
      }
      await page.keyboard.press("Enter");
      await expect.poll(() => failureAttempts).toBe(1);
      await capture(page, "checkout-submitting", viewport.width);
    } finally { releaseFailure(); }
    const failure = page.getByRole("alert").filter({ hasText: /couldn.t place your order/ });
    await expect(failure).toBeVisible();
    await expect(failure).toBeFocused();
    if (refined && viewport.width < 1024) {
      const errorBox = await failure.boundingBox();
      const barBox = await page.locator(".transaction-checkout-action").boundingBox();
      expect(errorBox!.y).toBeGreaterThanOrEqual(64);
      expect(errorBox!.y + errorBox!.height).toBeLessThanOrEqual(barBox!.y);
    }
    await expect(page.getByLabel("Address", { exact: true })).toHaveValue("1 Browser Street");
    await capture(page, "checkout-failure", viewport.width);
    await page.unroute("**/api/orders");
    await submit.click();
    await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/^#\d+$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Track your order" })).toHaveAttribute("href", /\/track-order\/\d+/);
    if (refined) for (const name of ["Track your order", "Start another order"]) {
      expect((await page.getByRole("link", { name, exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, "confirmation", viewport.width);
    await page.goto("/order-success");
    await expect(page.getByRole("heading", { name: "Order details unavailable" })).toBeVisible();
    if (refined) for (const name of ["Browse menu", "Track order"]) {
      expect((await page.getByRole("main").getByRole("link", { name, exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    await capture(page, "confirmation-missing", viewport.width);
  });
}

test("corrupt cart recovery and long cart scrolling preserve reachable actions", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("orderly.cart.v2", "not-json"));
  await page.reload();
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  const cart = page.getByRole("dialog", { name: "Your Cart" });
  await expect(cart.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("orderly.cart.v2"))).toBeNull();
  await cart.getByRole("button", { name: "Close cart" }).click();
  for (const size of ["Small", "Large"]) {
    for (const extra of [false, true]) {
      await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
      const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
      await product.getByRole("radio", { name: new RegExp(`^${size}`) }).click();
      if (extra) await product.getByRole("checkbox", { name: /^Extra Cheese/ }).click();
      await product.getByRole("button", { name: /^Add to cart/ }).click();
      await cart.getByRole("button", { name: "Close cart" }).click();
    }
  }
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await expect(cart.getByRole("heading", { name: "Golden Path Pizza" })).toHaveCount(4);
  const lastQuantity = cart.getByRole("button", { name: "Increase quantity for Golden Path Pizza" }).last();
  await lastQuantity.scrollIntoViewIfNeeded();
  await lastQuantity.click();
  if (refined) {
    const control = await lastQuantity.boundingBox();
    const footer = await cart.locator(".transaction-cart-footer").boundingBox();
    expect(control!.y + control!.height).toBeLessThanOrEqual(footer!.y);
    await expect(cart.getByRole("link", { name: "Continue to checkout" })).toBeInViewport();
    await expect(cart.getByRole("button", { name: "Close cart" })).toBeInViewport();
    await capture(page, "cart-scrolled", 320);
  }
  await cart.getByRole("button", { name: "Clear cart" }).click();
  await expect(cart.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open cart", exact: true })).toBeFocused();
});
