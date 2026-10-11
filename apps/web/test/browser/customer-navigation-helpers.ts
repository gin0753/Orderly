import type { Page } from "@playwright/test";

export async function openCustomerAccountActions(page: Page) {
  const desktop = page.getByRole("button", { name: "Account options", exact: true });
  if (await desktop.isVisible()) await desktop.click();
  else await page.getByRole("button", { name: "Open customer navigation" }).click();
}
