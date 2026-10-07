# Orderly V1 P2 hardening follow-up

Date: 8 October 2026, Australia/Sydney. Scope: findings #10 and #11 from the completed V1 acceptance audit, using the existing working tree as the baseline.

## Changes and behavior

Checkout receives the existing menu contract's `pickupEnabled`, `deliveryEnabled`, and `minimumOrderAmount`, alongside the previously corrected delivery fee. An unavailable method is disabled and labelled unavailable; if the selected/default method is disabled, checkout resolves to the other enabled method. If neither method is enabled, the existing paused-ordering state blocks both submit controls. A backend delivery-only availability rejection disables delivery and preserves pickup, cart, and entered details. Store-wide paused errors still block ordering.

The minimum uses the cart subtotal, before delivery/service fees, for both pickup and delivery, matching current backend enforcement. Checkout shows the configured minimum and remaining amount before submission, disables both submit controls below the minimum, and permits exact-minimum orders. Updating the cart recalculates eligibility. Backend validation remains unchanged and authoritative.

Configured delivery fees still flow through the existing pricing helpers, both summaries, and the mobile total. Pickup has no delivery charge; the existing $50 subtotal free-delivery threshold remains unchanged.

A small `PrivateResponse` decorator/interceptor sets `Cache-Control: private, no-store` on customer account/orders and admin authentication/orders/category/product/AI controllers. It does not change guards, sessions, cookies, or query caching. Existing customer authentication no-store policies remain in place. Public menu, health, and public order controllers were not given this interceptor; the public menu regression confirms neither `private` nor `no-store` was added.

## Files changed for this follow-up

- Fulfillment/minimum UI: `apps/web/src/app/(customer)/checkout/page.tsx`, `apps/web/src/features/checkout/components/checkout-page-client.tsx`, `apps/web/src/features/checkout/components/fulfillment-selector.tsx`.
- Cache policy: `apps/api/src/http/private-response.interceptor.ts`, `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/customer-auth/customer-account.controller.ts`, `apps/api/src/modules/orders/customer-orders.controller.ts`, `apps/api/src/modules/orders/orders-admin.controller.ts`, `apps/api/src/modules/menu/admin/categories/admin-categories.controller.ts`, `apps/api/src/modules/menu/admin/products/admin-products.controller.ts`, `apps/api/src/modules/menu/admin/ai/admin-menu-ai.controller.ts`.
- Tests: `apps/web/test/checkout-customer-page.test.tsx`; API `customer-account.e2e-spec.ts`, `customer-orders.e2e-spec.ts`, `admin-orders.e2e-spec.ts`, `admin-menu.e2e-spec.ts`; shared `test/support/cache-policy.ts` validates directives independently of order.

Earlier acceptance-audit changes remain in the working tree and are not new changes from this follow-up.

## Validation

Evidence is retained in `audit-artifacts/p2-hardening/`.

| Check | Result | Scope |
|---|---|---|
| Focused frontend regressions | PASS | 2 suites, 20/20 tests; checkout customer and existing navigation coverage. |
| Focused API cache regressions | PASS | 4 suites, 19/19 tests; real local PostgreSQL. |
| `pnpm lint` | PASS | API and web. |
| `pnpm typecheck` | PASS | API, web source, web test project. |
| Complete `pnpm test:quality`, optimized browser frontend | PASS | Run once; exited 0. API unit 150/150 (13 suites), API e2e 118/118 (11 suites), web 235/235 (30 suites); typecheck, lint, builds, and browser checks all passed. |
| Browser workflows | PASS | 38/38: critical 18, controlled Google 5, account 3, checkout ownership 6, private history 6. Real API/local PostgreSQL and optimized Next frontend. |

Initial focused API invocation supplied an incomplete direct-run test environment and was rejected by the existing safety guard before tests ran. After setting both local Prisma URLs and `NODE_ENV=test`, initialization failed because Docker Desktop was stopped and PostgreSQL was unreachable. Starting Docker and verifying local database readiness resolved the environment failure; all 19 focused tests then passed. No product workaround, timeout increase, or test bypass was introduced.

## Scope and release status

No unrelated feature, broad architecture redesign, dependency replacement, schema/migration change, production deployment, or production data mutation occurred. Local fixtures operate only on `orderly_test`.

**The remaining V1 acceptance P2 findings are resolved. The project is ready for production UAT and Stage 14 completion.**

No outstanding confirmed P0/P1/P2 code finding from this acceptance work prevents production UAT. The complete gate passed all 541 tests/workflows without skips or weakened checks. This is not a claim that production UAT has already passed: the original checklist remains required before V1 Freeze, including hosting settings and live provider checks if enabled. No new Docker build or live provider/deployment check was performed in this focused follow-up.
