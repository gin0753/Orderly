import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Isolated component audit using actual production CSS. No API or database access.
// Generate the six DOM fixtures with ORDERLY_TIMELINE_CAPTURE_PHASE=regression-after.
const root = path.resolve(__dirname, "../../../..");
const output = process.env.ORDERLY_TIMELINE_EVIDENCE_DIRECTORY
  ? path.resolve(root, process.env.ORDERLY_TIMELINE_EVIDENCE_DIRECTORY)
  : path.join(root, "audit-artifacts/timeline-regression/verified-after");
const fixtures = path.join(root, "audit-artifacts/timeline-connectors/regression-after");
const cssDirectory = path.join(root, "apps/web/.next/static/chunks");
const css = readdirSync(cssDirectory).filter(file => file.endsWith(".css"))
  .map(file => readFileSync(path.join(cssDirectory, file), "utf8")).join("\n");
const states = ["PENDING", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

for (const width of [320, 390, 768, 1440]) {
  test(`timeline geometry, states and wrapping at ${width}px`, async ({ page }) => {
    await page.route("**/*", route => route.abort());
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    mkdirSync(output, { recursive: true });
    for (const font of [16, 32]) {
      for (const status of states) {
        // The timeline is an h2 section; supply the surrounding page's h1 in this isolated fixture.
        const html = readFileSync(path.join(fixtures, `${status}.html`), "utf8")
          .replace(/(<main[^>]*>)/, '$1<h1 class="sr-only">Order tracking fixture</h1>');
        await page.setContent(`<html lang="en"><head><title>Timeline fixture</title><style>${css}\nhtml{font-size:${font}px}</style></head><body>${html}</body></html>`);
        if (font === 32) {
          await page.locator("li > div > p:first-child").evaluateAll(nodes => nodes.forEach(node => {
            node.textContent = "L\u00e4ngere\u00fcbersetzteStatusbeschreibung mit mehreren umgebrochenen Zeilen";
          }));
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        const lines = page.locator("[data-progress-connector]");
        await expect(lines).toHaveCount(status === "CANCELLED" ? 0 : 3);
        if (status !== "CANCELLED") {
          const markers = page.locator("li > span.relative");
          await expect(page.locator('[aria-current="step"]')).toHaveCount(1);
          for (let index = 0; index < 3; index++) {
            const line = (await lines.nth(index).boundingBox())!;
            const start = (await markers.nth(index).boundingBox())!;
            const end = (await markers.nth(index + 1).boundingBox())!;
            expect(line.width).toBeGreaterThan(0);
            expect(line.height).toBeGreaterThan(0);
            if (width < 768) {
              expect(Math.abs(line.x + line.width / 2 - start.x - start.width / 2)).toBeLessThan(1);
              expect(Math.abs(line.y - start.y - start.height)).toBeLessThan(1);
              expect(Math.abs(line.y + line.height - end.y)).toBeLessThan(1);
            } else {
              expect(Math.abs(line.y + line.height / 2 - start.y - start.height / 2)).toBeLessThan(1);
              expect(Math.abs(line.x - start.x - start.width)).toBeLessThan(1);
              expect(Math.abs(line.x + line.width - end.x)).toBeLessThan(1);
            }
            await lines.nth(index).scrollIntoViewIfNeeded();
            const painted = await lines.nth(index).evaluate(element => {
              const style = getComputedStyle(element);
              const token = element.getAttribute("data-progress-connector") === "completed"
                ? "--color-brand-strong" : "--color-control-border";
              const probe = document.createElement("span");
              element.appendChild(probe);
              probe.style.backgroundColor = `var(${token})`;
              const expected = getComputedStyle(probe).backgroundColor;
              probe.remove();
              const box = element.getBoundingClientRect();
              return {
                color: style.backgroundColor, expected, zIndex: style.zIndex,
                visibleAtCenter: document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === element,
              };
            });
            expect(painted.color).toBe(painted.expected);
            expect(painted.color).not.toBe("rgba(0, 0, 0, 0)");
            expect(painted.zIndex).toBe("0");
            expect(painted.visibleAtCenter).toBe(true);
            await expect(lines.nth(index)).toHaveAttribute("aria-hidden", "true");
          }
        }
        if ((status === "PREPARING" || status === "COMPLETED") && font === 16 || status === "PREPARING" && font === 32) {
          await page.screenshot({ path: path.join(output, `${status.toLowerCase()}-${width}-${font}.png`), fullPage: true });
        }
        if (font === 16 && (status === "READY" || status === "CANCELLED")) {
          const axe = await new AxeBuilder({ page }).analyze();
          writeFileSync(path.join(output, `${status.toLowerCase()}-${width}-axe.json`), JSON.stringify(axe, null, 2));
          expect(axe.violations.map(violation => violation.id)).toEqual([]);
        }
      }
    }
  });
}
