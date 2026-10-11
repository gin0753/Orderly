# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-acceptance.spec.ts >> rendered customer journey, axe and keyboard containment across four widths
- Location: test\browser\final-acceptance.spec.ts:65:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1   | import AxeBuilder from "@axe-core/playwright";
  2   | import { expect, test, type Page } from "@playwright/test";
  3   | import { mkdir, writeFile } from "node:fs/promises";
  4   | import path from "node:path";
  5   | import { createRequire } from "node:module";
  6   | 
  7   | const require = createRequire(__filename);
  8   | const { assertDestructiveTestDatabaseAllowed } = require("../../../api/test/test-database-url.cjs");
  9   | const { PrismaClient } = require("../../../api/node_modules/@prisma/client");
  10  | let originalImage: string | null;
  11  | let productId: string;
  12  | test.beforeAll(async () => {
  13  |   const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  14  |   const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  15  |   try {
  16  |     const product = await prisma.product.findFirstOrThrow({ where: { name: "Golden Path Pizza" } });
  17  |     originalImage = product.imageUrl;
  18  |     productId = product.id;
  19  |     await prisma.product.update({ where: { id: productId }, data: { imageUrl: "/images/menu/roasted-mushroom-pizza-v1.webp" } });
  20  |   } finally { await prisma.$disconnect(); }
  21  | });
  22  | test.afterAll(async () => {
  23  |   if (!productId) return;
  24  |   const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  25  |   const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  26  |   try { await prisma.product.update({ where: { id: productId }, data: { imageUrl: originalImage } }); }
  27  |   finally { await prisma.$disconnect(); }
  28  | });
  29  | 
  30  | const evidence = path.resolve(__dirname, "../../../..", "docs/stage-15.7-evidence");
  31  | const user = { id: "audit-customer", name: "Alex Taylor", email: "alex@example.test", phone: "0400123456", authMethods: { password: true, google: false } };
  32  | const detail = {
  33  |   id: "audit-order", orderNumber: "157001", status: "PREPARING", orderType: "PICKUP",
  34  |   customer: { name: user.name, email: user.email, phone: user.phone }, address: null, notes: "Please cut into eight slices.",
  35  |   items: [{ id: "audit-item", productId: null, name: "Golden Path Pizza", imageUrl: null, sizeName: "Large", sizePriceCents: 1800, quantity: 2, unitPriceCents: 2000, lineTotalCents: 4000, options: [{ id: "extra", optionGroupName: "Extras", name: "Extra Cheese", priceDeltaCents: 200 }] }],
  36  |   subtotalCents: 4000, deliveryFeeCents: 0, serviceFeeCents: 120, totalCents: 4120,
  37  |   createdAt: "2026-10-09T03:00:00Z", updatedAt: "2026-10-09T03:10:00Z",
  38  | };
  39  | const tracked = { ...detail, customerName: user.name, customerEmail: user.email, customerPhone: user.phone, addressLine1: null, addressLine2: null, city: null, state: null, postcode: null, paymentStatus: "UNPAID" };
  40  | 
  41  | async function audit(page: Page, engine: string, name: string, width: number) {
  42  |   await mkdir(path.join(evidence, engine), { recursive: true });
  43  |   const hasDialog = await page.getByRole("dialog").count() > 0;
  44  |   if (!hasDialog) await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  45  |   await page.locator("img").evaluateAll(async (images) => {
  46  |     await Promise.all(images.filter((image) => (image as HTMLImageElement).complete).map((image) => (image as HTMLImageElement).decode().catch(() => undefined)));
  47  |   });
  48  |   const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  49  |   await page.screenshot({ path: path.join(evidence, engine, `${name}-${width}.png`), fullPage: !hasDialog, animations: "disabled" });
  50  |   const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  51  |   const interaction = await page.evaluate(() => ({
  52  |     controls: Array.from(document.querySelectorAll("button,input:not([type=hidden]),select,textarea,summary")).map((element) => {
  53  |       const rect = element.getBoundingClientRect();
  54  |       return { tag: element.tagName, label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 100), width: rect.width, height: rect.height };
  55  |     }).filter((control) => control.width > 0 && control.height > 0),
  56  |     feedback: Array.from(document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')).map((element) => ({ role: element.getAttribute("role"), live: element.getAttribute("aria-live"), text: element.textContent?.trim() })),
  57  |     focus: document.activeElement ? { tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outline, text: document.activeElement.textContent?.trim().slice(0, 100) } : null,
  58  |   }));
  59  |   await writeFile(path.join(evidence, engine, `${name}-${width}.json`), JSON.stringify({
  60  |     browser: engine, viewport: page.viewportSize(), url: page.url(), overflow,
  61  |     axeVersion: axe.testEngine.version, violations: axe.violations, incomplete: axe.incomplete,
  62  |     passedRules: axe.passes.length, interaction,
  63  |   }, null, 2));
  64  |   expect(overflow, `${name} horizontal overflow`).toBeLessThanOrEqual(1);
  65  | }
  66  | 
  67  | test("rendered customer journey, axe and keyboard containment across four widths", async ({ page, browserName, browser }) => {
  68  |   test.setTimeout(600_000);
  69  |   await writeFile(path.join(evidence, `${browserName}-version.json`), JSON.stringify({ browserName, version: browser.version(), platform: process.platform }, null, 2));
  70  |   let authenticated = false;
  71  |   let orderState: "ready" | "empty" | "error" = "ready";
  72  |   await page.route("**/customer/auth/**", (route) => {
  73  |     if (route.request().url().endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
  74  |     return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { user } : {} });
  75  |   });
  76  |   await page.route("**/customer/orders?*", (route) => route.fulfill({ status: orderState === "error" ? 503 : 200, json: { data: orderState === "empty" ? [] : [{ ...detail, itemCount: 2 }], meta: { page: 1, pageSize: 10, totalItems: orderState === "empty" ? 0 : 1, totalPages: orderState === "empty" ? 0 : 1 } } }));
  77  |   await page.route("**/customer/orders/*", (route) => route.fulfill({ json: detail }));
  78  |   await page.route("**/orders/guest/lookup", (route) => route.fulfill({ json: tracked }));
  79  |   // Only the guarded local menu is read. Order/auth fixtures do not submit data.
  80  |   for (const width of [1440, 768, 390, 320]) {
  81  |     await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
  82  |     authenticated = false;
  83  |     await page.goto("/");
  84  |     const productButton = page.getByRole("button", { name: "View Golden Path Pizza" });
  85  |     await expect(productButton).toBeVisible();
  86  |     await audit(page, browserName, "storefront", width);
  87  |     if (width < 768) {
  88  |       const opener = page.getByRole("button", { name: "Open customer navigation" });
  89  |       await opener.click();
  90  |       const navigation = page.getByRole("dialog", { name: "Customer navigation" });
  91  |       await expect(navigation).toBeVisible();
  92  |       await audit(page, browserName, "mobile-navigation", width);
> 93  |       for (let i = 0; i < 12; i++) {
      |                                                                                                ^ Error: expect(received).toBe(expected) // Object.is equality
  94  |         await page.keyboard.press("Tab");
  95  |         expect(await navigation.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  96  |       }
  97  |       await page.keyboard.press("Escape");
  98  |       await expect(opener).toBeFocused();
  99  |     }
  100 |     await productButton.click();
  101 |     const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
  102 |     await expect(product).toBeVisible();
  103 |     await audit(page, browserName, "configurator", width);
  104 |     for (let i = 0; i < 18; i++) {
  105 |       await page.keyboard.press("Tab");
  106 |       expect(await product.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  107 |     }
  108 |     await page.keyboard.press("Escape");
  109 |     await expect(productButton).toBeFocused();
  110 |     await productButton.click();
  111 |     await product.getByRole("radio", { name: /^Large/ }).click();
  112 |     await product.getByRole("button", { name: /^Add to cart/ }).click();
  113 |     const cart = page.getByRole("dialog", { name: "Your Cart" });
  114 |     await expect(cart).toBeVisible();
  115 |     await audit(page, browserName, "cart", width);
  116 |     for (let i = 0; i < 12; i++) {
  117 |       await page.keyboard.press("Tab");
  118 |       expect(await cart.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  119 |     }
  120 |     await cart.getByRole("button", { name: "Close cart" }).click();
  121 |     const cartOpener = page.getByRole("button", { name: "Open cart", exact: true });
  122 |     await cartOpener.click();
  123 |     await page.keyboard.press("Escape");
  124 |     await expect(cartOpener).toBeFocused();
  125 |     await page.goto("/checkout");
  126 |     await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  127 |     await audit(page, browserName, "checkout-pickup", width);
  128 |     await page.getByRole("button", { name: /Delivery/ }).click();
  129 |     await expect(page.getByLabel("Address", { exact: true })).toBeVisible();
  130 |     await audit(page, browserName, "checkout-delivery", width);
  131 |     await page.goto("/order-success");
  132 |     await expect(page.getByRole("heading", { name: "Order details unavailable" })).toBeVisible();
  133 |     await audit(page, browserName, "confirmation-missing", width);
  134 |     await page.goto("/order-success?orderNumber=157001&totalCents=4120&orderType=PICKUP");
  135 |     await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  136 |     await audit(page, browserName, "confirmation", width);
  137 |     for (const route of ["login", "register", "track-order"]) {
  138 |       await page.goto(`/${route}`);
  139 |       await expect(page.getByRole("main")).toBeVisible();
  140 |       await expect(page.getByRole("button", { name: route === "login" ? "Sign in" : route === "register" ? "Create account" : "Track Order", exact: true })).toBeEnabled();
  141 |       await audit(page, browserName, route, width);
  142 |     }
  143 |     await page.getByRole("button", { name: "Track Order", exact: true }).click();
  144 |     await expect(page.getByLabel("Order number", { exact: true })).toBeFocused();
  145 |     await audit(page, browserName, "tracking-invalid", width);
  146 |     await page.getByLabel("Order number", { exact: true }).fill("157001");
  147 |     await page.getByLabel("Email or phone", { exact: true }).fill(user.email);
  148 |     await page.getByRole("button", { name: "Track Order", exact: true }).click();
  149 |     await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeFocused();
  150 |     await audit(page, browserName, "tracking-result", width);
  151 |     authenticated = true;
  152 |     await page.goto("/account");
  153 |     await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
  154 |     await audit(page, browserName, "account", width);
  155 |     await page.locator("summary").filter({ hasText: "Change password" }).click();
  156 |     await audit(page, browserName, "security", width);
  157 |     await page.goto("/account/orders");
  158 |     await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeVisible();
  159 |     await audit(page, browserName, "orders", width);
  160 |     await page.getByRole("link", { name: "View order", exact: true }).click();
  161 |     await expect(page.getByRole("heading", { name: "Items", exact: true })).toBeVisible();
  162 |     await audit(page, browserName, "order-detail", width);
  163 |     await page.evaluate(() => localStorage.clear());
  164 |   }
  165 |   orderState = "empty";
  166 |   await page.goto("/account/orders");
  167 |   await expect(page.getByRole("heading", { name: "No signed-in orders yet" })).toBeVisible();
  168 |   await audit(page, browserName, "orders-empty", 320);
  169 |   orderState = "error";
  170 |   await page.reload();
  171 |   await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  172 |   await audit(page, browserName, "orders-error", 320);
  173 |   authenticated = false;
  174 |   await page.setViewportSize({ width: 1440, height: 900 });
  175 |   await page.goto("/login");
  176 |   await page.emulateMedia({ reducedMotion: "reduce" });
  177 |   await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  178 |   await audit(page, browserName, "login-root-text-200-percent", 1440);
  179 |   await page.setViewportSize({ width: 844, height: 390 });
  180 |   await page.goto("/");
  181 |   await expect(page.getByRole("button", { name: "View Golden Path Pizza" })).toBeVisible();
  182 |   await audit(page, browserName, "landscape", 844);
  183 | });
  184 | 
  185 | test("native browser performance diagnostics on the optimized local build", async ({ page, browserName, browser }) => {
  186 |   test.skip(browserName !== "chromium", "Consistent Chromium lab conditions; not field INP.");
  187 |   await page.setViewportSize({ width: 390, height: 844 });
  188 |   await page.addInitScript(`
  189 |     window.__auditMetrics = { lcp: null, cls: 0, shifts: [], longTasks: [], events: [] };
  190 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.lcp = entry.startTime; }).observe({type:'largest-contentful-paint', buffered:true});
  191 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) { window.__auditMetrics.cls += entry.value; window.__auditMetrics.shifts.push({value:entry.value, time:entry.startTime, sources:entry.sources.map(source => ({tag:source.node?.tagName,id:source.node?.id,previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))}); } }).observe({type:'layout-shift', buffered:true});
  192 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.longTasks.push(entry.duration); }).observe({type:'longtask', buffered:true});
  193 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.events.push({name:entry.name,duration:entry.duration}); }).observe({type:'event', buffered:true, durationThreshold:16});
```