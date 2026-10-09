# Anonymous customer authentication request investigation

Date: 8 October 2026, Australia/Sydney. Investigated local baseline `22899c4` and the focused fix below. Production observations were supplied by the owner; no production requests, credentials, deployment, data changes, or commits were made during this investigation.

## A. Root cause

`apps/web/src/features/customer-auth/components/customer-auth-bootstrap.tsx`, `CustomerAuthBootstrap`, registered `focus` and `visibilitychange` handlers whose `recheck()` dispatched `bootstrapCustomer()` whenever the document was visible, including after anonymous state had settled. Each later event could therefore create another bounded request batch. Opening/returning from DevTools or switching tabs can cause these browser events. Preserve Log also accumulates batches from prior reloads; it does not itself make requests. This mechanism explains the reported pattern but cannot attribute each observed production batch without its event/network trace.

`bootstrapCustomer()` in `apps/web/src/features/customer-auth/store/customer-auth-slice.ts` calls `customerAuthApi.me()`. Its condition only blocks a concurrent auth operation; it does not block subsequent bootstraps after the prior operation settles. `customerAuthApi.me()` in `api/customer-auth-api.ts` uses the customer client's required-auth mode.

`createCustomerApiClient()` in `api/customer-api-fetch.ts` sends the initial identity request. On 401, `request()` calls `refresh()`. Inside the Web Lock, `refresh()` deliberately checks `/me` again before rotating: another tab may already have replaced the shared access cookie. Only if this check also returns 401 does it POST `/refresh`. This second `/me` is a coordination check, not an automatic HTTP retry bug. Successful refresh permits one retry of the original request; terminal refresh 401 does not.

The refresh promise is shared in-tab and cleared in `finally`; clearing it does not schedule another refresh. `expire()` advances the generation and notifies failure listeners. For an already-known customer the bootstrap listener dispatches terminal session expiry and publishes `ended`; for anonymous startup the thunk's rejected reducer sets `unauthenticated`, clears identity/error/request/operation, and does not dispatch another bootstrap. Neither path remains stuck loading or recursively restarts auth.

Other triggers and non-triggers:

- Initial `CustomerAuthBootstrap` mount always bootstraps. Its main effect depends only on stable Redux `dispatch`; customer/status ref updates do not remount or rerun that effect.
- `session-events.ts` receives a cross-tab `changed` event: invalidate the client generation, reset session state, then bootstrap. An `ended` event only expires state; it does not bootstrap. BroadcastChannel posts do not echo back through the same channel object.
- Login/registration update Redux identity directly and broadcast `changed` to peers. Explicit error-retry buttons dispatch bootstrap. OAuth completion uses a fresh mount/initial bootstrap and publishes `changed`.
- `app/layout.tsx` owns a stable Redux provider. The customer route-group layout owns `CustomerShell`, which mounts one `QueryProvider` and one bootstrap component. Navigation within this shared layout preserves them. Full reload or leaving/re-entering the customer layout can remount/bootstrap again. Development Strict Mode can rerun effects; the pending-operation condition prevents concurrent duplicate bootstrap. Browser evidence here uses an optimized build.
- Authentication bootstrap is a Redux thunk, not a TanStack auth query. `QueryProvider` rejects retries for HTTP 4xx and allows one retry for other query failures; mutations have no retry. Query focus/reconnect behavior does not dispatch this auth thunk. Customer order queries are enabled only with a customer ID; their own retry overrides are private-data query behavior, not an anonymous storefront initializer.
- There is no auth polling interval, scheduled revalidation, or auth `online` listener. The client's 10-second timeout bounds Web Lock acquisition; it is not a refresh timer.

## B. Request sequence

An anonymous bootstrap, before and after the fix:

1. `GET /api/customer/auth/me` → 401.
2. `GET /api/customer/auth/me` → 401 inside refresh coordination.
3. `POST /api/customer/auth/refresh` → 401.
4. Stable unauthenticated state. No retry of the original identity request.

Before the fix, a later visible focus/visibility event restarted steps 1–3. After the fix, a known-anonymous tab with BroadcastChannel support makes no requests for those events. A reload/new mount still legitimately performs steps 1–3.

With an expired access token and a valid refresh cookie: `me 401 → me 401 → refresh 200 → me 200`, then authenticated state. A valid access session normally needs only `me 200` for each legitimate validation. A same-origin peer session-change broadcast also needs `me 200` when the access cookie is valid.

## C. Reproduction evidence

Existing Playwright infrastructure ran Chromium against an optimized local Next frontend, real Nest API, and isolated `orderly_test` PostgreSQL. Counts below refer to responses observed in the tracked page. Focus/visibility events were dispatched deliberately to isolate their handlers; existing-tab activation also used native `bringToFront()`. Reconnection used actual offline/online context toggling plus an `online` event. Native desktop/DevTools focus timing is not simulated fully by headless Chromium.

| Condition | Before fix | After fix |
|---|---|---|
| Fresh anonymous context; no customer cookies | 2 me + 1 refresh, all 401 | Same expected bounded sequence |
| Visible focus after anonymous settles | Another 2 me + 1 refresh, all 401 | 0 additional |
| Visible `visibilitychange` after anonymous settles | Another 2 me + 1 refresh, all 401 | 0 additional |
| Offline/online reconnect | 0 additional | 0 additional |
| Existing-tab activation | Not separately measured in baseline | 0 additional in tracked page; newly opened peer has its own initial 3-request bootstrap |
| In-app navigation to tracking | 0 additional | 0 additional |
| Page reload | Another 2 me + 1 refresh, all 401 | Same expected bounded sequence |
| Invalid access and refresh cookies | 2 me + 1 refresh, all 401; no idle continuation | Same sequence; focus/visibility afterwards add 0 |
| Idle anonymous observation | 0 additional over 2 seconds | 0 additional over 10 seconds |
| Peer registration/session-change broadcast | Not measured in baseline probe | 1 me, 200; peer identity appears in original tab |
| Locally signed expired access JWT, valid refresh cookie | Covered by existing coordination implementation/tests | 2 me 401, refresh 200, final me 200 |
| Peer logout/ended broadcast and later focus/visibility | Redundant focus reads also demonstrated by component tests | 0 additional; guest navigation restored |

The first baseline browser scenario accumulated 12 requests: 3 each for initial load, focus, visibility, and reload. The corrected scenario accumulated 6 in the tracked page: initial load and reload only. Tests intentionally retain legitimate backend 401 responses.

Evidence: `audit-artifacts/anonymous-auth/baseline-browser.log`, `baseline-component.log`, `regressions.log`, `fixed-browser.log`, `final-browser.log`, `lint-final.log`, and `typecheck-final.log`. Baseline component tests intentionally asserted the desired stable behavior: 4 failed and 1 passed on unchanged code, exposing redundant checks after anonymous settlement/expiry/logout/ended events. They pass after the fix; an additional fallback test was added.

This was not a multi-minute production recording. The bounded response trace, stable state tests, short idle windows, and absence of a polling/retry scheduler support event-driven repetition, not an infinite retry diagnosis.

## D. Severity

**P3 — redundant requests without demonstrated material load or functional impact.** The requests are bounded per external event. Terminal 401 correctly settles anonymous state; the storefront remains usable, and no session correctness problem was reproduced. Initial bootstrap/reload requests are expected. Rechecking a known-anonymous Chrome tab on every focus/visibility return was unnecessary because supported BroadcastChannel session-change events already announce peer sign-in/out.

Browsers without BroadcastChannel intentionally retain the existing bounded focus fallback so they can discover a changed shared-cookie session in another tab. This can still produce anonymous focus batches in those browsers; it is a compatibility validation path, not autonomous retry/polling.

## E. Changes

- `apps/web/src/features/customer-auth/components/customer-auth-bootstrap.tsx`: keep the latest auth status in a ref; skip automatic focus/visible checks only for settled anonymous state when BroadcastChannel is supported. Preserve initial mount, error recovery, authenticated checks, explicit actions, cross-tab changes, and the unsupported-browser fallback. No API/client/backend retry or response behavior changed.
- `apps/web/test/customer-auth-bootstrap.test.tsx`: six focused tests use the real auth client/thunks with controlled fetch responses; cover anonymous settlement, terminal expiry, signed-in validation, login/logout, peer changed/ended signals, successful refresh, and unsupported-BroadcastChannel fallback.
- `apps/web/test/browser/customer-anonymous-auth.spec.ts`: three browser scenarios record auth response counts, lifecycle events, invalid cookies, real peer session signals, and signed expired-token refresh using only the known local fixture secret.
- `apps/web/test/browser/scripts/run-playwright.mjs`: include this new regression suite in the existing serial optimized/CI suite list so it is not omitted from future gates.
- This report records the investigation. No unrelated files or features changed.

## F. Validation

| Validation | Result |
|---|---|
| Unchanged baseline browser probe | 2/2 passed; captured redundant event-driven batches |
| Focused auth component/client/state/navigation/routing/form suites | 6 suites, 35/35 passed |
| Final optimized browser run: new anonymous suite + existing account suite | 6/6 passed (3 + 3); signed expired JWT case included |
| Web lint | PASS |
| Web source/test typecheck | PASS |
| Local API and optimized Next build through browser wrapper | PASS |
| `git diff --check` | PASS |

The earlier 3/3 fixed anonymous run also passed; final 6/6 rerun included the improved signed-expired-token fixture and existing real account password-change/login/logout workflows. No tests were skipped or weakened. No new full release audit or complete quality gate was run for this narrowly scoped investigation.

## G. Production recommendation

This P3 finding does **not block Production UAT or V1 Freeze**. Include the focused fix in the normal reviewed release process to reduce anonymous focus noise. After deployment, verify a fresh anonymous page makes one bounded bootstrap, existing-tab focus adds no auth requests in Chrome, and reload/cross-tab login/logout still work. Preserve Log may retain earlier request batches; compare requests after a known event/time boundary. Continue the existing production UAT checklist. No deployment or commit was performed here.
