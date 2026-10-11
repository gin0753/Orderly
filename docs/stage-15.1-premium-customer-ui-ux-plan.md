# Orderly — Stage 15.1: Premium Customer UI/UX Audit and Specification

Date: 9 October 2026 (Australia/Sydney). Status: planning complete; implementation requires product-owner approval.

This stage adds this report only. It does not implement UI, change application code, install dependencies, change APIs, alter authentication, or mutate data.

## 1. Executive assessment

Orderly has a credible commerce architecture and unusually useful recovery behavior for a portfolio application. Its next upgrade should make that engineering visible through consistent hierarchy, accessible interactions and a distinctive restaurant identity. A broad rewrite is unnecessary.

Preserve native modal dialogs, scroll locking, exact opener focus restoration, paused-ordering states, checkout draft recovery, historical order snapshots, URL-backed order filters, Redux Toolkit, scoped TanStack Query providers and React Hook Form's existing admin boundary.

Recommended direction: charcoal brand presentation in the homepage hero; warm-white shopping and transactional surfaces; orange accents with a darker accessible action/text companion; prominent existing food photography; fewer decorative borders; restrained, purposeful motion. Do not reproduce Dodo Pizza layouts, assets, typography or branding. This report interprets the user's inspiration rather than auditing the reference website.

Highest priorities: complete custom radio keyboard behavior; associate checkout errors with fields; improve text contrast; correct nested main landmarks; replace permanent desktop Sign out with an account disclosure; make Profile, Orders and Security easy to navigate; introduce approved Google button artwork while preserving existing OAuth.

Evidence labels used throughout:

- **V — verified repository finding:** source structure or behavior inspected, with evidence below.
- **R — design recommendation:** proposed presentation; not an existing defect.
- **B — browser verification required:** source indicates a risk or design tradeoff, but rendered behavior is not confirmed.

Rendered inspection was unavailable: the browser connection failed with an environment configuration error during the preceding audit in this conversation. No current desktop/tablet/mobile screenshots were captured. Premium visual judgments, photography quality, crop quality, overflow, focus clipping and keyboard obstruction remain provisional. Existing failure screenshots are not treated as a current UI baseline. Tests were inspected, not run. The browser runner resets/seeds a test database and builds apps, so it was deliberately excluded from this planning stage.

## 2. Actual file and component inventory

Paths are relative to the repository root. Line references reflect this audited source state.

### Architecture and routes

| Area | Verified files / routes | Responsibility |
| --- | --- | --- |
| Root styling and providers | `apps/web/src/app/globals.css`, `app/layout.tsx`, `app/providers.tsx`; `store/store.ts`, `store/store-provider.tsx` | Tailwind v4 import, semantic colors, global motion, Redux cart/admin-auth/customer-auth slices |
| Query boundary | `apps/web/src/providers/query-provider.tsx`; `components/layout/customer-shell.tsx:12`; `app/admin/(protected)/layout.tsx` | Stable QueryClient, separate customer and protected admin provider instances |
| Customer shell | `app/(customer)/layout.tsx`; `components/layout/customer-shell.tsx:14`; `site-header.tsx`, `app-header-shell.tsx`, `mobile-navigation.tsx`, `site-footer.tsx` | Header, main landmark, footer and cart drawer |
| Storefront `/` | `app/(customer)/page.tsx`; `features/menu/components/menu-hero.tsx`, `menu-browser.tsx`, `category-tabs.tsx`, `menu-section.tsx`, `product-card.tsx`, `empty-menu-state.tsx` | Server menu fetch, hero, category filtering, products, ordering availability |
| Product configuration | `features/menu/components/product-modal/product-modal.tsx`, `product-option-group.tsx`, `hooks/use-product-configurator.ts` | Native dialog, existing option constraints and item totals |
| Cart | `features/cart/components/cart-drawer/{cart-drawer,cart-drawer-header,cart-drawer-footer,cart-item-row,cart-empty-state}.tsx`; `mobile-cart-bar.tsx`; `cart-slice.ts`, `cart-storage.ts`, `utils/cart-focus.ts` | Drawer, persistence/hydration, quantity/remove actions, checkout entry; no standalone cart route |
| Checkout `/checkout` | `app/(customer)/checkout/page.tsx`; `features/checkout/components/{checkout-page-client,checkout-order-summary,fulfillment-selector,customer-details-form,delivery-address-form,order-notes-field,checkout-step-indicator,checkout-skeleton,checkout-transition}.tsx` | Existing controlled-state checkout and recovery; preserve mapping/calculation/API helpers |
| Confirmation `/order-success` | `app/(customer)/order-success/page.tsx` | Confirmation summary and unavailable-details fallback |
| Guest tracking | `/track-order`, `/track-order/[orderNumber]`; `features/order-tracking/components/lookup/order-lookup-form.tsx`, `components/result/*` | Contact verification, result/error/loading states, status timeline |
| Authentication | `/login`, `/register`; `features/customer-auth/components/customer-auth-form.tsx` | Shared form, password visibility, conditional Google entry and return-path handling |
| Account `/account` | `app/(customer)/account/{layout,page}.tsx`; `customer-account-profile.tsx`, `customer-google-methods.tsx`, `customer-password-form.tsx`, `customer-sign-out.tsx`, `customer-route-guard.tsx` | Protected profile, methods/password management, existing logout |
| Orders | `/account/orders`, `/account/orders/[id]`; `features/customer-orders/{customer-orders-page,customer-order-detail-page,customer-order-status}.tsx`, `order-history-url.ts`, `customer-orders-api.ts` | Customer-scoped queries, filters/sorts/pages, immutable historical presentation |
| Policies/recovery | `/privacy`, `/terms`; `components/layout/policy-page.tsx`; customer `loading.tsx`, `error.tsx`; root `not-found.tsx`, `global-error.tsx` | Approved policy copy and recovery destinations |
| Admin boundary | `/admin/login`, `/admin/orders`, `/admin/menu/categories`, `/admin/menu/products`, product new/edit routes; `components/layout/admin-header.tsx` | Preserve professional light operational UI; no storefront theme rollout |

No root `packages` directory, repository AGENTS.md or separate Tailwind configuration file was found in the inspected inventory. `apps/web/postcss.config.mjs` exists. Tailwind v4 supplies its default scale; the project adds colors and motion in global CSS.

### Shared primitives and supporting assets

Existing `apps/web/src/components/ui/`: `button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `card.tsx`, `quantity-stepper.tsx`, `product-image.tsx`, `customer-state-panel.tsx`, `dialog-focus.ts`, `skeleton/skeleton-parts.tsx`. Existing Lucide icons and `cn`/tailwind-merge are sufficient for this scope. `hooks/use-scroll-lock.ts` counts overlapping locks; preserve this behavior during modal handoff.

Versioned WebP assets exist in `apps/web/public/images/menu/`, including pizza, pasta, sides, desserts and drinks. `ProductImage` uses Next Image, declared sizes and a keyed fallback reset (`product-image.tsx:18–58`). The hero selection helper chooses from existing available products (`features/menu/utils/select-homepage-hero-product.ts`); do not introduce merchandising rules.

Relevant tests: `homepage-hero`, `homepage-menu`, `product-image`, `mobile-navigation`, `site-shell-ux-states`, customer navigation/auth/forms/account/orders, checkout customer/ownership, and admin correctness/semantics tests under `apps/web/test/`. Browser suites under `test/browser/` cover critical workflow, Google OAuth, customer account, checkout ownership, order history and anonymous auth. `critical-workflow.spec.ts:504–611` covers native dialog focus/handoff and reduced motion. Viewport changes exist within suites even though configuration declares a desktop Chromium project. No `toHaveScreenshot` or axe references were found in the inspected tests.

`docs/ui-blueprint.md` is historical direction, not implementation truth: it mentions three desktop columns and future modal/cart work; current source has four columns and implemented dialogs. This report supplies the proposed Stage 15 direction without rewriting that historical document.

## 3. Existing issues ranked by severity

P0 = critical blocker; P1 = high-priority quality/accessibility issue; P2 = meaningful polish; P3 = optional. No P0 was established. All proposals preserve business logic. S = up to one effective day; M = approximately one–two days. Estimates overlap in the implementation phases.

| ID | Severity / confidence | Finding and evidence | Proposed change | Effort / regression risk |
| --- | --- | --- | --- | --- |
| C01 | P1 / V | Product SINGLE options are buttons with `role="radio"`, no arrow-key handling/roving tab index (`product-option-group.tsx:53–103`). | Styled native radio inputs using the current selection callback; preserve optional-selection semantics and disabled options. Verify keyboard behavior in browser. | M / Medium |
| C02 | P1 / V | Checkout fields use `aria-invalid` but error spans have no IDs/describedby associations (`customer-details-form.tsx:31–94`, `delivery-address-form.tsx:62–177`). | Stable field/help/error IDs and descriptions; retain existing first-invalid focus and validation rules. | S / Low |
| C03 | P1 / V+B | Bright orange small text: tracking current step (`order-status-timeline.tsx:162–166`) and policy eyebrow (`policy-page.tsx:7`). #FF4D00 computes to ~3.33:1 on white and ~3.18:1 on #F8FAFC. Input placeholders use #D4D4D4 (~1.48:1 on white, `input.tsx:13`). | Use existing dark orange text token; darker placeholder token. Confirm actual computed colors and all backgrounds. Disabled text is a separate state, not automatically a contrast defect. | S / Low |
| C04 | P2 / V | Shell main wraps inner main in Account, Orders and Order detail (`customer-shell.tsx:14`, account page:10, orders page:32, detail page:22). | Shell owns the single main; use sections/divs inside it. Add customer skip link without assuming one currently exists. | S / Low |
| C05 | P2 / V+R | Desktop authenticated header permanently renders Sign out alongside Account/Orders (`site-header.tsx:29–44`). | Account disclosure with Profile, Orders, Security and existing Sign out; retain guest tracking in primary navigation. | M / Medium |
| C06 | P2 / V+R | Account combines profile/security in one column; supplemental account links are below forms (`account/page.tsx:16–27`). | Shared account subnav; separate Profile and Security sections using existing route anchors, with Orders on its existing route. | M / Medium |
| C07 | P2 / V | Google auth uses a text-only shared secondary button (`customer-auth-form.tsx:106–110`). | Official approved light button artwork and compliant presentation; same handler and availability/disabled conditions. | S / Low |
| C08 | P2 / V+B | Quantity targets are 36px high with repeated generic accessible names; remove is 32px (`quantity-stepper.tsx:22–41`, `cart-item-row.tsx:49–55`). | Aim for 44px frequent touch controls, explicit focus treatment, item-specific quantity context. Not a confirmed WCAG target-size failure. | S / Low |
| C09 | P2 / V+B | Product title is 14px, one-line clamped; 4:3 images; one/two/four-column grid (`product-card.tsx:36–63`, `menu-section.tsx:40`). | Two-line title allowance, clearer price emphasis and controlled crop treatment; validate real content before changing grid. | M / Low |
| C10 | P2 / V+B | Product modal uses 92vh with outer padding; checkout fixed bar has safe-area padding but page reserves fixed pb-28 (`product-modal.tsx:120–142`, `checkout-page-client.tsx:283,391`). | Fit dialogs to available dynamic viewport; content reservation includes footer and safe area. Test soft keyboard/short screens first. Obstruction is unconfirmed. | M / Medium |
| C11 | P2 / V | Button size controls radius; action links repeat button styles; Card borders/shadows are default; fulfillment uses emoji (`button.tsx:52–56`, `card.tsx:11`, `fulfillment-selector.tsx:19–33`, cart footer:38). | Explicit surface/action treatments, shared link styles, existing Lucide icons; avoid blanket primitive restyling affecting admin. | M / Medium |
| C12 | P2 / V+R | Orders/history pending UI is text panels, unlike existing richer skeletons elsewhere (`customer-orders-page.tsx:57`, detail:24). | Geometry-matched skeletons using existing parts; retain announced loading/update messages and retry states. Layout shift magnitude requires browser measurement. | S / Low |
| C13 | P2 / V+R | Cart drawer checkout action says “View Cart & Checkout” while already showing cart (`cart-drawer-footer.tsx:40`). | “Continue to checkout”; remove menu-account link duplication where it adds no orientation. Preserve useful guest tracking redundancy. | S / Low |
| C14 | P3 / R | Brand and transactional surfaces currently share a largely light presentation. This is not a defect. | Charcoal hero with photography and restrained orange, warm-white transaction surfaces; no site-wide dark mode. | M / Low |

Verified strengths: customer authentication already associates errors with fields; checkout already focuses invalid fields and submission errors; product/cart native dialogs restore focus; mobile navigation closes on desktop resize; reduced-motion CSS suppresses animations and smooth scrolling. Preserve rather than reimplement these behaviors.

## 4. Proposed design tokens

These are specification values, not implemented variables. Keep existing names where possible and introduce only the missing semantic roles. Scope changed customer colors under the customer shell/brand region; do not change root tokens globally and accidentally recolor admin. Dialogs currently render within the customer tree and should inherit that scope; future portals must retain an explicit customer theme context.

| Role | Proposed value | Application |
| --- | --- | --- |
| Brand charcoal | #181818 | Hero/presentation surface; optional restrained footer band only after approval |
| Raised charcoal | #242424 | Hero image backing or inset accents |
| On-brand primary / secondary | #FFFFFF / #D6D3D1 | Brand region titles/supporting copy |
| Customer background | #FAF8F5 | Warm page background |
| Surface / muted surface | #FFFFFF / #F3F0EB | Forms, panels, selected-neutral background |
| Primary / secondary / muted text | #1C1917 / #57534E / #69635D | Content hierarchy; verify small-text contrast on each surface |
| Signature orange | #FF4D00 | Decorative highlights and orange fill paired with charcoal text; never white small text on this orange |
| Orange action / hover | #C2410C / #9A3412 | White-label primary buttons and light-surface brand text |
| Orange soft | #FFF1E7 | Selected/notice backgrounds with dark orange text |
| Decorative border | #E7E2DA | Optional surface divisions; not sole indication of interactive boundaries |
| Control boundary | #8A8178 | Inputs where boundary identifies the control; validate 3:1 against adjacent surfaces |
| Focus | #C2410C on light; #FFB38A on charcoal | 2px ring with 2px offset; do not rely on faint tinted rings |
| Overlay | rgba(0,0,0,0.48) | Native dialog backdrop |
| Status roles | Preserve existing success/danger/warning/info strong/surface tokens initially | Text labels and icons accompany color |

Signature orange and accessible action orange deliberately coexist. If an orange-filled hero CTA uses charcoal text, verify that pair independently. AA goals and actual states take precedence over matching a reference palette.

Typography: keep the current system sans-serif, no new general font dependency. Proposed display 36/40px mobile and 56/60px desktop; page title 28/34 and 36/42; section title 24/30; card title 16/22 semibold; body/form entry 16/24; helper 14/20; badge 12/16. Use fluid or breakpoint sizing without squeezing long titles. Reserve uppercase tracked text for short eyebrows. Monetary summaries may use tabular numerals.

Spacing: retain Tailwind's 4px-based scale; primary increments 4, 8, 12, 16, 24, 32, 48, 64px. Page gutters 16px mobile, 24px tablet, 32px desktop; max customer shell width 1152px, narrower transaction/account inner regions. Avoid isolated fractional values unless required by artwork or verified layout.

Radii: control 12px; card 20px; hero/dialog 24px; pill reserved for filters/badges. Elevation: resting panels primarily surface contrast; hover shadow `0 8px 24px rgba(28,25,23,.08)`; overlay `0 24px 64px rgba(0,0,0,.20)`. Forms retain clear control boundaries; fewer borders means removing decorative repetition, not hiding inputs.

## 5. Shared component recommendations

1. Extend existing Button with shared variant class generation usable by semantic links. Do not render nested anchor/button controls. Retain default admin appearance; customer opt-in treatments use existing variant concepts.
2. Extend Input/Select/Textarea coherently: customer 48px controls, 16px entry text, explicit invalid/help styling and 44px minimum frequent icon targets. Preserve compact admin sizing through explicit variants rather than broad overrides.
3. Extend Card with explicit plain/surface/outlined treatments. Use plain sections where page hierarchy already separates content. Do not replace Card everywhere.
4. Keep ProductImage fallback, source validation and sizes. Adjust crop classes by image type only after existing assets are inspected. No image generation or replacement is part of this plan's baseline.
5. Reuse native dialog/focus/scroll-lock utilities. Small customer-specific wrappers may centralize backdrop/panel/footer styling; do not build a new dialog engine.
6. Add a customer account disclosure within SiteHeader: ordinary button plus labeled link/action panel, not ARIA menu roles unless full menu keyboard behavior is implemented. Reuse CustomerSignOut and its error/busy handling.
7. Add a shared AccountNavigation for existing Profile/Security anchors and Orders route. No new route required.
8. Add a narrow GoogleAuthButton presentation wrapper around the existing startGoogle callback. Use an official asset; no OAuth SDK migration or new auth state machine.
9. Give QuantityStepper optional context/label props and consistent customer focus/target sizing; preserve min/max/change behavior.
10. Reuse CustomerStatePanel and skeleton parts; standardize inline success/error feedback. No toast dependency or animation library.

## 6. Page-by-page redesign specification

### Storefront `/`

Warm-white shell/header with a charcoal hero. Hero retains current store facts, availability, selected existing product and Browse menu/Track order actions. Use strong title hierarchy and existing photography; no invented claims, discounts or preparation times. On mobile, compact text appears before a shallow image region; the first menu category should not be buried under a tall promotional panel. Preserve no-image/no-product fallback.

Category navigation remains a horizontal set of pressed filter buttons, not a pretend tab interface. It retains All/category filtering and current scroll destination logic. Provide visible overflow hints; do not add scrollspy that changes current behavior. Header offset and category strip height determine scroll padding so headings remain exposed.

Keep one column below sm, two from sm, four from lg initially. Cards use photography without heavy surrounding chrome, two-line product titles, stable description space and stronger price/action row. Desktop hover is subtle; keyboard focus gets equivalent emphasis. Configurable products may say “Customize” rather than “Add” if this copy is approved, but must still call the same existing configurator path. Do not invent starting-price rules.

### Product customization

Desktop: image/detail split; light detail panel against restrained image backing. Mobile: bottom-aligned sheet with compact image, title/close area, scrollable choices and a persistent total/add footer. Panel fits the available viewport, with safe-area padding on footer; close control remains reachable.

Render SINGLE choices as styled native radios, MULTIPLE as native checkboxes where their current toggle semantics can be preserved. Keep group limits, optional deselection behavior, availability and price deltas. Labels state minimum/maximum requirements from existing values. Announce selection constraints without repeatedly announcing the whole dialog. Preserve product-to-cart focus handoff and exact opener return.

### Cart drawer

Desktop right drawer remains max-w-md initially; mobile fills available width. Fixed heading and subtotal/action footer; only items scroll. Clear title/count, legible option summary, 44px quantity/remove targets and item-specific labels. Footer says Continue to checkout, explains that final fees are calculated there, and preserves checking/paused/unavailable states. Keep existing close/reopen availability recovery; a new retry fetch is outside baseline presentation scope. Cart hydration behavior and automatic drawer opening after Add stay unchanged.

### Checkout `/checkout`

Entirely warm/light and task-focused. Header: title, short explanation, existing guest/signed-in context. Preserve single-page flow; present Details → Confirmation as a non-interactive progress indicator with current-step semantics, avoiding confusing duplicated numbered section headings.

Fulfillment uses Lucide icons, clear selected state, and existing fee/unavailability values. Contact, conditional delivery address and notes have consistent section headings, field spacing and error associations. At lg use existing form/summary split; below lg summary follows fields with fixed total/submit bar. Reserve sufficient bottom content space including safe area; evaluate keyboard behavior. Preserve place-order labels, API handling, minimum-order messaging, session recovery, draft return and submission guards. Do not change any fee threshold or total computation.

### Confirmation `/order-success`

Light confirmation panel with restrained success icon, dominant order number/fulfillment/total and Track your order as the primary action. Secondary return-to-menu action remains. Keep existing parameter handling/unavailable-details fallback; do not represent query-derived confirmation as a new independently verified order record. Historical/current status changes remain the responsibility of existing tracking/order data.

### Guest tracking `/track-order` and `/track-order/[orderNumber]`

Guest tracking remains visible for both signed-in and signed-out customers. Simplify promotional framing in favor of lookup instructions, contact verification and a light readable result. Retain all verification/privacy constraints. Timeline uses dark orange text, text/icon distinctions, current-step semantics and vertical mobile presentation. Retain last-updated, loading, error and recovery content.

### Sign in `/login` and registration `/register`

Use a light max-w-md form panel, short brand eyebrow and clear return/guest option. Preserve field order, password visibility, byte/length policy, errors, Google conflict/cancel messages, unresolved-session handling and safe return paths. Avoid large decorative imagery on mobile. Google action uses the same width/visual prominence as the form action while retaining its own approved brand appearance.

Google presentation specification: use the official pre-approved light rectangular button asset from Google's branding page, sized proportionally; provide an accessible action label and preserve pending/disabled feedback. Prefer the supplied PNG to avoid adding a general Google Sans dependency; inspect resolution at desktop/mobile pixel densities before final selection. If SVG/custom HTML is chosen instead, satisfy the current documented font, logo, padding and color requirements. Do not draw a G icon, tint it orange or substitute Lucide. Existing Continue with Google wording is permitted; a supplied Sign in with Google asset is also appropriate. Account linking retains “Connect Google” as an explicit linking action, not a misleading sign-in button.

These are branding presentation options, not an instruction to replace the existing server OAuth flow. Google permits approved image/HTML assets when its generated button is unsuitable. [Official Google branding guidelines](https://developers.google.com/identity/branding-guidelines), checked 9 October 2026.

### Account `/account`

Premium dashboard means clear organization, not new business capabilities. Existing profile fields form **Profile**; existing sign-in methods and password form form **Security**. Add stable `#profile` and `#security` anchors to the existing page. Desktop uses a narrow account navigation rail and flexible content; mobile uses a wrapping three-item subnav above content. Sections can remain on one page in V1; navigation must lead to the relevant heading. No new `/account/security` route is assumed or required.

Retain read-only email and its explanation, dirty/save state, optional phone, success/errors, Google enablement/connect prerequisites and password-method availability. Existing Google-only/password account differences remain. Show concise connected/not-configured text with suitable badges; do not add avatars/uploads, account statistics or password reset capability. Avatar trigger uses initials or an existing icon, not a new profile-photo service.

### Orders `/account/orders` and detail `/account/orders/[id]`

Use the shared account navigation. Keep existing URL-backed status/sort/page controls, customer-scoped cache keys and guest-order explanation. Cards emphasize order number, date, status, total and View order; preserve list semantics. On mobile controls wrap or use current-value native selects only if they preserve all URL behavior. Match skeleton geometry to rows.

Detail has a clear Back to orders action, overview, stored item/options snapshots, fulfillment/contact, notes and totals. Desktop groups fulfillment/totals side by side, mobile stacks them. No reorder action or live product image dependency; historical accuracy takes priority. Preserve account-scoped not-found/retry behavior.

### Footer, policies and recovery

Footer contains brand description, Menu, Track order, Privacy and Terms. Repetition of guest tracking here is intentional recovery access. Remove account-page Browse menu/Track an order link clutter once shared header/subnav provides adequate orientation, subject to approval. Do not change policy content. Error/empty/paused panels follow the same light typography and action conventions; loading retains announced messages.

### Admin

Keep existing light operational presentation, compact controls, tables, query boundaries and permissions. Customer-specific styles must be opt-in/scoped. Shared semantic accessibility fixes may benefit admin but do not include an admin redesign in this stage's implementation estimate.

## 7. Desktop/mobile behavior matrix

Breakpoints retain Tailwind defaults: sm 640, md 768, lg 1024, xl 1280px. Validate 320, 390, 768/820, 1024 and 1440px rather than relying solely on device names.

| Surface | Mobile <768px | Tablet 768–1023px | Desktop >=1024px |
| --- | --- | --- | --- |
| Header | 64px; hamburger, centered logo, cart; account links in drawer | Desktop nav if measured to fit; otherwise retain mobile treatment | Menu, Track order, sign-in/account disclosure, cart |
| Hero | Text then compact photo; natural content height | Two-part layout if image/title fit | Charcoal split composition, strong title, existing food photo |
| Categories | Horizontal overflow with cue; pressed state | Same filter model, wider strip | Sticky below header; no hidden heading after scroll |
| Grid | 1 column <640; 2 at 640–767 | 2 columns | 4 initially; change only after content review |
| Product dialog | Sheet; compact image; scrollable choices; fixed footer | Split only when both panes remain usable | Centered split dialog, capped available height |
| Cart | Full-width drawer, safe-area footer | Right drawer | Right drawer, focus return |
| Checkout | Stacked; fixed total/action bar | Stacked through <lg; same action bar | Existing 390px summary beside form |
| Account | Wrapping top subnav; stacked Profile/Security | Subnav plus stacked or flexible panels | Navigation rail plus content |
| Orders/detail | Wrapped filters, stacked records/details | Existing flexible layouts | Wide rows and grouped detail sections |
| Footer | Wrapping links; last content above sticky actions | Two-part layout where space permits | Compact grouped links |

Do not force desktop nav at 768px if signed-in content fails to fit; that breakpoint decision follows measurement. Use content-driven adjustment, not a second navigation system.

## 8. Navigation information architecture

Recommended desktop primary navigation: **Menu · Track order**. Right controls: **Sign in** when anonymous; **Account disclosure** when authenticated; **Cart** in both cases. Remove permanently displayed desktop Sign out and redundant primary Orders/Account links once disclosure is available.

Authenticated account disclosure contains: identity label using existing name/email; Profile → `/account#profile`; Orders → `/account/orders`; Security → `/account#security`; existing Sign out action. Trigger is a 44px+ button with accessible name, expanded state and controls association. Open by click/Enter/Space, not hover only; Escape closes and restores trigger focus; outside click closes; route selection closes; ordinary links remain tabbable. Never trap focus in this non-modal disclosure. Logout failure remains visible and does not falsely dismiss the authenticated state.

Mobile navigation remains the existing native dialog. Anonymous links: Menu, Track order, Sign in. Authenticated links: Menu, Track order, Profile, Orders, Security; Sign out in its existing footer treatment. No additional avatar menu is necessary on mobile. Existing close-before-open cart coordination remains.

Account subnav always exposes Profile, Orders, Security, with correct current page/location/section state. Anchor activation scrolls and moves focus to the corresponding heading without changing authentication. Cross-page anchors are presentation destinations, not new routes. Back to orders retains current behavior; do not introduce URL/cache-state changes as incidental redesign work.

Keep guest tracking in the header, mobile drawer and footer even for signed-in customers; older guest orders do not become account history. This intentional repetition serves a separate task. Checkout sign-in entry must keep the existing draft-saving callback and return path.

## 9. Motion and accessibility standards

Motion uses existing CSS, not a new library: feedback 150ms, disclosures 180ms, product/card transitions 180–220ms, dialog/drawer entry 240–280ms, complex handoff at most 350ms. Use opacity and restrained transforms; avoid layout animation, parallax, autoplay or bouncing totals. Card hover lift at most 2px on fine pointers. Preserve immediate data/availability updates; animation must never delay checkout or duplicate actions. Exit animation is optional and must not defer focus restoration or native dialog cleanup.

Reduced motion: retain global `prefers-reduced-motion` suppression, automatic scroll and nonanimated loading text. Clear feedback must remain when pulses/spinners stop. Scope will-change to active transitions rather than all resting cards.

Target WCAG 2.2 AA, verified on the rendered implementation: normal text 4.5:1; large text 3:1; necessary control/state graphics 3:1. Frequent touch controls target 44px as an internal usability standard; AA target-size criterion is 24px with exceptions, so do not mislabel every 36px control as a violation. Ensure keyboard operation, visible/unobscured focus, reflow at 320 CSS px, meaningful labels/errors and status announcements. [W3C WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/).

Additional implementation requirements: one main landmark; skip-to-content; real label associations; native radios/checkboxes where practical; input help and errors described together; first-invalid focus; busy/submission status; no icon-only unnamed actions. Use selected text/checkmarks alongside color. Keep adequate focus ring contrast in both brand/light regions.

Sticky/fixed layout: retain 64px header; category strip below it; scroll offset equals actual occupied height plus breathing room. Bottom bars include env(safe-area-inset-bottom) and matching content clearance. Native modal top layer remains above sticky controls; only the intended content pane scrolls. Test short-height landscape, browser chrome changes and soft keyboards. Do not infer absence of obstruction from class names.

## 10. Six-stage implementation plan

Baseline: approximately **13 effective development days**, medium overall complexity. No dependencies or backend work required. Each stage should be a reviewable customer presentation change with its targeted checks. Estimates assume current assets and existing account route/anchors; allow up to 15 days if measured mobile layout issues require extra iteration.

| Stage | Days | Scope / dependency | Exit criteria |
| --- | --- | --- | --- |
| 1 — Baseline and foundation | 2 | Approved direction; current rendered baselines; customer token scope, primitive treatments, C03/C04 | Dark/light color pairs verified; admin unchanged; one main; reusable action/field/surface conventions |
| 2 — Shell and account architecture | 2 | Stage 1; header disclosure, mobile links, shared Profile/Orders/Security navigation, footer cleanup | Signed-in/out, guest tracking, anchors and logout failure work with keyboard and mobile navigation |
| 3 — Storefront and configurator | 2.5 | Stages 1–2; charcoal hero, photography/crop review, cards/category polish, C01 | Long/missing content works; selection constraints unchanged; radios keyboard usable; modal handoff passes |
| 4 — Cart and checkout | 2.5 | Foundation/configurator; contextual targets, error associations, light checkout hierarchy, safe areas | Identical calculations/requests; paused and expired-session recovery preserved; keyboard does not obstruct actions |
| 5 — Auth, account, orders and tracking | 2 | Account architecture; official Google artwork, method/profile/security polish, loading/detail/confirmation/tracking | OAuth/password/Google-only states unchanged; historical snapshots correct; guest tracking remains independent |
| 6 — Regression and visual acceptance | 2 | All implementation stages | Targeted component suites and isolated browser flows pass; responsive/accessibility/manual visual acceptance complete |

If scope exceeds 15 days, defer optional charcoal footer, image replacements, extra exit animations and major alternative tablet/card layouts. Do not cut keyboard/error/recovery verification to preserve decoration.

## 11. Risks and regression considerations

| Risk | Required containment |
| --- | --- |
| Customer token changes alter admin | Customer-scoped variables and opt-in variants; compare admin login/orders/menu/editor before/after |
| Header rewrite loses auth navigation semantics | Keep slice/bootstrap/logout untouched; update presentation tests; include failed logout and session bootstrap states |
| Dropdown becomes a pseudo-menu | Use normal disclosure/link semantics, or explicitly implement full ARIA menu behavior; no hover-only access |
| Native radio conversion changes optional behavior | Test current selection/deselection, unavailable options, min/max limits and item totals; preserve callbacks/model |
| Dialog motion interferes with modal handoff | Keep showModal, focus containment/restoration and counted scroll lock; do not delay close/unmount |
| Checkout styling alters ordering | No changes to utility/mapping/API contracts; verify payload/totals and existing submission guards |
| Warm surfaces lower text contrast | Measure computed states, including notices, placeholders, selected text and dark regions |
| Google artwork encourages auth rewrite | Use approved presentation asset with current redirect callback; no SDK/auth replacement |
| Account organization adds new data needs | Existing fields/methods/orders only; anchors reuse existing account route/guard |
| Historical detail acquires live product assumptions | Use stored names/options/prices; no catalog-image/reorder dependency |
| Fixed controls hide last content or keyboard focus | Dynamic viewport/safe-area/content clearance checks at short heights and real keyboard behavior |
| Visual snapshots mask functional regressions | Pair comparisons with functional assertions; use isolated fixtures and inspect baseline changes |

## 12. Concrete acceptance criteria and approval decisions

### Functional invariants

- No API contract, schema, authentication rule, token/session lifecycle, checkout calculation or ownership change.
- Existing Redux/TanStack Query/RHF responsibilities and customer/admin separation remain.
- Guest tracking is reachable when anonymous and authenticated; guest orders remain separate from account history.
- Product options retain current required/optional/limit/unavailability semantics and prices.
- Cart contents survive navigation/reload as before; add/configure/cart handoff restores correct focus.
- Checkout draft/sign-in return, expired-session recovery, minimum-order/paused states and duplicate-submission guards behave as before.
- Google conflict/cancel/disabled states, Google-only accounts and password-connected accounts remain supported.
- Profile/password/Google linking and historical order access retain current authorization and feedback.

### Presentation and accessibility acceptance

- Charcoal brand region and warm transaction UI approved from real screenshots; no copied third-party artwork.
- Official Google asset source recorded; default/busy/disabled states inspected; no stretched or recolored G.
- No unexplained permanently visible desktop Sign out; keyboard-operable account disclosure and mobile equivalents exist.
- Profile, Orders and Security destinations work without new backend data or new account routes.
- One customer main landmark; skip link works; all editable fields have labels; checkout errors are associated and announced.
- Product single-choice keyboard navigation works, unavailable options cannot be selected, and optional behavior remains correct.
- Necessary text/control contrast meets AA goals in actual rendered states; frequent touch controls aim for 44px.
- No unintended horizontal page overflow at 320/390/768/820/1024/1440px; long names/emails/option summaries are usable.
- Product/cart/navigation overlays support Escape, focus isolation where modal, focus return and scrolling; final actions remain reachable on short screens.
- Safe areas and soft keyboard do not obscure focused fields or place-order action; fixed-bar clearance matches occupied space.
- Reduced motion removes nonessential movement while loading/submission feedback remains understandable.
- No customer styling regression in admin; no general font, UI, motion or auth dependency added without a separately justified need.

### Verification execution after implementation approval

Component checks: extend existing navigation, mobile-navigation, shell-state, auth/account, checkout and order tests. Add radio keyboard/optional semantics, error associations, disclosure close/focus/logout-failure, landmark, contextual quantity and account-anchor checks. Avoid tests that merely mirror CSS classes.

Browser flows in an explicitly isolated test environment: anonymous browse/configure/cart/checkout/confirmation/tracking; signed-in checkout/history/detail; expired-session and paused ordering recovery; Google redirect/conflict/cancel and password/Google-only account surfaces; profile/security validation; admin smoke for shared primitive impact. Existing runner resets/seeds a guarded test DB; do not execute against production or during read-only audits.

Visual comparisons: storefront/hero/menu, product choices, empty/full cart, pickup/delivery checkout, auth, Profile/Security, order history/detail, confirmation/tracking and representative error/loading/paused states. Capture consistent fonts/assets/data at desktop/tablet/mobile; no assumption that source review confirms premium appearance. Existing Playwright can provide screenshots without adding a visual-test dependency.

Manual accessibility: keyboard and screen-reader error context, radio behavior, modal handoff, account disclosure, 200% text zoom, 400% page zoom/reflow, reduced motion, soft keyboard and actual contrast/focus appearance. Automation alone does not establish WCAG conformance.

### Product-owner decisions

Recommended defaults to approve together before implementation:

1. Charcoal homepage hero with light header/menu/transactional surfaces; retain light footer initially.
2. Signature orange for accents; darker orange for white-label buttons and small light-surface text. This avoids sacrificing contrast for a single brand hex.
3. Desktop Account disclosure replacing standalone Account/Orders/Sign out header items; Track order stays primary for everyone.
4. Profile/Security anchors on `/account` and existing `/account/orders` route; no separate Security route in V1.
5. Official approved light Google button artwork; current OAuth flow unchanged.
6. Existing food assets and current one/two/four-column grid as baseline; photography replacement deferred unless rendered review demonstrates a need.
7. Approximately 13 effective days with a 15-day cap, keeping optional motion/footer work outside the critical path.

These are design/scope approvals. The Stage 15.1 request authorizes this report only. Stop here; implementation starts only after approval.
