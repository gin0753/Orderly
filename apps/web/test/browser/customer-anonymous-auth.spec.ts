import { expect, test, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";

type AuthResponse = { method: string; path: string; status: number };
function observe(page: Page) {
  const responses: AuthResponse[] = [];
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (/\/customer\/auth\/(me|refresh)$/.test(path)) {
      responses.push({ method: response.request().method(), path, status: response.status() });
    }
  });
  return responses;
}
async function settled(page: Page) {
  // Observation window, not a product retry delay. Allows both DOM event handlers
  // and any resulting fetches to finish before counting requests.
  await page.waitForTimeout(600);
}

test("anonymous request probe: bootstrap, focus, visibility, reconnect, navigation and reload", async ({ page, context }) => {
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("orderly_customer_"))).toEqual([]);
  const responses = observe(page);
  await page.goto("/");
  await expect.poll(() => responses.length).toBe(3);
  await settled(page);
  console.log("AUTH_PROBE initial", JSON.stringify(responses));
  const baseline = responses.length;

  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await settled(page);
  console.log("AUTH_PROBE focus", JSON.stringify(responses.slice(baseline)));
  expect(responses).toHaveLength(baseline);
  const afterFocus = responses.length;
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await settled(page);
  console.log("AUTH_PROBE visible", JSON.stringify(responses.slice(afterFocus)));
  expect(responses).toHaveLength(afterFocus);
  const afterVisible = responses.length;

  await context.setOffline(true);
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await settled(page);
  console.log("AUTH_PROBE reconnect", JSON.stringify(responses.slice(afterVisible)));
  expect(responses).toHaveLength(afterVisible);
  const peer = await context.newPage();
  const peerResponses = observe(peer);
  await peer.goto("/");
  await expect.poll(() => peerResponses.length).toBe(3);
  await peer.bringToFront();
  await page.bringToFront();
  await settled(page);
  console.log("AUTH_PROBE tabs", JSON.stringify(responses.slice(afterVisible)));
  expect(responses).toHaveLength(afterVisible);
  await peer.close();
  const afterReconnect = responses.length;
  await page.getByRole("link", { name: "Track order", exact: true }).first().click();
  await expect(page).toHaveURL(/\/track-order$/);
  await settled(page);
  console.log("AUTH_PROBE navigation", JSON.stringify(responses.slice(afterReconnect)));
  expect(responses).toHaveLength(afterReconnect);
  const beforeReload = responses.length;
  await page.reload();
  await expect.poll(() => responses.length).toBeGreaterThanOrEqual(beforeReload + 3);
  await settled(page);
  console.log("AUTH_PROBE reload", JSON.stringify(responses.slice(beforeReload)));
  const beforeIdle = responses.length;
  await page.waitForTimeout(10_000);
  expect(responses).toHaveLength(beforeIdle);
  console.log("AUTH_PROBE idle", 0);
});

test("invalid cookies produce one bounded terminal bootstrap", async ({ page, context }) => {
  await context.addCookies([
    { name: "orderly_customer_access", value: "invalid-access", url: "http://localhost:3000" },
    { name: "orderly_customer_refresh", value: "invalid-refresh", url: "http://localhost:3000" },
  ]);
  const responses = observe(page);
  await page.goto("/");
  await expect.poll(() => responses.length).toBe(3);
  await settled(page);
  console.log("AUTH_PROBE invalid", JSON.stringify(responses));
  const beforeIdle = responses.length;
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(2_000);
  expect(responses).toHaveLength(beforeIdle);
});

test("same-context tabs discover login, refresh valid cookies, and keep logout anonymous", async ({ page, context }) => {
  const responses = observe(page);
  await page.goto("/");
  await expect.poll(() => responses.length).toBe(3);
  await settled(page);
  const peer = await context.newPage();
  await peer.goto("/register");
  await peer.getByLabel("Name").fill("Anonymous Probe");
  await peer.getByLabel("Email").fill("anonymous.probe.browser@example.test");
  await peer.getByLabel("Password", { exact: true }).fill("Anonymous probe password 123!");
  await peer.getByLabel("Confirm password").fill("Anonymous probe password 123!");
  await peer.getByRole("button", { name: "Create account" }).click();
  await expect(peer).toHaveURL(/\/account$/);
  await expect(page.getByRole("link", { name: "Account", exact: true }).first()).toBeVisible();
  await expect.poll(() => responses.length).toBe(4);
  console.log("AUTH_PROBE cross-tab changed", JSON.stringify(responses.slice(3)));

  const beforeRefresh = responses.length;
  const accessCookie = (await context.cookies()).find((cookie) => cookie.name === "orderly_customer_access");
  if (!accessCookie) throw new Error("Local fixture access cookie is missing.");
  const [header, encodedPayload] = accessCookie.value.split(".");
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as Record<string, unknown>;
  payload.exp = Math.floor(Date.now() / 1000) - 60;
  const unsigned = `${header}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
  // Known local browser-fixture secret from playwright.config.ts, never production.
  const signature = createHmac("sha256", "browser-customer-access-secret-at-least-32-characters").update(unsigned).digest("base64url");
  await context.addCookies([{ ...accessCookie, value: `${unsigned}.${signature}` }]);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => responses.length).toBe(beforeRefresh + 4);
  console.log("AUTH_PROBE valid refresh", JSON.stringify(responses.slice(beforeRefresh)));
  expect(responses.slice(beforeRefresh).map(({ status }) => status)).toEqual([401, 401, 200, 200]);

  const beforeLogout = responses.length;
  await peer.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("link", { name: "Sign in", exact: true }).first()).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await settled(page);
  console.log("AUTH_PROBE cross-tab ended", JSON.stringify(responses.slice(beforeLogout)));
  expect(responses).toHaveLength(beforeLogout);
  await peer.close();
});
