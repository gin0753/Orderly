import { expect, test } from "@playwright/test";

test("customer controls use scoped foundation tokens while admin keeps its defaults", async ({ page }) => {
  await page.goto("/track-order");
  const email = page.getByRole("textbox", { name: "Order number", exact: true });
  await expect(email).toBeVisible();
  const customer = await email.evaluate((input) => {
    const styles = getComputedStyle(input);
    return { background: getComputedStyle(input.closest(".customer-theme")!).backgroundColor,
      placeholder: getComputedStyle(input, "::placeholder").color, fontSize: styles.fontSize,
      border: styles.borderColor };
  });
  expect(customer).toEqual({ background: "rgb(250, 248, 245)", placeholder: "rgb(105, 99, 93)", fontSize: "16px", border: "rgb(138, 129, 120)" });
  const contrast = await email.evaluate((input) => {
    function luminance(color: string) {
      const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    function ratio(a: string, b: string) {
      const first = luminance(a), second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }
    const styles = getComputedStyle(input);
    return {
      text: ratio(styles.color, styles.backgroundColor),
      placeholder: ratio(getComputedStyle(input, "::placeholder").color, styles.backgroundColor),
      boundary: ratio(styles.borderColor, styles.backgroundColor),
    };
  });
  expect(contrast.text).toBeGreaterThanOrEqual(4.5);
  expect(contrast.placeholder).toBeGreaterThanOrEqual(4.5);
  expect(contrast.boundary).toBeGreaterThanOrEqual(3);
  await email.focus();
  await expect(email).toHaveCSS("outline-style", "solid");
  await expect(email).toHaveCSS("outline-width", "2px");
  await page.goto("/admin/login");
  expect(await page.locator(".customer-theme").count()).toBe(0);
  const adminEmail = page.getByRole("textbox", { name: /Email/i });
  await expect(adminEmail).toHaveCSS("font-size", "14px");
  await expect(adminEmail).toHaveCSS("height", "44px");
  await expect(adminEmail).toHaveCSS("border-color", "rgb(229, 231, 235)");
});

test("product radios support arrows and customer controls fit narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page.getByRole("button", { name: "View Golden Path Pizza" }).click();
  const dialog = page.getByRole("dialog", { name: "Golden Path Pizza" });
  const small = dialog.getByRole("radio", { name: /Small/ });
  const large = dialog.getByRole("radio", { name: /Large/ });
  await small.focus();
  await page.keyboard.press("ArrowRight");
  await expect(large).toBeFocused();
  await expect(large).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("ArrowRight");
  await expect(small).toBeFocused();
  await expect(small).toHaveAttribute("aria-checked", "true");
  const quantity = dialog.getByRole("button", { name: "Increase quantity" });
  const box = await quantity.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "View Golden Path Pizza" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
