# Stage 15.5 — Premium Cart, Checkout & Order Confirmation

Date: 10 October 2026 (Australia/Sydney).

## 1. Implementation summary

Read the Stage 15.1 plan and Stage 15.2, 15.3, 15.4 and 15.4.1 reports and inspected transaction components, design tokens, shared primitives, persistence, focus utilities and existing tests before implementation.

Baseline findings: cart uses a native named dialog with close-button initial focus, focus containment, exact-opener restoration and counted scroll locking. Header and purchase footer sit outside the item scroll pane. Checkout retains first-invalid focus, field-specific error associations, session/draft recovery and authoritative backend submission. Summary is sticky on desktop; mobile submission is fixed with safe-area padding. Confirmation uses query-derived order number/type/total, with a missing-details fallback; it does not independently fetch current status.

Confirmed accessibility gaps: Stage 15.4 successful-add feedback is in the inert background while cart is open; repeated identical text may not announce. The notes textarea's wrapping label contains only its character count, without a meaningful field name. Fixed checkout clearance was a fixed 112px without matching safe-area reservation. Actual keyboard/device obstruction remains a manual check.

Cart now has a restrained charcoal heading, warm item surfaces, larger existing photography, readable modifier summaries, a full-width quantity/line-total row and a concise Continue to checkout action. Header and footer remain outside the item scroll pane. Empty, paused and availability-failure recovery remain editable. An advisory product/option-unavailability message uses the cart's existing menu fetch; it does not delete items, alter their identity/prices or introduce a new checkout gate. Backend validation remains authoritative.

Checkout uses the existing desktop form/390px summary split, with a narrower foundation content width, compact unboxed page introduction, clear light sections, Lucide fulfillment icons and textual/checked selection states. Existing contact/address errors and focus remain intact; optional notes now have a stable name, helper text and character-limit description. Mobile action height is measured with ResizeObserver, so bottom clearance tracks wrapped labels and safe-area padding. The desktop summary has a viewport-height cap and can scroll on short screens. Submission has one polite busy status and disabled/busy actions; existing error focus, retry, session recovery and preserved drafts are unchanged.

Confirmation emphasizes the order number with charcoal, keeps supplied fulfillment/total details, and uses the shared action styles. The success mark fades without moving the layout. Removed the hard-coded Pending badge: this query-derived page cannot establish latest order status. Existing tracking remains the source of current status. Missing details use the existing recovery primitive in a restrained width. Screenshot review caught mobile action shrinking in the stacked flex layout; an explicit 48px minimum now protects success and recovery links.

No API/database application source, dependencies, pricing/fulfillment utilities, cart reducer/storage/types, request mapping or authentication logic changed. The only storefront change makes its existing visible add message passive so it does not compete with the cart's live announcement; its approved design and handoff remain intact.

## 2. File inventory

Paths are relative to the repository root.

| File | Responsibility |
| --- | --- |
| `apps/web/src/features/cart/utils/cart-feedback.ts` | Presentation-only middleware emits successful add/update/remove/clear feedback after unchanged reducers run; no persisted notification state. |
| `apps/web/src/store/store.ts` | Wires that middleware; existing authentication/private-data behavior remains untouched. |
| `apps/web/src/features/cart/components/cart-drawer/cart-drawer.tsx` | One in-dialog live region, deferred text insertion, ordinary-reopen suppression, catalog advisory, scrolling and safe removal/clear focus. |
| `apps/web/src/features/cart/components/cart-drawer/cart-drawer-header.tsx` | Charcoal identity, actual quantity count, persistent close action. |
| `apps/web/src/features/cart/components/cart-drawer/cart-item-row.tsx` | Photo/title/modifier hierarchy, quantity/total row and advisory presentation. |
| `apps/web/src/features/cart/components/cart-drawer/cart-drawer-footer.tsx` | Strong subtotal, shared checkout link, compact safe-area footer; existing availability recovery preserved. |
| `apps/web/src/features/cart/components/cart-drawer/cart-empty-state.tsx` | Foundation icon treatment and scrollable short-screen empty content. |
| `apps/web/src/features/checkout/components/checkout-page-client.tsx` | Page spacing, busy feedback and measured mobile clearance; submission/calculation/recovery branches retained. |
| `apps/web/src/features/checkout/components/checkout-order-summary.tsx` | Photography on mobile/desktop, clearer totals, viewport cap and accurate generic error-summary wording. Pickup delivery fee is labeled Not applicable; numeric calculations are unchanged. |
| `apps/web/src/features/checkout/components/fulfillment-selector.tsx` | Existing pressed buttons, named group, Lucide icons, strong borders/checkmarks and readable unavailable text. |
| `apps/web/src/features/checkout/components/customer-details-form.tsx`, `delivery-address-form.tsx` | Foundation surfaces and remove redundant section numbering; label/error IDs retained. |
| `apps/web/src/features/checkout/components/order-notes-field.tsx` | Meaningful label and associated help/count, preserving the 200-character limit. |
| `apps/web/src/features/checkout/components/checkout-step-indicator.tsx` | Same two noninteractive steps, compact ordered list with current-step semantics. |
| `apps/web/src/features/checkout/components/checkout-skeleton.tsx` | Announced loading state and introduction geometry aligned with checkout. |
| `apps/web/src/app/(customer)/order-success/page.tsx` | Confirmation/recovery hierarchy, token/shared-action reuse, touch targets; parameter parsing unchanged. |
| `apps/web/src/app/globals.css` | Customer-only drawer/mark feedback, dark close focus ring, measured checkout clearance and reduced-motion overrides. |
| `apps/web/src/features/menu/components/menu-browser.tsx` | Removes live semantics from the unchanged visible storefront feedback. |
| `apps/web/test/cart-dialog-feedback.test.tsx`, `order-confirmation.test.tsx` | Quick/configured repeated add, update/remove/clear, ordinary reopen, availability and confirmation/recovery coverage. |
| `apps/web/test/checkout-field-accessibility.test.tsx`, `site-shell-ux-states.test.tsx` | Notes name/help association and passive storefront-message assertions. |
| `apps/web/test/browser/premium-transactions.spec.ts` | Guarded before/after fixtures, responsive transaction/retry/busy/minimum/fee/recovery/scroll checks. |
| `apps/web/test/browser/critical-workflow.spec.ts`, `customer-checkout-ownership.spec.ts`, `customer-order-history.spec.ts` | Existing scenarios enter checkout through the new CTA wording. |
| `apps/web/test/browser/storefront-configurator.spec.ts` | Existing visible storefront-message assertion follows its passive semantics. |
| `apps/web/test/browser/scripts/run-playwright.mjs` | Adds the new suite to the existing isolated production/CI sequence. |
| `docs/stage-15.5-visuals/{before,after}/`, `docs/stage-15.5-premium-cart-checkout-report.md` | Review captures and this report. |

## 3. Before/after screenshots

Local production Chromium, guarded loopback `orderly_test`, at 1440×900, 390×844 and 320×568. Baseline/after use the same configured Golden Path Pizza, Large + Extra Cheese. Test orders and failure interception are local only. No production data is used.

| View | Before | After |
| --- | --- | --- |
| Desktop populated cart | [1440px](stage-15.5-visuals/before/cart-populated-1440.png) | [1440px](stage-15.5-visuals/after/cart-populated-1440.png) |
| Mobile populated cart | [390px](stage-15.5-visuals/before/cart-populated-390.png) | [390px](stage-15.5-visuals/after/cart-populated-390.png) |
| Narrow populated cart | [320px](stage-15.5-visuals/before/cart-populated-320.png) | [320px](stage-15.5-visuals/after/cart-populated-320.png) |
| Empty cart | [320px](stage-15.5-visuals/before/cart-empty-320.png) | [320px](stage-15.5-visuals/after/cart-empty-320.png) |
| Paused cart | [320px](stage-15.5-visuals/before/cart-paused-320.png) | [320px](stage-15.5-visuals/after/cart-paused-320.png) |
| Checkout availability failure | [320px](stage-15.5-visuals/before/cart-checkout-unavailable-320.png) | [320px](stage-15.5-visuals/after/cart-checkout-unavailable-320.png) |
| Item unavailable | [320px](stage-15.5-visuals/before/cart-item-unavailable-320.png) | [320px](stage-15.5-visuals/after/cart-item-unavailable-320.png) |
| Removal | [320px](stage-15.5-visuals/before/cart-removed-320.png) | [320px](stage-15.5-visuals/after/cart-removed-320.png) |
| Desktop pickup checkout | [1440px](stage-15.5-visuals/before/checkout-pickup-1440.png) | [1440px](stage-15.5-visuals/after/checkout-pickup-1440.png) |
| Mobile pickup checkout | [390px](stage-15.5-visuals/before/checkout-pickup-390.png) | [390px](stage-15.5-visuals/after/checkout-pickup-390.png) |
| Narrow pickup checkout | [320px](stage-15.5-visuals/before/checkout-pickup-320.png) | [320px](stage-15.5-visuals/after/checkout-pickup-320.png) |
| Desktop delivery checkout | [1440px](stage-15.5-visuals/before/checkout-delivery-1440.png) | [1440px](stage-15.5-visuals/after/checkout-delivery-1440.png) |
| Mobile delivery checkout | [390px](stage-15.5-visuals/before/checkout-delivery-390.png) | [390px](stage-15.5-visuals/after/checkout-delivery-390.png) |
| Narrow delivery checkout | [320px](stage-15.5-visuals/before/checkout-delivery-320.png) | [320px](stage-15.5-visuals/after/checkout-delivery-320.png) |
| Invalid fields | [320px](stage-15.5-visuals/before/checkout-invalid-320.png) | [320px](stage-15.5-visuals/after/checkout-invalid-320.png) |
| Failed submission | [320px](stage-15.5-visuals/before/checkout-failure-320.png) | [320px](stage-15.5-visuals/after/checkout-failure-320.png) |
| Minimum order | [320px](stage-15.5-visuals/before/checkout-minimum-320.png) | [320px](stage-15.5-visuals/after/checkout-minimum-320.png) |
| Free delivery | [320px](stage-15.5-visuals/before/checkout-free-delivery-320.png) | [320px](stage-15.5-visuals/after/checkout-free-delivery-320.png) |
| Desktop confirmation | [1440px](stage-15.5-visuals/before/confirmation-1440.png) | [1440px](stage-15.5-visuals/after/confirmation-1440.png) |
| Mobile confirmation | [390px](stage-15.5-visuals/before/confirmation-390.png) | [390px](stage-15.5-visuals/after/confirmation-390.png) |
| Narrow confirmation | [320px](stage-15.5-visuals/before/confirmation-320.png) | [320px](stage-15.5-visuals/after/confirmation-320.png) |
| Missing details | [320px](stage-15.5-visuals/before/confirmation-missing-320.png) | [320px](stage-15.5-visuals/after/confirmation-missing-320.png) |

Additional after-only viewport captures: [long cart scrolled](stage-15.5-visuals/after/cart-scrolled-320.png), [checkout scrolled 390px](stage-15.5-visuals/after/checkout-scrolled-390.png), [checkout scrolled 320px](stage-15.5-visuals/after/checkout-scrolled-320.png), [invalid-field focus 390px](stage-15.5-visuals/after/checkout-invalid-scrolled-390.png), [invalid-field focus 320px](stage-15.5-visuals/after/checkout-invalid-scrolled-320.png), and [busy submission](stage-15.5-visuals/after/checkout-submitting-320.png). Both directories also contain invalid/failure/missing-details captures at 1440px and 390px. Cart/explicit scrolled captures are viewport screenshots; checkout/confirmation overview captures are full-page artifacts, whose fixed header/action positions should be assessed with the viewport captures and geometry assertions.

Visual comparison: mobile quantity and line total now share a readable row, the checkout introduction is more compact, the selected fulfillment boundary is stronger, and order number is dominant. Photos use the same existing asset; the fixture restores the original product image and temporary store minimum/fee in cleanup. The minimum/fee screenshot uses $30 minimum and $7.25 configured delivery, then tests the unchanged $50 free-delivery threshold. Overview orders use two $20 configured items ($41.20 pickup / $46.20 delivery). Order numbers naturally differ across real local orders. After screenshots wait for finite animations to finish; these are review artifacts, not automated pixel baselines.

## 4. Accessibility and interaction changes

One polite, atomic region lives inside the active cart dialog. The region mounts empty and receives text after two animation frames; pending changes are cancelled on dismissal. Add text includes quantity added, product name and resulting quantity, so repeated adds change the meaningful message. Quick and configured adds share the unchanged add action. A presentation-only middleware observes that action after reduction; cart state/action/persistence contracts are unchanged. Quantity/removal/clear use the same region, coalescing rapid updates rather than introducing multiple toasts or announcements. Background storefront text remains visible but passive. Ordinary cart reopening does not replay a prior add.

Removal and clear move focus to the persistent close button when the acted-on controls disappear. Native modal lifecycle, Escape/outside dismissal, Tab containment and exact-opener/product-to-cart restoration are retained. Modifiers and persisted configured keys remain intact. Quantity/remove targets stay at least 44px; confirmation/recovery links now have 48px minimums.

Fulfillment retains pressed-button semantics and adds a named control group, checked graphic and strong boundary. Notes has a unique label and associated helper/count; existing contact/address field IDs, invalid/error relationships and first-invalid focus are preserved. Busy submission is announced once in checkout; actions expose busy/disabled state. Error-summary copy covers both invalid fields and server failure accurately. Backend submission errors still receive focus and preserve entered details. Confirmation keeps existing Order received route metadata and Next's route announcement, plus the existing announced successful-submission transition; no additional duplicate success live region is added.

Drawer entry is a restrained 12px/opacity change over the existing 280ms token. Confirmation mark uses the existing 220ms fade. Exit/handoff remain immediate. Reduced-motion overrides disable both additions, preserving textual feedback.

Rendered verification additionally caught first-invalid focus below the visible area at 320px. Invalid-field and submission-error focus now use immediate centered scrolling, so the existing target is exposed between the header and mobile action. Validation rules and target selection are unchanged; geometry checks cover both paths.

## 5. Automated validation results

| Check | Result |
| --- | --- |
| Web component suite: `pnpm --filter web test --runInBand` | 37 suites / 282 tests passed. |
| Focused components after the final error-focus correction | 4 suites / 28 tests passed: checkout customer page, cart dialog feedback, confirmation and field accessibility. |
| Application and test TypeScript: `pnpm --filter web typecheck` | Passed. |
| Web ESLint: `pnpm --filter web lint` | Passed. |
| Production builds | API build passed; Next production build passed after final source changes with the existing local-browser production flag/origin configuration. |
| Production Chromium transaction suite | 5 passed: responsive transactions at all three widths, minimum/fee/unavailable/paused states, corrupt persistence and long-cart recovery. |
| Production Chromium regression suites | All passed: critical workflow (18), checkout ownership (6), order history (6), storefront configurator (2) and design foundation (2). With the transaction suite, 39 browser tests passed. |
| Screenshot artifacts | 30 before / 38 after PNGs, including initial/scrolled cart, invalid-field viewport, fixed-action clearance, busy/failure/retry and confirmation/recovery. |
| Whitespace/scope inspection | `git diff --check` passed; application API/database, dependency manifests, cart state/storage contracts and pricing/fulfillment utilities unchanged. |

Browser commands use `pnpm --filter web test:e2e:run <suite>` with `ORDERLY_BROWSER_PRODUCTION=1`, local API origin and guarded loopback `orderly_test` database. `ORDERLY_TRANSACTION_CAPTURE_DIR` selects the screenshot directory; `ORDERLY_TRANSACTION_BASELINE=1` permits baseline presentation assertions. Failure responses are intercepted locally; successful orders use the local test API. Temporary catalog/settings fixtures restore their original values in cleanup.

Coverage includes empty/populated/configured carts, repeated additions, quantity/removal/clear, persisted and corrupt storage, pickup/delivery, minimum/fee/free-delivery cases, invalid submission, disabled busy submission with one POST, failed submission with preserved details and successful retry, confirmation/recovery, exact focus restoration, reduced motion, horizontal overflow, short-screen scrolling and geometric fixed-action clearance. The existing regression suites also cover authenticated/guest ownership and session recovery without changing those contracts.

Verification corrections: baseline failure selectors were narrowed to exclude Next's route-announcer alert; screenshot capture waits for finite animations. An initial standalone build needed the existing local-production test flag. Sandboxed browser cleanup stalled after test completion, so the final isolated browser run uses approved execution outside that sandbox. Rendered touch-target and invalid-focus defects were fixed and retested; no assertion was relaxed to hide them.

## 6. Unverified manual checks

VoiceOver/NVDA speech (including repeated adds and rapid changes), Safari/Firefox, real iOS safe areas, mobile browser chrome, soft keyboards, landscape, 200% text zoom and 400% reflow remain manual checks. Automated live-region markup/DOM changes do not prove spoken announcement delivery.

## 7. Remaining issues

Confirmation retains the existing query-parameter contract. Tracking is the source of latest status; no unsupported payment, acceptance, preparation or arrival information is introduced.

Catalog advice is a snapshot from the existing cart availability request, not a reservation or an authoritative checkout decision. Closing/reopening retains the existing refresh behavior. The unavailable-item warning may require scrolling on a short screen; the controls remain reachable in the item pane and the purchase footer remains separate.

Unusually long product/option names, many cart rows, browser text enlargement and real device keyboard/safe-area combinations warrant representative manual review. Local fixtures cover four configurations and 320px/568px short-screen scrolling. No quantitative Lighthouse/Web Vitals or production performance comparison was performed. Product-owner visual acceptance remains separate from engineering validation.

## 8. Stage 15.6 recommendations

After separate approval, review the planned remaining customer Auth/Orders/Tracking presentation and complete manual device/assistive-technology acceptance. Preserve authentication and historical-order contracts. Stage 15.5 stops here; no later stage is started.
