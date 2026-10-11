# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-acceptance.spec.ts >> rendered customer journey, axe and keyboard containment across four widths
- Location: test\browser\final-acceptance.spec.ts:67:5

# Error details

```
Test timeout of 600000ms exceeded.
```

```
Error: locator.click: Test timeout of 600000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Golden Path Pizza' }).getByRole('radio', { name: /^Large/ })

```

# Test source

```ts
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
  69  |   const environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, deviceScaleFactor: devicePixelRatio, locale: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  70  |   await writeFile(path.join(evidence, `${browserName}-version.json`), JSON.stringify({ browserName, version: browser.version(), platform: process.platform, ...environment }, null, 2));
  71  |   let authenticated = false;
  72  |   let orderState: "ready" | "empty" | "error" = "ready";
  73  |   await page.route("**/customer/auth/**", (route) => {
  74  |     if (route.request().url().endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
  75  |     return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { user } : {} });
  76  |   });
  77  |   await page.route("**/customer/orders?*", (route) => route.fulfill({ status: orderState === "error" ? 503 : 200, json: { data: orderState === "empty" ? [] : [{ ...detail, itemCount: 2 }], meta: { page: 1, pageSize: 10, totalItems: orderState === "empty" ? 0 : 1, totalPages: orderState === "empty" ? 0 : 1 } } }));
  78  |   await page.route("**/customer/orders/*", (route) => route.fulfill({ json: detail }));
  79  |   await page.route("**/orders/guest/lookup", (route) => route.fulfill({ json: tracked }));
  80  |   // Only the guarded local menu is read. Order/auth fixtures do not submit data.
  81  |   for (const width of [1440, 768, 390, 320]) {
  82  |     await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
  83  |     authenticated = false;
  84  |     await page.goto("/");
  85  |     const productButton = page.getByRole("button", { name: "View Golden Path Pizza" });
  86  |     await expect(productButton).toBeVisible();
  87  |     await audit(page, browserName, "storefront", width);
  88  |     if (width < 768) {
  89  |       const opener = page.getByRole("button", { name: "Open customer navigation" });
  90  |       await opener.click();
  91  |       const navigation = page.getByRole("dialog", { name: "Customer navigation" });
  92  |       await expect(navigation).toBeVisible();
  93  |       await audit(page, browserName, "mobile-navigation", width);
  94  |       for (const name of ["Menu", "Track order", "Sign in"]) {
  95  |         await page.keyboard.press("Tab");
  96  |         await expect(navigation.getByRole("link", { name, exact: true })).toBeFocused();
  97  |       }
  98  |       for (let i = 0; i < 12; i++) {
  99  |         await page.keyboard.press("Tab");
  100 |         expect(await navigation.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  101 |       }
  102 |       await page.keyboard.press("Escape");
  103 |       await expect(opener).toBeFocused();
  104 |     }
  105 |     await productButton.click();
  106 |     const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
  107 |     await expect(product).toBeVisible();
  108 |     await audit(page, browserName, "configurator", width);
  109 |     for (let i = 0; i < 18; i++) {
  110 |       await page.keyboard.press("Tab");
  111 |       expect(await product.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  112 |     }
  113 |     await page.keyboard.press("Escape");
  114 |     await expect(productButton).toBeFocused();
  115 |     await page.keyboard.press("Enter");
> 116 |     await expect(product).toBeVisible();
      |                                                          ^ Error: locator.click: Test timeout of 600000ms exceeded.
  117 |     await product.getByRole("radio", { name: /^Large/ }).click();
  118 |     await product.getByRole("button", { name: /^Add to cart/ }).click();
  119 |     const cart = page.getByRole("dialog", { name: "Your Cart" });
  120 |     await expect(cart).toBeVisible();
  121 |     await audit(page, browserName, "cart", width);
  122 |     for (let i = 0; i < 12; i++) {
  123 |       await page.keyboard.press("Tab");
  124 |       expect(await cart.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  125 |     }
  126 |     await cart.getByRole("button", { name: "Close cart" }).click();
  127 |     const cartOpener = page.getByRole("button", { name: "Open cart", exact: true });
  128 |     await cartOpener.click();
  129 |     await page.keyboard.press("Escape");
  130 |     await expect(cartOpener).toBeFocused();
  131 |     await page.goto("/checkout");
  132 |     await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  133 |     await audit(page, browserName, "checkout-pickup", width);
  134 |     await page.getByRole("button", { name: /Delivery/ }).click();
  135 |     await expect(page.getByLabel("Address", { exact: true })).toBeVisible();
  136 |     await audit(page, browserName, "checkout-delivery", width);
  137 |     await page.goto("/order-success");
  138 |     await expect(page.getByRole("heading", { name: "Order details unavailable" })).toBeVisible();
  139 |     await audit(page, browserName, "confirmation-missing", width);
  140 |     await page.goto("/order-success?orderNumber=157001&totalCents=4120&orderType=PICKUP");
  141 |     await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  142 |     await audit(page, browserName, "confirmation", width);
  143 |     for (const route of ["login", "register", "track-order"]) {
  144 |       await page.goto(`/${route}`);
  145 |       await expect(page.getByRole("main")).toBeVisible();
  146 |       await expect(page.getByRole("button", { name: route === "login" ? "Sign in" : route === "register" ? "Create account" : "Track Order", exact: true })).toBeEnabled();
  147 |       await audit(page, browserName, route, width);
  148 |     }
  149 |     await page.getByRole("button", { name: "Track Order", exact: true }).click();
  150 |     await expect(page.getByLabel("Order number", { exact: true })).toBeFocused();
  151 |     await audit(page, browserName, "tracking-invalid", width);
  152 |     await page.getByLabel("Order number", { exact: true }).fill("157001");
  153 |     await page.getByLabel("Email or phone", { exact: true }).fill(user.email);
  154 |     await page.getByRole("button", { name: "Track Order", exact: true }).click();
  155 |     await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeFocused();
  156 |     await audit(page, browserName, "tracking-result", width);
  157 |     authenticated = true;
  158 |     await page.goto("/account");
  159 |     await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
  160 |     await audit(page, browserName, "account", width);
  161 |     await page.locator("summary").filter({ hasText: "Change password" }).click();
  162 |     await audit(page, browserName, "security", width);
  163 |     await page.goto("/account/orders");
  164 |     await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeVisible();
  165 |     await audit(page, browserName, "orders", width);
  166 |     await page.getByRole("link", { name: "View order", exact: true }).click();
  167 |     await expect(page.getByRole("heading", { name: "Items", exact: true })).toBeVisible();
  168 |     await audit(page, browserName, "order-detail", width);
  169 |     await page.evaluate(() => localStorage.clear());
  170 |   }
  171 |   orderState = "empty";
  172 |   await page.goto("/account/orders");
  173 |   await expect(page.getByRole("heading", { name: "No signed-in orders yet" })).toBeVisible();
  174 |   await audit(page, browserName, "orders-empty", 320);
  175 |   orderState = "error";
  176 |   await page.reload();
  177 |   await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  178 |   await audit(page, browserName, "orders-error", 320);
  179 |   authenticated = false;
  180 |   await page.setViewportSize({ width: 1440, height: 900 });
  181 |   await page.goto("/login");
  182 |   await page.emulateMedia({ reducedMotion: "reduce" });
  183 |   await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  184 |   await audit(page, browserName, "login-root-text-200-percent", 1440);
  185 |   await page.setViewportSize({ width: 844, height: 390 });
  186 |   await page.goto("/");
  187 |   await expect(page.getByRole("button", { name: "View Golden Path Pizza" })).toBeVisible();
  188 |   await audit(page, browserName, "landscape", 844);
  189 | });
  190 | 
  191 | test("native browser performance diagnostics on the optimized local build", async ({ page, browserName, browser }) => {
  192 |   test.skip(browserName !== "chromium", "Consistent Chromium lab conditions; not field INP.");
  193 |   await page.setViewportSize({ width: 390, height: 844 });
  194 |   await page.addInitScript(`
  195 |     window.__auditMetrics = { lcp: null, cls: 0, shifts: [], longTasks: [], events: [] };
  196 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.lcp = entry.startTime; }).observe({type:'largest-contentful-paint', buffered:true});
  197 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) { window.__auditMetrics.cls += entry.value; window.__auditMetrics.shifts.push({value:entry.value, time:entry.startTime, sources:entry.sources.map(source => ({tag:source.node?.tagName,id:source.node?.id,previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))}); } }).observe({type:'layout-shift', buffered:true});
  198 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.longTasks.push(entry.duration); }).observe({type:'longtask', buffered:true});
  199 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.events.push({name:entry.name,duration:entry.duration}); }).observe({type:'event', buffered:true, durationThreshold:16});
  200 |   `);
  201 |   const samples = [];
  202 |   for (const route of ["/", "/", "/", "/login", "/login", "/login", "/register", "/register", "/register", "/track-order"]) {
  203 |     await page.goto(route);
  204 |     await expect(page.getByRole("main")).toBeVisible();
  205 |     await page.waitForTimeout(1500); // Fixed observation window, not a readiness assertion.
  206 |     const sample = await page.evaluate(() => ({
  207 |       metrics: (window as unknown as { __auditMetrics: unknown }).__auditMetrics,
  208 |       navigation: performance.getEntriesByType("navigation").map((entry) => entry.toJSON()),
  209 |       resources: performance.getEntriesByType("resource").map((entry) => entry.toJSON()),
  210 |       images: Array.from(document.images).map((image) => ({ src: image.currentSrc, loading: image.loading, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight })),
  211 |     }));
  212 |     samples.push({ route, ...sample });
  213 |   }
  214 |   await page.goto("/");
  215 |   const start = await page.evaluate(() => performance.now());
  216 |   await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
```