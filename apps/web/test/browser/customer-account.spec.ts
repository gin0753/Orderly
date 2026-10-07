import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const email = "account.stage135.browser@example.test";
const oldPassword = "Account browser password 123!";
const newPassword = "Account browser password 456!";
const linkedEmail = "other.browser@example.com";
const linkedPassword = "Account link password 123!";

test("profile persists and password change replaces the session across browsers", async ({ page, browser }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("Before Name");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page.getByLabel("Confirm password").fill(oldPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);

  const peerContext = await browser.newContext({ baseURL: "http://localhost:3000" });
  const peer = await peerContext.newPage();
  await peer.goto("/login");
  await peer.getByLabel("Email").fill(email);
  await peer.getByLabel("Password", { exact: true }).fill(oldPassword);
  await peer.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(peer).toHaveURL(/\/account$/);

  await page.getByLabel("Name").fill("After Name");
  await page.getByLabel(/Phone/).fill("+61 400 123 456");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Name")).toHaveValue("After Name");
  await expect(page.getByLabel(/Phone/)).toHaveValue("+61 400 123 456");

  await page.getByLabel("Current password", { exact: true }).fill(oldPassword);
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password").fill(newPassword);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText(/Other sessions have been signed out/)).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("After Name");
  await page.reload();
  await expect(page).toHaveURL(/\/account$/);
  await peer.reload();
  await expect(peer).toHaveURL(/\/login\?returnTo=%2Faccount/);
  await peerContext.close();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("linked and Google-only accounts show their available methods", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("Linked Account");
  await page.getByLabel("Email").fill(linkedEmail);
  await page.getByLabel("Password", { exact: true }).fill(linkedPassword);
  await page.getByLabel("Confirm password").fill(linkedPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByLabel("Current password to connect Google").fill(linkedPassword);
  await page.getByRole("button", { name: "Connect Google" }).click();
  await page.getByRole("link", { name: "Continue as other" }).click();
  await expect(page).toHaveURL(/\/account\?google=connected$/);
  await expect(page.getByText("Connected", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Change password" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Unlink/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.getByRole("link", { name: "Continue as new", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText("Password is not configured for this account.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Change password" })).toHaveCount(0);
  await expect(page.getByText("Connected", { exact: true })).toHaveCount(1);
});

test("account forms fit desktop, tablet, and narrow mobile viewports", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change password" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
