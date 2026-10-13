import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ trace: "off", screenshot: "off", video: "off" });

for (const width of [1440, 390, 320]) {
  test(`direct registration, logout revocation and password login at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/register");
    const email = `direct.${width}@browser.example.test`;
    const password = "Direct browser synthetic password 123!";
    await page.getByLabel("Name", { exact: true }).fill("Synthetic Owner");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    await page.getByLabel("Password", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByLabel("Confirm password", { exact: true }),
    ).toBeFocused();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByText("Email ownership is unverified.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toHaveCount(0);
    const peer = width === 1440 ? await page.context().newPage() : null;
    if (peer) {
      await peer.goto("/account");
      await expect(peer.getByLabel("Email", { exact: true })).toHaveValue(
        email,
      );
    }
    const oldCookies = await page.context().cookies();
    const access = oldCookies.find((c) => c.name === "orderly_customer_access");
    const refresh = oldCookies.find(
      (c) => c.name === "orderly_customer_refresh",
    );
    expect(access).toBeDefined();
    expect(refresh).toBeDefined();
    const loggedOut = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/customer/auth/logout" &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", {
        name: width < 768 ? "Open customer navigation" : "Account options",
      })
      .click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    expect((await loggedOut).status()).toBe(204);
    await expect(
      page.getByRole("link", { name: "Sign in", exact: true }),
    ).toBeVisible();
    if (peer)
      await expect(peer.getByLabel("Password", { exact: true })).toBeVisible();
    const revoked = await page.request.get("/api/customer/auth/me", {
      headers: { Cookie: `${access!.name}=${access!.value}` },
    });
    expect(revoked.status()).toBe(401);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByText("Email ownership is unverified.", { exact: false }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
    if (peer) await peer.close();
  });
}
