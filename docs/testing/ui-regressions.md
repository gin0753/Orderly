# UI and accessibility regression record

Consolidated 13 October 2026 from Stage 15 design and pre-packaging investigations. Historical source/revisions and exact failure distinctions are retained in [acceptance](acceptance.md), [browser investigations](browser-investigations.md) and [evidence policy](evidence-retention.md). Current portfolio captures are synthetic 1440×900 optimized-build media, not proof of every historical viewport/device claim.

## Customer design boundary

Customer styling is scoped to `.customer-theme`; Admin keeps root tokens and fallback dimensions. Warm surfaces (`#FAF8F5`, white, `#F3F0EB`), primary text `#1C1917`, muted `#69635D`, strong orange `#C2410C` and form boundary `#8A8178` support representative contrast checks. The system font, 4px spacing scale, 16/24/32px gutters, 72rem container, 12px controls/20px cards/24px overlays and restrained shadows define the current design vocabulary. Customer form controls are 48px with 16px text; small/icon/quantity actions preserve 44px targets. Focus is a 2px orange outline with 2px offset. Motion durations range from 150ms feedback to 280ms drawer and honor reduced motion; token introduction did not certify every hardcoded page style.

Stage 15.2 checked representative text/placeholder ratios ≥4.5:1 and control boundaries ≥3:1, customer/Admin isolation and 320px target geometry. Its 262 components and 44 Chromium workflows passed. A combined invocation initially crossed auth throttles and revealed shrinking quantity targets/incorrect test selection; the final isolated runner passed without auth changes. No whole-site WCAG certification or manual screen-reader pass is implied.

## Navigation, forms and transactional surfaces

- One customer main landmark belongs to the shared shell; a visible-on-focus skip link targets it. Product radio groups have one available Tab stop, wrap arrows and Home/End while skipping unavailable choices; optional deselection and multiselect pricing semantics remain unchanged.
- Checkout labels stay stable accessible names with unique field/error IDs, `aria-invalid` and `aria-describedby`; invalid submission focuses the first invalid field. Profile/password cleanup adds form-local first-invalid focus after validation, without stealing focus on initial load or server responses, changing sessions, or adding duplicate live regions.
- Account navigation derives Orders from route/detail paths and Profile/Security from hash; `aria-current="location"`, hash/popstate heading focus, modified clicks and Back/Forward remain meaningful. No invented scroll observer is needed.
- Storefront imagery/configurator keeps selection/price rules, roving focus, Escape and trigger-focus restoration, bounded scrollable content, sticky mobile heading, persistent close and purchase action, safe areas, modifier completeness and reduced motion. Required image load/decode failures remain test failures.
- Cart spacing removes redundant mobile padding/divider separation while preserving full modifiers, price/remove actions, 44px targets, drawer footer and long-cart scroll. Mobile history status/sort rows are separately named horizontal controls with nonshrinking items, focus clearance and discoverability; desktop wraps. URL-backed filters/sort/page/reset-to-page-1 and owned detail semantics are unchanged.
- Admin cleanup removes inert Filters, gives search an accessible name and compacts mobile metrics without hiding counts/helpers. Category/group/option ordering uses labelled handles, keyboard sensors, instructions and cancellation without committing reorder. Stage 17's recorded category Order column remains a known blank-value presentation follow-up despite persisted API reordering.
- AI actions require build opt-in plus literal authenticated capability, failing hidden. Generic Google failures are generic retry guidance, conflict semantics do not overstate a particular cause, cancellation means authorization incomplete, and one alert—not forced alert focus—presents safe text while preserving entered password and stale-success suppression.

Focused auth-feedback change on `1ed797b` plus patch recorded 33 components across four suites, six before-capture cases and 15 after/regression browser cases (nine feedback plus six OAuth), with typecheck/lint/build pass. These are controlled callback fixtures, not live provider failures. Cart/history/timeline/layout investigations are static render or guarded local application checks as specified; they do not imply real mobile keyboard/safe-area acceptance.

## Order Progress connector and regression evidence

Connector completion follows actual status. Completed pickup/delivery joins completed markers; cancellation does not fabricate future progress. A one-case isolated connector audit captured 48 combinations across four widths/six states; geometry and overflow assertions passed. Focused timeline/tracking components passed 23 cases. The later preparing/completed regression retained its baseline, failed/blocked attempt and resumed final verification rather than recasting isolated captures as end-to-end acceptance.

Minimal comparison IDs remain browsable:

| Finding | Before | After |
| --- | --- | --- |
| Narrow login | [320px](../stage-15.6-visuals/before/login-320.png) | [320px](../stage-15.6-visuals/after/login-320.png) |
| Narrow history | [320px](../stage-15.6-visuals/before/orders-320.png) | [320px](../stage-15.6-visuals/after/orders-320.png) |
| Generic method feedback | [320px](../v1-auth-feedback-evidence/before/failed-320.png) | [320px](../v1-auth-feedback-evidence/after/failed-320.png) |
| Cart spacing | [320px](../v1-pre-packaging-cleanup-evidence/before/cart-320.png) | [320px](../v1-pre-packaging-cleanup-evidence/after/cart-320.png) |
| Completed connector | [320px](../v1-timeline-connector-evidence/before/completed-320.png) | [320px](../v1-timeline-connector-evidence/after/completed-320.png) |
| Preparing connector | [320px / 16px](../v1-timeline-regression-evidence/before/preparing-320-16.png) | [Final 320px / 16px](../v1-timeline-regression-evidence/final-verification/preparing-320-16.png) |

[Final completed connector](../v1-timeline-regression-evidence/final-verification/completed-320-16.png), [cleanup geometry](../v1-pre-packaging-cleanup-evidence/geometry.json), [cleanup manifest](../v1-pre-packaging-cleanup-evidence/manifest.json) and [connector manifest](../v1-timeline-connector-evidence/manifest.json) preserve original roles. Full-run manifests are frozen historical identifiers; retired images are not implied available just because their ID appears there. Curation intentionally reduces gallery coverage while retaining findings and tests.

## Native zoom and simulation failure

The artificial `html.style.zoom = "4"` run at a 1440×900 viewport failed the unchanged ≤1px overflow threshold with 573px: desktop media queries remained active, Open cart extended to about 2013px and the desktop account grid stayed active. The same exact assertion failed in reproduction. This was not a Google notification-origin defect.

Native Chromium tab zoom used `chrome.tabs.setZoom` through a local diagnostic extension, verified zoom factor, DPR and unchanged CSS zoom 1. At 1440×900, 200%/400% produced 720×450/360×225 CSS viewports; at 1280×900, 640×450/320×225. All four native cases had zero horizontal overflow; repeated 400% and label-scroll follow-up yielded seven passing native runs and seven axe scans with no violations. Profile and disclosure interactions used synthetic responses. Native zoom switched breakpoints; narrowed viewport and CSS zoom are different methodologies.

At 400%, sticky header partially masked the upper edge of the Google password label; input/action stayed usable, ordinary upward scroll exposed the label and an explicit scroll-follow-up passed. Retain as P3 focus/scroll-offset friction; it does not prove a P1/P2 content loss. Four duplicate-tracing harness failures, four closed-disclosure/floating-point-factor failures and one blank scrolled capture were retained historically; only harness issues were corrected. No overflow threshold or app code was weakened.

All ten [zoom-triage artifacts](../v1-zoom-triage-evidence/) remain, including the [original CSS failure](../v1-zoom-triage-evidence/original-css-400-failure.png) and [visible label after scroll](../v1-zoom-triage-evidence/native-1280-4-label-scrolled.png). The native result is Chromium/local/headless-extension evidence on `1ed797b` plus auth-feedback patch, not proof of native Safari, assistive technology or deployed behavior.

## Remaining findings

Historical enlarged-header/root-text overflow and auth CLS >0.1 are dated findings, not automatically closed by responsive-width simulation. WebKit loading timeout causality remains unproven despite later passing local journeys; hydration is separately fixed and native RSC messages separately classified. Real-device speech, screen-reader announcements, keyboard/safe-area, cross-engine verification/deletion and deployed performance/configuration remain [manual UAT](manual-uat.md) and release conditions.

## Generating new evidence

Retained audit source preserves assertions, test semantics, timeouts and guarded database behavior. Future output defaults to ignored per-run directories. Acceptance config publishes `ORDERLY_ACCEPTANCE_EVIDENCE_DIR` and `ORDERLY_ACCEPTANCE_RESULTS_FILE` defaults to shared workers; explicit values remain authoritative. Static cleanup/timeline audits also accept output overrides.

To summarize an existing **complete new run**, supply its directory explicitly:

```sh
node apps/web/test/browser/scripts/summarize-acceptance.mjs --evidence-dir audit-artifacts/browser-evidence/<run>/acceptance
```

The summarizer requires three complete 70-scan engine datasets and uses the existing local `.next` build for chunk metadata; it is not a historical reconstruction. Never run it over the curated 25-PNG subset or claim screenshots from a new execution are original Stage 15.7 observations. Any guarded database execution requires separate appropriate local authorization; this cleanup ran no destructive suite or deployed request.
