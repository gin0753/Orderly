import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertRequiredImageReady, diagnoseOtherImages } from "./image-readiness";

const require = createRequire(__filename);
const { assertDestructiveTestDatabaseAllowed } = require("../../../api/test/test-database-url.cjs");
const { PrismaClient } = require("../../../api/node_modules/@prisma/client");

test("storefront and configurator at desktop, mobile and short viewports", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const product = await prisma.product.findFirstOrThrow({ where: { name: "Golden Path Pizza" } });
  const captureDirectory = process.env.ORDERLY_STOREFRONT_CAPTURE_DIR;
  const visualProductIds: string[] = [];
  const imageRequests: Record<string, unknown>[] = [];
  const imageObservationStarted = Date.now();
  const imagePath = (value: string) => {
    const url = new URL(value);
    const asset = url.searchParams.get("url");
    const safeAsset = asset?.match(/^\/images\/menu\/[a-z0-9-]+\.(?:webp|png|jpg|jpeg|svg)$/i)?.[0];
    return url.pathname === "/_next/image" && safeAsset
      ? `${url.pathname}?url=${encodeURIComponent(safeAsset)}&w=${Number(url.searchParams.get("w"))}&q=${Number(url.searchParams.get("q"))}`
      : url.pathname;
  };
  const record = (event: string, request: import("@playwright/test").Request, extra = {}) => {
    if (request.resourceType() === "image") imageRequests.push({ event, path: imagePath(request.url()), viewport: page.viewportSize(), atMs: Date.now() - imageObservationStarted, ...extra });
  };
  page.on("request", (request) => record("request", request));
  page.on("response", (response) => {
    record("response", response.request(), { status: response.status(), cache: response.headers()["x-nextjs-cache"], contentType: response.headers()["content-type"] });
  });
  page.on("requestfinished", (request) => record("finished", request, { timing: request.timing() }));
  page.on("requestfailed", (request) => {
    record("failed", request, { failure: request.failure()?.errorText.match(/^net::[A-Z_]+/)?.[0] ?? "request-failed" });
  });
  // Do not attach raw console text: it may contain URLs or customer identifiers.
  page.on("console", (message) => {
    if (message.type() === "error") imageRequests.push({ event: "console-error", code: message.text().match(/net::[A-Z_]+|Minified React error #\d+/)?.[0] ?? "redacted-console-error", httpStatus: Number(message.text().match(/status of (\d{3})/)?.[1]) || undefined, viewport: page.viewportSize(), atMs: Date.now() - imageObservationStarted });
  });
  page.on("pageerror", () => imageRequests.push({ event: "page-error", viewport: page.viewportSize(), atMs: Date.now() - imageObservationStarted }));
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
      // End the previous document before changing responsive image candidates.
      // Otherwise resizing starts optimizer requests that the next navigation cancels.
      await page.goto("about:blank");
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.getByRole("link", { name: "Browse menu" })).toBeVisible();
      await expect(page.locator("#homepage-hero-title")).toHaveCSS("font-size", viewport.width >= 1024 ? "56px" : viewport.width < 359 ? "32px" : "36px");
      await expect(page.getByRole("link", { name: "Browse menu" })).toBeInViewport();
      await expect(page.getByRole("heading", { name: "Golden Path Pizza" })).toBeVisible();
      await assertRequiredImageReady(page.locator(".storefront-hero img"), testInfo, `hero-${viewport.width}`);
      // Explicitly bring each fixture photo into view, including native lazy images.
      // Every fixture is required: fallback/404/zero dimensions or stalled decode fails.
      for (const name of ["Golden Path Pizza", "Pepperoni photo sample", "Carbonara photo sample", "Wings photo sample"]) {
        await assertRequiredImageReady(page.getByRole("button", { name: `View ${name}`, exact: true }).locator("img"), testInfo, `${name}-${viewport.width}`);
      }
      await diagnoseOtherImages(page, testInfo);
      await page.evaluate(() => window.scrollTo(0, 0));
      if (captureDirectory) await page.screenshot({ path: path.resolve(captureDirectory, `storefront-${viewport.width}.png`), fullPage: true });
      const opener = page.getByRole("button", { name: "View Golden Path Pizza" });
      await opener.click();
      const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
      await expect(dialog.getByRole("button", { name: "Close product details" })).toBeFocused();
      await expect(dialog.getByRole("heading", { name: "Golden Path Pizza", exact: true })).toBeInViewport();
      const identity = dialog.locator(".storefront-product-heading");
      await expect(identity.getByText(/Base price.*\$14\.00/)).toBeInViewport();
      await expect(dialog.getByRole("img", { name: "Golden Path Pizza", exact: true })).toHaveCSS("object-fit", "contain");
      await assertRequiredImageReady(dialog.locator("img[alt='Golden Path Pizza']"), testInfo, `configurator-${viewport.width}`);
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
    await expect(page.getByText("Added 1 × Golden Path Pizza to your cart.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /^Browser Test Pizza/ }).click();
    await expect(page.getByRole("button", { name: /^Browser Test Pizza/ })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /^All/ }).click();
    await expect(page.getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
  } finally {
    const requestPath = testInfo.outputPath("storefront-image-requests.json");
    await writeFile(requestPath, JSON.stringify(imageRequests));
    await testInfo.attach("storefront-image-requests", { path: requestPath, contentType: "application/json" });
    await prisma.product.deleteMany({ where: { id: { in: visualProductIds } } });
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl: product.imageUrl } });
    await prisma.$disconnect();
  }
});

const diagnosticSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="orange"/></svg>';

test("image readiness: offscreen lazy photo loads when explicitly inspected", async ({ page }, testInfo) => {
  await page.route("https://image-readiness.test/lazy.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: diagnosticSvg }));
  await page.setContent('<div style="height:6000px"></div><img loading="lazy" width="16" height="16" src="https://image-readiness.test/lazy.svg">');
  const image = page.locator("img");
  // Reproduce the old assumption without leaving the test itself unbounded.
  const oldWait = await image.evaluate((node: HTMLImageElement) => Promise.race([
    node.decode().then(() => "decoded"),
    new Promise<string>((resolve) => setTimeout(() => resolve("pending"), 100)),
  ]));
  expect(oldWait).toBe("pending");
  await assertRequiredImageReady(image, testInfo, "offscreen-fixture", 2_000);
  await expect(image).toBeInViewport();
});

test("image readiness: broken required photo fails instead of passing", async ({ page }, testInfo) => {
  await page.route("https://image-readiness.test/broken.svg", (route) => route.fulfill({ status: 404, body: "Missing image" }));
  await page.setContent('<img width="16" height="16" src="https://image-readiness.test/broken.svg">');
  await expect(assertRequiredImageReady(page.locator("img"), testInfo, "broken-fixture", 500)).rejects.toThrow("load-failed");
});

test("image readiness: stalled required decode fails within its deadline", async ({ page }, testInfo) => {
  await page.setContent(`<img src="data:image/svg+xml,${encodeURIComponent(diagnosticSvg)}">`);
  await page.locator("img").evaluate((image: HTMLImageElement) => {
    image.decode = () => new Promise<void>(() => {});
  });
  await expect(assertRequiredImageReady(page.locator("img"), testInfo, "stalled-fixture", 250)).rejects.toThrow("decode-timeout");
});

test("image readiness: optional decode failure and stall produce explicit diagnostics", async ({ page }, testInfo) => {
  await page.setContent(`<img src="data:image/svg+xml,${encodeURIComponent(diagnosticSvg)}"><img src="data:image/svg+xml,${encodeURIComponent(diagnosticSvg)}">`);
  await page.locator("img").nth(0).evaluate((image: HTMLImageElement) => { image.decode = () => new Promise<void>(() => {}); });
  await page.locator("img").nth(1).evaluate((image: HTMLImageElement) => { image.decode = () => Promise.reject(new Error("Controlled decode failure")); });
  const results = await diagnoseOtherImages(page, testInfo, 100);
  expect(results.map((entry) => entry.outcome)).toEqual(["decode-timeout", "decode-rejected"]);
  expect(testInfo.annotations.filter((entry) => entry.type === "image-warning")).toHaveLength(2);
});

test("image readiness: required decode rejection is not swallowed", async ({ page }, testInfo) => {
  await page.setContent(`<img src="data:image/svg+xml,${encodeURIComponent(diagnosticSvg)}">`);
  await page.locator("img").evaluate((image: HTMLImageElement) => { image.decode = () => Promise.reject(new Error("Controlled decode failure")); });
  await expect(assertRequiredImageReady(page.locator("img"), testInfo, "rejected-fixture", 500)).rejects.toThrow("decode-rejected");
});

test("image readiness: visible pending and broken photos warn while offscreen lazy load is deferred", async ({ page }, testInfo) => {
  await page.route("https://image-readiness.test/slow.svg", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ contentType: "image/svg+xml", body: diagnosticSvg });
  });
  await page.route("https://image-readiness.test/missing.svg", (route) => route.fulfill({ status: 404, body: "Missing image" }));
  await page.setContent('<img width="16" height="16" src="https://image-readiness.test/slow.svg"><img width="16" height="16" src="https://image-readiness.test/missing.svg"><div style="height:6000px"></div><img loading="lazy" width="16" height="16" src="https://image-readiness.test/lazy.svg">', { waitUntil: "domcontentloaded" });
  const results = await diagnoseOtherImages(page, testInfo, 100);
  expect(results.map((entry) => entry.outcome)).toEqual(["load-timeout", "load-failed", "deferred-lazy-offscreen"]);
  expect(testInfo.annotations.filter((entry) => entry.type === "image-warning")).toHaveLength(2);
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
