# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-acceptance.spec.ts >> fixed checkout controls at top and bottom in four viewports
- Location: test\browser\final-acceptance.spec.ts:225:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('Full name', { exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByLabel('Full name', { exact: true })

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- banner:
  - link "Orderly":
    - /url: /
  - navigation "Primary navigation":
    - link "Menu":
      - /url: /
    - link "Track order":
      - /url: /track-order
  - link "Sign in":
    - /url: /login?returnTo=%2Fcheckout
  - button "Open cart": 1 $18.00
- main:
  - status "Loading checkout": Loading checkout…
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
  217 |   await expect(page.getByRole("dialog", { name: "Golden Path Pizza" })).toBeVisible();
  218 |   const dialogActionToVisibleMs = await page.evaluate((before) => performance.now() - before, start);
  219 |   await writeFile(path.join(evidence, "performance.json"), JSON.stringify({
  220 |     browser: browser.version(), viewport: page.viewportSize(), cpuThrottle: "none", networkThrottle: "none",
  221 |     observationWindowMs: 1500, cache: "same context; first cold then warm", deployment: "local next start production build",
  222 |     dialogActionToVisibleMs, proxyIncludesPlaywrightScheduling: true, fieldINP: null, samples,
  223 |   }, null, 2));
  224 | });
  225 | 
  226 | test("fixed checkout controls at top and bottom in four viewports", async ({ page, browserName }) => {
  227 |   let authenticated = false;
  228 |   await page.route("**/customer/auth/**", (route) => {
  229 |     if (route.request().url().endsWith("/google/status")) return route.fulfill({ json: { enabled: true } });
  230 |     return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { user } : {} });
  231 |   });
  232 |   for (const width of [1440, 768, 390, 320]) {
  233 |     authenticated = false;
  234 |     await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
  235 |     await page.goto("/");
  236 |     await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  237 |     const product = page.getByRole("dialog", { name: "Golden Path Pizza" });
  238 |     await product.getByRole("radio", { name: /^Large/ }).click();
  239 |     await product.getByRole("button", { name: /^Add to cart/ }).click();
  240 |     await page.getByRole("dialog", { name: "Your Cart" }).getByRole("button", { name: "Close cart" }).click();
> 241 |     await page.goto("/checkout");
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  242 |     await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  243 |     await audit(page, browserName, "checkout-pickup", width);
  244 |     await page.getByRole("button", { name: /Delivery/ }).click();
  245 |     await audit(page, browserName, "checkout-delivery", width);
  246 |     await page.screenshot({ path: path.join(evidence, browserName, `checkout-viewport-top-${width}.png`), animations: "disabled" });
  247 |     await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  248 |     if (width < 1024) {
  249 |       await expect.poll(async () => {
  250 |         const summary = await page.getByRole("complementary", { name: "Order review" }).boundingBox();
  251 |         const bar = await page.locator(".transaction-checkout-action").boundingBox();
  252 |         return summary!.y + summary!.height - bar!.y;
  253 |       }).toBeLessThanOrEqual(0);
  254 |     }
  255 |     await expect(page.getByRole("button", { name: /^Place Order/ }).filter({ visible: true })).toBeInViewport();
  256 |     await page.screenshot({ path: path.join(evidence, browserName, `checkout-viewport-bottom-${width}.png`), animations: "disabled" });
  257 |     authenticated = true;
  258 |     await page.goto("/account");
  259 |     await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
  260 |     await page.locator("summary").filter({ hasText: "Change password" }).click();
  261 |     await audit(page, browserName, "security", width);
  262 |     await page.evaluate(() => localStorage.clear());
  263 |   }
  264 | });
  265 | 
  266 | test("mobile navigation tab-order diagnostic", async ({ page, browserName }) => {
  267 |   await page.route("**/customer/auth/**", (route) => route.fulfill({ status: 401, json: {} }));
  268 |   await page.setViewportSize({ width: 390, height: 844 });
  269 |   await page.goto("/");
  270 |   await page.getByRole("button", { name: "Open customer navigation" }).click();
  271 |   const dialog = page.getByRole("dialog", { name: "Customer navigation" });
  272 |   await expect(dialog).toBeVisible();
  273 |   const sequence = [];
  274 |   for (const key of ["Tab", "Tab", "Tab", "Tab", "Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Alt+Tab", "Alt+Tab", "Alt+Tab", "Alt+Tab"]) {
  275 |     await page.keyboard.press(key);
  276 |     sequence.push({ key, ...(await dialog.evaluate((element) => ({
  277 |       inside: element.contains(document.activeElement), tag: document.activeElement?.tagName,
  278 |       label: document.activeElement?.getAttribute("aria-label"),
  279 |       text: document.activeElement?.textContent?.trim().slice(0, 80),
  280 |       hasFocus: document.hasFocus(),
  281 |     }))) });
  282 |   }
  283 |   await writeFile(path.join(evidence, `${browserName}-navigation-tab-diagnostic.json`), JSON.stringify(sequence, null, 2));
  284 |   expect(sequence.every((step) => step.inside && step.hasFocus)).toBe(true);
  285 |   expect(sequence.map((step) => step.text)).toEqual(expect.arrayContaining(["Menu", "Track order", "Sign in"]));
  286 |   await dialog.getByRole("button", { name: "Close customer navigation" }).focus();
  287 |   await page.keyboard.press("Tab");
  288 |   await expect(dialog.getByRole("link", { name: "Menu", exact: true })).toBeFocused();
  289 |   await page.screenshot({ path: path.join(evidence, browserName, "navigation-focus-after-390.png"), animations: "disabled" });
  290 | });
  291 | 
```