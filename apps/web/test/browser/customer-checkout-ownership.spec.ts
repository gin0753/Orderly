import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";

const requireFromTest = createRequire(__filename);
const { PrismaClient } = requireFromTest("../../../api/node_modules/@prisma/client") as {
  PrismaClient: new (options: { datasources: { db: { url: string } } }) => {
    order: {
      count: () => Promise<number>;
      findUniqueOrThrow: (args: { where: { orderNumber: string }; select: { customerUserId: true; customerEmail: true } }) => Promise<{ customerUserId: string | null; customerEmail: string }>;
    };
    customerUser: { findUniqueOrThrow: (args: { where: { email: string }; select: { id: true; email: true; phone: true } }) => Promise<{ id: string; email: string; phone: string | null }> };
    customerSession: { deleteMany: (args: { where: { customerUser: { email: string } } }) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  };
};

const email = "owner.stage136.browser@example.test";
const password = "Checkout owner password 123!";
test.describe.configure({ mode: "serial" });

async function database<T>(work: (prisma: InstanceType<typeof PrismaClient>) => Promise<T>) {
  if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is required.");
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
  try { return await work(prisma); } finally { await prisma.$disconnect(); }
}

async function addPizza(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
  await dialog.getByRole("radio", { name: "Large" }).click();
  await dialog.getByRole("button", { name: /^Add to cart/ }).click();
  await page.getByRole("link", { name: "View Cart & Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

async function place(page: Page) {
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  const text = await page.getByText(/^#\d+$/).textContent();
  const orderNumber = text?.slice(1);
  if (!orderNumber) throw new Error("Order number was not shown.");
  return orderNumber;
}

test("guest checkout stays unowned and guest tracking works", async ({ page }) => {
  await addPizza(page);
  await page.getByLabel("Full name").fill("Guest Browser");
  await page.getByLabel("Phone number").fill("0400 123 456");
  await page.getByLabel("Email address").fill("guest.stage136@example.test");
  const number = await place(page);
  const order = await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } }));
  expect(order).toEqual({ customerUserId: null, customerEmail: "guest.stage136@example.test" });
  await page.goto("/track-order");
  await page.getByLabel("Order number").fill(number);
  await page.getByLabel("Email or phone").fill("guest.stage136@example.test");
  await page.getByRole("button", { name: "Track Order" }).click();
  await expect(page).toHaveURL(new RegExp(`/track-order/${number}$`));
});

test("password customer checkout owns the order but keeps contact edits out of the account", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("Owner Browser");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByLabel(/Phone/).fill("+61 400 123 456");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  const owner = await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email }, select: { id: true, email: true, phone: true } }));
  await addPizza(page);
  await expect(page.getByLabel("Full name")).toHaveValue("Owner Browser");
  await expect(page.getByLabel("Email address")).toHaveValue(email);
  await expect(page.getByLabel("Phone number")).toHaveValue("+61 400 123 456");
  await page.getByLabel("Email address").fill("work.stage136@example.test");
  const number = await place(page);
  expect(await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } })))
    .toEqual({ customerUserId: owner.id, customerEmail: "work.stage136@example.test" });
  expect(await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email }, select: { id: true, email: true, phone: true } })))
    .toEqual(owner);
});

test("Google customer checkout creates an owned order", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.getByRole("link", { name: "Continue as new", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  const googleEmail = "google.browser@example.com";
  const owner = await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email: googleEmail }, select: { id: true, email: true, phone: true } }));
  await addPizza(page);
  await expect(page.getByLabel("Email address")).toHaveValue(googleEmail);
  await page.getByLabel("Phone number").fill("0400 999 888");
  const number = await place(page);
  expect(await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } })))
    .toEqual({ customerUserId: owner.id, customerEmail: googleEmail });
});

test("expired access refreshes once and creates one owned order", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await addPizza(page);
  const cookies = await page.context().cookies();
  const access = cookies.find((cookie) => cookie.name === "orderly_customer_access");
  if (!access) throw new Error("Customer access cookie is missing.");
  await page.context().addCookies([{ ...access, value: "expired-access" }]);
  const countBefore = await database((prisma) => prisma.order.count());
  let orderRequests = 0;
  let refreshRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/orders")) orderRequests += 1;
    if (request.method() === "POST" && request.url().endsWith("/api/customer/auth/refresh")) refreshRequests += 1;
  });
  const number = await place(page);
  expect(orderRequests).toBe(2);
  expect(refreshRequests).toBe(1);
  expect(await database((prisma) => prisma.order.count())).toBe(countBefore + 1);
  const owner = await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email }, select: { id: true, email: true, phone: true } }));
  expect((await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } }))).customerUserId)
    .toBe(owner.id);
});

test("revoked session stops checkout until explicit guest continuation", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await addPizza(page);
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  await page.getByLabel("Full name").fill("Manual Guest Name");
  await page.getByLabel("Email address").fill("manual.guest@example.test");
  await page.getByLabel("Phone number").fill("0400 444 333");
  await page.setViewportSize({ width: 320, height: 568 });
  const countBefore = await database((prisma) => prisma.order.count());
  let revoked = false;
  await page.route("**/api/orders", async (route) => {
    if (!revoked) {
      revoked = true;
      await database((prisma) => prisma.customerSession.deleteMany({ where: { customerUser: { email } } }));
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "Place Order →" }).click();
  await expect(page.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/login?returnTo=%2Fcheckout");
  await expect(page.getByRole("button", { name: "Continue as guest" })).toBeVisible();
  expect(await database((prisma) => prisma.order.count())).toBe(countBefore);
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /session has been cleared/ })).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Manual Guest Name");
  await expect(page.getByLabel("Phone number")).toHaveValue("0400 444 333");
  const number = await placeMobile(page);
  expect(await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } })))
    .toEqual({ customerUserId: null, customerEmail: "manual.guest@example.test" });
  async function placeMobile(current: Page) {
    await current.getByRole("button", { name: "Place Order →" }).click();
    await expect(current.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
    const number = (await current.getByText(/^#\d+$/).textContent())?.slice(1);
    if (!number) throw new Error("Order number was not shown.");
    return number;
  }
});

test("logout clears untouched account prefills while keeping typed details and cart", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await addPizza(page);
  await page.getByLabel("Phone number").fill("0400 777 666");
  await page.getByRole("button", { name: "Account options" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("");
  await expect(page.getByLabel("Email address")).toHaveValue("");
  await expect(page.getByLabel("Phone number")).toHaveValue("0400 777 666");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: viewport.width >= 1024 ? "Place Order" : "Place Order →", exact: true })).toBeVisible();
  }
  await page.getByRole("link", { name: "Sign in", exact: true }).last().click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcheckout$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByLabel("Phone number")).toHaveValue("0400 777 666");
  await expect(page.getByLabel("Full name")).toHaveValue("Owner Browser");
});
