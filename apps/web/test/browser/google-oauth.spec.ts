import { expect, test, type BrowserContext } from "@playwright/test";
import { createRequire } from "node:module";

const requireFromTest = createRequire(__filename);
const { PrismaClient } = requireFromTest("../../../api/node_modules/@prisma/client") as {
  PrismaClient: new (options: { datasources: { db: { url: string } } }) => {
    customerUser: { findMany: (args: { where: { email: string }; select: { id: true; googleSubject: true } }) => Promise<Array<{ id: string; googleSubject: string | null }>> };
    $disconnect: () => Promise<void>;
  };
};
const password = "Browser link password 123!";
const linkedEmail = "google.link.browser@example.com";
let linkedCookies: Parameters<BrowserContext["addCookies"]>[0] = [];

test.describe.configure({ mode: "serial" });

async function customerIds(email: string) {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required for OAuth browser checks.");
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try { return await prisma.customerUser.findMany({ where: { email }, select: { id: true, googleSubject: true } }); }
  finally { await prisma.$disconnect(); }
}

test("new Google customer keeps a session across reload and returns to checkout", async ({ page }) => {
  const peer = await page.context().newPage();
  await peer.goto("/");
  await expect(peer.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.goto("/login?returnTo=%2Fcheckout");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("heading", { name: "Controlled Google provider" })).toBeVisible();
  await page.getByRole("link", { name: "Continue as new", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(peer.getByRole("link", { name: "Account" })).toBeVisible();
  await page.goto("/account");
  await expect(page.getByLabel("Email")).toHaveValue("google.browser@example.com");
  await expect(page.getByText("Not configured", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Email")).toHaveValue("google.browser@example.com");
  const before = await customerIds("google.browser@example.com");
  expect(before).toHaveLength(1);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(peer.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.getByRole("link", { name: "Continue as new", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  expect(await customerIds("google.browser@example.com")).toEqual(before);
  await peer.close();
});

test("matching password email blocks anonymous Google linking, then explicit linking succeeds", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("Web Link Customer");
  await page.getByLabel("Email").fill(linkedEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  const original = await customerIds(linkedEmail);
  expect(original).toHaveLength(1);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.getByRole("link", { name: "Continue as web-conflict" }).click();
  await expect(page).toHaveURL(/\/login\?google=conflict$/);
  await expect(page.getByText(/Sign in with your password, then connect Google/)).toBeVisible();
  expect(await customerIds(linkedEmail)).toEqual(original);

  await page.getByLabel("Email").fill(linkedEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByLabel("Current password to connect Google").fill(password);
  await page.getByRole("button", { name: "Connect Google" }).click();
  await page.getByRole("link", { name: "Continue as web-link" }).click();
  await expect(page).toHaveURL(/\/account\?google=connected$/);
  await expect(page.getByText("Google is connected to your account.")).toBeVisible();
  expect(await customerIds(linkedEmail)).toEqual([{ id: original[0].id, googleSubject: "google-web-link" }]);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.getByRole("link", { name: "Continue as web-link" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByLabel("Email")).toHaveValue(linkedEmail);
  expect(await customerIds(linkedEmail)).toEqual([{ id: original[0].id, googleSubject: "google-web-link" }]);
  linkedCookies = await page.context().cookies();
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`Google auth surfaces fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of ["/login", "/register"]) {
      await page.goto(route);
      await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await page.context().addCookies(linkedCookies);
    await page.goto("/account");
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Sign-in methods" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
