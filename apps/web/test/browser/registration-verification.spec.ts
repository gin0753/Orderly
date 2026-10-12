import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { deliveredRegistrationToken, openVerification } from "./verified-registration-helpers";

test.use({ trace: "off", screenshot: "off", video: "off" });
for (const width of [1440, 390, 320]) {
  test(`owner establishes credentials across browsers with refresh and accessible layout at ${width}px`, async ({ page, browser }) => {
    await page.setViewportSize({ width, height: 900 });
    const email = `verification.${width}@browser.example.test`;
    // Mock delivery acknowledgement; API delivery/activation races are tested against PostgreSQL.
    await page.route("**/api/customer/auth/register", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ status: "pending", retryAfterSeconds: 60 }) }));
    await page.goto("/register");
    await page.getByLabel("Name").fill("Initial Name");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    const secret = await deliveredRegistrationToken(email);
    const context = await browser.newContext({ baseURL: "http://localhost:3000", viewport: { width, height: 900 } });
    const owner = await context.newPage();
    await openVerification(owner, secret);
    await owner.reload();
    await expect(owner.getByRole("form", { name: "Finish registration" })).toBeVisible();
    expect(await owner.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect((await new AxeBuilder({ page: owner }).analyze()).violations).toEqual([]);
    await owner.getByLabel("Name", { exact: true }).fill("Mailbox Owner");
    await owner.getByLabel("Password", { exact: true }).fill("Owner chosen browser password 123!");
    await owner.getByLabel("Confirm password").fill("Owner chosen browser password 123!");
    await owner.getByRole("button", { name: "Verify email and create account" }).focus();
    await owner.keyboard.press("Enter");
    await expect(owner.getByRole("heading", { name: "Email verified" })).toBeVisible();
    expect(owner.url().includes("#")).toBe(false);
    await owner.getByRole("link", { name: "Continue to your account" }).click();
    await expect(owner.getByLabel("Name", { exact: true })).toHaveValue("Mailbox Owner");
    // Initiating browser never receives the mailbox owner's session.
    expect((await page.context().cookies()).some((cookie) => cookie.name === "orderly_customer_access")).toBe(false);
    await owner.goto("/verify-email");
    await owner.evaluate((value) => { location.hash = `token=${value}`; }, secret);
    await owner.reload();
    await expect(owner.getByRole("alert").filter({ hasText: "invalid or expired" })).toContainText("invalid or expired");
    await context.close();
  });
}

test('invalid links and delivery failures announce actionable states', async ({ page }) => {
  await page.goto('/verify-email');
  await expect(page.getByRole('alert').filter({ hasText: /invalid or expired|delivery failed/ })).toContainText('invalid or expired');
  await page.route('**/api/customer/auth/register', (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ status: 'delivery_failed', retryAfterSeconds: 60 }) }));
  await page.goto('/register');
  await page.getByLabel('Name').fill('Delivery Fixture');
  await page.getByLabel('Email').fill('delivery@browser.example.test');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: /invalid or expired|delivery failed/ })).toContainText('delivery failed');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
