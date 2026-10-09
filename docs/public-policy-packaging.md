# Public privacy and terms packaging

Prepared 8 October 2026. No deployment or commit was performed. Existing Google activation changes in the working tree were preserved.

## Implementation

Public static Next.js routes `/privacy` and `/terms` live in the existing customer route group, outside the protected account layout. They use the shared customer header/footer, theme variables, readable content width, page metadata and accessible headings. The footer links to both pages and wraps on narrow screens. A shared policy presentation component includes the owner-confirmation contact placeholder and links between policies.

## Source-based data review

- `apps/api/prisma/schema.prisma`: customer profile, optional password credential, Google identifier, session records and timestamps; orders store contact/address/notes, item and price snapshots, statuses and optional account ownership.
- Customer auth services/provider: Google supplies subject, verified email and optional name; no Gmail/Drive/contact scopes, no persisted provider tokens, and explicit password-account linking. Cookies support customer sessions and Google sign-in.
- Cart storage and checkout/tracking utilities: local cart persistence and per-tab checkout/tracking details. Clearing browser data does not delete persisted orders/accounts.
- Order tracking mapper: matching guest lookup returns contact/address/order information; the policy tells users to keep lookup details private.
- Root README/deployment configuration: live demo on Vercel, Railway API and Neon database. Hosting log settings, locations and backup retention were not independently inspected. Request IP information supports abuse prevention.
- Admin menu AI service: optional OpenAI requests contain product/category/description text, not account/order inputs. No assertion is made about provider-side retention or training policy.
- No payment processing or advertising/analytics integration was found in application source. The policy distinguishes this from hosting technical logs.

The pages disclose these practices without environment names, credentials, internal authentication mechanisms, invented deletion features, retention deadlines or security guarantees. They describe the deployment as a portfolio demo, consistent with the repository's Live Demo description. No restaurant contact, governing jurisdiction, business entity or refund promise was invented.

## Owner confirmation required before publication

1. Replace `[Developer contact email — owner confirmation required]` with a monitored email in `apps/web/src/components/layout/policy-page.tsx`; confirm the responsible developer/operator identity and a practical process for privacy concerns and access/correction/deletion requests. There is currently no usable public contact in this draft.
2. Confirm this deployed site remains a noncommercial portfolio demonstration: no real food fulfilment, payment or commercial purchases. If that changes, revise both pages before release.
3. Confirm actual Vercel/Railway/Neon deployment regions, operational log settings, backup retention and any additional host analytics/monitoring. Determine and document retention/deletion practices; current pages promise no fixed period or complete backup deletion.
4. Confirm who can access order data through administrator accounts, and that no additional processors, tracking tools or manual customer-data exports have been added outside the inspected app code. Confirm optional AI configuration and prevent personal data being entered in menu text.
5. Review legal applicability and the operator's obligations for its actual audience and location. The text does not certify compliance. The [OAIC privacy policy guidance](https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/what-is-a-privacy-policy) identifies data categories, use/disclosure, contact/request handling and overseas practices as policy topics; applicable obligations depend on the operator.
6. After the owner replaces the placeholder, publish through the normal reviewed deployment process and verify anonymous HTTPS access to both URLs. Then use `https://orderly-web-gamma.vercel.app/privacy` and `https://orderly-web-gamma.vercel.app/terms` in Google Auth Platform Branding. These URLs are not deployed by this task.

## Validation

All checks passed. Logs are stored locally under ignored `audit-artifacts/public-policies/`.

| Check | Result | Evidence |
| --- | --- | --- |
| Focused policy tests and existing customer/mobile navigation tests | **24/24**, 3 suites | `tests.log`; three added cases verify both pages render without auth/store providers and footer/cross-policy destinations. |
| Frontend ESLint | PASS | `lint.log` |
| Frontend source and test TypeScript checks | PASS | `typecheck.log` |
| Optimized Next.js production build | PASS | `build.log`; `/privacy` and `/terms` prerendered as static routes. |
| Local production HTTP checks without cookies | PASS | `http-smoke.log`; both routes return 200 with both policy links, without an authentication redirect. The local server was stopped afterward. |
| `git diff --check` | PASS | Final working-tree verification. |

No production server was changed or production data created. Backend suites and the complete release quality gate were not rerun for these static frontend pages.
