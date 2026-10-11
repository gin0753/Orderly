# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-acceptance.spec.ts >> rendered customer journey, axe and keyboard containment across four widths
- Location: test\browser\final-acceptance.spec.ts:70:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'No signed-in orders yet' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'No signed-in orders yet' })

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- banner:
  - button "Open customer navigation"
  - link "Orderly":
    - /url: /
  - button "Open cart"
- main:
  - status: Checking your session…
- contentinfo:
  - paragraph: Orderly Kitchen
  - paragraph: Comfort food, made easy to order.
  - navigation "Footer navigation":
    - link "Track order":
      - /url: /track-order
    - link "Privacy Policy":
      - /url: /privacy
    - link "Terms of Service":
      - /url: /terms
  - paragraph: © 2026 Orderly Kitchen.
- alert
```

# Test source

```ts
  76  |   const environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, deviceScaleFactor: devicePixelRatio, locale: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  77  |   await writeFile(path.join(evidence, `${browserName}-version.json`), JSON.stringify({ browserName, version: browser.version(), platform: process.platform, ...environment }, null, 2));
  78  |   let authenticated = false;
  79  |   let orderState: "ready" | "empty" | "error" = "ready";
  80  |   await page.route("**/customer/auth/**", (route) => {
  81  |     if (route.request().url().endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
  82  |     return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { user } : {} });
  83  |   });
  84  |   await page.route("**/customer/orders?*", (route) => route.fulfill({ status: orderState === "error" ? 503 : 200, json: { data: orderState === "empty" ? [] : [{ ...detail, itemCount: 2 }], meta: { page: 1, pageSize: 10, totalItems: orderState === "empty" ? 0 : 1, totalPages: orderState === "empty" ? 0 : 1 } } }));
  85  |   await page.route("**/customer/orders/*", (route) => route.fulfill({ json: detail }));
  86  |   await page.route("**/orders/guest/lookup", (route) => route.fulfill({ json: tracked }));
  87  |   // Only the guarded local menu is read. Order/auth fixtures do not submit data.
  88  |   for (const width of isolatedWidth === null ? [1440, 768, 390, 320] : [isolatedWidth]) {
  89  |     await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
  90  |     authenticated = false;
  91  |     await page.goto("/");
  92  |     const productButton = page.getByRole("button", { name: "View Golden Path Pizza" });
  93  |     await expect(productButton).toBeVisible();
  94  |     await audit(page, browserName, "storefront", width);
  95  |     if (width < 768) {
  96  |       const opener = page.getByRole("button", { name: "Open customer navigation" });
  97  |       await opener.click();
  98  |       const navigation = page.getByRole("dialog", { name: "Customer navigation" });
  99  |       await expect(navigation).toBeVisible();
  100 |       await audit(page, browserName, "mobile-navigation", width);
  101 |       for (const name of ["Menu", "Track order", "Sign in"]) {
  102 |         await page.keyboard.press("Tab");
  103 |         await expect(navigation.getByRole("link", { name, exact: true })).toBeFocused();
  104 |       }
  105 |       for (let i = 0; i < 12; i++) {
  106 |         await page.keyboard.press("Tab");
  107 |         expect(await navigation.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  108 |       }
  109 |       await page.keyboard.press("Escape");
  110 |       await expect(opener).toBeFocused();
  111 |     }
  112 |     await productButton.click();
  113 |     const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
  114 |     await expect(product).toBeVisible();
  115 |     await audit(page, browserName, "configurator", width);
  116 |     for (let i = 0; i < 18; i++) {
  117 |       await page.keyboard.press("Tab");
  118 |       expect(await product.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  119 |     }
  120 |     await page.keyboard.press("Escape");
  121 |     await expect(productButton).toBeFocused();
  122 |     await page.keyboard.press("Enter");
  123 |     await expect(product).toBeVisible();
  124 |     await product.getByRole("radio", { name: /^Large/ }).click();
  125 |     await product.getByRole("button", { name: /^Add to cart/ }).click();
  126 |     const cart = page.getByRole("dialog", { name: "Your Cart" });
  127 |     await expect(cart).toBeVisible();
  128 |     await audit(page, browserName, "cart", width);
  129 |     for (let i = 0; i < 12; i++) {
  130 |       await page.keyboard.press("Tab");
  131 |       expect(await cart.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  132 |     }
  133 |     await cart.getByRole("button", { name: "Close cart" }).click();
  134 |     const cartOpener = page.getByRole("button", { name: "Open cart", exact: true });
  135 |     await cartOpener.click();
  136 |     await page.keyboard.press("Escape");
  137 |     await expect(cartOpener).toBeFocused();
  138 |     await page.goto("/checkout");
  139 |     await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  140 |     await audit(page, browserName, "checkout-pickup", width);
  141 |     await page.getByRole("button", { name: /Delivery/ }).click();
  142 |     await expect(page.getByLabel("Address", { exact: true })).toBeVisible();
  143 |     await audit(page, browserName, "checkout-delivery", width);
  144 |     await page.goto("/order-success");
  145 |     await expect(page.getByRole("heading", { name: "Order details unavailable" })).toBeVisible();
  146 |     await audit(page, browserName, "confirmation-missing", width);
  147 |     await page.goto("/order-success?orderNumber=157001&totalCents=4120&orderType=PICKUP");
  148 |     await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  149 |     await audit(page, browserName, "confirmation", width);
  150 |     for (const route of ["login", "register", "track-order"]) {
  151 |       await page.goto(`/${route}`);
  152 |       await expect(page.getByRole("main")).toBeVisible();
  153 |       await expect(page.getByRole("button", { name: route === "login" ? "Sign in" : route === "register" ? "Create account" : "Track Order", exact: true })).toBeEnabled();
  154 |       await audit(page, browserName, route, width);
  155 |     }
  156 |     await page.getByRole("button", { name: "Track Order", exact: true }).click();
  157 |     await expect(page.getByLabel("Order number", { exact: true })).toBeFocused();
  158 |     await audit(page, browserName, "tracking-invalid", width);
  159 |     await page.getByLabel("Order number", { exact: true }).fill("157001");
  160 |     await page.getByLabel("Email or phone", { exact: true }).fill(user.email);
  161 |     await page.getByRole("button", { name: "Track Order", exact: true }).click();
  162 |     await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeFocused();
  163 |     await audit(page, browserName, "tracking-result", width);
  164 |     authenticated = true;
  165 |     await page.goto("/account");
  166 |     await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
  167 |     await audit(page, browserName, "account", width);
  168 |     await page.locator("summary").filter({ hasText: "Change password" }).click();
  169 |     await audit(page, browserName, "security", width);
  170 |     await page.goto("/account/orders");
  171 |     await expect(page.getByRole("heading", { name: "Order #157001", exact: true })).toBeVisible();
  172 |     await audit(page, browserName, "orders", width);
  173 |     await page.getByRole("link", { name: "View order", exact: true }).click();
  174 |     await expect(page.getByRole("heading", { name: "Items", exact: true })).toBeVisible();
  175 |     await audit(page, browserName, "order-detail", width);
> 176 |     await page.evaluate(() => localStorage.clear());
      |                                                                                ^ Error: expect(locator).toBeVisible() failed
  177 |   }
  178 |   if (isolatedWidth === null || isolatedWidth === 320) {
  179 |   orderState = "empty";
  180 |   await page.goto("/account/orders");
  181 |   await expect(page.getByRole("heading", { name: "No signed-in orders yet" })).toBeVisible();
  182 |   await audit(page, browserName, "orders-empty", 320);
  183 |   orderState = "error";
  184 |   await page.reload();
  185 |   await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  186 |   await audit(page, browserName, "orders-error", 320);
  187 |   }
  188 |   if (isolatedWidth === null || isolatedWidth === 1440) {
  189 |   authenticated = false;
  190 |   await page.setViewportSize({ width: 1440, height: 900 });
  191 |   await page.goto("/login");
  192 |   await page.emulateMedia({ reducedMotion: "reduce" });
  193 |   await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  194 |   await audit(page, browserName, "login-root-text-200-percent", 1440);
  195 |   }
  196 |   if (isolatedWidth === null || isolatedWidth === 390) {
  197 |   await page.setViewportSize({ width: 844, height: 390 });
  198 |   await page.goto("/");
  199 |   await expect(page.getByRole("button", { name: "View Golden Path Pizza" })).toBeVisible();
  200 |   await audit(page, browserName, "landscape", 844);
  201 |   }
  202 | });
  203 | }
  204 | 
  205 | test("native browser performance diagnostics on the optimized local build", async ({ page, browserName, browser }) => {
  206 |   test.skip(browserName !== "chromium", "Consistent Chromium lab conditions; not field INP.");
  207 |   await page.setViewportSize({ width: 390, height: 844 });
  208 |   await page.addInitScript(`
  209 |     window.__auditMetrics = { lcp: null, cls: 0, shifts: [], longTasks: [], events: [] };
  210 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.lcp = entry.startTime; }).observe({type:'largest-contentful-paint', buffered:true});
  211 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) { window.__auditMetrics.cls += entry.value; window.__auditMetrics.shifts.push({value:entry.value, time:entry.startTime, sources:entry.sources.map(source => ({tag:source.node?.tagName,id:source.node?.id,previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))}); } }).observe({type:'layout-shift', buffered:true});
  212 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.longTasks.push(entry.duration); }).observe({type:'longtask', buffered:true});
  213 |     new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__auditMetrics.events.push({name:entry.name,duration:entry.duration}); }).observe({type:'event', buffered:true, durationThreshold:16});
  214 |   `);
  215 |   const samples = [];
  216 |   for (const route of ["/", "/", "/", "/login", "/login", "/login", "/register", "/register", "/register", "/track-order"]) {
  217 |     await page.goto(route);
  218 |     await expect(page.getByRole("main")).toBeVisible();
  219 |     await page.waitForTimeout(1500); // Fixed observation window, not a readiness assertion.
  220 |     const sample = await page.evaluate(() => ({
  221 |       metrics: (window as unknown as { __auditMetrics: unknown }).__auditMetrics,
  222 |       navigation: performance.getEntriesByType("navigation").map((entry) => entry.toJSON()),
  223 |       resources: performance.getEntriesByType("resource").map((entry) => entry.toJSON()),
  224 |       images: Array.from(document.images).map((image) => ({ src: image.currentSrc, loading: image.loading, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight })),
  225 |     }));
  226 |     samples.push({ route, ...sample });
  227 |   }
  228 |   await page.goto("/");
  229 |   const start = await page.evaluate(() => performance.now());
  230 |   await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  231 |   await expect(page.getByRole("dialog", { name: "Golden Path Pizza" })).toBeVisible();
  232 |   const dialogActionToVisibleMs = await page.evaluate((before) => performance.now() - before, start);
  233 |   await writeFile(path.join(evidence, "performance.json"), JSON.stringify({
  234 |     browser: browser.version(), viewport: page.viewportSize(), cpuThrottle: "none", networkThrottle: "none",
  235 |     observationWindowMs: 1500, cache: "same context; first cold then warm", deployment: "local next start production build",
  236 |     dialogActionToVisibleMs, proxyIncludesPlaywrightScheduling: true, fieldINP: null, samples,
  237 |   }, null, 2));
  238 | });
  239 | 
  240 | test("fixed checkout controls at top and bottom in four viewports", async ({ page, browserName }) => {
  241 |   let authenticated = false;
  242 |   await page.route("**/customer/auth/**", (route) => {
  243 |     if (route.request().url().endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
  244 |     return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { user } : {} });
  245 |   });
  246 |   for (const width of [1440, 768, 390, 320]) {
  247 |     authenticated = false;
  248 |     await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
  249 |     await page.goto("/");
  250 |     await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  251 |     const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
  252 |     await product.getByRole("radio", { name: /^Large/ }).click();
  253 |     await product.getByRole("button", { name: /^Add to cart/ }).click();
  254 |     await page.getByRole("dialog", { name: "Your Cart" }).getByRole("button", { name: "Close cart" }).click();
  255 |     await page.goto("/checkout");
  256 |     await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  257 |     await audit(page, browserName, "checkout-pickup", width);
  258 |     await page.getByRole("button", { name: /Delivery/ }).click();
  259 |     await audit(page, browserName, "checkout-delivery", width);
  260 |     await page.screenshot({ path: path.join(evidence, browserName, `checkout-viewport-top-${width}.png`), animations: "disabled" });
  261 |     await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  262 |     if (width < 1024) {
  263 |       await expect.poll(async () => {
  264 |         const summary = await page.getByRole("complementary", { name: "Order review" }).boundingBox();
  265 |         const bar = await page.locator(".transaction-checkout-action").boundingBox();
  266 |         return summary!.y + summary!.height - bar!.y;
  267 |       }).toBeLessThanOrEqual(0);
  268 |     }
  269 |     await expect(page.getByRole("button", { name: /^Place Order/ }).filter({ visible: true })).toBeInViewport();
  270 |     await page.screenshot({ path: path.join(evidence, browserName, `checkout-viewport-bottom-${width}.png`), animations: "disabled" });
  271 |     authenticated = true;
  272 |     await page.goto("/account");
  273 |     await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
  274 |     await page.locator("summary").filter({ hasText: "Change password" }).click();
  275 |     await audit(page, browserName, "security", width);
  276 |     await page.evaluate(() => localStorage.clear());
```