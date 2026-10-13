# V1 dual registration mode

Date: 13 October 2026 (Australia/Sydney).

## Verdict

**PASS WITH CONDITIONS.** Both registration modes are implemented, and the final API, component and affected browser selections pass. Security 2A/2B, guest/Admin isolation and ownership protections remain intact. Direct mode's explicitly requested lack of mailbox verification introduces email-squatting and address-availability risks; it is appropriate only as the disclosed portfolio-demo choice. No confirmed implementation release blocker remains. Deployment is conditional on consistent API mode configuration, the coordinated rollout and manual staging checks below. Verified mode still requires its existing authorized email provider; live Resend/Google and Firefox/Safari behavior are not established by mocked Chromium tests.

## Architecture and security model

`CUSTOMER_REGISTRATION_MODE` is a strict server startup setting: `verified` is the default, `direct` is an explicit portfolio-demo tradeoff, and every other value (including blank, whitespace-padded or differently cased values) fails startup. The existing registration controller selects the strategy; the registration service independently enforces mode separation. No request parameter can select another mode.

`GET /api/customer/auth/registration/status` returns only `{ mode }` with `private, no-store`. The existing registration page retrieves this runtime setting, validates it and disables submission on lookup failure. There is no public provider secret or independently configured frontend mode.

Direct registration validates the existing DTO, requires a password, uses the existing cost-12 bcrypt policy, canonicalizes email, and creates the customer and secure session in one database transaction under the existing customer-deletion coordination lock. The unique canonical email constraint arbitrates duplicate/concurrent creation and Google conflicts. The shared activation helper accepts explicit verification evidence: direct passes `null`; verified retains its timestamp. Failure to issue a session rolls back customer creation. There is no guest-order lookup, Google linking, UUID reuse or recovery mechanism.

The existing register mutation guard, CSRF origin/client checks and five-attempt/minute/client HTTP limit remain. Direct mode creates no pending record and sends no registration email. The mailer itself refuses to send in direct mode even if credentials exist. Unverified email is a profile/contact claim, never ownership evidence. Public customer responses expose an `emailVerified` boolean derived from existing evidence; Account UI labels absent evidence as unverified.

Verified mode retains Security 2A's pending record, 256-bit token, SHA-256 digest, 30-minute expiry, single use, resend rotation/cooldown/mailbox quota, neutral acknowledgements and owner-established password. Initial passwords remain validated but discarded. Activation and session issuance remain transactional. All registration resend/check/complete entry points reject in direct mode; direct service registration rejects in verified mode. Tests continue to mock delivery.

Customer password authentication, subject-based Google sign-in and explicit password-protected linking, deletion authorization/grants, session revocation, order ownership, guest receipt capabilities and Admin separation use their existing implementations. No schema or migration was added, reverted or removed.

## Configuration matrix

| API setting | Effective mode | Production Resend requirements | Registration result |
| --- | --- | --- | --- |
| Unset | verified | Existing API key and sender required; missing configuration fails startup | Pending acknowledgement; owner completes verified link |
| `verified` | verified | Same strict requirement | Same Security 2A behavior |
| `direct` | direct | Neither credential required; delivery disabled even if supplied | Valid name/email/password creates unverified customer and session immediately |
| Any other value | none | Irrelevant | Startup rejected |

Existing JWT secret separation, HTTPS origin and secure-cookie requirements are unchanged. The UI has Name/Email in verified mode and Name/Email/Password/Confirm password in direct mode; it reuses Stage 15 controls, validation, focus feedback and session coordination. Privacy and Terms disclose both configured behaviors, unverified ownership and unchanged retention, with revision date 13 October 2026.

## Mode-transition policy

- Configuration is immutable for a running API process. Restart all instances consistently when changing it; avoid mixed-mode instances and drain in-flight work. Coordinate the API/Web rollout so the deployed UI understands both response shapes before enabling direct registration.
- Existing customers retain UUIDs, credential hashes, sessions, verification evidence and customer-ID order ownership. Changing mode performs no customer data migration or verification backfill. Existing direct/legacy password users can continue logging in when verified mode is enabled.
- Switching to direct pauses every verification endpoint. Existing pending digests/expiry/quota history remain; a live pending row blocks a fresh direct registration for that email until its original expiry. No pending profile or proof is converted into an account.
- Switching back to verified permits completion only with genuine, unexpired pending proof. A link paused in direct mode can resume only within its original lifetime. Expired, consumed or deletion-invalidated links remain unusable; changing configuration never extends expiry.
- After pending expiry, direct registration requires a fresh explicit submission and new password. A stale link cannot change that account. Resend/quota metadata may remain until later verified-mode cleanup or maintenance; direct mode does not promise physical cleanup.
- Future verified rollout must retain `emailVerifiedAt = null` for existing direct accounts. Do not overwrite credentials, merge with Google by email, claim guest history or reclaim an account on mailbox proof. Any future upgrade of existing ownership evidence needs a separately scoped, authenticated design; password reset/email change/recovery are not implemented here.
- Deleted identities remain deleted. New direct registration receives a new UUID and cannot recover old owned history. Existing stale-Google-callback barriers and deletion/session protections remain applicable.

## Security implications and known risks

Direct mode intentionally permits email squatting: a registrant can enter an address they do not control, occupy that canonical email and prevent its actual owner from registering or independently signing in with Google. No email-recovery feature resolves that conflict. Duplicate/pending rejection also exposes more address-availability information than verified mode's neutral acknowledgement. These are accepted functional tradeoffs of the requested public demo mode, not evidence of mailbox ownership. The Terms prohibit impersonation and the UI discloses the lack of verification.

The existing HTTP limiter bounds attempts for each client on each running API instance. It is not a distributed global creation quota; multiple clients/IPs or instances can still cause database growth. Monitor demo traffic and storage. No CAPTCHA, external abuse infrastructure or unrelated authorization changes were introduced. Provider delivery prerequisites remain relevant only to verified mode. Account deletion does not guarantee immediate removal from retained historical business records, backups or third parties.

## Validation evidence

| Check | Evidence |
| --- | --- |
| API unit: `pnpm test:api:unit --runInBand` | 16 suites / 164 tests passed, including strict mode parsing and production mailer configuration/no-send behavior. |
| API integration: `pnpm test:api:e2e` | Final complete run: 14 suites / 188 tests passed against guarded loopback `orderly_test`. Includes direct credentials/session/duplicates/concurrency, pending transitions, real rate/CSRF guards, actual transactional rollback, Google conflict, deletion/re-registration and guest/historical ownership. Existing verified-token, OAuth, deletion, receipt and Admin suites included. |
| Web components: `pnpm test:web --runInBand` | Final isolated complete run: 47 suites / 342 tests passed. After the last mode-failure/response handling adjustment, affected `customer-auth-forms` selection passed all 14 tests. |
| TypeScript: `pnpm typecheck` | API, web and test TypeScript passed. |
| Lint: `pnpm lint` | Both applications passed after formatting/type-safe test response corrections. |
| Builds | API and web builds passed using the repository's local production-browser configuration (`ORDERLY_API_ORIGIN=http://localhost:4000`, `ORDERLY_BROWSER_PRODUCTION=1`). Actual deployments still require HTTPS; that requirement was not weakened. |
| Browser direct | `ORDERLY_BROWSER_PRODUCTION=1 ORDERLY_RECEIPT_SECURITY_TESTS=1 pnpm --filter web test:e2e --direct-registration`: 3/3 passed at 1440/390/320px, zero retries. Immediate registration, unverified disclosure, no pending UI, keyboard/axe/overflow checks, desktop peer-tab logout, old-session rejection, password login and reload. |
| Browser verified | With the same production/security environment flags, `pnpm --filter web test:e2e --security-2b` completed all 8 selections: deletion 4, verification 4, Google 6, account 4, checkout ownership 6, history 6, anonymous/session 3, receipt tracking 4; **37/37 passed, zero retries**. |
| Browser presentation | Production-build selection `premium-auth-orders-tracking.spec.ts final-acceptance.spec.ts --grep 'authentication and guest tracking presentation\|rendered customer journey'`: **5/5 passed**, zero retries. Existing four-width customer journeys (1440/768/390/320px), axe/keyboard checks, authentication and guest tracking feedback. Evidence redirected to ignored local `apps/web/test-results/dual-registration-acceptance`; existing design evidence was not overwritten. Together with direct and Security 2B selections: **45 browser tests passed**. |
| Diff hygiene | `git diff --check` passed. No dependency, schema, migration or production-data changes. |

Earlier attempts: the first guarded integration attempt stopped before tests because Docker was unavailable. After starting the local engine, sandbox pipe permissions required elevated execution; every reset still passed the existing loopback/database/environment guards. The first executable API run had 185 passes and two failures: an outdated allowed-public-field assertion and a rollback fault injected into the wrong JWT provider instance. The assertion now admits only the additional safe verification boolean, and the fault targets JWT signing so the real database rollback is exercised. The subsequent complete run passed.

Two overlapping component reruns had respectively two and one unchanged checkout tests exceed their existing five-second timeout. No timeout, sleep, retry setting, assertion or checkout implementation was changed. A complete isolated rerun passed all 342 tests; earlier failures remain documented rather than represented as clean runs. Initial build attempts failed required-origin validation (unset origin, then HTTP without the existing local-test flag); the correctly configured local production builds passed.

The first direct browser run passed desktop and failed both mobile cases because the new test attempted to click the desktop-only Account options control, which is hidden below 768px. Consequently no mobile logout request began. The fixture now selects the existing mobile navigation control at mobile widths; application navigation and logout code were unchanged.

Browser tests retain real rate guards, zero retries and secret-artifact suppression. They run a production Next.js build with the guarded test-mode API and controlled Google/mailbox fixtures, not a production API deployment. Direct and verified are separate selected configurations: `--direct-registration` runs the new direct cases; normal/Security 2B selections run verified cases. The direct file is excluded from verified discovery because its required form deliberately does not exist in that mode. No assertion is disabled to conceal a failure. Include the explicit direct selection alongside verified browser checks in future staging/CI validation; the existing workflow was not changed. API and component suites cover both modes in their normal discovery. Automated provider delivery/identity evidence remains synthetic, not proof of live Resend or Google behavior.

## Deployment instructions and manual acceptance

1. Deploy neither component from this task automatically. Review the changes and take the normal database backup; there are no new migrations to apply. Retain Security 2A/2B migrations.
2. For the public direct demo, set the API's `CUSTOMER_REGISTRATION_MODE=direct`, retain secure JWT/HTTPS configuration, and restart consistently. Resend credentials can be absent. No `NEXT_PUBLIC` secret or registration-mode build variable is needed.
3. For verified mode, set `verified` or remove the variable, configure the existing Resend key/authorized sender, and confirm strict startup validation and real staging delivery before rollout. Production provider testing is not covered by mocked tests.
4. Check direct name/password validation, immediate Account navigation, unverified disclosure, logout/revocation and subsequent password login on desktop/mobile. Check mode lookup failure disables registration while ordinary login remains available.
5. Create a synthetic pending link in verified staging, change to direct, and confirm link/resend rejection and temporary direct-registration blocking. Return to verified within the original lifetime and complete once; check expiry/replay and verify no lifetime extension.
6. Confirm existing direct/legacy users retain their IDs and unverified evidence after switching back, matching-email Google sign-in conflicts instead of merging, and explicit linking requires their current password.
7. Check deletion with current password/fresh Google proof as applicable, active-order blocking, all-device revocation and new-UUID re-registration without guest or historical-order reclamation. Recheck Firefox/Safari and mobile keyboard/screen-reader behavior in staging; automated Chromium is not proof of every browser.

## Exact change scope

- `.env.example`
- `apps/api/.env.example`
- `apps/api/src/modules/customer-auth/customer-auth.config.ts`
- `apps/api/src/modules/customer-auth/customer-auth.config.spec.ts`
- `apps/api/src/modules/customer-auth/customer-auth.controller.ts`
- `apps/api/src/modules/customer-auth/customer-auth.service.ts`
- `apps/api/src/modules/customer-auth/customer-auth.types.ts`
- `apps/api/src/modules/customer-auth/customer-registration.service.ts`
- `apps/api/src/modules/customer-auth/registration-mailer.ts`
- `apps/api/src/modules/customer-auth/registration-mailer.spec.ts`
- `apps/api/test/customer-auth.e2e-spec.ts`
- `apps/api/test/customer-registration-mode.e2e-spec.ts` (new)
- `apps/web/src/features/customer-auth/types.ts`
- `apps/web/src/features/customer-auth/api/customer-auth-api.ts`
- `apps/web/src/features/customer-auth/store/customer-auth-slice.ts`
- `apps/web/src/features/customer-auth/components/customer-auth-form.tsx`
- `apps/web/src/features/customer-auth/components/customer-account-profile.tsx`
- `apps/web/src/app/(customer)/privacy/page.tsx`
- `apps/web/src/app/(customer)/terms/page.tsx`
- `apps/web/test/customer-auth-forms.test.tsx`
- `apps/web/playwright.config.ts`
- `apps/web/test/browser/scripts/run-playwright.mjs`
- `apps/web/test/browser/direct-registration.spec.ts` (new)
- `apps/web/test/browser/premium-auth-orders-tracking.spec.ts` (public-mode fixture response)
- `apps/web/test/browser/final-acceptance.spec.ts` (public-mode fixture response for the existing registration journey)
- `docs/v1-dual-registration-mode-report.md` (new)

The pre-existing untracked Gmail feasibility report is preserved and is outside this task's change scope. No production data, commit, push, deployment or Packaging work.
