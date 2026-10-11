# AI menu assistant visibility fix

## Behavior and scope

Previously, the shared Admin product create/edit fields displayed AI actions whenever the frontend build-time `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` flag was `true`, regardless of API configuration. The API then rejected suggestions when either provider credential or model was absent.

The shared fields now require both the existing explicit frontend opt-in and an authenticated backend capability response containing the literal boolean `available: true`. Pending, failed, unavailable and malformed capability responses hide the assistant. Failed revalidation also hides an action that was previously available. Disabling the existing flag prevents capability requests entirely. Production mode does not independently disable AI.

`GET /api/admin/menu/ai/capability` retains the controller's admin JWT/role guards and private-response handling. Its only response field is an availability boolean, calculated using the same trimmed key/model configuration helper as suggestion generation. It does not instantiate the provider, contact OpenAI, or disclose credential/model values. No new feature-flag framework, dependency, schema, environment value or deployment change was introduced.

Existing suggestion validation, sanitized provider errors, generation, apply/discard behavior, and manual description editing remain unchanged. Availability means locally configured, not that a credential is valid or a provider is reachable; real provider failures continue to use the existing error handling. Configuration removed between discovery and generation remains safely rejected by the API.

## Changed files

- `apps/api/src/modules/menu/admin/ai/admin-menu-ai.controller.ts`
- `apps/api/src/modules/menu/admin/ai/admin-menu-ai.controller.spec.ts`
- `apps/api/src/modules/menu/admin/ai/admin-menu-ai.service.ts`
- `apps/api/src/modules/menu/admin/ai/admin-menu-ai.service.spec.ts`
- `apps/web/src/features/admin-menu/api/admin-menu-api.ts`
- `apps/web/src/features/admin-menu/hooks/use-admin-ai-availability.ts`
- `apps/web/src/features/admin-menu/components/products/editor/form/admin-product-basic-fields.tsx`
- `apps/web/test/admin-ai-visibility.test.tsx`
- `apps/web/.env.example` (comment only)
- This report.

## Validation

- Focused web Jest suites: **14 tests passed**, covering shared create/edit action labels, disabled flag, unknown capability, false/malformed capability, request errors, failed revalidation, and existing assistant interactions.
- Focused API Jest suites: **17 tests passed**, including boolean-only discovery without provider requests, incomplete/blank configuration, controller guard metadata, and existing suggestion/provider-error behavior.
- Web and API TypeScript: passed.
- Web and API production builds: passed. Web build used a local API rewrite target and the existing local browser-build override; no production API or customer data was accessed.
- Full web and API lint, targeted changed-web-file lint, and `git diff --check`: passed.

## Deployment review

No commit, push, deployment or live provider request was performed. Deploy the API capability endpoint with the web change; an older API returning 404 safely leaves the action hidden. The existing frontend flag is build-time and still requires rebuilding when changed. Deployed browser verification and live provider health are not claimed. Local component tests mock capability responses; controller tests verify guard metadata rather than an end-to-end authenticated HTTP session.
