import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const captureDir = process.env.ORDERLY_AUTH_ORDERS_CAPTURE_DIR;
const baseline = process.env.ORDERLY_AUTH_ORDERS_BASELINE === "1";
const user = { id: "visual-customer", name: "Alex Taylor", email: "alex@example.test", phone: "0400123456", authMethods: { password: true, google: false } };
const item = { id: "snapshot-item", productId: null, name: "Golden Path Pizza", imageUrl: null, sizeName: "Large", sizePriceCents: 1800, quantity: 2, unitPriceCents: 2000, lineTotalCents: 4000, options: [{ id: "extra", optionGroupName: "Extras", name: "Extra Cheese", priceDeltaCents: 200 }] };
const detail = { id: "snapshot-order", orderNumber: "156001", status: "PREPARING", orderType: "PICKUP", customer: { name: user.name, email: user.email, phone: user.phone }, address: null, notes: "Please cut into eight slices.", items: [item], subtotalCents: 4000, deliveryFeeCents: 0, serviceFeeCents: 120, totalCents: 4120, createdAt: "2026-10-09T03:00:00Z", updatedAt: "2026-10-09T03:10:00Z" };
const tracked = { ...detail, customerName: user.name, customerEmail: user.email, customerPhone: user.phone, addressLine1: null, addressLine2: null, city: null, state: null, postcode: null, paymentStatus: "UNPAID" };

async function capture(page: Page, name: string, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  if (captureDir) {
    await mkdir(captureDir, { recursive: true });
    const previousScroll = await page.evaluate(() => window.scrollY);
    if (previousScroll > 0) {
      await page.screenshot({ path: path.join(captureDir, `${name}-viewport-${width}.png`), fullPage: false, animations: "disabled" });
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(captureDir, `${name}-${width}.png`), fullPage: true, animations: "disabled" });
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), previousScroll);
  }
}

async function focusedControlIsVisible(page: Page) {
  const rect = await page.evaluate(() => {
    const bounds = document.activeElement!.getBoundingClientRect();
    return { top: bounds.top, bottom: bounds.bottom, viewport: innerHeight };
  });
  expect(rect.top).toBeGreaterThanOrEqual(64);
  expect(rect.bottom).toBeLessThanOrEqual(rect.viewport);
}

test("authentication and guest tracking presentation, errors and keyboard feedback", async ({ page }) => {
  let releaseLogin: (() => void) | undefined;
  await page.route("**/customer/auth/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
    if (url.endsWith("/google/start")) return route.fulfill({ status: 503, json: {} });
    if (url.endsWith("/login") && releaseLogin) await new Promise<void>((resolve) => { releaseLogin = resolve; });
    return route.fulfill({ status: 401, json: {} });
  });
  let lookupStatus = 200;
  let release: (() => void) | undefined;
  await page.route("**/orders/guest/lookup", async (route) => {
    if (release) await new Promise<void>((resolve) => { release = resolve; });
    await route.fulfill({ status: lookupStatus, json: lookupStatus === 200 ? tracked : {} });
  });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/login?returnTo=%2Faccount%2Forders");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await capture(page, "login", viewport.width);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
    if (!baseline) await focusedControlIsVisible(page);
    await capture(page, "login-invalid", viewport.width);
    await page.goto("/register");
    await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeEnabled();
    await capture(page, "register", viewport.width);
    await page.getByLabel("Password", { exact: true }).fill("visible password");
    await page.getByLabel("Show password").focus();
    await page.keyboard.press("Space");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
    await page.goto("/track-order");
    await capture(page, "tracking-search", viewport.width);
    await page.getByRole("button", { name: "Track Order", exact: true }).click();
    if (!baseline) {
      await expect(page.getByLabel("Order number", { exact: true })).toBeFocused();
      await expect(page.getByLabel("Order number", { exact: true })).toHaveAttribute("aria-invalid", "true");
      await focusedControlIsVisible(page);
    }
    await capture(page, "tracking-invalid", viewport.width);
    await page.getByLabel("Order number", { exact: true }).fill("156001");
    await page.getByLabel("Email or phone", { exact: true }).fill(user.email);
    await page.getByRole("button", { name: "Track Order", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).toBeVisible();
    if (!baseline) {
      await expect(page.getByRole("list", { name: "Order progress" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).toBeFocused();
      await expect(page.getByRole("main")).toHaveCount(1);
    }
    await capture(page, "tracking-result", viewport.width);
  }
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong password");
  if (!baseline) releaseLogin = () => {};
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  if (!baseline) {
    await expect(page.getByRole("button", { name: "Signing in…", exact: true })).toBeDisabled();
    await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
    await capture(page, "login-submitting", 320);
    releaseLogin?.(); releaseLogin = undefined;
  }
  await expect(page.getByText("Invalid email or password.", { exact: true })).toBeFocused();
  if (!baseline) await focusedControlIsVisible(page);
  await capture(page, "login-failure", 320);
  await page.getByRole("button", { name: "Continue with Google" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Google sign-in could not start. Please try again.")).toBeVisible();
  if (!baseline) await expect(page.getByText("Google sign-in could not start. Please try again.")).toBeFocused();
  // No external provider navigation is allowed by this fixture.
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/track-order/unknown");
  await expect(page.getByRole("heading", { name: "Verify your order first" })).toBeVisible();
  await capture(page, "tracking-verification", 320);
  lookupStatus = 404;
  await page.goto("/track-order/156001");
  await expect(page.getByRole("heading", { name: "Order not found" })).toBeFocused();
  await capture(page, "tracking-not-found", 320);
  lookupStatus = 503;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Tracking unavailable" })).toBeVisible();
  await capture(page, "tracking-unavailable", 320);
  lookupStatus = 200;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  release = () => {};
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("button", { name: "Refreshing..." })).toBeDisabled();
  await capture(page, "tracking-refreshing", 320);
  if (!baseline) expect(await page.locator(".animate-pulse").count()).toBe(0);
  release(); release = undefined;
  await expect(page.getByRole("status")).toContainText("Order status refreshed.");
  if (!baseline) {
    await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).not.toBeFocused();
    for (const status of ["ACCEPTED", "READY", "COMPLETED", "CANCELLED"]) {
      tracked.status = status;
      await page.getByRole("button", { name: "Refresh", exact: true }).click();
      await expect(page.getByRole("button", { name: "Refresh", exact: true })).toBeEnabled();
      if (status === "CANCELLED") {
        await expect(page.getByRole("heading", { name: "This order has been cancelled" })).toBeVisible();
        await expect(page.getByRole("list", { name: "Order progress" })).toHaveCount(0);
      } else {
        await expect(page.getByRole("list", { name: "Order progress" }).locator('[aria-current="step"]')).toHaveCount(1);
        await expect(page.getByRole("main").getByText(status === "ACCEPTED" ? "Accepted" : status === "READY" ? "Ready" : "Completed", { exact: true }).first()).toBeVisible();
      }
      await capture(page, `tracking-${status.toLowerCase()}`, 320);
    }
    release = () => {};
    await page.reload();
    await expect(page.getByRole("status")).toContainText("Loading order.");
    await capture(page, "tracking-loading", 320);
    const motion = await page.locator(".animate-pulse").first().evaluate((element) => getComputedStyle(element).animationDuration);
    expect(parseFloat(motion)).toBeLessThanOrEqual(0.01);
    release(); release = undefined;
    await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).toBeFocused();
  }
});

test("account history and snapshot detail presentation with loading, empty and failure recovery", async ({ page }) => {
  await page.route("**/customer/auth/**", (route) => route.fulfill({ json: { user } }));
  let listStatus = 200;
  let empty = false;
  let hold = false;
  let release: (() => void) | undefined;
  await page.route("**/customer/orders?*", async (route) => {
    if (hold) await new Promise<void>((resolve) => { release = resolve; });
    await route.fulfill({ status: listStatus, json: { data: empty ? [] : [{ ...detail, itemCount: 2 }], meta: { page: 1, pageSize: 10, totalItems: empty ? 0 : 12, totalPages: empty ? 0 : 2 } } });
  });
  await page.route("**/customer/orders/*", (route) => route.fulfill({ json: detail }));
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Account sections" })).toHaveCount(1);
    await capture(page, "orders", viewport.width);
    if (!baseline) {
      const filter = page.getByRole("navigation", { name: "Filter orders by status" }).getByRole("link", { name: "All", exact: true });
      expect((await filter.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("link", { name: "View order", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Items", exact: true })).toBeVisible();
    await expect(page.getByText("Extras: Extra Cheese ($2.00)", { exact: true })).toBeVisible();
    await capture(page, "order-detail", viewport.width);
  }
  hold = true;
  await page.goto("/account/orders");
  await expect(page.getByRole("status")).toContainText("Loading your orders");
  await capture(page, "orders-loading", 320);
  hold = false; release?.();
  await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).toBeVisible();
  empty = true;
  await page.reload();
  await expect(page.getByRole("heading", { name: "No signed-in orders yet" })).toBeVisible();
  await capture(page, "orders-empty", 320);
  listStatus = 503;
  await page.reload();
  await expect(page.getByText("We couldn’t load your orders.")).toBeVisible();
  await capture(page, "orders-error", 320);
  listStatus = 200; empty = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Order #156001", exact: true })).toBeVisible();
});
