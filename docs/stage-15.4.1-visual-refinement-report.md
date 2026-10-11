# Stage 15.4.1 — Focused Visual Refinement

Date: 9 October 2026. Scope: four targeted storefront/configurator refinements following Stage 15.4 engineering acceptance.

## Changes and rationale

Reviewed the rendered Stage 15.4 configurator screenshots at 390px and 320px, then captured matching initial-open and explicitly scrolled baselines against the accepted production build. The earlier captures were taken after option interactions: the title and base price existed at initial open but scrolled out of view. This refinement keeps a compact mobile identity heading available during option scrolling.

| File | Refinement |
| --- | --- |
| `apps/web/src/features/menu/components/product-modal/product-modal.tsx` | Compact mobile sticky product-name/base-price heading inside the existing scroll area; desktop-only customization eyebrow; smaller mobile photo; desktop maximum height reduced from 760px to 680px and columns balanced equally. Responsive image sizes updated for the wider desktop photo panel. Full image remains `object-contain`. Close control, purchase footer, native-dialog lifecycle and pricing/selection logic retained. |
| `apps/web/src/app/globals.css` | Customer-scoped scroll padding keeps focused options below the mobile heading; existing short-screen photo rule reduced from 96px to 80px. Existing safe-area footer and reduced-motion rules retained. |
| `apps/web/src/features/menu/components/product-card.tsx` | Mobile photo ratio changes from 4:3 to 3:2, with slightly tighter internal padding/gaps and no unnecessary minimum description height. At 640px and above, existing 4:3 photos and description reservation remain. Same stacked card structure, two-line descriptions, price labels and 44px actions. |
| `apps/web/src/features/menu/components/menu-hero.tsx` | Balanced headline wrapping, slightly more comfortable line height and adjusted headline/supporting-copy spacing. Supporting copy has a restrained measure. Display sizes, colors, CTAs, claims and data bindings remain unchanged. |
| `apps/web/test/browser/storefront-configurator.spec.ts` | Initial-open and explicitly scrolled captures; title/base-price visibility assertions, contained-photo verification, persistent close/CTA checks, quantity reachability, required-radio click/selection and sticky-heading/control overlap checks. Existing arrow, Escape, focus-return, total, cart-handoff, contrast and reduced-motion coverage retained. |
| `docs/stage-15.4.1-visuals/{before,after}/` | Matching 1440 × 900, 390 × 844 and 320 × 568 viewport captures, including storefront, initial configurator, selected-options and scrolled configurator states. |
| `docs/stage-15.4.1-visual-refinement-report.md` | This report. |

The working tree already contained Stage 15.3/15.4 changes; this inventory identifies only the refinement. No dependencies, business features, API/database/application logic or Cart/Checkout/Account/Auth/Admin presentation changes were introduced. Existing Stage 15.2 tokens and shared primitives remain in use.

## Visual comparison

- **Mobile initial open:** product name is the first heading in configuration content, followed by an explicit Base price label. Removing the mobile eyebrow and reducing photo height leaves more room for the description and required choices. Photo height is 112px normally, 96px below 359px width, and 80px on mobile screens at most 600px tall.
- **Mobile scrolled state:** the same title and base price stay visible in a compact opaque heading, flush beneath the photo. There is one configuration scroll area; options and quantity remain scrollable. Close and purchase controls remain outside it. Visual review caught and corrected a small gap where scrolled text showed above the heading; a rendered geometry assertion now covers that boundary.
- **Mobile cards:** shorter photo proportions and tighter body spacing reduce list height while preserving food imagery, readable description lines, prices and touch targets. No horizontal/split card layout was introduced.
- **Hero:** headline wrapping and copy spacing are refined within the approved charcoal/light composition. No new text or operational/branding claims were added.
- **Desktop configurator:** equal columns slightly enlarge the photograph, and the shorter maximum panel height reduces empty space above/below it. The image remains fully contained without an aggressive crop. The right panel scrolls as needed; its purchase footer remains reachable.

All comparisons use the same existing photography and guarded local fixture. Temporary visual products are removed and the original product image restored by the browser test. Fixture names/descriptions are test content, not new production products. Initial captures use the default Small selection and $14.00; selected/scrolled captures use Large + Extra Cheese and $20.00. Screenshots supplement assertions rather than serving as automated pixel baselines.

| View | Before | After |
| --- | --- | --- |
| Desktop storefront | [1440px before](stage-15.4.1-visuals/before/storefront-1440.png) | [1440px after](stage-15.4.1-visuals/after/storefront-1440.png) |
| Mobile storefront | [390px before](stage-15.4.1-visuals/before/storefront-390.png) | [390px after](stage-15.4.1-visuals/after/storefront-390.png) |
| Narrow storefront | [320px before](stage-15.4.1-visuals/before/storefront-320.png) | [320px after](stage-15.4.1-visuals/after/storefront-320.png) |
| Desktop configurator, initial | [Before](stage-15.4.1-visuals/before/configurator-initial-1440.png) | [After](stage-15.4.1-visuals/after/configurator-initial-1440.png) |
| Mobile configurator, initial | [Before](stage-15.4.1-visuals/before/configurator-initial-390.png) | [After](stage-15.4.1-visuals/after/configurator-initial-390.png) |
| Narrow configurator, initial | [Before](stage-15.4.1-visuals/before/configurator-initial-320.png) | [After](stage-15.4.1-visuals/after/configurator-initial-320.png) |
| Desktop configurator, scrolled | [Before](stage-15.4.1-visuals/before/configurator-scrolled-1440.png) | [After](stage-15.4.1-visuals/after/configurator-scrolled-1440.png) |
| Mobile configurator, scrolled | [Before](stage-15.4.1-visuals/before/configurator-scrolled-390.png) | [After](stage-15.4.1-visuals/after/configurator-scrolled-390.png) |
| Narrow configurator, scrolled | [Before](stage-15.4.1-visuals/before/configurator-scrolled-320.png) | [After](stage-15.4.1-visuals/after/configurator-scrolled-320.png) |

## Accessibility and behavior

The dialog still has one product heading referenced by `aria-labelledby`; the sticky presentation does not duplicate headings or product identity. Base price has a visible label, and total-price live feedback remains unchanged. Native radio/checkbox semantics, roving radio keyboard behavior, selected/default/unavailable states and quantity controls retain their existing implementation.

Browser assertions explicitly verify title/base-price visibility initially and after mobile scrolling, required option selection, absence of sticky-heading overlap with the accessed option, quantity reachability, close/CTA visibility, keyboard arrow selection, Escape restoration and immediate cart handoff. Existing native focus trapping and reduced-motion behavior are regression-tested separately. Dynamic viewport sizing, short-screen scrolling, safe-area footer padding and image containment remain in place.

## Validation

Continuation review confirmed the existing refinement implementation and inspected the before/after screenshots. Final checks:

- Focused component tests: **4 suites, 36 tests passed**.
- Web TypeScript checks (application and tests): **passed**.
- Web lint: **passed**, exit code 0.
- API and web production builds: **passed**.
- Production storefront browser suite: **2 tests passed**, covering 1440px, 390px and 320px, hero contrast, required options, title/base price, persistent close/purchase controls, quantity reachability, keyboard selection, focus return, cart handoff and reduced motion.
- Focused critical-workflow browser regressions: **3 tests passed**, covering mobile dialog/cart/checkout smoke, native modal focus containment and Tab wrapping, Escape/focus restoration, and reduced-motion behavior. The first direct invocation lacked the test-only proxy identity secret and was stopped; supplying that required local test setting resolved the setup issue without application changes.
- All **12 after screenshots refreshed** and representative desktop/mobile/narrow captures visually inspected, including initial-open and scrolled mobile states.
- `git diff --check`: **passed**; the build did not change `apps/web/tsconfig.json`.

Commands used:

```powershell
pnpm --filter web test --runInBand product-option-keyboard site-shell-ux-states homepage-menu homepage-hero
pnpm --filter web typecheck
pnpm --filter web lint
$env:TEST_DATABASE_URL='postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public'
$env:ORDERLY_BROWSER_PRODUCTION='1'
$env:ORDERLY_STOREFRONT_CAPTURE_DIR='C:\dev\Orderly\docs\stage-15.4.1-visuals\after'
pnpm --filter web test:e2e storefront-configurator.spec.ts
$env:NODE_ENV='test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
$env:DIRECT_DATABASE_URL=$env:TEST_DATABASE_URL
$env:ORDERLY_PROXY_IDENTITY_SECRET='stage1541-local-browser-test-secret-at-least-32-bytes'
pnpm --filter web test:e2e:run critical-workflow.spec.ts --grep 'native product and cart dialogs|reduced-motion preference|product dialog, keyboard close'
git diff --check
```

The production runner performs guarded loopback test-database preparation and API/web production builds before the selected browser suite. Separate focused critical-workflow checks use the successful build, explicit local test Prisma URLs and fresh servers. Production data and deployments are not involved. Existing Prisma configuration-deprecation and Node color-environment warnings are non-blocking.

## Remaining issues and limits

- Verification is local Chromium automation and screenshot inspection. Safari/Firefox, real iOS safe areas/browser chrome, mobile keyboards, screen-reader speech and zoom/reflow still require manual checks. The existing successful-add announcement limitations documented in Stage 15.4 are unchanged.
- Long product names and unusual catalog combinations warrant further representative-data review; the sticky mobile heading must remain small enough to leave room for options. Current captures/overlap assertions use the deterministic test product.
- No new motion, font or image dependency was introduced. No quantitative production Web Vitals comparison was performed; explicit image dimensions/aspect ratios and existing responsive loading remain the performance safeguards.
- Product-owner visual acceptance remains separate from engineering checks. The prior full Stage 15.4 regression suite was not repeated wholesale for this small refinement; focused checks cover the changed surfaces and their dialog/commerce handoff.

Stage 15.4.1 stops here. Stage 15.5 requires separate approval.
