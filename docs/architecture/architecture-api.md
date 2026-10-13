# Architecture, database and API overview

This source-based overview describes implemented contracts, not deployed acceptance. `/api` is the global API prefix. DTOs and controllers are authoritative; no Swagger/OpenAPI generation is asserted.

| Route family | Implemented operations | Authorization |
| --- | --- | --- |
| `GET /api/menu`, `GET /api/health` | Catalog and service health | Public |
| `POST /api/orders` | Validate catalog/options, price and persist checkout snapshots | Guest or validated Customer session; ownership server-derived |
| `POST /api/orders/guest/lookup` | Receipt-protected lookup | Order number + valid capability (or explicitly supported current owner proof); never email/phone-only |
| `/api/customer/auth` | Mode/provider status, registration/resend/check/complete, login/refresh/logout/me, Google start/connect/delete intent/callback | Public entry points plus purpose/session-bound checks on protected flows |
| `/api/customer/account` | Profile, password, deletion status/final delete | Customer guard and required reauthentication |
| `GET /api/customer/orders`, `GET /api/customer/orders/:id` | Filter/sort/page history and detail | Current Customer UUID in database read |
| `/api/auth` | Admin login/refresh/logout/me | Separate Admin credentials/session |
| `GET /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/action` | Admin list/detail and state-machine actions | Admin guard |
| `/api/admin/menu/categories` | List/create/edit, availability, archive/restore, reorder | Admin guard |
| `/api/admin/menu/products` | List/detail/create/edit, availability, archive | Admin guard; availability/archive API-only in current frontend |
| `/api/admin/menu/ai` | Capability and structured draft suggestion | Admin guard, optional provider configuration |

Category -> Product -> ProductOptionGroup -> ProductOption defines the catalog. Order -> OrderItem -> OrderItemOption stores immutable name/selection/price snapshots; nullable product/option references do not determine historical rendering. Status/payment status are separate; payment enum fields do not imply a payment processor.

CustomerUser -> CustomerSession supports current identity. Separate AdminUser/AdminSession handles Admin authorization. Pending registration, OAuth transactions, deletion grants and a hashed deleted-subject barrier enforce expiring proof and revocation. Legacy User remains in schema; it is not the current customer account model. `StoreSettings` supplies ordering configuration, not an implemented Admin settings interface.

Runtime prices/options and state transitions are validated in NestJS services. Prisma transactions coordinate identity/deletion/owned checkout with advisory/session locks; PostgreSQL sequence allocation avoids concurrent order-number collisions. API money uses cents, catalog prices use database decimals. HTTP throttling is process-local; durable mailbox quotas are database-backed.

Source: [schema](../../apps/api/prisma/schema.prisma), [modules](../../apps/api/src/modules), [frontend features](../../apps/web/src/features), [proxy configuration](../../apps/web/next.config.ts). Optional provider calls stay server-side; AI content requires human review before a normal save.


## Optional Admin AI capability

The product create/edit action requires both the explicit build-time `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` opt-in and authenticated `GET /api/admin/menu/ai/capability` returning literal boolean `available: true`. Pending, failed, false/malformed and failed-revalidation responses hide it; disabling the flag prevents discovery requests. The endpoint retains Admin JWT/role guards and private responses, returns only the boolean, and makes no provider request. The same trimmed key/model configuration governs discovery and generation; capability is local configuration, not a claim of provider reachability or credential validity. Suggestions remain reviewable drafts requiring normal save; API generation still rejects removed configuration. An older API returning 404 fails safely hidden.

The historical visibility fix recorded 14 focused web tests and 17 API tests passing, plus typecheck/lint/build checks. Web responses were mocked; controller guard metadata checks are not full authenticated HTTP acceptance. Real provider and deployed-browser acceptance were not claimed. See [AI service](../../apps/api/src/modules/menu/admin/ai/admin-menu-ai.service.ts) and [visibility regression](../../apps/web/test/admin-ai-visibility.test.tsx).
