# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-checkout-ownership.spec.ts >> revoked session stops checkout until explicit guest continuation
- Location: test\browser\customer-checkout-ownership.spec.ts:127:5

# Error details

```
PrismaClientInitializationError: 
Invalid `prisma.order.count()` invocation in
C:\dev\Orderly\apps\web\test\browser\customer-checkout-ownership.spec.ts:139:63

  136 await page.getByLabel("Email address").fill("manual.guest@example.test");
  137 await page.getByLabel("Phone number").fill("0400 444 333");
  138 await page.setViewportSize({ width: 320, height: 568 });
→ 139 const countBefore = await database((prisma) => prisma.order.count(
Can't reach database server at `localhost:5432`

Please make sure your database server is running at `localhost:5432`.
```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - banner [ref=f1e3]:
      - generic [ref=f1e4]:
        - button "Open customer navigation" [ref=f1e6] [cursor=pointer]
        - link "Orderly" [ref=f1e8] [cursor=pointer]:
          - /url: /
        - button "Open cart" [ref=f1e14] [cursor=pointer]:
          - generic [ref=f1e15]: "1"
    - main [ref=f1e20]:
      - generic [ref=f1e21]:
        - generic [ref=f1e22]:
          - generic [ref=f1e23]:
            - heading "Checkout" [level=1] [ref=f1e24]
            - paragraph [ref=f1e25]: Review your order and enter your details.
            - paragraph [ref=f1e26]: Signed in as owner.stage136.browser@example.test. You can use different contact details for this order.
            - generic [ref=f1e28]:
              - generic [ref=f1e30]:
                - generic [ref=f1e31]: "1"
                - generic [ref=f1e32]: Details
              - generic [ref=f1e34]:
                - generic [ref=f1e35]: "2"
                - generic [ref=f1e36]: Confirmed
          - generic [ref=f1e38]:
            - generic [ref=f1e39]:
              - generic [ref=f1e40]:
                - heading "1. Fulfillment" [level=2] [ref=f1e41]
                - paragraph [ref=f1e42]: How would you like to receive your order?
              - generic [ref=f1e43]:
                - button "🛍️ Pickup Collect your order from the restaurant Free" [ref=f1e44] [cursor=pointer]:
                  - generic [ref=f1e45]: 🛍️
                  - generic [ref=f1e46]:
                    - generic [ref=f1e47]: Pickup
                    - generic [ref=f1e48]: Collect your order from the restaurant
                    - generic [ref=f1e49]: Free
                - button "🚗 Delivery Have your order delivered to your address $5.00" [ref=f1e51] [cursor=pointer]:
                  - generic [ref=f1e52]: 🚗
                  - generic [ref=f1e53]:
                    - generic [ref=f1e54]: Delivery
                    - generic [ref=f1e55]: Have your order delivered to your address
                    - generic [ref=f1e56]: $5.00
            - generic [ref=f1e58]:
              - generic [ref=f1e59]:
                - heading "2. Customer Details" [level=2] [ref=f1e60]
                - paragraph [ref=f1e61]: We'll use this to send updates about your order.
              - generic [ref=f1e62]:
                - generic [ref=f1e63]:
                  - generic [ref=f1e64]: Full name
                  - textbox "Full name" [ref=f1e65]:
                    - /placeholder: Enter your full name
                    - text: Manual Guest Name
                - generic [ref=f1e66]:
                  - generic [ref=f1e67]: Phone number
                  - textbox "Phone number" [active] [ref=f1e68]:
                    - /placeholder: (+61) 123–456789
                    - text: 0400 444 333
                - generic [ref=f1e69]:
                  - generic [ref=f1e70]: Email address
                  - textbox "Email address" [ref=f1e71]:
                    - /placeholder: you@email.com
                    - text: manual.guest@example.test
            - generic [ref=f1e72]:
              - generic [ref=f1e73]:
                - heading "4. Order Notes (Optional)" [level=2] [ref=f1e74]
                - paragraph [ref=f1e75]: Add any special instructions for the restaurant.
              - generic [ref=f1e76]:
                - textbox "0/200" [ref=f1e77]:
                  - /placeholder: e.g. No onions, extra sauce on the side
                - generic [ref=f1e78]: 0/200
            - complementary "Order review" [ref=f1e80]:
              - generic [ref=f1e81]:
                - generic [ref=f1e82]:
                  - heading "Your Order" [level=2] [ref=f1e83]
                  - paragraph [ref=f1e84]: 1 item
                - button "Edit cart" [ref=f1e85] [cursor=pointer]
              - generic [ref=f1e88]:
                - generic [ref=f1e89]:
                  - generic [ref=f1e90]:
                    - heading "Golden Path Pizza" [level=3] [ref=f1e91]
                    - paragraph [ref=f1e92]: Large
                  - paragraph [ref=f1e93]: $18.00
                - paragraph [ref=f1e94]: "Qty: 1"
              - generic [ref=f1e95]:
                - generic [ref=f1e96]:
                  - generic [ref=f1e97]: Subtotal
                  - generic [ref=f1e98]: $18.00
                - generic [ref=f1e99]:
                  - generic [ref=f1e100]: Delivery fee
                  - generic [ref=f1e101]: Free
                - generic [ref=f1e102]:
                  - generic [ref=f1e103]: Service fee
                  - generic [ref=f1e104]: $1.20
                - generic [ref=f1e106]:
                  - generic [ref=f1e107]: Total
                  - generic [ref=f1e108]: $19.20
        - generic [ref=f1e110]:
          - generic [ref=f1e111]:
            - paragraph [ref=f1e112]: Total
            - paragraph [ref=f1e113]: $19.20
          - button "Place Order →" [ref=f1e114] [cursor=pointer]
    - contentinfo [ref=f1e115]:
      - generic [ref=f1e116]:
        - generic [ref=f1e117]:
          - paragraph [ref=f1e118]: Orderly Kitchen
          - paragraph [ref=f1e119]: Comfort food, made easy to order.
        - navigation "Footer navigation" [ref=f1e120]:
          - link "Menu" [ref=f1e121] [cursor=pointer]:
            - /url: /
          - link "Track order" [ref=f1e122] [cursor=pointer]:
            - /url: /track-order
        - paragraph [ref=f1e123]: © 2026 Orderly Kitchen.
  - alert [ref=f1e124]: Checkout | Orderly Kitchen
```

# Test source

```ts
  39  |   await expect(page.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  40  |   const text = await page.getByText(/^#\d+$/).textContent();
  41  |   const orderNumber = text?.slice(1);
  42  |   if (!orderNumber) throw new Error("Order number was not shown.");
  43  |   return orderNumber;
  44  | }
  45  | 
  46  | test("guest checkout stays unowned and guest tracking works", async ({ page }) => {
  47  |   await addPizza(page);
  48  |   await page.getByLabel("Full name").fill("Guest Browser");
  49  |   await page.getByLabel("Phone number").fill("0400 123 456");
  50  |   await page.getByLabel("Email address").fill("guest.stage136@example.test");
  51  |   const number = await place(page);
  52  |   const order = await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } }));
  53  |   expect(order).toEqual({ customerUserId: null, customerEmail: "guest.stage136@example.test" });
  54  |   await page.goto("/track-order");
  55  |   await page.getByLabel("Order number").fill(number);
  56  |   await page.getByLabel("Email or phone").fill("guest.stage136@example.test");
  57  |   await page.getByRole("button", { name: "Track Order" }).click();
  58  |   await expect(page).toHaveURL(new RegExp(`/track-order/${number}$`));
  59  | });
  60  | 
  61  | test("password customer checkout owns the order but keeps contact edits out of the account", async ({ page }) => {
  62  |   await page.goto("/register");
  63  |   await page.getByLabel("Name").fill("Owner Browser");
  64  |   await page.getByLabel("Email").fill(email);
  65  |   await page.getByLabel("Password", { exact: true }).fill(password);
  66  |   await page.getByLabel("Confirm password").fill(password);
  67  |   await page.getByRole("button", { name: "Create account" }).click();
  68  |   await expect(page).toHaveURL(/\/account$/);
  69  |   await page.getByLabel(/Phone/).fill("+61 400 123 456");
  70  |   await page.getByRole("button", { name: "Save profile" }).click();
  71  |   await expect(page.getByText("Profile saved.")).toBeVisible();
  72  |   const owner = await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email }, select: { id: true, email: true, phone: true } }));
  73  |   await addPizza(page);
  74  |   await expect(page.getByLabel("Full name")).toHaveValue("Owner Browser");
  75  |   await expect(page.getByLabel("Email address")).toHaveValue(email);
  76  |   await expect(page.getByLabel("Phone number")).toHaveValue("+61 400 123 456");
  77  |   await page.getByLabel("Email address").fill("work.stage136@example.test");
  78  |   const number = await place(page);
  79  |   expect(await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } })))
  80  |     .toEqual({ customerUserId: owner.id, customerEmail: "work.stage136@example.test" });
  81  |   expect(await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email }, select: { id: true, email: true, phone: true } })))
  82  |     .toEqual(owner);
  83  | });
  84  | 
  85  | test("Google customer checkout creates an owned order", async ({ page }) => {
  86  |   await page.goto("/login");
  87  |   await page.getByRole("button", { name: "Continue with Google" }).click();
  88  |   await page.getByRole("link", { name: "Continue as new", exact: true }).click();
  89  |   await expect(page).toHaveURL(/\/account$/);
  90  |   const googleEmail = "google.browser@example.com";
  91  |   const owner = await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email: googleEmail }, select: { id: true, email: true, phone: true } }));
  92  |   await addPizza(page);
  93  |   await expect(page.getByLabel("Email address")).toHaveValue(googleEmail);
  94  |   await page.getByLabel("Phone number").fill("0400 999 888");
  95  |   const number = await place(page);
  96  |   expect(await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } })))
  97  |     .toEqual({ customerUserId: owner.id, customerEmail: googleEmail });
  98  | });
  99  | 
  100 | test("expired access refreshes once and creates one owned order", async ({ page }) => {
  101 |   await page.goto("/login");
  102 |   await page.getByLabel("Email").fill(email);
  103 |   await page.getByLabel("Password", { exact: true }).fill(password);
  104 |   await page.getByRole("button", { name: "Sign in", exact: true }).click();
  105 |   await expect(page).toHaveURL(/\/account$/);
  106 |   await addPizza(page);
  107 |   const cookies = await page.context().cookies();
  108 |   const access = cookies.find((cookie) => cookie.name === "orderly_customer_access");
  109 |   if (!access) throw new Error("Customer access cookie is missing.");
  110 |   await page.context().addCookies([{ ...access, value: "expired-access" }]);
  111 |   const countBefore = await database((prisma) => prisma.order.count());
  112 |   let orderRequests = 0;
  113 |   let refreshRequests = 0;
  114 |   page.on("request", (request) => {
  115 |     if (request.method() === "POST" && request.url().endsWith("/api/orders")) orderRequests += 1;
  116 |     if (request.method() === "POST" && request.url().endsWith("/api/customer/auth/refresh")) refreshRequests += 1;
  117 |   });
  118 |   const number = await place(page);
  119 |   expect(orderRequests).toBe(2);
  120 |   expect(refreshRequests).toBe(1);
  121 |   expect(await database((prisma) => prisma.order.count())).toBe(countBefore + 1);
  122 |   const owner = await database((prisma) => prisma.customerUser.findUniqueOrThrow({ where: { email }, select: { id: true, email: true, phone: true } }));
  123 |   expect((await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } }))).customerUserId)
  124 |     .toBe(owner.id);
  125 | });
  126 | 
  127 | test("revoked session stops checkout until explicit guest continuation", async ({ page }) => {
  128 |   await page.goto("/login");
  129 |   await page.getByLabel("Email").fill(email);
  130 |   await page.getByLabel("Password", { exact: true }).fill(password);
  131 |   await page.getByRole("button", { name: "Sign in", exact: true }).click();
  132 |   await expect(page).toHaveURL(/\/account$/);
  133 |   await addPizza(page);
  134 |   await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  135 |   await page.getByLabel("Full name").fill("Manual Guest Name");
  136 |   await page.getByLabel("Email address").fill("manual.guest@example.test");
  137 |   await page.getByLabel("Phone number").fill("0400 444 333");
  138 |   await page.setViewportSize({ width: 320, height: 568 });
> 139 |   const countBefore = await database((prisma) => prisma.order.count());
      |                                                               ^ PrismaClientInitializationError: 
  140 |   let revoked = false;
  141 |   await page.route("**/api/orders", async (route) => {
  142 |     if (!revoked) {
  143 |       revoked = true;
  144 |       await database((prisma) => prisma.customerSession.deleteMany({ where: { customerUser: { email } } }));
  145 |     }
  146 |     await route.continue();
  147 |   });
  148 |   await page.getByRole("button", { name: "Place Order →" }).click();
  149 |   await expect(page.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/login?returnTo=%2Fcheckout");
  150 |   await expect(page.getByRole("button", { name: "Continue as guest" })).toBeVisible();
  151 |   expect(await database((prisma) => prisma.order.count())).toBe(countBefore);
  152 |   await page.getByRole("button", { name: "Continue as guest" }).click();
  153 |   await expect(page.getByRole("alert").filter({ hasText: /session has been cleared/ })).toBeVisible();
  154 |   await expect(page.getByLabel("Full name")).toHaveValue("Manual Guest Name");
  155 |   await expect(page.getByLabel("Phone number")).toHaveValue("0400 444 333");
  156 |   const number = await placeMobile(page);
  157 |   expect(await database((prisma) => prisma.order.findUniqueOrThrow({ where: { orderNumber: number }, select: { customerUserId: true, customerEmail: true } })))
  158 |     .toEqual({ customerUserId: null, customerEmail: "manual.guest@example.test" });
  159 |   async function placeMobile(current: Page) {
  160 |     await current.getByRole("button", { name: "Place Order →" }).click();
  161 |     await expect(current.getByRole("heading", { name: "Thanks, your order is in." })).toBeVisible();
  162 |     const number = (await current.getByText(/^#\d+$/).textContent())?.slice(1);
  163 |     if (!number) throw new Error("Order number was not shown.");
  164 |     return number;
  165 |   }
  166 | });
  167 | 
  168 | test("logout clears untouched account prefills while keeping typed details and cart", async ({ page }) => {
  169 |   await page.goto("/login");
  170 |   await page.getByLabel("Email").fill(email);
  171 |   await page.getByLabel("Password", { exact: true }).fill(password);
  172 |   await page.getByRole("button", { name: "Sign in", exact: true }).click();
  173 |   await expect(page).toHaveURL(/\/account$/);
  174 |   await addPizza(page);
  175 |   await page.getByLabel("Phone number").fill("0400 777 666");
  176 |   await page.getByRole("button", { name: "Sign out" }).click();
  177 |   await expect(page.getByLabel("Full name")).toHaveValue("");
  178 |   await expect(page.getByLabel("Email address")).toHaveValue("");
  179 |   await expect(page.getByLabel("Phone number")).toHaveValue("0400 777 666");
  180 |   await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  181 |   for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  182 |     await page.setViewportSize(viewport);
  183 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  184 |     await expect(page.getByRole("button", { name: viewport.width >= 1024 ? "Place Order" : "Place Order →", exact: true })).toBeVisible();
  185 |   }
  186 |   await page.getByRole("link", { name: "Sign in", exact: true }).last().click();
  187 |   await expect(page).toHaveURL(/\/login\?returnTo=%2Fcheckout$/);
  188 |   await page.getByLabel("Email").fill(email);
  189 |   await page.getByLabel("Password", { exact: true }).fill(password);
  190 |   await page.getByRole("button", { name: "Sign in", exact: true }).click();
  191 |   await expect(page).toHaveURL(/\/checkout$/);
  192 |   await expect(page.getByLabel("Phone number")).toHaveValue("0400 777 666");
  193 |   await expect(page.getByLabel("Full name")).toHaveValue("Owner Browser");
  194 | });
  195 | 
```