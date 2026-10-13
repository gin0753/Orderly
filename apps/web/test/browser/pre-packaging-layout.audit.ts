import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evidenceDirectory } from "./evidence-output";

// Opt-in isolated render fixtures: no servers, credentials, API or database.
// Generate HTML with pre-packaging-layout.test.tsx before/after the source edit.
const root = path.resolve(__dirname, "../../../..");
const artifacts = path.join(root, "audit-artifacts/pre-packaging");
const screenshots =
  process.env.ORDERLY_CLEANUP_EVIDENCE_DIR ?? evidenceDirectory("cleanup-layout");

test("isolated cleanup layouts retain geometry and keyboard access", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const geometry: Record<string, number> = {};
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const imagePath =
      url.pathname === "/_next/image"
        ? url.searchParams.get("url")
        : url.pathname;
    if (imagePath === "/images/menu/roasted-mushroom-pizza-v1.webp") {
      await route.fulfill({
        contentType: "image/webp",
        body: readFileSync(path.join(root, "apps/web/public", imagePath)),
      });
      return;
    }
    await route.abort();
  });
  for (const phase of ["before", "after"]) {
    const css =
      phase === "before"
        ? readFileSync(path.join(artifacts, "before.css"), "utf8")
        : readdirSync(path.join(root, "apps/web/.next/static/chunks"))
            .filter((file) => file.endsWith(".css"))
            .map((file) =>
              readFileSync(
                path.join(root, "apps/web/.next/static/chunks", file),
                "utf8",
              ),
            )
            .join("\n");
    mkdirSync(path.join(screenshots, phase), { recursive: true });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of [
        "cart",
        "history",
        "admin-toolbar",
        "admin-metrics",
      ]) {
        const html = readFileSync(
          path.join(artifacts, phase, `${name}.html`),
          "utf8",
        );
        await page.setContent(
          `<html><head><base href="http://127.0.0.1:38917"><style>${css}</style></head><body>${html}</body></html>`,
        );
        await expect
          .poll(() =>
            page
              .locator("img")
              .evaluateAll((images) =>
                images.every(
                  (image) =>
                    (image as HTMLImageElement).complete &&
                    (image as HTMLImageElement).naturalWidth > 0,
                ),
              ),
          )
          .toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        geometry[`${phase}/${name}/${width}`] = await page.locator("main").evaluate((element) => element.getBoundingClientRect().height);
        await page.screenshot({
          path: path.join(screenshots, phase, `${name}-${width}.png`),
          fullPage: true,
        });
        if (phase !== "after") continue;
        if (name === "cart") {
          for (const control of await page.getByRole("button").all()) {
            const box = await control.boundingBox();
            expect(box?.height).toBeGreaterThanOrEqual(44);
            expect(box?.width).toBeGreaterThanOrEqual(44);
          }
        }
        if (name === "history") {
          for (const label of ["Filter orders by status", "Sort orders"]) {
            const links = page
              .getByRole("navigation", { name: label })
              .getByRole("link");
            await links.first().focus();
            for (let index = 1; index < (await links.count()); index++)
              await page.keyboard.press("Tab");
            await expect(links.last()).toBeFocused();
            const box = await links.last().boundingBox();
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          }
          await page.screenshot({
            path: path.join(
              screenshots,
              phase,
              `history-keyboard-${width}.png`,
            ),
            fullPage: true,
          });
        }
        if (name === "admin-toolbar") {
          await expect(
            page.getByRole("textbox", {
              name: "Search orders, customers or items",
            }),
          ).toBeVisible();
          await expect(
            page.getByRole("button", { name: "Filters", exact: true }),
          ).toHaveCount(0);
        }
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  expect(await page.locator("main p").first().evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(0.00001);
  for (const name of ["cart", "history", "admin-metrics"]) {
    for (const width of [768, 1440]) expect(geometry[`after/${name}/${width}`]).toBe(geometry[`before/${name}/${width}`]);
    for (const width of [320, 390]) expect(geometry[`after/${name}/${width}`]).toBeLessThan(geometry[`before/${name}/${width}`]);
  }
  writeFileSync(path.join(screenshots, "geometry.json"), JSON.stringify(geometry, null, 2));
});
