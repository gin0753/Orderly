# Stage 15.2 — Premium design system foundation

## Scope and outcome

Implemented the conditionally approved foundation from the full Stage 15.1 plan. Changes are incremental and scoped to the customer shell. No dependency, API, database, authentication, route or business-rule changes were made. Admin retains its original root tokens and primitive fallback dimensions. Account/navigation/hero redesign, Google artwork and animation overhaul remain deferred.

## Implemented tokens and variants

`apps/web/src/app/globals.css` adds `.customer-theme`, without replacing the root palette:

| Family | Foundation |
| --- | --- |
| Surfaces | Warm page `#FAF8F5`, white transactional surface, soft `#F3F0EB`; reserved charcoal `#181818` / `#242424` |
| Text | Primary `#1C1917`, secondary `#57534E`, muted/placeholder `#69635D` |
| Orange | Existing accessible strong/text `#C2410C`, soft `#FFF1E7`, hover `#9A3412`; bright orange remains decorative |
| Borders | Decorative `#E7E2DA`; form boundary `#8A8178`; invalid boundary uses existing strong danger |
| Typography | System font; display, page, section, card, body, helper and badge sizes with paired leading; responsive display/page sizes |
| Spacing | 4px-based 1/2/3/4/6/8/12/16 scale; 16/24/32px responsive gutters; 72rem content-width token |
| Shape/elevation | 12px controls, 20px cards, 24px overlays, pill; restrained surface, hover and overlay shadows |
| Focus/controls | 2px solid orange outline with 2px offset; 48px form controls with 16px text; 44px small/medium/icon buttons and quantity controls |
| Motion | 150ms feedback, 180ms disclosure, 220ms fade, 260ms enter, 280ms drawer; existing easing and reduced-motion suppression |

Typography, gutter, charcoal, overlay and hover tokens are available for later approved work; they do not automatically restyle every heading, layout or hero in this stage. Existing animation timing is preserved through token fallbacks.

Button retains `brand`, `brandSoft`, `dark`, `secondary`, `outlineBrand`, `ghost`, `danger`, `warningSoft`, `successSoft` and `sm`/`md`/`lg`/`icon`; exported `buttonStyles` allows future semantic links to reuse the same styling. Card adds opt-in `surface` and `plain`, retaining `outlined` as the default. Input, Select and Textarea share `controlClasses`; customer tokens apply through inheritance while Admin retains existing fallbacks.

## Files changed and rationale

All paths below are relative to `apps/web/` unless stated otherwise.

| Files | Rationale |
| --- | --- |
| `src/app/globals.css` | Customer-scoped semantic foundation, stronger text/control contrast and focus; tokenized existing motion |
| `src/components/layout/customer-shell.tsx` | Theme boundary, skip link and focusable main target |
| `src/components/ui/button.tsx`, `card.tsx` | Reusable styling API, scoped dimensions/radii, opt-in card variants |
| `src/components/ui/control-styles.ts`, `input.tsx`, `select.tsx`, `textarea.tsx` | Consolidate shared control appearance and preserve Admin fallbacks |
| `src/components/ui/quantity-stepper.tsx`, `src/features/cart/components/cart-drawer/cart-item-row.tsx` | Visible focus, contextual names and 44px controls; prevent stepper shrinking on narrow mobile; enlarge remove target |
| `src/features/menu/components/product-modal/product-option-group.tsx` | Roving radio focus and arrow/Home/End handling without changing optional-selection rules |
| `src/features/checkout/components/customer-details-form.tsx`, `delivery-address-form.tsx` | Unique field/error IDs and separate stable labels with error descriptions |
| `src/app/(customer)/account/page.tsx`, `src/features/customer-orders/customer-orders-page.tsx`, `customer-order-detail-page.tsx` | Remove nested main landmarks; shell owns the customer main landmark |
| `src/components/layout/policy-page.tsx`, `src/app/(customer)/track-order/page.tsx`, `src/features/order-tracking/components/result/order-status-timeline.tsx` | Use accessible strong orange for identified small text |
| `test/product-option-keyboard.test.tsx`, `test/checkout-field-accessibility.test.tsx` | Focused keyboard, optional/required/multiple selection and label/error association coverage |
| `test/checkout-customer-page.test.tsx`, `test/customer-orders-page.test.tsx`, `test/site-shell-ux-states.test.tsx` | Invalid-submit focus, landmark and skip-link regression assertions |
| `test/browser/design-foundation.spec.ts`, `test/browser/scripts/run-playwright.mjs` | Computed contrast/focus/Admin isolation and 320px keyboard/target checks; include new suite in default isolated browser runner |
| `docs/stage-15.2-premium-design-system-foundation.md` | Implementation handoff and validation record |

The existing Stage 15.1 planning document remains unchanged.

## Accessibility and before/after behavior

- Single-choice product groups previously exposed separate Tab stops without complete radio keyboard behavior. They now expose one available Tab stop, wrap with arrow keys, and support Home/End while skipping unavailable choices. Existing callbacks, totals, required selection and optional click/Space/Enter clearing are preserved. Multiple-choice behavior remains unchanged.
- Checkout errors previously shared the label wrapper. Labels now remain stable accessible names; `aria-invalid` and `aria-describedby` connect each control to its own error, removed when valid. React IDs prevent collisions across repeated form sections. Invalid submission still focuses the first invalid field and does not submit an order.
- Customer account/order pages now have one main landmark. A keyboard-visible skip link targets the shell main.
- Customer placeholder/muted text and control boundaries are darker. Identified orange helper text uses strong orange. The browser test measures representative rendered text/placeholder ratios at least 4.5:1 and control boundaries at least 3:1. This is targeted verification, not a claim of whole-site WCAG conformance.
- Customer focus outlines also cover existing links/custom controls. Quantity controls maintain 44px targets even at 320px, with product-specific cart labels. Existing modal Escape/focus return, scrolling and reduced-motion behavior are preserved.

## Validation

| Check | Final result |
| --- | --- |
| `pnpm --filter web test --runInBand` | 34 suites, 262 tests passed |
| `pnpm --filter web typecheck` | Application and test TypeScript checks passed |
| `pnpm --filter web lint` | Passed |
| `git diff --check` | Passed |
| Production `pnpm test:browser` with `ORDERLY_BROWSER_PRODUCTION=1` and local guarded `TEST_DATABASE_URL` | All 44 Chromium tests passed across seven isolated suites |
| API and Next.js production builds inside browser runner | Passed; 20 static pages generated |

Browser coverage includes guest checkout/tracking, admin acceptance/auth, customer login/registration/revocation, Google OAuth, profile/password session replacement, checkout ownership/refresh, history/detail, anonymous auth, responsive layouts, dialog focus handoff, reduced motion and the new foundation checks. The runner reset and seeded only the guarded loopback `orderly_test` database.

An initial standalone web build lacked required `ORDERLY_API_ORIGIN`; the production runner supplied its local test configuration and built successfully. An initial combined-spec invocation bypassed the established per-suite API restarts and encountered an observed auth rate-limit error. Account/session scenarios passed in the final default isolated run. That initial run also exposed shrinking quantity targets and an incorrect placeholder-test target; both were corrected and verified. No throttling or authentication code was changed.

No final automated check remained blocked. Interactive visual inspection was unavailable because the in-app browser tooling failed to initialize; repository Playwright checks ran successfully. Manual assistive-technology and non-Chromium checks were not run.

## Risks and remaining work

- Automated browser verification uses Chromium. Manual screen-reader, Safari/Firefox and real mobile keyboard/safe-area checks remain necessary before claiming complete accessibility coverage.
- Larger customer controls and card radii are intentional incremental visual changes. Automated narrow-mobile checks pass; full visual review of every content combination remains future QA.
- Only confirmed contrast findings and representative shared controls were addressed. Hard-coded page styling remains for later scoped redesign; tokens do not imply a wholesale CSS migration.
- Native custom radio buttons preserve optional deselection semantics. Keyboard behavior is covered, but assistive-technology announcement should receive manual review.
- Do not adopt customer variants in Admin without a separate review. The browser suite verifies Admin login retains 14px/44px controls and original border colors.

## Recommended next stage

Request approval for the Stage 15.1 navigation/account information architecture before implementing the account dropdown and responsive header. Reuse this foundation and preserve public guest tracking. Keep hero, Google asset replacement and account dashboard presentation in their approved later stages. Stage 15.2 stops here.
