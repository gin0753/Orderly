import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";

// Explicit render audit; not an authenticated application journey.
const root = path.resolve(__dirname, "../../../..");
const fixtures = path.join(root, "audit-artifacts/timeline-connectors");
const evidence = path.join(root, "docs/v1-timeline-connector-evidence");

test("timeline connectors meet adjacent markers at mobile and desktop widths", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.route("**/*", (route) => route.abort());
  for (const phase of ["before", "after"]) {
    mkdirSync(path.join(evidence, phase), { recursive: true });
    const css =
      phase === "before"
        ? readFileSync(path.join(fixtures, "before.css"), "utf8")
        : readdirSync(path.join(root, "apps/web/.next/static/chunks"))
            .filter((file) => file.endsWith(".css"))
            .map((file) =>
              readFileSync(
                path.join(root, "apps/web/.next/static/chunks", file),
                "utf8",
              ),
            )
            .join("\n");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const status of [
        "PENDING",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ]) {
        const html = readFileSync(
          path.join(fixtures, phase, `${status}.html`),
          "utf8",
        );
        await page.setContent(
          `<html><head><style>${css}</style></head><body>${html}</body></html>`,
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: path.join(
            evidence,
            phase,
            `${status.toLowerCase()}-${width}.png`,
          ),
          fullPage: true,
        });
        if (phase !== "after") continue;
        const connectors = page.locator("[data-progress-connector]");
        await expect(connectors).toHaveCount(status === "CANCELLED" ? 0 : 3);
        if (status === "CANCELLED") continue;
        const markers = page.locator("li > span.relative");
        for (let index = 0; index < 3; index++) {
          const line = (await connectors.nth(index).boundingBox())!;
          const start = (await markers.nth(index).boundingBox())!;
          const end = (await markers.nth(index + 1).boundingBox())!;
          if (width < 768) {
            expect(
              Math.abs(line.x + line.width / 2 - start.x - start.width / 2),
            ).toBeLessThan(1);
            expect(Math.abs(line.y - start.y - start.height)).toBeLessThan(1);
            expect(Math.abs(line.y + line.height - end.y)).toBeLessThan(1);
          } else {
            expect(
              Math.abs(line.y + line.height / 2 - start.y - start.height / 2),
            ).toBeLessThan(1);
            expect(Math.abs(line.x - start.x - start.width)).toBeLessThan(1);
            expect(Math.abs(line.x + line.width - end.x)).toBeLessThan(1);
          }
        }
      }
    }
  }
});
