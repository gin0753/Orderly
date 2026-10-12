import { expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { createHash, randomBytes } from "node:crypto";

const requireFromTest = createRequire(__filename);
type PendingData = { email: string; tokenHash: string; expiresAt: Date; lastSentAt: Date; windowStartedAt: Date };
const { PrismaClient } = requireFromTest("../../../api/node_modules/@prisma/client") as {
  PrismaClient: new (options: { datasourceUrl: string }) => {
    customerPendingRegistration: { upsert: (args: { where: { email: string }; create: PendingData; update: Partial<PendingData> }) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  };
};
const { assertDestructiveTestDatabaseAllowed } = requireFromTest("../../../api/test/test-database-url.cjs") as {
  assertDestructiveTestDatabaseAllowed: (env: NodeJS.ProcessEnv) => { databaseUrl: string };
};

/** Represents delivery by a mocked mailbox. Only the guarded local test DB is permitted. */
export async function deliveredRegistrationToken(email: string): Promise<string> {
  const { databaseUrl } = assertDestructiveTestDatabaseAllowed(process.env);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const token = randomBytes(32).toString("base64url");
  const data = { email, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 30 * 60_000), lastSentAt: new Date(), windowStartedAt: new Date() };
  try { await prisma.customerPendingRegistration.upsert({ where: { email }, create: data, update: data }); }
  finally { await prisma.$disconnect(); }
  return token;
}

export async function openVerification(page: Page, token: string): Promise<void> {
  await page.goto("/verify-email");
  await expect(page.getByText("This verification link is invalid or expired. Request a new email.", { exact: true })).toBeVisible();
  await page.evaluate((value) => { window.history.replaceState(null, "", `/verify-email#token=${value}`); }, token);
  await page.reload();
  await expect(page.getByRole("form", { name: "Finish registration" })).toBeVisible();
}

export async function verifiedRegistration(page: Page, input: { email: string; name: string; password: string }): Promise<void> {
  const destination = new URL(page.url()).searchParams.get("returnTo") ?? "/account";
  const token = await deliveredRegistrationToken(input.email);
  await openVerification(page, token);
  await page.getByLabel("Name", { exact: true }).fill(input.name);
  await page.getByLabel("Password", { exact: true }).fill(input.password);
  await page.getByLabel("Confirm password", { exact: true }).fill(input.password);
  await page.getByRole("button", { name: "Verify email and create account" }).click();
  await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
  await page.goto(destination);
}
