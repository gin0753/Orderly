import {
  test,
  expect,
  type Page,
} from "../../apps/web/node_modules/@playwright/test";
import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
const assets = path.resolve(__dirname, "../../docs/portfolio/assets");
const origin = "http://localhost:3000";
test("synthetic portfolio screenshots and Admin walkthrough", async ({
  browser,
}) => {
  mkdirSync(assets, { recursive: true });
  const password = process.env.PORTFOLIO_PASSWORD!;
  const setup = await browser.newContext({ baseURL: origin });
  const adminLogin = await setup.request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email: "portfolio.admin@orderly.test", password },
  });
  expect(adminLogin.ok()).toBeTruthy();
  const adminState = await setup.storageState(); // memory only; never save cookies
  const customer = await browser.newContext({
    baseURL: origin,
    viewport: { width: 1440, height: 900 },
    timezoneId: "Australia/Sydney",
  });
  const customerLogin = await customer.request.post(
    "/api/customer/auth/login",
    {
      headers: {
        Origin: origin,
        "X-Orderly-Client": "customer-web",
        "Content-Type": "application/json",
      },
      data: { email: "alex@portfolio.test", password },
    },
  );
  expect(
    customerLogin.ok(),
    `Customer login HTTP ${customerLogin.status()}: ${await customerLogin.text()}`,
  ).toBeTruthy();
  const page = await customer.newPage();
  async function settle(p: Page) {
    await p.evaluate(async () => {
      await Promise.race([
        Promise.all([
          document.fonts.ready,
          ...Array.from(document.images).map((img) =>
            img.decode().catch(() => {}),
          ),
        ]),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
    });
    await p.waitForTimeout(700);
  }
  async function shot(p: Page, name: string) {
    await settle(p);
    await p.screenshot({
      path: path.join(assets, `${name}.png`),
      animations: "disabled",
      timeout: 15000,
    });
    console.log(`Captured ${name}`);
  }
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "View Margherita", exact: true }),
  ).toBeVisible();
  await shot(page, "customer-storefront");
  await page.evaluate(() => window.scrollTo(0, 510));
  await shot(page, "customer-menu");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page
    .getByRole("button", { name: "View Margherita", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Margherita", exact: true });
  await expect(dialog).toBeVisible();
  await shot(page, "customer-product");
  await dialog.getByRole("button", { name: /^Add to cart/ }).click();
  await expect(page.getByRole("dialog", { name: "Your Cart" })).toBeVisible();
  await shot(page, "customer-cart");
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(
    page.getByRole("heading", { name: "Checkout", exact: true }),
  ).toBeVisible();
  await shot(page, "customer-checkout");
  await page.goto("/account");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    "alex@portfolio.test",
  );
  await shot(page, "customer-account");
  await page.goto("/account/orders");
  await expect(
    page.getByRole("heading", { name: "Order #2101", exact: true }),
  ).toBeVisible();
  await shot(page, "customer-history");
  await customer.close();
  const admin = await browser.newContext({
    baseURL: origin,
    storageState: adminState,
    viewport: { width: 1440, height: 900 },
    timezoneId: "Australia/Sydney",
    recordVideo: {
      dir: path.resolve(__dirname, "../../audit-artifacts/portfolio/raw"),
      size: { width: 1440, height: 900 },
    },
  });
  const p = await admin.newPage();
  const video = p.video()!;
  const start = Date.now();
  const chapters: { seconds: number; caption: string }[] = [];
  async function caption(text: string, hold = 4500) {
    chapters.push({ seconds: (Date.now() - start) / 1000, caption: text });
    await p.evaluate((text) => {
      let el = document.getElementById("portfolio-caption");
      if (!el) {
        el = document.createElement("div");
        el.id = "portfolio-caption";
        document.body.appendChild(el);
      }
      el.textContent = text;
      el.style.cssText =
        "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#15221fee;color:white;padding:14px 24px;border-radius:12px;font:500 17px system-ui;box-shadow:0 4px 20px #0003;white-space:nowrap;pointer-events:none";
    }, text);
    await p.waitForTimeout(hold);
  }
  await p.goto("/admin/orders");
  await expect(
    p.getByRole("heading", { name: "Orders", exact: true }),
  ).toBeVisible();
  await shot(p, "admin-orders");
  await caption(
    "Orderly Admin · Local synthetic data · Order queue and status counts",
  );
  await p.getByRole("button", { name: "New", exact: true }).click();
  await caption("Filter the queue by order status", 3500);
  await p.getByRole("button", { name: "New", exact: true }).click();
  await p.getByPlaceholder("Search orders, customers or items").fill("2101");
  const card = p.getByRole("button", { name: /#2101.*Alex Morgan/s });
  await expect(card).toBeVisible();
  await card.click();
  await caption(
    "Search orders and inspect contact, fulfillment and item snapshots",
  );
  for (const label of [
    "Accept order",
    "Start preparing",
    "Mark as ready",
    "Complete order",
  ]) {
    const action = p.getByRole("button", { name: label, exact: true });
    await expect(action).toBeVisible();
    await action.click();
    await caption(`Validated order transition · ${label}`, 2500);
  }
  await expect(p.getByText("Order completed", { exact: true })).toBeVisible();
  await p.goto("/admin/menu/products");
  await expect(p.getByText("Margherita", { exact: true })).toBeVisible();
  await shot(p, "admin-products");
  await caption(
    "Menu management · Product search, category and availability filters",
  );
  await p.goto("/admin/menu/products/new");
  await p.getByLabel("Product name").fill("Roasted Garden Pizza");
  await p
    .getByLabel("Description", { exact: true })
    .fill("Roasted peppers, mushrooms and fresh basil on a tomato base.");
  await p.getByLabel(/^Category/).selectOption({ label: "Pizza" });
  await p.getByLabel("Base price (AUD)").fill("18.90");
  await p.getByLabel("Image URL").fill("/images/menu/margherita-pizza-v1.webp");
  await caption(
    "Create a product with validated pricing and category assignment",
    3500,
  );
  await p.getByRole("button", { name: "Create product", exact: true }).click();
  await expect(p).toHaveURL(/\/admin\/menu\/products\/[a-f0-9-]+\/edit$/);
  const productId = p.url().split("/").at(-2)!;
  await p.getByLabel("Product name").fill("Roasted Garden Pizza — Seasonal");
  await p.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    p.getByText("Roasted Garden Pizza — Seasonal", { exact: true }),
  ).toBeVisible();
  await caption(
    "Edit product content · Changes persist through the normal save operation",
  );
  const availability = await admin.request.patch(
    `/api/admin/menu/products/${productId}/availability`,
    { headers: { Origin: origin }, data: { isAvailable: false } },
  );
  expect(availability.ok()).toBeTruthy();
  await p.goto("/admin/menu/products");
  await p.getByPlaceholder("Search products...").fill("Roasted Garden");
  await expect(
    p.getByRole("cell", { name: "Unavailable", exact: true }),
  ).toBeVisible();
  await caption(
    "Product availability · Protected API operation (no UI control in V1)",
  );
  const archived = await admin.request.patch(
    `/api/admin/menu/products/${productId}/archive`,
    { headers: { Origin: origin } },
  );
  expect(archived.ok()).toBeTruthy();
  await p.reload();
  await expect(
    p.getByText("Roasted Garden Pizza — Seasonal", { exact: true }),
  ).toHaveCount(0);
  await caption(
    "Product archive · Protected API operation removes it from the active list",
  );
  await p.goto("/admin/menu/categories");
  await expect(p.getByText("Pizza", { exact: true })).toBeVisible();
  await shot(p, "admin-categories");
  await caption("Category management · Edit, activate, archive and restore");
  const pizza = p
    .getByRole("row")
    .filter({ has: p.getByText("Pizza", { exact: true }) });
  await pizza.getByRole("button", { name: "Deactivate", exact: true }).click();
  await expect(
    pizza.getByRole("button", { name: "Activate", exact: true }),
  ).toBeVisible();
  await caption("Control category availability from the Admin interface", 3000);
  await pizza.getByRole("button", { name: "Activate", exact: true }).click();
  await p
    .getByRole("button", { name: "Reorder categories", exact: true })
    .click();
  const handle = p.getByRole("button", { name: "Move Pizza", exact: true });
  const target = p.getByRole("button", { name: "Move Pasta", exact: true });
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Category drag handles unavailable.");
  await p.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await p.mouse.down();
  await p.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 12, {
    steps: 4,
  });
  await p.waitForTimeout(300);
  await p.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 12, {
    steps: 20,
  });
  await p.waitForTimeout(300);
  await p.mouse.up();
  await expect(
    p.getByRole("button", { name: "Save order", exact: true }),
  ).toBeEnabled();
  await caption("Drag to reorder categories · Save the new menu order", 3500);
  await p.getByRole("button", { name: "Save order", exact: true }).click();
  await expect(
    p.getByRole("button", { name: "Reorder categories", exact: true }),
  ).toBeVisible();
  const categories = await admin.request.get("/api/admin/menu/categories");
  expect(categories.ok()).toBeTruthy();
  expect(
    (await categories.json()).data.find(
      (category: { name: string }) => category.name === "Pizza",
    ).sortOrder,
  ).toBe(2);
  await caption(
    "Orderly V1 · Full-stack ordering with separate Customer and Admin authorization",
  );
  await admin.close();
  await video.saveAs(path.join(assets, "admin-walkthrough.webm"));
  writeFileSync(
    path.join(assets, "walkthrough-chapters.json"),
    JSON.stringify(
      { viewport: "1440x900", synthetic: true, chapters },
      null,
      2,
    ),
  );
  await setup.close();
});
