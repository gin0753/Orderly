# Stage 15.3 — Premium customer navigation and account

## 1. Implementation summary

Read the Stage 15.1 plan and Stage 15.2 foundation report before implementation. This stage implements customer navigation, account organization and official Google presentation only. No new library, backend capability, API/schema change, authentication rewrite or storefront/configurator/checkout redesign is included.

The customer header now consistently offers Menu and Track order. Anonymous desktop customers receive Sign in; authenticated customers receive a compact account disclosure containing Account, Orders, Sign-in & Security and the existing Sign out action. Cart stays visible. Mobile retains the native dialog and existing cart handoff.

The existing protected account layout provides a desktop rail and wrapping mobile section navigation shared by Profile, Orders and Security destinations. Profile and Security use stable anchors on `/account`; Orders remains `/account/orders`, including its existing detail routes and URL-backed filters. Profile and Security remain mounted together so switching anchors preserves drafts. Password changes and optional Google linking use native progressive disclosure. Unsupported account settings are not presented.

Stage 15.2 warm surfaces, accessible orange, charcoal identity accents, radii, shadows, focus and motion tokens are reused. Admin retains its light presentation; new shared-header props have unchanged defaults.

## 2. Files changed

Paths are relative to `apps/web/` unless stated otherwise.

| File(s) | Purpose |
| --- | --- |
| `src/components/layout/site-header.tsx` | Coherent primary destinations, desktop account/sign-in entry and prominent cart |
| `src/components/layout/customer-account-dropdown.tsx` | Customer disclosure, identity, keyboard handling and dismissal |
| `src/components/layout/app-header-shell.tsx` | Optional distinct mobile links; existing Admin defaults preserved |
| `src/components/layout/mobile-navigation.tsx` | Account anchors and their current-section state within existing modal navigation |
| `src/components/layout/site-footer.tsx` | Retain Track order, Privacy Policy and Terms; remove redundant Menu destination |
| `src/app/(customer)/account/layout.tsx` | Shared responsive account navigation around existing route guard |
| `src/app/(customer)/account/page.tsx` | Clear account hierarchy, Security anchor, collapsible forms; remove supplemental link clutter |
| `src/features/customer-auth/components/account-navigation.tsx` | Profile/Orders/Security navigation and anchor heading focus |
| `src/features/customer-auth/lib/account-section-navigation.ts` | Native same-page hashes, active-state subscriptions and focus; Next links retained between routes |
| `src/features/customer-auth/components/customer-account-profile.tsx` | Profile anchor/focus target and foundation surface styling; save behavior unchanged |
| `src/features/customer-auth/components/customer-password-form.tsx` | Opt-in native disclosure, retaining the existing password form/session behavior |
| `src/features/customer-auth/components/customer-google-methods.tsx` | Official logo, clearer methods hierarchy and opt-in linking disclosure |
| `src/features/customer-auth/components/google-brand.tsx`, `customer-auth-form.tsx` | Local approved Google artwork around existing OAuth callback/busy/disabled behavior |
| `public/images/brand/google-sign-in-light.png`, `google-g.png`, `README.md` | Official assets and provenance |
| `src/app/globals.css` | Customer-only disclosure fade and summary focus support |
| `test/customer-account-navigation.test.tsx`, `mobile-navigation.test.tsx` | New disclosure, failure/retry, focus, section and authenticated mobile assertions |
| `test/customer-auth-navigation.test.tsx`, `customer-navigation.test.tsx`, `site-shell-ux-states.test.tsx`, `public-policies.test.tsx` | Update existing navigation/footer contracts |
| `test/browser/customer-navigation.spec.ts`, `customer-navigation-helpers.ts`, `scripts/run-playwright.mjs` | Real keyboard/hash/responsive/logout checks and default isolated-suite inclusion |
| `test/browser/critical-workflow.spec.ts`, `customer-account.spec.ts`, `google-oauth.spec.ts`, `customer-checkout-ownership.spec.ts`, `customer-anonymous-auth.spec.ts` | Exercise existing behavior through the new disclosure entry points |
| `test/browser/customer-order-history.spec.ts` | Enter Orders through the disclosure from order confirmation |
| `docs/stage-15.3-premium-navigation-account-report.md` | This handoff |
| `docs/stage-15.3-visuals/*.png` | Rendered Chromium review captures, using seeded test data |

## 3. Before/after UX

| Before | After |
| --- | --- |
| Authenticated header replaces tracking with Orders and permanently exposes Sign out | Guest tracking remains primary; account actions live in a compact disclosure |
| Profile followed by uninterrupted security forms and supplemental action links | Responsive account navigation, clearly separated surfaces and opt-in security forms |
| Account orientation differs between profile/history/detail | One account section navigation spans existing protected routes |
| Google authentication is text-only | Unmodified official light button artwork; standard-color Google logo identifies connected methods/linking |
| Footer repeats Menu alongside utility links | Restrained utility footer; guest tracking repetition is intentional recovery access |

Existing profile dirty/save/error state, read-only email, phone editing, auth-method availability, Google-only/password account differences, password validation/session replacement, linking prerequisites, OAuth callbacks and order history contracts are preserved. Full login/register redesign remains deferred.

Google provenance: [official branding guidelines](https://developers.google.com/identity/branding-guidelines), checked 9 October 2026. The unmodified 720×160 light Android/Web PNG renders proportionally at 180×40; the button retains an accessible action label, disabled state and announced busy feedback. Assets are local: no OAuth SDK, font dependency or remote runtime artwork request. Connect Google remains explicit account linking rather than a sign-in action.

## 4. Accessibility changes

- Desktop uses an ordinary disclosure with a button, expanded/controls association, labeled navigation, semantic links and the existing logout button. It does not pretend to be an ARIA application menu.
- Click/Enter/Space open the disclosure. Arrow keys, Home and End navigate its available actions. Tab remains ordinary document navigation and dismisses when leaving. Escape returns focus to the trigger; outside pointer interaction closes without stealing focus. Selecting a destination closes immediately.
- Failed logout leaves the authenticated disclosure and existing alert available for retry; no false success or session clearing is introduced.
- Account anchors move focus to their headings and keep current-section state synchronized with native hash/back/forward navigation. Same-page changes preserve form drafts; route changes retain existing page lifecycle behavior.
- Native details/summary controls expose collapsed/expanded security actions through browser semantics. Focusable summaries receive the foundation's visible outline; forms keep their existing labels/errors/feedback.
- Existing mobile dialog containment, Escape, close focus return, desktop resize handling and scroll lock remain. Account hash destinations are available alongside guest tracking.
- Dropdown opening uses the existing 180ms disclosure token. Closing is immediate so focus/dismissal is not delayed by an exit animation. Hover feedback uses foundation timing; no page entrance/transition animation was added. Existing reduced-motion suppression applies.

## 5. Tests and validation

| Check | Result |
| --- | --- |
| `pnpm --filter web test --runInBand` | 35 suites / 268 tests passed |
| `pnpm --filter web typecheck` | Passed for application and tests |
| `pnpm --filter web lint` | Passed in the final standalone rerun |
| API and Next.js production builds | Passed; 20 static pages generated |
| Chromium production browser checks | All 46 checks passed across eight isolated suites |
| `git diff --check` | Passed |

Browser totals: critical workflow 18, foundation 2, navigation 2, Google OAuth 6, account 3, checkout ownership 6, history 6, anonymous authentication 3. Coverage includes guest/authenticated navigation, dropdown keyboard/Tab/Escape/outside dismissal, delayed failed-logout retry, mobile access, hash focus and Back/Forward state, profile draft preservation, profile save/password session replacement, Google-only/linked accounts, OAuth recovery, cart/checkout ownership, historical detail and reduced motion. Responsive checks include 320/390/768/820/1024/1440px.

Production validation used `ORDERLY_BROWSER_PRODUCTION=1` and the guarded loopback `orderly_test` database, never production data. The full default run passed its first six suites, then stopped on an outdated Orders-link assertion in history. After updating that assertion, navigation/history/anonymous suites passed in separate Playwright invocations with the existing successful production builds and fresh guarded fixtures. The API/web servers restarted between suites to retain rate-limit isolation. This is coverage across successful isolated executions, not a claim that the final default command completed all eight suites in one invocation.

Earlier checks exposed the Next hash/active-indicator gap, missing explicit suppression of the new disclosure animation, stale navigation/footer assertions and test queries needing narrower scope/type options. These were corrected. One concurrent lint invocation encountered a transient missing `test-results` directory while Playwright cleaned output; final lint is run separately after browser completion.

Rendered review is limited to local Chromium screenshots with seeded test data: [desktop account/disclosure](stage-15.3-visuals/desktop-account-dropdown.png), [320px account](stage-15.3-visuals/mobile-account.png), [320px Google entry](stage-15.3-visuals/mobile-google-entry.png). Captures are at the top of the page, with settled opening motion. The mobile section navigation wraps, profile/security surfaces and footer fit the narrow viewport, and Google artwork renders proportionally. These are after-change review artifacts; no pixel baseline comparison was performed.

Unverified: Safari/Firefox rendering, screen-reader announcements, live interactive visual review across every state, real mobile keyboards/safe areas and zoom/reflow beyond the automated viewport checks. No claim of full WCAG conformance is made.

## 6. Remaining risks

- Chromium automation and screenshots do not establish Safari/Firefox behavior or screen-reader conformance. VoiceOver/NVDA announcement of disclosure, native summaries, hash focus and form feedback still needs manual verification.
- Real mobile keyboard/safe-area behavior, 200% text zoom and 400% reflow remain manual checks; automated viewport coverage includes 320, 390, 768, 820, 1024 and 1440px.
- Large customer identity strings wrap/truncate intentionally in the disclosure; no profile-photo service or avatar upload was introduced.
- Password/Google linking drafts remain mounted when collapsed. Navigation away retains the existing page lifecycle; no new unsaved-changes prompt or draft persistence feature was added.
- Official artwork is documented and proportionally rendered; final product-owner visual acceptance remains separate from automated checks.

## 7. Recommendation for Stage 15.4

After approval, proceed with the planned customer storefront presentation: charcoal hero, existing food photography, product-card hierarchy and category navigation polish. Reuse this foundation, preserve configurator constraints/modal focus, and begin with real desktop/mobile visual baselines. Do not broaden that stage into checkout, new account capabilities or a full authentication redesign. Stage 15.3 stops here.
