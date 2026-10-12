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
    let checks = 0;
    const checkStatuses: number[] = [];
    const checkIds = new WeakMap<object, number>();
    owner.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/customer/auth/registration/check") {
        checkIds.set(request, ++checks);
        console.log(`Verification diagnostic: width=${width} check=${checks} started`);
      }
    });
    owner.on("response", (response) => {
      if (new URL(response.url()).pathname === "/api/customer/auth/registration/check") {
        checkStatuses.push(response.status());
        console.log(`Verification diagnostic: width=${width} check=${checkIds.get(response.request())} status=${response.status()}`);
      }
    });
    owner.on("requestfailed", (request) => {
      if (new URL(request.url()).pathname === "/api/customer/auth/registration/check") {
        console.log(`Verification diagnostic: width=${width} check=${checkIds.get(request)} networkFailure=true`);
      }
    });
    owner.on("console", (message) => {
      if (/^Verification state: (checking|pending|invalid|unavailable|complete)$|^Verification replay: emptyLinkSettled=(true|false)$/.test(message.text())) {
        console.log(`Verification diagnostic: width=${width} ${message.text()}`);
      }
    });
    await owner.addInitScript(() => {
      let previous = "";
      const observe = () => {
        const text = document.querySelector("main")?.textContent ?? "";
        const state = text.includes("We could not check this link") ? "unavailable"
          : text.includes("This verification link is invalid or expired") ? "invalid"
          : text.includes("Verification completed") ? "complete"
          : document.querySelector('form[aria-label="Finish registration"]') ? "pending"
          : text.includes("Checking verification link") ? "checking" : "";
        if (state && state !== previous) { previous = state; console.log(`Verification state: ${state}`); }
      };
      new MutationObserver(observe).observe(document, { childList: true, subtree: true });
    });
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
    // Navigation load can precede the component's first effect. Set the fragment
    // only after that empty-link check settles, then make one deliberate replay.
    await expect(owner.getByText("This verification link is invalid or expired. Request a new email.", { exact: true })).toBeVisible();
    await owner.evaluate((value) => {
      console.log(`Verification replay: emptyLinkSettled=${document.querySelector("main")?.textContent?.includes("This verification link is invalid or expired") ?? false}`);
      window.history.replaceState(null, "", `/verify-email#token=${value}`);
    }, secret);
    await owner.reload();
    await expect(owner.getByRole("alert").filter({ hasText: "invalid or expired" })).toContainText("invalid or expired");
    expect(checks).toBe(3);
    expect(checkStatuses).toEqual([200, 200, 400]);
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
