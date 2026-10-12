import { expect, test } from "@playwright/test";
import path from "node:path";
const user={id:"feedback-fixture",name:"Feedback Fixture",email:"feedback@example.test",phone:null,authMethods:{password:true,google:false}};
for(const width of [1440,390,320]) for(const state of ["failed","conflict","cancelled"]) {
 test(`Google ${state} feedback at ${width}px`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});
 await page.route("**/api/customer/auth/**",route=>route.fulfill({json:route.request().url().endsWith("/google/status")?{enabled:true}:{user}}));
 await page.goto(`/account?google=${state}`);
 const section=page.locator('section[aria-labelledby="customer-methods-heading"]');
 const alert=section.getByRole("alert");
 await expect(alert.getByRole("heading",{name:"Google connection unsuccessful"})).toBeVisible();
 await expect(alert).toHaveClass(/color-danger-strong/);
 await expect(alert).toContainText(state==="cancelled"?"authorization was not completed":state==="conflict"?"could not be linked":"could not be connected");
 await section.locator("summary").click();
 const password=page.getByLabel("Current password to connect Google");await expect(password).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 await section.screenshot({path:process.env.INVESTIGATION_EVIDENCE?path.join(process.env.INVESTIGATION_EVIDENCE,`${state}-${width}.png`):testInfo.outputPath(`${state}-${width}.png`)});
 await password.fill("Fixture password 123!");
 await page.route("**/api/customer/auth/google/connect",route=>route.fulfill({status:503,json:{message:"private fixture diagnostic"}}));
 await page.getByRole("button",{name:"Connect Google",exact:true}).click();
 await expect(alert).toContainText("Google could not be connected. Please try again.");
 await expect(section.getByRole("alert")).toHaveCount(1);
 await expect(alert).not.toContainText("private fixture diagnostic");
 await expect(password).toHaveValue("Fixture password 123!");
 await expect(alert).not.toBeFocused();
 });
}

for (const scale of [2, 4]) {
  test(`Google feedback at ${scale * 100}% zoom-equivalent reflow width`, async ({ page }) => {
    // Browser zoom changes the CSS viewport; CSS zoom alone does not update media queries.
    await page.setViewportSize({ width: 1440 / scale, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/customer/auth/**", route => route.fulfill({ json: route.request().url().endsWith("/google/status") ? { enabled: true } : { user } }));
    await page.goto("/account?google=conflict");
    const section = page.locator('section[aria-labelledby="customer-methods-heading"]');
    await expect(section.getByRole("alert")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const summary = section.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    const password = page.getByLabel("Current password to connect Google");
    await expect(password).toBeVisible();
    await password.focus();
    await page.keyboard.type("Fixture password 123!");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Connect Google", exact: true })).toBeFocused();
  });
}
