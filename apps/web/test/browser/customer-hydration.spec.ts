import { expect, test } from "@playwright/test";

const user = { id: "hydration-customer", name: "Hydration Fixture", email: "hydration@example.test", phone: null, authMethods: { password: true, google: false } };

for (const width of [1440, 390, 320]) {
  for (const delay of [0, 500]) {
    for (const destination of ["/account", "/account/orders"]) {
    test(`${destination} document hydration at ${width}px with ${delay}ms session response`, async ({ page }) => {
      const hydrationErrors: string[] = [];
      page.on("pageerror", (error) => {
        if (/#418|hydration|server rendered/i.test(error.message)) hydrationErrors.push(new URL(page.url()).pathname);
      });
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/api/customer/auth/**", async (route) => {
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        await route.fulfill({ json: route.request().url().endsWith("/google/status") ? { enabled: false } : { user } });
      });
      await page.route("**/api/customer/orders?*", (route) => route.fulfill({ json: {
        data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      } }));
        await page.goto(destination);
        await expect(page.getByRole("navigation", { name: "Account sections" })).toBeVisible();
        if (destination === "/account") await expect(page.getByLabel("Name", { exact: true })).toHaveValue(user.name);
        else await expect(page.getByRole("heading", { name: "No signed-in orders yet", exact: true })).toBeVisible();
        expect(hydrationErrors, `Hydration errors on ${destination}`).toEqual([]);
    });
    }
  }
}
