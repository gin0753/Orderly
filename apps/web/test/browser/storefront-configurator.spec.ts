import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(__filename);
const { assertDestructiveTestDatabaseAllowed } = require("../../../api/test/test-database-url.cjs");
const { PrismaClient } = require("../../../api/node_modules/@prisma/client");

test("storefront and configurator at desktop, mobile and short viewports", async ({ page }) => {
  test.setTimeout(120_000);
  const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const product = await prisma.product.findFirstOrThrow({ where: { name: "Golden Path Pizza" } });
  const captureDirectory = process.env.ORDERLY_STOREFRONT_CAPTURE_DIR;
  const visualProductIds: string[] = [];
  if (captureDirectory) await mkdir(path.resolve(captureDirectory), { recursive: true });
  try {
    // Use the same existing food photography before and after; restore the guarded test fixture.
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl: "/images/menu/roasted-mushroom-pizza-v1.webp" } });
    for (const [index, [name, image]] of [["Pepperoni photo sample", "pepperoni-pizza"], ["Carbonara photo sample", "creamy-carbonara"], ["Wings photo sample", "chicken-wings"]].entries()) {
      const visualProduct = await prisma.product.create({ data: {
        categoryId: product.categoryId, name, description: "Existing menu photography, used only for visual regression.",
        basePrice: "12.00", isAvailable: true, sortOrder: index + 2, imageUrl: `/images/menu/${image}-v1.webp`,
      } });
      visualProductIds.push(visualProduct.id);
    }
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.getByRole("link", { name: "Browse menu" })).toBeVisible();
      await expect(page.locator("#homepage-hero-title")).toHaveCSS("font-size", viewport.width >= 1024 ? "56px" : viewport.width < 359 ? "32px" : "36px");
      await expect(page.getByRole("link", { name: "Browse menu" })).toBeInViewport();
      await expect(page.getByRole("heading", { name: "Golden Path Pizza" })).toBeVisible();
      await page.locator("img").evaluateAll(async (images) => {
        await Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => undefined)));
      });
      if (captureDirectory) await page.screenshot({ path: path.resolve(captureDirectory, `storefront-${viewport.width}.png`), fullPage: true });
      const opener = page.getByRole("button", { name: "View Golden Path Pizza" });
      await opener.click();
      const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
      await expect(dialog.getByRole("button", { name: "Close product details" })).toBeFocused();
      await expect(dialog.getByRole("heading", { name: "Golden Path Pizza", exact: true })).toBeInViewport();
      const identity = dialog.locator(".storefront-product-heading");
      await expect(identity.getByText(/Base price.*\$14\.00/)).toBeInViewport();
      await expect(dialog.getByRole("img", { name: "Golden Path Pizza", exact: true })).toHaveCSS("object-fit", "contain");
      await dialog.getByRole("img", { name: "Golden Path Pizza", exact: true }).evaluate((image: HTMLImageElement) => image.decode());
      if (captureDirectory) await page.screenshot({ path: path.resolve(captureDirectory, `configurator-initial-${viewport.width}.png`) });
      await dialog.getByRole("radio", { name: /^Small/ }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(dialog.getByRole("radio", { name: /^Large/ })).toHaveAttribute("aria-checked", "true");
      await dialog.getByRole("checkbox", { name: /^Extra Cheese/ }).click();
      await expect(dialog.getByRole("button", { name: /^Add to cart/ })).toHaveText(/20\.00/);
      await expect(dialog.getByRole("button", { name: /^Add to cart/ })).toBeInViewport();
      await expect(dialog.getByRole("button", { name: "Close product details" })).toBeInViewport();
      await expect(dialog.getByRole("status")).toHaveText(/Item total.*20\.00/);
      await expect(dialog.getByRole("radio", { name: /^Small/ })).toHaveText(/Default/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (captureDirectory) await page.screenshot({ path: path.resolve(captureDirectory, `configurator-${viewport.width}.png`) });
      await dialog.locator(".overflow-y-auto").evaluate((content) => { content.scrollTop = content.scrollHeight; });
      await expect(dialog.getByRole("button", { name: "Increase quantity" })).toBeInViewport();
      await expect(dialog.getByRole("button", { name: /^Add to cart/ })).toBeInViewport();
      await expect(dialog.getByRole("button", { name: "Close product details" })).toBeInViewport();
      if (viewport.width < 768) {
        await expect(dialog.getByRole("heading", { name: "Golden Path Pizza", exact: true })).toBeInViewport();
        await expect(identity.getByText(/Base price.*\$14\.00/)).toBeInViewport();
        const photoBox = await dialog.locator(".storefront-configurator-photo").boundingBox();
        const identityBox = await identity.boundingBox();
        expect(Math.abs(identityBox!.y - (photoBox!.y + photoBox!.height))).toBeLessThanOrEqual(1);
      }
      if (captureDirectory) await page.screenshot({ path: path.resolve(captureDirectory, `configurator-scrolled-${viewport.width}.png`) });
      await dialog.getByRole("radio", { name: /^Small/ }).click();
      await expect(dialog.getByRole("radio", { name: /^Small/ })).toHaveAttribute("aria-checked", "true");
      const controlBox = await dialog.getByRole("radio", { name: /^Small/ }).boundingBox();
      const headingBox = await identity.boundingBox();
      if (viewport.width < 768) expect(controlBox!.y).toBeGreaterThanOrEqual(headingBox!.y + headingBox!.height);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
    await expect(page.locator(".storefront-configurator")).toHaveCSS("animation-name", "none");
    await page.getByRole("dialog", { name: "Golden Path Pizza" }).getByRole("button", { name: /^Add to cart/ }).click();
    await expect(page.getByRole("dialog", { name: "Your Cart" })).toBeVisible();
    await page.getByRole("button", { name: "Close cart" }).click();
    await expect(page.getByRole("button", { name: "View Golden Path Pizza" })).toBeFocused();
    await expect(page.getByRole("status").filter({ hasText: "Added 1 × Golden Path Pizza" })).toBeVisible();
    await page.getByRole("button", { name: /^Browser Test Pizza/ }).click();
    await expect(page.getByRole("button", { name: /^Browser Test Pizza/ })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /^All/ }).click();
    await expect(page.getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
  } finally {
    await prisma.product.deleteMany({ where: { id: { in: visualProductIds } } });
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl: product.imageUrl } });
    await prisma.$disconnect();
  }
});

test("charcoal hero text, actions and keyboard focus meet contrast goals", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".storefront-hero");
  const ratios = await hero.evaluate((element) => {
    function channels(color: string) { return color.match(/[\d.]+/g)!.slice(0, 3).map(Number); }
    function luminance(values: number[]) {
      const linear = values.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    function contrast(a: number[], b: number[]) {
      const first = luminance(a), second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }
    const surface = channels(getComputedStyle(element).backgroundColor);
    const warmestSurface = surface.map((value, index) => value * 0.86 + [194, 65, 12][index] * 0.14);
    const copy = [...element.querySelectorAll("h1, p")].map((node) => contrast(channels(getComputedStyle(node).color), warmestSurface));
    const actions = [...element.querySelectorAll("a")].map((node) => {
      const styles = getComputedStyle(node);
      return contrast(channels(styles.color), channels(styles.backgroundColor));
    });
    return [...copy, ...actions];
  });
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  const action = page.getByRole("link", { name: "Browse menu" });
  await action.focus();
  await expect(action).toHaveCSS("outline-width", "2px");
  await expect(action).toHaveCSS("outline-color", "rgb(255, 179, 138)");
});
