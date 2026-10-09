import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";

const requireFromTest = createRequire(__filename);
const { PrismaClient } = requireFromTest("../../../api/node_modules/@prisma/client") as {
  PrismaClient: new (options: { datasources: { db: { url: string } } }) => {
    customerUser: { findUniqueOrThrow: (args: { where: { email: string }; select: { id: true } }) => Promise<{ id: string }> };
    order: {
      create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; orderNumber: string }>;
      findUniqueOrThrow: (args: { where: { orderNumber: string }; select: { id: true; customerUserId: true } }) => Promise<{ id: string; customerUserId: string | null }>;
    };
    $disconnect: () => Promise<void>;
  };
};

const ownerEmail = "history.owner.browser@example.test";
const otherEmail = "history.other.browser@example.test";
const password = "History password 123!";
let guestNumber = "";
let ownedId = "";
let ownerId = "";
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
  const number = (await page.getByText(/^#\d+$/).textContent())?.slice(1);
  if (!number) throw new Error("Order number missing.");
  return number;
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test("guest tracking remains separate from later account history", async ({ page }) => {
  await addPizza(page);
  await page.getByLabel("Full name").fill("Guest History");
  await page.getByLabel("Phone number").fill("0400 321 654");
  await page.getByLabel("Email address").fill("guest.history@example.test");
  guestNumber = await place(page);
  await page.goto("/track-order");
  await page.getByLabel("Order number").fill(guestNumber);
  await page.getByLabel("Email or phone").fill("guest.history@example.test");
  await page.getByRole("button", { name: "Track Order" }).click();
  await expect(page).toHaveURL(new RegExp(`/track-order/${guestNumber}$`));
});

test("password customer sees an owned checkout in history and historical detail", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("History Owner");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  ownerId = (await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email: ownerEmail }, select: { id: true } }))).id;
  await addPizza(page);
  await page.getByLabel("Phone number").fill("0400 123 456");
  const number = await place(page);
  const persisted = await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { id: true, customerUserId: true } }));
  ownedId = persisted.id;
  expect(persisted.customerUserId).toBe(ownerId);
  await page.getByRole("button", { name: "Account options" }).click();
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/orders$/);
  await expect(page.getByRole("heading", { name: `Order #${number}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: `Order #${guestNumber}` })).toHaveCount(0);
  await page.getByRole("link", { name: "View order" }).click();
  await expect(page).toHaveURL(new RegExp(`/account/orders/${ownedId}$`));
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
  await expect(page.getByText(/Golden Path Pizza/)).toBeVisible();
  await expect(page.getByText(/Size: Large/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order total" })).toBeVisible();
});

test("status, sort, pagination, and browser history restore URL state", async ({ page }) => {
  await database(async (prisma) => {
    for (let index = 0; index < 12; index += 1) {
      await prisma.order.create({ data: {
        orderNumber: String(13700001 + index), customerUserId: ownerId,
        status: "COMPLETED", orderType: "PICKUP", customerName: "Fixture", customerPhone: "0400123456", customerEmail: ownerEmail,
        subtotalCents: 1000 + index * 100, serviceFeeCents: 120, totalCents: 1120 + index * 100,
        createdAt: new Date(Date.UTC(2026, 0, index + 1)),
        items: { create: { productNameSnapshot: `Historical item ${index}`, quantity: 1, unitPriceCents: 1000 + index * 100, lineTotalCents: 1000 + index * 100 } },
      } });
    }
  });
  await signIn(page, ownerEmail);
  await page.goto("/account/orders?status=COMPLETED&sort=amount_high&page=2");
  await expect(page.getByRole("navigation", { name: "Filter orders by status" }).getByRole("link", { name: "Completed" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("navigation", { name: "Sort orders" }).getByRole("link", { name: "Highest total" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByText(/Page 2 of 2/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Your orders" }).locator("li")).toHaveCount(2);
  await page.getByRole("link", { name: "Previous" }).click();
  await expect(page).toHaveURL(/status=COMPLETED&sort=amount_high$/);
  await expect(page.getByRole("heading", { name: "Order #13700012" })).toBeVisible();
  await page.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2$/);
  await page.getByRole("navigation", { name: "Sort orders" }).getByRole("link", { name: "Lowest total" }).click();
  await expect(page).toHaveURL(/status=COMPLETED&sort=amount_low$/);
  await expect(page.getByRole("heading", { name: "Order #13700001" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/status=COMPLETED&sort=amount_high&page=2$/);
  await expect(page.getByRole("navigation", { name: "Sort orders" }).getByRole("link", { name: "Highest total" })).toHaveAttribute("aria-current", "true");
  await page.goForward();
  await expect(page).toHaveURL(/status=COMPLETED&sort=amount_low$/);
  await expect(page.getByRole("navigation", { name: "Sort orders" }).getByRole("link", { name: "Lowest total" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByText(/Page 1 of 2/)).toBeVisible();
  await page.getByRole("navigation", { name: "Filter orders by status" }).getByRole("link", { name: "Cancelled" }).click();
  await expect(page).toHaveURL(/status=CANCELLED&sort=amount_low$/);
  await expect(page.getByRole("heading", { name: "No matching orders" })).toBeVisible();
});

test("Google customer can open owned history and detail", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("heading", { name: "Controlled Google provider" })).toBeVisible();
  await page.getByRole("link", { name: "Continue as new", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await addPizza(page);
  await page.getByLabel("Phone number").fill("0400 888 999");
  const number = await place(page);
  await page.goto("/account/orders");
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: `Order #${number}` })).toBeVisible();
  await page.getByRole("link", { name: "View order" }).first().click();
  await expect(page).toHaveURL(/\/account\/orders\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
});

test("another customer gets the same not-found detail state for an owned order", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("History Other");
  await page.getByLabel("Email").fill(otherEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto(`/account/orders/${ownedId}`);
  await expect(page.getByRole("heading", { name: "Order not found" })).toBeVisible();
  await page.goto("/account/orders");
  await expect(page.getByRole("heading", { name: "No signed-in orders yet" })).toBeVisible();
});

test("history and detail fit the requested desktop and mobile viewports", async ({ page }) => {
  await signIn(page, ownerEmail);
  const longOrder = await database((prisma) => prisma.order.create({ data: {
    orderNumber: "9".repeat(64), customerUserId: ownerId, status: "PREPARING", orderType: "DELIVERY",
    customerName: "Long History Contact", customerEmail: ownerEmail, customerPhone: "0400123456",
    addressLine1: "123 Long Historical Address Street", city: "Sydney", state: "NSW", postcode: "2000",
    notes: "Long customer note ".repeat(12), subtotalCents: 2000, deliveryFeeCents: 500, serviceFeeCents: 120, totalCents: 2620,
    items: { create: { productNameSnapshot: "HistoricalProductNameWithoutSpaces".repeat(3), quantity: 2, unitPriceCents: 1000, lineTotalCents: 2000,
      options: { create: { optionGroupNameSnapshot: "Extras", optionNameSnapshot: "HistoricalOptionWithoutSpaces".repeat(3), priceDeltaCentsSnapshot: 250 } },
    } },
  } }));
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/account/orders?status=COMPLETED&sort=amount_high&page=2");
    await expect(page.getByRole("navigation", { name: "Filter orders by status" }).getByRole("link", { name: "Completed" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Sort orders" }).getByRole("link", { name: "Highest total" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.goto(`/account/orders/${longOrder.id}`);
    await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
    await expect(page.getByText(/HistoricalOptionWithoutSpaces/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
