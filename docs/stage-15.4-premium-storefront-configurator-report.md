# Stage 15.4 — Premium Storefront & Product Configurator

Date: 9 October 2026. Scope: customer homepage, menu browsing and product configuration only.

## 1. Implementation summary

Read the Stage 15.1, 15.2 and 15.3 reports before implementation. Reused the Stage 15.2 customer tokens, Button, Card, ProductImage and QuantityStepper, together with existing native dialogs and focus/scroll-lock utilities. No dependency was added.

The homepage now combines a charcoal hero with a subtle warm gradient, existing food photography and warm-white menu surfaces. Product cards use quieter surfaces, clearer titles and prices, and restrained pointer-hover feedback. Category filters retain their existing selection and scroll behavior, with a named control group and room for focus outlines.

The configurator retains its existing desktop two-column composition, refined with warm surfaces and clearer option states. Mobile uses the available dynamic viewport, compact photography and one scrolling configuration area. Close and purchase controls remain outside that scrolling area. The purchase footer reserves safe-area space.

Selection initialization, optional deselection, minimum/maximum constraints, quantity handling, price calculations and cart construction remain in the existing configurator/cart utilities. Those utilities were not changed. Existing availability, fulfillment, preparation-time, authentication and Admin behavior remain intact. No operational claims were added; hero copy and data-driven facts were preserved.

## 2. File inventory

Paths below are relative to the repository root. This inventory describes Stage 15.4 changes only; the working tree already contained the accepted, uncommitted Stage 15.3 implementation, which was preserved.

| File | Stage 15.4 responsibility |
| --- | --- |
| `apps/web/src/app/globals.css` | Customer-scoped storefront gradient, dark-surface focus treatment, card/control feedback, dialog entrance, price feedback, safe-area footer and reduced-motion overrides. Existing global/Admin styles retained. |
| `apps/web/src/features/menu/components/menu-hero.tsx` | Charcoal presentation, token-based display typography, contrasting copy/actions and a dark-surface focus indicator; existing hero selection, photo sizing and ordering facts retained. |
| `apps/web/src/features/menu/components/category-tabs.tsx` | Named category-filter group, padded overflow area for focus indicators, visible thin overflow scrollbar and token-based transition timing. |
| `apps/web/src/features/menu/components/menu-section.tsx` | Section-title typography, spacing, wrapping heading/count layout and singular item count. Existing one/two/four-column breakpoints retained. |
| `apps/web/src/features/menu/components/product-card.tsx` | Existing Card surface variant, larger two-line titles, stronger price hierarchy and scoped image feedback. Configurable prices are explicitly labeled Base, without calculating a new starting price. |
| `apps/web/src/features/menu/components/menu-browser.tsx` | Reserved-height feedback region for guidance and successful adds; presentation-only callback for configured adds. Existing cart opening, filtering and navigation retained. |
| `apps/web/src/features/menu/components/product-modal/product-modal.tsx` | Dynamic viewport sizing, persistent close control, compact short-screen image, scroll containment, safe-area purchase footer, polite total-price feedback and add-success callback. |
| `apps/web/src/features/menu/components/product-modal/product-option-group.tsx` | Clearer required/default/unavailable/limit presentation, stronger selected boundaries, readable disabled labels, described multi-select groups and correctly signed negative adjustments. Existing keyboard handler and disabling rules retained. |
| `apps/web/test/product-option-keyboard.test.tsx` | Default/unavailable presentation, negative adjustment and minimum-selection description coverage alongside existing arrow/optional/limit tests. |
| `apps/web/test/site-shell-ux-states.test.tsx` | Successful-add feedback, quantity/total announcements and unchanged cart totals/handoff assertions. Earlier Stage 15.3 assertions preserved. |
| `apps/web/test/browser/storefront-configurator.spec.ts` | New responsive interaction/screenshot coverage, actual display-size assertions, hero contrast and focus checks, reduced motion and cart handoff. |
| `apps/web/test/browser/scripts/run-playwright.mjs` | Adds the new storefront suite to the existing isolated production/CI suite sequence. |
| `docs/stage-15.4-visuals/{before,after}/` | Twelve PNGs: storefront and configured-product views at 1440, 390 and 320 pixels, before and after. |
| `docs/stage-15.4-premium-storefront-configurator-report.md` | This implementation and verification report. |

No application files under API, database, cart, checkout, authentication, orders or Admin were changed for this stage. Existing photography and shared primitive implementations were reused without modifying their contracts.

## 3. Before/after visual changes

| Area | Before | After |
| --- | --- | --- |
| Hero | White bordered panel; dark headline and orange store label. | Charcoal brand panel with a static warm gradient, white display headline, warm accent label and restrained orange primary action. Light photography remains the visual counterpoint. |
| Menu filters | Pill controls with hidden horizontal scrollbar and little focus clearance. | Same filter buttons and pressed states, with padded focus clearance, an explicit accessible group name and a thin overflow scrollbar. |
| Section hierarchy | Fixed heading/count row; generic small spacing. | Token-based section titles, wrapping count alignment and increased section spacing; singular counts read correctly. |
| Cards | Bordered, shaded cards with small single-line titles. | Existing surface variant, larger titles that permit two lines, clearer base-price context and subtle image/hover feedback. |
| Option states | Required badge, selection fill and opacity-dimmed disabled controls. | Warm required badge, stronger selected border, visible Default metadata for single-select options, explicit Unavailable/Selection limit reached text and readable disabled content. |
| Mobile configurator | `92vh` panel inside vertically padded wrapper; close control scrolls with details. | `100dvh`-based panel, compact image on short screens, persistent close button and purchase footer with safe-area spacing. |
| Feedback | Price changes immediately; successful add opens the cart. | Price still updates immediately with a short fade and a polite atomic total region. Cart opens immediately, with a persistent successful-add message when returning to the menu. |

Screenshots use the same guarded local fixture and existing photos in both captures. Three temporary photo products exercise the desktop grid and mobile list; they are removed and the original product image is restored in test cleanup. Fixture names/descriptions are test data, not production menu content. Storefront captures cover the full page; configurator captures show the same Large + Extra Cheese selection and $20.00 total.

| View | Before | After |
| --- | --- | --- |
| Desktop storefront, 1440 × 900 viewport | [Before](stage-15.4-visuals/before/storefront-1440.png) | [After](stage-15.4-visuals/after/storefront-1440.png) |
| Mobile storefront, 390 × 844 viewport | [Before](stage-15.4-visuals/before/storefront-390.png) | [After](stage-15.4-visuals/after/storefront-390.png) |
| Narrow storefront, 320 × 568 viewport | [Before](stage-15.4-visuals/before/storefront-320.png) | [After](stage-15.4-visuals/after/storefront-320.png) |
| Desktop configurator | [Before](stage-15.4-visuals/before/configurator-1440.png) | [After](stage-15.4-visuals/after/configurator-1440.png) |
| Mobile configurator | [Before](stage-15.4-visuals/before/configurator-390.png) | [After](stage-15.4-visuals/after/configurator-390.png) |
| Narrow/short configurator | [Before](stage-15.4-visuals/before/configurator-320.png) | [After](stage-15.4-visuals/after/configurator-320.png) |

Rendered review confirmed the baseline short-screen close-control issue. Review also caught Tailwind interpreting untyped token text classes as colors; explicit length hints corrected the typography, with browser assertions preventing recurrence. Final screenshots are recaptured after that correction. This is local Chromium visual inspection, not pixel-diff automation or product-owner visual sign-off.

## 4. Interaction and motion changes

- Card elevation and 1.025× image scaling use transform/shadow transitions over the existing 220ms fade token, only for fine pointers with hover capability.
- Category and option state changes use the 150ms feedback token. Selected options have an inset strong-orange boundary as well as their existing checked state.
- The native product dialog enters with opacity and a restrained 12px translation over the 260ms entry token. Escape, outside dismissal, close and cart handoff remain immediate. No exit timer postpones native-dialog cleanup or focus restoration.
- Total-price changes use a 150ms fade without animating numbers or layout. Actual prices update synchronously using the unchanged calculation hook.
- Successful quick/configured adds update a reserved feedback slot and open the existing cart immediately. The message remains visible on return from the cart, without a new toast dependency, timeout or persistence feature.
- Reduced motion disables the new entrance/price animations and removes card/image hover transforms. Existing global reduced-motion handling suppresses transitions and smooth scrolling.

## 5. Accessibility and performance considerations

### Verified through code and automation

- Native dialog naming, Escape/outside close, focus containment, initial close-button focus, exact-opener restoration and product-to-cart handoff remain covered by browser regressions.
- Radio arrow/Home/End behavior, wrapping, unavailable-option skipping, one radio Tab stop, optional clearing and multi-select limits remain covered by component tests.
- Required and unavailable states have textual descriptions; multi-select controls now share a named, described group. Default metadata appears only for single-select options, matching existing initialization behavior; multi-select defaults were not newly selected.
- The total region is polite and atomic. Successful adds have a persistent polite status region. Feedback space is reserved to avoid shifting the menu when its text changes.
- Focus uses the existing 2px indicator, with the approved light warm ring on the dark hero. Computed hero text/action contrast is checked against 4.5:1, including the gradient's warmest blend for copy.
- At the new captured viewport sizes, the primary hero action, product close button and purchase action are reachable; no horizontal page overflow is observed.
- Photography keeps explicit reserved dimensions/aspect ratios, existing Next Image handling, fallbacks and responsive sizes. Hero imagery remains prioritized, with no hero entrance animation delaying its visibility. The configurator's mobile image size reflects its full-width panel.
- No new font download, animation library, continuous animation, extra data fetch or business dependency was introduced. The hero remains a server-rendered component; client changes are small local presentation state and existing interactions.

### Verification limits

Screen-reader speech has not been manually verified. In particular, native-modal background inertness may suppress the menu's successful-add live region while the cart is open; the cart itself opens and receives focus immediately, and the message is visible after dismissal. Repeated identical adds may not produce a fresh spoken status. Do not treat status markup/browser assertions as proof of announcement behavior.

Real iOS safe-area behavior, mobile browser chrome, landscape/notches, soft keyboards, Safari/Firefox, VoiceOver/NVDA and 200% text/400% page zoom remain manual checks. Local screenshot review does not establish full WCAG conformance.

Image reservations, fixed feedback space, opacity/transform motion and unchanged asset loading are structural CLS/LCP safeguards. No controlled Lighthouse/Web Vitals, throttled-network or production RUM comparison was performed; quantitative CLS/LCP neutrality is not claimed.

## 6. Tests and validation

| Check | Result |
| --- | --- |
| Full web unit/component suite | Passed: 35 suites, 271 tests. |
| Focused storefront/component checks | Passed: 4 suites, 36 tests; includes option presentation, quantity/total feedback, hero, filtering and cart handoff. |
| Application and test TypeScript | Passed, including a final run after the typography correction. |
| Web ESLint | Passed; final run performed after browser cleanup. |
| API production build | Passed through the browser runner; API application source was unchanged. |
| Web production build | Passed after the typography correction; 20 static pages generated, with existing dynamic routes retained. |
| Complete production Chromium browser run | Passed: 48 tests across all nine isolated suites in one final default-runner invocation. |
| Whitespace check | `git diff --check` passed. |
| Rendered visual comparison | Twelve before/after PNGs captured; desktop and mobile storefront/configurator images reviewed locally. |

Browser counts: critical workflow 18; design foundation 2; customer navigation 2; Google OAuth 6; customer account 3; checkout ownership 6; order history 6; anonymous auth 3; storefront/configurator 2. Coverage includes menu/category selection, rendered typography and contrast, radio keyboard interaction, narrow/short viewport fit, persistent close/purchase controls, reduced motion, focus containment/restoration, cart persistence/recovery, checkout, guest tracking, account/OAuth and Admin regression checks.

The full component run passed before the final CSS class-length correction. The focused component suite was repeated against the final source, and the entire production browser run was repeated against the rebuilt final application. All relevant final checks passed. No requested automated check remains unavailable; manual cross-browser/assistive-technology checks and quantitative performance profiling remain unverified as listed above.

Commands used:

```powershell
pnpm --filter web test --runInBand
pnpm --filter web typecheck
pnpm --filter web lint
$env:TEST_DATABASE_URL='postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public'
$env:ORDERLY_BROWSER_PRODUCTION='1'
$env:ORDERLY_STOREFRONT_CAPTURE_DIR='C:\dev\Orderly\docs\stage-15.4-visuals\after'
pnpm --filter web test:e2e
git diff --check
```

The production runner performs guarded local database reset/seeding, API and web production builds, then starts fresh servers per suite to retain rate-limit isolation. No production database or deployment was used. The new screenshot fixture restores its changes and removes only its own temporary product IDs. Builds emit the existing Prisma package-configuration deprecation and Node color-environment warnings; neither blocks validation.

An initial direct baseline invocation lacked the required Prisma environment URLs and was safely denied before test execution. Explicit local `DATABASE_URL` and `DIRECT_DATABASE_URL` resolved that setup error. Before captures used the unchanged Stage 15.3 production build; after captures use the Stage 15.4 production build.

## 7. Remaining issues

- Complete the manual browser, assistive-technology, zoom and device checks listed above before calling the experience fully verified.
- Product-owner review of final food crops, compact mobile photography and the dark/light balance remains separate from implementation/testing.
- Existing modal photography is intentionally contained rather than replaced with a complex product visualization. No new photography was created.
- Extremely long product/option names, many option groups and unusual catalog combinations warrant additional representative production-data visual QA. Card titles intentionally allow two lines; configuration details remain scrollable.
- Cart/checkout/auth/order surfaces retain their prior presentation, including the existing cart checkout-action wording. They were regression-tested but not redesigned.
- Quantitative production performance and the timing/repetition of spoken add feedback remain unverified as described above.

## 8. Recommendations for Stage 15.5

After explicit approval, proceed with the planned cart and checkout presentation work: clearer item/option hierarchy, a concise checkout CTA, warm-white summary/form composition, consistent paused/error feedback and reliable fixed-action clearance. Preserve cart hydration/recovery, quantity/removal, fulfillment fees, minimum-order checks, total calculations, submission guards and expired-session handling.

Begin that stage with rendered cart/checkout baselines, mobile keyboard/safe-area checks and a manually verified announcement strategy inside the active cart dialog. Retain the existing components and avoid a new notification or animation framework. Full Auth and Orders redesign require their own later approval. Stage 15.4 stops here.
