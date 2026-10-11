# Stage 15.6 — Premium Authentication, Orders & Tracking

Date: 10 October 2026 (Australia/Sydney). Scope: customer presentation and accessibility only. Stage 15.7 has not begun.

## 1. Implementation summary

Read the Stage 15.1 plan and all Stage 15.2–15.5 reports, including the Stage 15.4.1 refinement, before changing application code. Inspected authentication form/validation/session integration, shared account layout/navigation, customer-scoped order queries and historical response types, guest lookup/storage/polling, shared primitives, tokens and regression suites. Captured the accepted Stage 15.5 production UI before implementation.

Authentication now has an unboxed page introduction, a restrained white form surface, foundation-sized inputs and actions, a larger existing Show password target and clearer guest/registration paths. Password-policy help remains associated alongside validation errors. Invalid fields and server/Google-start errors receive visible focus. Existing official Google light artwork is reused without modification; no new SDK, asset, font or provider behavior is introduced.

Account integration retains the accepted Stage 15.3 rail/wrapping navigation, dropdown, route guard and Profile/Security anchors. Orders/detail remove their extra inner page gutters, so content aligns with that layout. No second account navigation is added. Authentication keeps its safe return path, including order-history destinations; guest tracking includes a normal link to the existing protected order-history route.

History uses quiet foundation surfaces, clearer total labels, readable status badges, dated records, contextual descriptions for repeated View order links, 44px status/sort/page controls, a non-color selected check, skeleton loading and result-count feedback. Existing filter/sort/page links, page-reset behavior, query keys, ownership scoping and requests are preserved.

Detail uses a compact charcoal order identity with current recorded status and stored placed/updated timestamps. White sections organize historical items/modifiers, fulfillment/contact/notes and stored totals. It does not acquire a catalog dependency, recalculate prices, add an order-history timeline, or introduce reorder/payment capabilities. Pickup delivery fees say Not applicable, consistent with Stage 15.5; numeric data is unchanged.

Guest tracking removes repetitive promotional panels, emphasizes the lookup task and privacy instructions, and makes result/refresh/recovery paths clearer. The existing four progress positions become a labeled ordered list: current status, earlier step and not-yet-reached are text distinctions. Accepted remains represented in the Placed position with explicit Current status: Accepted; cancellation has its own factual presentation. Only the supplied placed/updated timestamps are shown. Individual step timestamps, ETAs and payment assumptions are not invented. Polling, terminal-status handling, verification, storage and lookup contracts are unchanged.

## 2. Files changed

Paths are relative to the repository root.

| Files | Responsibility |
| --- | --- |
| `apps/web/src/features/customer-auth/components/customer-auth-form.tsx` | Foundation form composition, combined helper/error descriptions, existing visibility target, submission/error focus. |
| `apps/web/src/features/customer-orders/customer-orders-page.tsx` | Account-aligned hierarchy, shared Card/Button actions, URL-backed control presentation, result feedback and record summaries. |
| `apps/web/src/features/customer-orders/customer-orders-loading.tsx` | Shared, announced list/detail skeletons using existing skeleton parts. |
| `apps/web/src/features/customer-orders/customer-order-detail-page.tsx` | Charcoal record identity, stored timestamps/items/totals and shared back/retry actions. |
| `apps/web/src/features/customer-orders/customer-order-status.tsx` | Consistent readable textual badge dimensions. |
| `apps/web/src/app/(customer)/track-order/page.tsx` | Focused lookup/privacy/history composition with existing primitives and Lucide icon. |
| `apps/web/src/features/order-tracking/components/lookup/order-lookup-form.tsx` | Field-specific error associations/focus, helper description, one busy live region and foundation submit action. |
| `apps/web/src/features/order-tracking/components/result/order-status-timeline.tsx` | Ordered progress semantics, current Accepted representation, explicit future/earlier text and truthful timestamp limits. |
| `apps/web/src/features/order-tracking/components/result/order-tracking-header.tsx` | Result identity/status/date hierarchy, refresh busy state and Track another order link. |
| `apps/web/src/features/order-tracking/components/result/order-tracking-result.tsx` | Foundation spacing, initial result-heading focus without refocusing background/manual refresh, existing refresh feedback. |
| `apps/web/src/features/order-tracking/components/result/tracking-order-summary.tsx` | Untruncated historical names, grouped modifiers, semantic item list/totals and narrow price wrapping. |
| `apps/web/src/features/order-tracking/components/result/order-tracking-details.tsx` | Quiet surface and wrapping contact/address/notes. |
| `apps/web/src/features/order-tracking/components/result/order-tracking-loading-state.tsx` | Loading heading and one implicit polite status. |
| `apps/web/src/features/order-tracking/components/result/order-tracking-error-state.tsx`, `order-tracking-verification-state.tsx` | Foundation recovery surfaces/actions; decorative lock replaced by existing icon. |
| `apps/web/test/customer-auth-forms.test.tsx`, `premium-tracking-accessibility.test.tsx` | Helper/error association, generic auth-error focus, repeated tracking validation focus, busy/server recovery and all timeline statuses. |
| `apps/web/test/browser/premium-auth-orders-tracking.spec.ts` | Deterministic presentation captures, responsive focus/controls, Google-start failure without external navigation, tracking and history state/retry checks. |
| `apps/web/test/browser/critical-workflow.spec.ts` | Accepted timeline assertion updated to new text and current-step semantics. |
| `apps/web/test/browser/premium-transactions.spec.ts` | Stabilizes the unchanged checkout-clearance assertion by scrolling immediately and awaiting the same geometric bound. |
| `apps/web/test/browser/scripts/run-playwright.mjs` | New suite included in existing isolated production/CI sequence. |
| `docs/stage-15.6-visuals/{before,after}/`, this report | Review evidence and handoff. |

No API/database/schema application files, dependencies, auth/session/return-path utilities, order APIs/query parsers, ownership rules, tracking hook/storage/API, Admin, accepted Profile/Security or Stage 15.2–15.5 transaction/storefront components are changed.

## 3. Before/after visual comparisons

Local production Chromium at 1440×900, 390×844 and 320×568. Screenshots use fixed local route-response fixtures with the same Alex Taylor customer, order #156001, two Large Golden Path Pizzas with Extra Cheese and the stored $41.20 pickup total. No production customer data or external authentication is involved. Separate regression suites exercise real local API sessions/orders/ownership. These screenshots are review artifacts, not pixel baselines or final product-owner acceptance.

| View | Before: 1440 / 390 / 320px | After: 1440 / 390 / 320px |
| --- | --- | --- |
| Sign in | [1440](stage-15.6-visuals/before/login-1440.png) · [390](stage-15.6-visuals/before/login-390.png) · [320](stage-15.6-visuals/before/login-320.png) | [1440](stage-15.6-visuals/after/login-1440.png) · [390](stage-15.6-visuals/after/login-390.png) · [320](stage-15.6-visuals/after/login-320.png) |
| Registration | [1440](stage-15.6-visuals/before/register-1440.png) · [390](stage-15.6-visuals/before/register-390.png) · [320](stage-15.6-visuals/before/register-320.png) | [1440](stage-15.6-visuals/after/register-1440.png) · [390](stage-15.6-visuals/after/register-390.png) · [320](stage-15.6-visuals/after/register-320.png) |
| Order history | [1440](stage-15.6-visuals/before/orders-1440.png) · [390](stage-15.6-visuals/before/orders-390.png) · [320](stage-15.6-visuals/before/orders-320.png) | [1440](stage-15.6-visuals/after/orders-1440.png) · [390](stage-15.6-visuals/after/orders-390.png) · [320](stage-15.6-visuals/after/orders-320.png) |
| Order detail | [1440](stage-15.6-visuals/before/order-detail-1440.png) · [390](stage-15.6-visuals/before/order-detail-390.png) · [320](stage-15.6-visuals/before/order-detail-320.png) | [1440](stage-15.6-visuals/after/order-detail-1440.png) · [390](stage-15.6-visuals/after/order-detail-390.png) · [320](stage-15.6-visuals/after/order-detail-320.png) |
| Tracking search | [1440](stage-15.6-visuals/before/tracking-search-1440.png) · [390](stage-15.6-visuals/before/tracking-search-390.png) · [320](stage-15.6-visuals/before/tracking-search-320.png) | [1440](stage-15.6-visuals/after/tracking-search-1440.png) · [390](stage-15.6-visuals/after/tracking-search-390.png) · [320](stage-15.6-visuals/after/tracking-search-320.png) |
| Tracking result | [1440](stage-15.6-visuals/before/tracking-result-1440.png) · [390](stage-15.6-visuals/before/tracking-result-390.png) · [320](stage-15.6-visuals/before/tracking-result-320.png) | [1440](stage-15.6-visuals/after/tracking-result-1440.png) · [390](stage-15.6-visuals/after/tracking-result-390.png) · [320](stage-15.6-visuals/after/tracking-result-320.png) |

Both directories additionally contain login/tracking invalid-field views at all widths and 320px login failure, verification, not-found, unavailable, refreshing, history loading/empty/error views. After-only captures add login submitting, tracking loading and Accepted, Ready, Completed and Cancelled tracking. Full-page screenshots provide content overviews; sticky headers retain the capture's current scroll position in scrolled error overviews. Automated geometry/focus checks verify the actual focused control fits below the 64px header and within the viewport. Real soft-keyboard behavior is not established by those captures.

Rendered comparison: the authentication title sits clearly above its form instead of inside a large bordered panel; inputs and visibility controls have more comfortable targets. History content now aligns with the existing account navigation, removing double mobile gutters; status and total remain prominent while filters wrap at usable sizes. The charcoal detail header separates identity from the white historical record sections. Tracking search is narrower and task-focused on desktop; result names and modifiers wrap instead of truncating on mobile, and future timeline labels no longer read like completed events. Inspected representative before/after 1440px, 390px and 320px PNGs, including registration, invalid focus and skeleton states. Final aesthetic acceptance remains separate.

## 4. Accessibility and interactions

Shell ownership of the single main landmark and skip link is retained. Pages have meaningful headings; forms and progress/summary sections are named. No account navigation is duplicated. Labels, autocomplete, current/new-password semantics, validation rules, credentials, OAuth calls and redirect handling remain intact.

Registration descriptions combine password policy and error instead of dropping help on invalid input. Existing Show password still controls both supported password fields, with a 44px label target. Login validation focuses the first invalid field with immediate centered scrolling; existing server feedback and Google-start failure are focused and exposed. Busy/disabled feedback remains textual and programmatic.

Guest validation focuses the invalid input on every submit, including repeated identical failures, with `aria-invalid` and its own associated message. Contact help remains in the description. Server lookup errors use the existing safe generic copy, focus the error and preserve entries. One persistent polite region handles busy lookup; there is no second validation live announcement. Successful result focus moves to the order heading once; refresh does not reapply that focus. Existing explicit-refresh feedback remains the only tracking refresh announcement; background polling is not given another live region.

Progress uses an ordered list and one current step for each non-cancelled status, including Accepted. Color is supplemented by text, step numbers and decorative checkmarks. Earlier positions are labeled Earlier step rather than claimed timestamped events; future steps say Not yet reached. Cancellation does not render a misleading completed progression. Item lists and monetary definition lists expose structure; repeated imagery has empty alternatives because adjacent item names supply the content.

History controls retain native links, current-state attributes and browser-history behavior. Status selection includes a check and visible boundary. Pending skeletons hide their geometry from assistive technology and announce loading once. Successful/update feedback uses one result-count region. Foundation focus styles, stronger text/control colors, 44/48px controls and global reduced-motion suppression are reused; no new animation or stylesheet is introduced.

## 5. Automated validation

All requested automated categories completed. Browser results below cover successful isolated executions against the final production build; the default runner did not complete every suite in one uninterrupted invocation.

| Check | Result |
| --- | --- |
| Full web component suite | 38 suites / 291 tests passed. |
| Focused final authentication/history/tracking components | 3 suites / 28 tests passed after final authentication focus/spacing refinements. |
| Application and test TypeScript | Passed, including final source and browser-test changes. |
| Web lint | Passed in the final standalone check after browser completion. |
| API and Next production builds | Passed; 20 static pages generated, existing dynamic routes retained. Final generated auth chunk includes the last form-spacing refinement. |
| Production Chromium regressions | 55 unique tests passed across 11 isolated suites; details below. |
| Screenshot artifacts | 32 before / 38 after PNGs at the specified widths, captured against production builds. |
| Whitespace and scope | `git diff --check` passed; API, schema, dependency, authentication and ownership contracts unchanged. |

Browser counts: critical workflow 18, design foundation 2, customer navigation 2, controlled Google OAuth 6, account 3, checkout ownership 6, order history 6, anonymous auth 3, storefront/configurator 2, transactions 5 and Stage 15.6 presentation 2. Coverage includes login success/failure, registration, safe protected return, session revocation/refresh, Google entry/callback/conflict/linking without live external authentication, Profile/Security drafts/password session replacement, account navigation, filters/sorts/pages/Back, historical names/modifiers/prices, other-customer scoped 404, guest verification/invalid/not-found/unavailable/busy/refresh and status presentations, keyboard controls, visible focus, narrow overflow, touch targets and reduced-motion skeletons.

Commands use the established guarded loopback `orderly_test` target:

```powershell
pnpm --filter web test --runInBand
pnpm --filter web typecheck
pnpm --filter web lint
$env:TEST_DATABASE_URL='postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public'
$env:ORDERLY_BROWSER_PRODUCTION='1'
$env:ORDERLY_AUTH_ORDERS_CAPTURE_DIR='C:\dev\Orderly\docs\stage-15.6-visuals\after'
pnpm --filter web test:e2e
git diff --check
```

Baseline used the new selected fixture suite with `ORDERLY_AUTH_ORDERS_BASELINE=1` and the before directory, against the unchanged production presentation. The full runner resets/seeds only the guarded test database, builds API/web and restarts servers between suites to preserve auth rate-limit isolation. Google regressions use the repository's controlled local provider; the visual fixture deliberately fails Google start without following external authentication.

Initial verification corrections: the tracking introduction's header exposed a second banner in the component test's layout setup, so it became a plain heading container. An old critical-workflow assertion expected Restaurant confirmed your order; it now asserts Current status: Accepted and the current Placed position. No backend/auth behavior or regression assertion was removed to hide a failure. The in-app Browser connection failed to initialize; repository Playwright and local PNG inspection provide the visual evidence.

The restarted default production run passed its first nine suites, then reported a 320px clearance failure in the unchanged checkout surface (four of five transaction cases passed). That assertion measured immediately after an implicitly smooth `window.scrollTo`; the application already applies smooth document scrolling. The test now requests immediate scrolling and awaits the same zero-overlap bound. All five transaction cases passed in a fresh-server rerun; no checkout application code changed. The new Stage 15.6 suite passed separately with all screenshots. One concurrent lint attempt encountered the previously documented disappearing Playwright `test-results` directory; the final lint check runs after browser completion. Existing Prisma configuration-deprecation and Node color-environment warnings remain non-blocking.

## 6. Remaining risks and unverified checks

Safari, Firefox, real iOS/Android devices, mobile browser chrome, soft keyboards, safe areas, landscape, 200% text enlargement and actual 400% browser zoom remain unverified. 320px automation establishes narrow viewport reflow for the tested content, not every zoom/device combination. VoiceOver/NVDA speech, live-region delivery, repeated errors and native checkbox/navigation announcements need manual review; DOM semantics/focus assertions do not establish screen-reader conformance.

No controlled Lighthouse/Web Vitals, throttled-network, bundle-size or production performance comparison was performed. No dependency, remote artwork, font or animation is added; those are structural safeguards, not measured performance results. Very long historical contact/product/modifier strings and unusually large lists need representative-data manual review. Timeline positions derive from the current recorded backend status and do not establish an event history. Historical back-to-orders behavior intentionally retains the existing destination rather than adding filter-persistence behavior.

Final visual and real-device acceptance remains deferred. No deployment or production data change is included.

## 7. Stage 15.7 final acceptance recommendations

Once Stage 15.7 is approved, review this stage's paired screenshots alongside Stage 15.2–15.5 evidence and perform the deferred Safari/Firefox, real-device, screen-reader, zoom and performance checks. Exercise login/registration error and busy focus, official Google entry/callback recovery, account anchors/dropdown, URL filters/sorts/pagination/back, scoped detail not-found, guest verification/invalid/not-found/refresh and every recorded tracking status. Confirm long historical snapshots, touch targets and focused controls remain readable with device keyboards and enlarged text.

Stage 15.7 should close final visual/device/assistive-technology acceptance for the approved customer journey. Any newly discovered functional work or deferred-area redesign requires its own approval. Stage 15.6 stops here.
