import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { verifiedRegistration } from "./verified-registration-helpers";

test.beforeEach(async ({ page }) => {
  page.on('response', (response) => { if (new URL(response.url()).pathname === '/api/customer/account/delete') console.log('Deletion HTTP status:', response.status()); });
});

test.use({ trace: "off", screenshot: "off", video: "off" });
for (const width of [1440, 390, 320]) {
  test(`password deletion is explicit, accessible and ends peer sessions at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    const email = `deletion.${width}@browser.example.test`;
    const password = "Deletion browser password 123!";
    await page.goto('/register');
    await verifiedRegistration(page, { email, name: 'Deletion Browser', password });
    const peer = await context.newPage(); await peer.goto('/account');
    await expect(peer.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();
    await page.evaluate(() => { sessionStorage.setItem('unrelated-guest-value', 'preserve'); });
    await page.getByRole('button', { name: 'Delete account', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Permanently delete account?' });
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    await expect(dialog.getByRole('button', { name: 'Permanently delete account', exact: true })).toBeDisabled();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const bounds = await dialog.boundingBox(); expect(bounds!.x >= 0 && bounds!.x + bounds!.width <= width + 1).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete account', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await dialog.getByRole('checkbox').check();
    // Keep total requests within the real five/minute guard; API tests separately exercise throttling.
    if (width === 1440) {
      await dialog.getByLabel('Current password to delete account').fill('wrong password');
      await dialog.getByRole('button', { name: 'Permanently delete account', exact: true }).click();
      await expect(dialog.getByRole('alert')).toBeFocused();
    }
    await dialog.getByLabel('Current password to delete account').fill(password);
    await dialog.getByRole('button', { name: 'Permanently delete account', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
    await expect(peer).toHaveURL(/\/login\?returnTo=%2Faccount/);
    expect(await page.evaluate(() => sessionStorage.getItem('unrelated-guest-value'))).toBe('preserve');
    await page.goto('/account'); await expect(page).toHaveURL(/\/login/);
    await peer.close();
  });
}

test('Google-only deletion needs new reauthentication and a distinct final action', async ({ page }) => {
  await page.goto('/login'); await page.getByRole('button', { name: 'Continue with Google' }).click();
  await page.getByRole('link', { name: 'Continue as new', exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
  await page.getByRole('button', { name: 'Delete account', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Permanently delete account?' });
  await dialog.getByRole('checkbox').check();
  await expect(dialog.getByRole('button', { name: 'Permanently delete account', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Verify identity with Google' }).click();
  await page.getByRole('link', { name: 'Continue as delete-silent', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Google did not provide fresh' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete account', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Permanently delete account?' });
  await dialog.getByRole('button', { name: 'Verify identity with Google' }).click();
  await page.getByRole('link', { name: 'Continue as delete-fresh', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Google verified your identity for deletion' })).toBeVisible();
  // OAuth callback leaves the account alive and must not trigger deletion on GET.
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete account', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Permanently delete account?' });
  await expect(dialog.getByRole('button', { name: 'Permanently delete account', exact: true })).toBeDisabled();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Permanently delete account', exact: true }).click();
  await expect(page).toHaveURL('/');
});
