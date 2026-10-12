import { verifiedRegistration } from "./verified-registration-helpers";
import { expect, test } from "@playwright/test";

// Never retain network bodies or receipt-bearing DOM screenshots from this suite.
test.use({ trace: "off", screenshot: "off", video: "off" });
test.beforeAll(async ({ browser }) => { console.log(`Receipt regression browser: ${browser.browserType().name()} ${browser.version()}`); });

for (const width of [1440, 390, 320]) {
  test(`guest receipt survives refresh, history and saved-code resumption at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
    const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
    await dialog.getByRole("radio", { name: "Large" }).click();
    await dialog.getByRole("button", { name: /^Add to cart/ }).click();
    await page.getByRole("link", { name: "Continue to checkout" }).click();
    await page.getByLabel("Full name").fill("Receipt Fixture");
    await page.getByLabel("Phone number").fill("0400 123 456");
    await page.getByLabel("Email address").fill("receipt.fixture@example.test");
    // Mobile sticky action includes an arrow; desktop uses the summary action.
    const placeOrder = page.getByRole("button", { name: /^Place Order/ }).filter({ visible: true });
    await expect(placeOrder).toBeEnabled();
    await placeOrder.click();
    await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
    const code = await page.getByLabel("Receipt code", { exact: true }).inputValue();
    const number = (await page.getByText(/^#\d+$/).textContent())!.slice(1);
    expect(/^[A-Za-z0-9_-]{43}$/.test(code)).toBe(true);
    expect(page.url().includes(code)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.reload();
    expect((await page.getByLabel("Receipt code", { exact: true }).inputValue()) === code).toBe(true);
    await page.getByRole("link", { name: "Track your order" }).click();
    await expect(page.getByRole("heading", { name: `Order #${number}`, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: `Order #${number}`, exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole("heading", { name: `Order #${number}`, exact: true })).toBeVisible();
    expect(page.url().includes(code)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

    // A new tab has no tab-local receipt; a deliberately saved code restores access.
    const resumed = await context.newPage();
    await resumed.goto(`/track-order/${number}`);
    await expect(resumed.getByRole("heading", { name: "Verify your order first" })).toBeVisible();
    await resumed.getByRole("button", { name: "Track order", exact: true }).click();
    await resumed.getByLabel("Receipt code", { exact: true }).fill(code);
    await resumed.getByRole("button", { name: "Track Order", exact: true }).click();
    await expect(resumed.getByRole("heading", { name: `Order #${number}`, exact: true })).toBeVisible();
    expect(resumed.url().includes(code)).toBe(false);
    await resumed.close();
  });
}

test("authenticated owner tracks independently of receipt and checkout contact email", async ({ page }) => {
  page.on("response", (response) => {
    if (new URL(response.url()).pathname === "/api/orders/guest/lookup") console.log(`Owner tracking diagnostic: ${response.status()}`);
  });
  await page.goto("/register");
  await verifiedRegistration(page, { name: "Receipt Owner", email: "receipt.owner@example.test", password: "Receipt owner password 123!" });
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/");
  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
  await dialog.getByRole("radio", { name: "Large" }).click();
  await dialog.getByRole("button", { name: /^Add to cart/ }).click();
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByLabel("Phone number").fill("0400 123 456");
  await page.getByLabel("Email address").fill("receipt.contact@example.test");
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  const number = (await page.getByText(/^#\d+$/).textContent())!.slice(1);
  await page.getByRole("button", { name: "Forget on this tab" }).click();
  await page.getByRole("link", { name: "Track your order" }).click();
  await expect(page.getByRole("heading", { name: `Order #${number}`, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: `Order #${number}`, exact: true })).toBeVisible();
});

// Clear receipt-bearing input values before diagnostic failure snapshots are collected.
test.afterEach(async ({ context }) => {
  for (const page of context.pages()) {
    await page.evaluate(() => {
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-private="true"]').forEach((input) => { input.value = "[redacted]"; });
      sessionStorage.removeItem("orderly:tracking-lookup");
    }).catch(() => {});
  }
});
