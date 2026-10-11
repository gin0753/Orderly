import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(__filename);
const { assertDestructiveTestDatabaseAllowed } = require("../../../api/test/test-database-url.cjs");
const { PrismaClient } = require("../../../api/node_modules/@prisma/client");
let originalImage: string | null;
let productId: string;
test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
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

const evidence = process.env.ORDERLY_ACCEPTANCE_EVIDENCE_DIR ?? path.resolve(__dirname, "../../../..", "docs/stage-15.7-evidence");
const user = { id: "audit-customer", name: "Alex Taylor", email: "alex@example.test", phone: "0400123456", authMethods: { password: true, google: false } };
const detail = {
  id: "audit-order", orderNumber: "157001", status: "PREPARING", orderType: "PICKUP",
  customer: { name: user.name, email: user.email, phone: user.phone }, address: null, notes: "Please cut into eight slices.",
  items: [{ id: "audit-item", productId: null, name: "Golden Path Pizza", imageUrl: null, sizeName: "Large", sizePriceCents: 1800, quantity: 2, unitPriceCents: 2000, lineTotalCents: 4000, options: [{ id: "extra", optionGroupName: "Extras", name: "Extra Cheese", priceDeltaCents: 200 }] }],
  subtotalCents: 4000, deliveryFeeCents: 0, serviceFeeCents: 120, totalCents: 4120,
  createdAt: "2026-10-09T03:00:00Z", updatedAt: "2026-10-09T03:10:00Z",
};
const tracked = { ...detail, customerName: user.name, customerEmail: user.email, customerPhone: user.phone, addressLine1: null, addressLine2: null, city: null, state: null, postcode: null, paymentStatus: "UNPAID" };

async function audit(page: Page, engine: string, name: string, width: number) {
  await mkdir(path.join(evidence, engine), { recursive: true });
  const hasDialog = await page.getByRole("dialog").count() > 0;
  if (!hasDialog) await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const instrumentation = process.env.ORDERLY_ACCEPTANCE_INSTRUMENTATION ?? "axe";
  if (instrumentation !== "dom-only") {
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(images.filter((image) => (image as HTMLImageElement).complete).map((image) => (image as HTMLImageElement).decode().catch(() => undefined)));
  });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (instrumentation !== "dom-only") {
  await page.screenshot({ path: path.join(evidence, engine, `${name}-${width}.png`), fullPage: !hasDialog, animations: "disabled" });
  }
  const axeSkipped = instrumentation !== "axe";
  const axe = axeSkipped ? { testEngine: { version: "not run" }, violations: [], incomplete: [], passes: [] } :
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const interaction = await page.evaluate(() => ({
    navigationElapsedMs: performance.now(),
    controls: Array.from(document.querySelectorAll("button,input:not([type=hidden]),select,textarea,summary")).map((element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 100), width: rect.width, height: rect.height };
    }).filter((control) => control.width > 0 && control.height > 0),
    feedback: Array.from(document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')).map((element) => ({ role: element.getAttribute("role"), live: element.getAttribute("aria-live"), text: element.textContent?.trim() })),
    focus: document.activeElement ? { tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outline, text: document.activeElement.textContent?.trim().slice(0, 100) } : null,
  }));
  await writeFile(path.join(evidence, engine, `${name}-${width}.json`), JSON.stringify({
    browser: engine, viewport: page.viewportSize(), url: page.url(), overflow,
    axeVersion: axe.testEngine.version, axeSkipped, violations: axe.violations, incomplete: axe.incomplete,
    passedRules: axe.passes.length, interaction,
  }, null, 2));
  expect(overflow, `${name} horizontal overflow`).toBeLessThanOrEqual(1);
}

// Independent contexts keep each visual audit isolated. Retain the combined
// journey as an explicit diagnostic for the recorded WebKit/axe interaction.
const journeyWidths = process.env.ORDERLY_ACCEPTANCE_COMBINED_JOURNEY === "1" ? [null] : [1440, 768, 390, 320];
for (const isolatedWidth of journeyWidths) {
test(`rendered customer journey, axe and keyboard containment ${isolatedWidth === null ? "across four widths" : `at ${isolatedWidth}px`}`, async ({ page, browserName, browser }) => {
  test.setTimeout(600_000);
  const environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, deviceScaleFactor: devicePixelRatio, locale: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  await writeFile(path.join(evidence, `${browserName}-version.json`), JSON.stringify({ browserName, version: browser.version(), platform: process.platform, ...environment }, null, 2));
  let authenticated = false;
  let orderState: "ready" | "empty" | "error" = "ready";
  await page.route("**/customer/auth/**", (route) => {
    if (route.request().url().endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
    return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { user } : {} });
  });
  await page.route("**/customer/orders?*", (route) => route.fulfill({ status: orderState === "error" ? 503 : 200, json: { data: orderState === "empty" ? [] : [{ ...detail, itemCount: 2 }], meta: { page: 1, pageSize: 10, totalItems: orderState === "empty" ? 0 : 1, totalPages: orderState === "empty" ? 0 : 1 } } }));
  await page.route("**/customer/orders/*", (route) => route.fulfill({ json: detail }));
  await page.route("**/orders/guest/lookup", (route) => route.fulfill({ json: tracked }));
  // Only the guarded local menu is read. Order/auth fixtures do not submit data.
  for (const width of isolatedWidth === null ? [1440, 768, 390, 320] : [isolatedWidth]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
    authenticated = false;
    await page.goto("/");
    const productButton = page.getByRole("button", { name: "View Golden Path Pizza" });
    await expect(productButton).toBeVisible();
    await audit(page, browserName, "storefront", width);
    if (width < 768) {
      const opener = page.getByRole("button", { name: "Open customer navigation" });
      await opener.click();
      const navigation = page.getByRole("dialog", { name: "Customer navigation" });
      await expect(navigation).toBeVisible();
      await audit(page, browserName, "mobile-navigation", width);
      for (const name of ["Menu", "Track order", "Sign in"]) {
        await page.keyboard.press("Tab");
        await expect(navigation.getByRole("link", { name, exact: true })).toBeFocused();
      }
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        expect(await navigation.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(opener).toBeFocused();
    }
    await productButton.click();
    const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
    await expect(product).toBeVisible();
    await audit(page, browserName, "configurator", width);
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press("Tab");
      expect(await product.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(productButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(product).toBeVisible();
    await product.getByRole("radio", { name: /^Large/ }).click();
    await product.getByRole("button", { name: /^Add to cart/ }).click();
    const cart = page.getByRole("dialog", { name: "Your Cart" });
    await expect(cart).toBeVisible();
    await audit(page, browserName, "cart", width);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await cart.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
    }
    await cart.getByRole("button", { name: "Close cart" }).click();
    const cartOpener = page.getByRole("button", { name: "Open cart", exact: true });
    await cartOpener.click();
    await page.keyboard.press("Escape");
    await expect(cartOpener).toBeFocused();
    await page.goto("/checkout");
    await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
    await audit(page, browserName, "checkout-pickup", width);
    await page.getByRole("button", { name: /Delivery/ }).click();
    await expect(page.getByLabel("Address", { exact: true })).toBeVisible();
    await audit(page, browserName, "checkout-delivery", width);
    await page.goto("/order-success");
    await expect(page.getByRole("heading", { name: "Order details unavailable" })).toBeVisible();
    await audit(page, browserName, "confirmation-missing", width);
    await page.goto("/order-success?orderNumber=157001&totalCents=4120&orderType=PICKUP");
    await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
    await audit(page, browserName, "confirmation", width);
    for (const route of ["login", "register", "track-order"]) {
      await page.goto(`/${route}`);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("button", { name: route === "login" ? "Sign in" : route === "register" ? "Create account" : "Track Order", exact: true })).toBeEnabled();
      await audit(page, browserName, route, width);
    }
    await page.getByRole("button", { name: "Track Order", exact: true }).click();
    await expect(page.getByLabel("Order number", { exact: true })).toBeFocused();
    await audit(page, browserName, "tracking-invalid", width);
    await page.getByLabel("Order number", { exact: true }).fill("157001");
    await page.getByLabel("Email or phone", { exact: true }).fill(user.email);
    await page.getByRole("button", { name: "Track Order", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeFocused();
    await audit(page, browserName, "tracking-result", width);
    authenticated = true;
    await page.goto("/account");
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
    await audit(page, browserName, "account", width);
    await page.locator("summary").filter({ hasText: "Change password" }).click();
    await audit(page, browserName, "security", width);
    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeVisible();
    await audit(page, browserName, "orders", width);
    await page.getByRole("link", { name: "View order", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Items", exact: true })).toBeVisible();
    await audit(page, browserName, "order-detail", width);
    await page.evaluate(() => localStorage.clear());
  }
  if (isolatedWidth === null || isolatedWidth === 320) {
  orderState = "empty";
  await page.goto("/account/orders");
  await expect(page.getByRole("heading", { name: "No signed-in orders yet" })).toBeVisible();
  await audit(page, browserName, "orders-empty", 320);
  orderState = "error";
  await page.reload();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await audit(page, browserName, "orders-error", 320);
  }
  if (isolatedWidth === null || isolatedWidth === 1440) {
  authenticated = false;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await audit(page, browserName, "login-root-text-200-percent", 1440);
  }
  if (isolatedWidth === null || isolatedWidth === 390) {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "View Golden Path Pizza" })).toBeVisible();
  await audit(page, browserName, "landscape", 844);
  }
});
}

test("native browser performance diagnostics on the optimized local build", async ({ page, browserName, browser }) => {
  test.skip(browserName !== "chromium", "Consistent Chromium lab conditions; not field INP.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(`
    window.__auditMetrics = { lcp: null, cls: 0, shifts: [], longTasks: [], events: [] };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.lcp = entry.startTime; }).observe({type:'largest-contentful-paint', buffered:true});
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) { window.__auditMetrics.cls += entry.value; window.__auditMetrics.shifts.push({value:entry.value, time:entry.startTime, sources:entry.sources.map(source => ({tag:source.node?.tagName,id:source.node?.id,previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))}); } }).observe({type:'layout-shift', buffered:true});
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.longTasks.push(entry.duration); }).observe({type:'longtask', buffered:true});
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.events.push({name:entry.name,duration:entry.duration}); }).observe({type:'event', buffered:true, durationThreshold:16});
  `);
  const samples = [];
  for (const route of ["/", "/", "/", "/login", "/login", "/login", "/register", "/register", "/register", "/track-order"]) {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    await page.waitForTimeout(1500); // Fixed observation window, not a readiness assertion.
    const sample = await page.evaluate(() => ({
      metrics: (window as unknown as { __auditMetrics: unknown }).__auditMetrics,
      navigation: performance.getEntriesByType("navigation").map((entry) => entry.toJSON()),
      resources: performance.getEntriesByType("resource").map((entry) => entry.toJSON()),
      images: Array.from(document.images).map((image) => ({ src: image.currentSrc, loading: image.loading, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight })),
    }));
    samples.push({ route, ...sample });
  }
  await page.goto("/");
  const start = await page.evaluate(() => performance.now());
  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  await expect(page.getByRole("dialog", { name: "Golden Path Pizza" })).toBeVisible();
  const dialogActionToVisibleMs = await page.evaluate((before) => performance.now() - before, start);
  await writeFile(path.join(evidence, "performance.json"), JSON.stringify({
    browser: browser.version(), viewport: page.viewportSize(), cpuThrottle: "none", networkThrottle: "none",
    observationWindowMs: 1500, cache: "same context; first cold then warm", deployment: "local next start production build",
    dialogActionToVisibleMs, proxyIncludesPlaywrightScheduling: true, fieldINP: null, samples,
  }, null, 2));
});

test("fixed checkout controls at top and bottom in four viewports", async ({ page, browserName }) => {
  let authenticated = false;
  await page.route("**/customer/auth/**", (route) => {
    if (route.request().url().endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
    return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { user } : {} });
  });
  for (const width of [1440, 768, 390, 320]) {
    authenticated = false;
    await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
    const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
    await product.getByRole("radio", { name: /^Large/ }).click();
    await product.getByRole("button", { name: /^Add to cart/ }).click();
    await page.getByRole("dialog", { name: "Your Cart" }).getByRole("button", { name: "Close cart" }).click();
    await page.goto("/checkout");
    await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
    await audit(page, browserName, "checkout-pickup", width);
    await page.getByRole("button", { name: /Delivery/ }).click();
    await audit(page, browserName, "checkout-delivery", width);
    await page.screenshot({ path: path.join(evidence, browserName, `checkout-viewport-top-${width}.png`), animations: "disabled" });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    if (width < 1024) {
      await expect.poll(async () => {
        const summary = await page.getByRole("complementary", { name: "Order review" }).boundingBox();
        const bar = await page.locator(".transaction-checkout-action").boundingBox();
        return summary!.y + summary!.height - bar!.y;
      }).toBeLessThanOrEqual(0);
    }
    await expect(page.getByRole("button", { name: /^Place Order/ }).filter({ visible: true })).toBeInViewport();
    await page.screenshot({ path: path.join(evidence, browserName, `checkout-viewport-bottom-${width}.png`), animations: "disabled" });
    authenticated = true;
    await page.goto("/account");
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
    await page.locator("summary").filter({ hasText: "Change password" }).click();
    await audit(page, browserName, "security", width);
    await page.evaluate(() => localStorage.clear());
  }
});

test("mobile navigation tab-order diagnostic", async ({ page, browserName }) => {
  await page.route("**/customer/auth/**", (route) => route.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open customer navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Customer navigation" });
  await expect(dialog).toBeVisible();
  const sequence = [];
  for (const key of ["Tab", "Tab", "Tab", "Tab", "Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Alt+Tab", "Alt+Tab", "Alt+Tab", "Alt+Tab"]) {
    await page.keyboard.press(key);
    sequence.push({ key, ...(await dialog.evaluate((element) => ({
      inside: element.contains(document.activeElement), tag: document.activeElement?.tagName,
      label: document.activeElement?.getAttribute("aria-label"),
      text: document.activeElement?.textContent?.trim().slice(0, 80),
      hasFocus: document.hasFocus(),
    }))) });
  }
  await writeFile(path.join(evidence, `${browserName}-navigation-tab-diagnostic.json`), JSON.stringify(sequence, null, 2));
  expect(sequence.every((step) => step.inside && step.hasFocus)).toBe(true);
  expect(sequence.map((step) => step.text)).toEqual(expect.arrayContaining(["Menu", "Track order", "Sign in"]));
  await dialog.getByRole("button", { name: "Close customer navigation" }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("link", { name: "Menu", exact: true })).toBeFocused();
  await page.screenshot({ path: path.join(evidence, browserName, "navigation-focus-after-390.png"), animations: "disabled" });
});

test("checkout hydration without axe across repeated document visits", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "Focused isolation of the recorded WebKit checkout failure");
  const errors: { url: string; message: string }[] = [];
  const failedRequests: { url: string; error: string | null }[] = [];
  page.on("pageerror", (error) => errors.push({ url: page.url(), message: error.message }));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null }));
  await page.route("**/customer/auth/**", (route) => route.fulfill({ status: 401, json: {} }));
  const visits = [];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
    const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
    await product.getByRole("radio", { name: /^Large/ }).click();
    await product.getByRole("button", { name: /^Add to cart/ }).click();
    await page.getByRole("dialog", { name: "Your Cart" }).getByRole("button", { name: "Close cart" }).click();
    const started = Date.now();
    await page.goto("/checkout");
    const ready = await page.getByLabel("Full name", { exact: true }).waitFor({ state: "visible", timeout: 30_000 }).then(() => true, () => false);
    visits.push({ width, ready, elapsedMs: Date.now() - started, text: await page.getByRole("main").innerText() });
    if (!ready) await page.screenshot({ path: path.join(evidence, `webkit-checkout-isolation-${width}.png`) });
    await page.evaluate(() => localStorage.clear());
  }
  await writeFile(path.join(evidence, "webkit-checkout-isolation.json"), JSON.stringify({ visits, errors, failedRequests }, null, 2));
  expect(visits.every((visit) => visit.ready)).toBe(true);
});
