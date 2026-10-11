# Orderly Git commit readiness audit

Date: 10 October 2026 (Australia/Sydney). Repository: C:/dev/Orderly. Audited HEAD: f6855d9faa6701d6109b5204ce7fd03e36507eee.

## Decision and scope

**Do not bulk-commit the current working tree.** Application changes and their tests have coherent commit boundaries; evidence publication and archival need approval and privacy review. No confirmed production credential was identified by the pattern scans, but that is not a guarantee that every artifact is safe to publish.

This audit inspected the complete current tracked/untracked inventory, ignore rules, changed source/test/configuration diffs, stage reports, local evidence references and trace archives. It did not stage, commit, push, reset, clean, stash, discard, delete, move or archive anything. No application/test/configuration file was edited. Only this requested report was created. No test suite or database-mutating test infrastructure was run during this read-only audit.

Counts below describe the **1,019 input changes before this report**. Creating this report adds one untracked documentation file: expected resulting total **1,020**, with 24 tracked modifications and 996 untracked files. The appendix exhaustively classifies all 1,019 input files; this report belongs in proposed C4 after approval.

## Inventory and Git state

- 588 files are already tracked. Of these, 24 are modified and 564 unchanged.
- 995 untracked files; 1,019 pending paths in total. No staged changes, tracked file deletions, renames, unmerged entries or file-mode changes were found.
- Tracked diff: **24 files, 284 insertions, 423 deletions**. Untracked additions are absent from git diff --stat and must be included separately in review.
- Current contents of pending files occupy **213,157,249 bytes (203.28 MiB)**. This includes whole modified files, not merely their patch sizes; it is not a prediction of Git pack growth.
- Evidence accounts for **986 files**: 70 Stage 15.6 PNGs plus 916 Stage 15.7 evidence files. The other **33 paths** are 18 source files, 10 tests/infrastructure files, 2 dependency/configuration files and 3 stage documents.
- A further **4 ignored initial-audit evidence files**, 133,850,070 bytes (127.65 MiB), exist below docs/stage-15.7-evidence/initial/test-results/. They are outside the 1,019 pending-path count and must not be mistaken for disposable build output.
- Earlier stages are already committed: HEAD is Stage 15.5, preceded by the Stage 15.3/15.4 and Stage 15.2 commits. The outstanding source changes belong to Stages **15.6 and 15.7**; do not recommit earlier stages as though they were new work.

| Exclusive category | Modified | Untracked | Total | Current bytes |
| --- | ---: | ---: | ---: | ---: |
| Dependency/configuration | 2 | 0 | 2 | 344,777 |
| Tests and infrastructure | 5 | 5 | 10 | 108,320 |
| Application source | 17 | 1 | 18 | 71,229 |
| Documentation | 0 | 3 | 3 | 52,819 |
| Screenshots | 0 | 501 | 501 | 75,375,563 |
| Generated evidence/reports/logs | 0 | 485 | 485 | 137,204,541 |
| Database migrations/schema changes | 0 | 0 | 0 | 0 |
| Build/cache artifacts among pending paths | 0 | 0 | 0 | 0 |

Potentially sensitive content is an **overlapping review flag**, not an extra category to add to these totals. The 2 configuration paths are apps/web/package.json and pnpm-lock.yaml, both for the development-only axe dependency; there is no new database configuration or migration.

The generated category contains **447 JSON files, 26 logs, 2 HTML galleries, 5 ZIP traces and 5 generated error-context Markdown files**. Human-authored documentation is the three Stage 15.6/15.7 reports/checklists. The screenshot category contains 501 PNGs. Source/test categories contain 21 TSX, 5 TS and 2 MJS files.

## Ignore and generated-artifact audit

Root .gitignore excludes node_modules, dist/build/.next, coverage, playwright-report, test-results, private .env variants, Prisma generated output and operating-system/debug artifacts. Existing dedicated exclusions cover /audit-artifacts/, /.pnpm-store/ and /.stage138d-proxy-test/. Web rules also exclude .vercel, *.pem, *.tsbuildinfo and next-env.d.ts. API rules exclude generated Prisma output and its .env. Root .gitattributes enforces automatic text detection and LF for text.

Observed ignored locations include node_modules at root/API/web, apps/api/dist, apps/web/.next, apps/web/test-results, apps/web/tsconfig.tsbuildinfo, generated next-env.d.ts, the local pnpm store/proxy test workspace, audit-artifacts and the two local environment files. Keep these exclusions. **Do not remove production-build configuration, source assets, migrations, seed helpers, database guards or test scripts simply because they generate artifacts.** The existing 11 migration SQL files plus migration_lock.toml remain tracked and unchanged.

The unanchored root rule **test-results** also ignores docs/stage-15.7-evidence/initial/test-results/. That directory contains a 133,817,622-byte Firefox trace, a failure screenshot, error context and run metadata. This is a retention mismatch: the acceptance narrative says initial failure evidence is retained, but a normal add of docs will not publish those four files. Do not force-add the large trace or broaden ignore exceptions without review. Preserve it in an approved external audit archive and record a durable reference/checksum, or explicitly approve another retention scheme.

No build/cache artifact currently escaped into the pending set. Generated audit results are **not automatically caches**: raw axe scans, failed-run records and significant screenshots support reproducibility and the acceptance decision. Do not blanket-ignore docs, all JSON/logs/ZIPs, tests or stage evidence. Future transient runs can use the existing ignored audit-artifacts location through the supported acceptance evidence/results and state-capture environment overrides. The summarizer still expects the documented evidence directory and a local .next build; moving its inputs without adapting the approved evidence workflow would break it.

## Sensitive-content and customer-data review

Values were never printed. Inspection reported paths, rule names, counts and context classifications only.

1. **952 tracked/untracked text files** were inspected across the repository inventory, including all 26 pending logs decoded as UTF-16LE when their BOM required it. Checks covered recognizable provider credentials, private-key headers, JWT-shaped strings, literal credential fields, identity-like content and serialized authorization/cookie headers. No private-key, recognized provider-token or JWT signature match was found in those text scans. The log scan found no matching credential assignments, identity patterns or auth-header fields.
2. **Six ZIP traces**, five pending and one already ignored, were inspected without extraction to disk: **599 textual entries**, including trace/network/source/JSON/HTML and bundled .htc/SVG entries. No matching private keys, provider credential signatures or JWTs were found. Trace/network text had no matching serialized authorization/cookie header fields. Six opaque binary entries and image/font content were excluded from textual scanning. Fixture identity strings occur in captured source, JSON bodies and DOM snapshots; dependency/source annotations also produce identity-pattern matches.
3. **501 pending PNGs** were examined for text/EXIF metadata; none contained the inspected text/EXIF chunk types. This does **not** inspect readable pixels. The stage fixtures explicitly use synthetic customer/account/order/contact data. Nevertheless, review proposed published images and trace frames for names, contact/address details, entered passwords, browser state and unrelated desktop content before publication. An automated signature scan cannot certify the absence of real customer data in pixels or unknown opaque values.
4. The changed tests contain deliberate local/test identity and credential fixtures. Credential-pattern hits in critical-workflow.spec.ts, customer-auth-forms.test.tsx and mobile-navigation.test.tsx are test data, not evidence of production secrets. New presentation/audit fixtures also carry synthetic identity/order fields. Keep required test fixtures; do not redact application tests so they stop reproducing auth/ownership behavior. The Stage 15.6 report's credential-bearing connection example is a guarded loopback test database reference.
5. The lookup form's identity-pattern hit is a UI placeholder. Lockfile identity-pattern hits are upstream dependency deprecation contact text, not customer data; lockfile integrity hashes are not credentials. These were inspected and should not trigger blanket file exclusion.
6. Actual apps/api/.env and apps/web/.env.local are ignored and not tracked. The three tracked .env.example files remain unchanged. Their scanned connection/signing fields are recognizable placeholders/local examples, **except ADMIN_SEED_PASSWORD in apps/api/.env.example:35**, which is a literal sample value not classified as a placeholder. This is a baseline manual-review item, not a newly introduced secret or confirmed live credential. Confirm its intended demo-only status and that it is never a production credential; do not print it or alter it as part of this audit.

No new database dump, private environment file, PEM/key bundle, browser storage-state file, SQLite/database snapshot or obvious scratch/backup file was found among untracked candidates by filename checks. No production customer export was identified in inspected text. This is pattern/context inspection, not a full-history secret audit, entropy scanner, OCR review, external credential validation or proof of production configuration safety.

Privacy-review candidates overlap classifications: **501 PNGs, 5 pending ZIPs plus the ignored ZIP, and 5 pending generated error contexts**. Human review should also cover representative JSON bodies and local path/environment metadata before a public release. Screenshots and traces with only synthetic fixtures may be retained; unknown data should be restricted/redacted in separately approved derivative artifacts with originals preserved securely.

## Proposed disposition and evidence policy

The appendix assigns every pending file a proposed C1/C2/C3/C4 boundary or **Archive**. None of these labels is authorization to stage, move or delete files.

| Proposed boundary/disposition | Input files | Current bytes | MiB |
| --- | ---: | ---: | ---: |
| C1 | 92 | 3,818,304 | 3.64 |
| C2 | 4 | 25,081 | 0.02 |
| C3 | 5 | 372,864 | 0.36 |
| C4 | 561 | 41,502,800 | 39.58 |
| Archive | 357 | 167,438,200 | 159.68 |

C1?C4 comprise **662 commit candidates**, conditional on review. Archive comprises **357 pending files**, plus the 4 already ignored initial-audit files: preserve these externally after approval, with original relative paths and hashes. This report adds one further C4 document beyond the table. There is no proposed deletion of any source, test, fixture, migration or necessary audit record.

Recommended Git evidence includes all 70 Stage 15.6 before/after PNGs, the final 210 axe scan JSONs, 237 engine PNGs and 50 current state PNGs, root Stage 15.7 result/metadata/performance/log records and its final gallery, before-fix navigation sequences, the explicit initial Firefox enlargement finding, initial failure log/results and the five small failure screenshots/error contexts. Publication remains subject to synthetic-data/privacy review.

Archive the five pending large trace ZIPs and the ignored original Firefox trace, older bulk initial galleries/captures and the screenshots-only/DOM-only per-page diagnostic folders. They remain useful forensic evidence, particularly for the open WebKit loading diagnostic. **Archive means preserve, not discard.** Keep the compact corresponding run logs/results and significant failure captures in Git; record a durable approved archive reference and SHA-256 manifest before changing report links. Retain all originals until the archive is verified and any later cleanup is separately authorized.

The 112 local links examined in the Stage 15.6/15.7 reports currently resolve. There are no missing local targets today. Local resolution does not prove inclusion in a fresh clone: ignored directory descendants and externally archived trace links require explicit handling. The final screenshot gallery depends on the 287 final engine/state PNGs; do not commit that gallery while silently dropping those images. Stage 15.6 report links depend on its retained before/after PNGs. The original initial gallery should be archived with its original inputs, not published with broken image references.

SHA-256 comparison found **150 exact-duplicate groups / 154 extra identical PNG/JSON/log files**, representing 22,391,308 logical bytes. This does not authorize deduplication: equivalent captures can have different temporal/diagnostic roles and referenced paths. Git itself reuses identical blobs; logical duplicate size is not the same as removable Git pack size. An external archive can preserve path-to-hash mappings without losing those roles.

The 26 logs are UTF-16LE/BOM where applicable and may be detected by Git as binary. Preserve their original transcript bytes; do not silently transcode historical evidence. If review prefers UTF-8 derivatives, preserve/hash the originals and label the derivatives after approval.

## Dependencies and coherent commit sequence

### C1 ? Stage 15.6 customer presentation and regression

Suggested title: feat(web): refine authentication, orders and guest tracking

Include the **15 application paths outside the three customer-header fix files**, the **six Stage 15.6 test/runner paths**, the Stage 15.6 report and its 70 reviewed PNGs. The appendix enumerates exact paths. Include the new customer-orders-loading.tsx together with both order pages that import it. Include the new premium-auth-orders-tracking.spec.ts with run-playwright.mjs's suite registration, customer-auth-forms.test.tsx, premium-tracking-accessibility.test.tsx, critical-workflow.spec.ts and premium-transactions.spec.ts.

The tracking timeline change and critical-workflow assertions belong together: the recorded ACCEPTED status still uses the Placed progress position with explicit status text. The transaction test adjustment is an existing fixed-control geometry assertion made deterministic with instant scrolling/polling, not unrelated product work.

The current new presentation test file also contains Stage 15.7 tablet coverage and normalized/viewport capture-helper refinements. Safest default: keep the entire current file in this regression commit and disclose the expanded test coverage. If exact historical stage separation is required, it needs a reviewed hunk split later; this audit did not alter or split the file. Existing Stage 15.2 primitives and Stage 15.3 account navigation are already present in HEAD.

### C2 ? Confirmed customer drawer keyboard fix

Suggested title: fix(web): keep customer drawer destinations keyboard reachable

Include exactly app-header-shell.tsx, mobile-navigation.tsx, site-header.tsx and mobile-navigation.test.tsx. The prop, forwarding, customer opt-in and focused unit regression are inseparable; committing only an opt-in consumer would leave an incomplete fix. Default behavior stays unchanged for Admin. This boundary depends on the shared header already in HEAD, and may follow C1 cleanly.

### C3 ? Final acceptance tooling and development dependency

Suggested title: test(web): add multi-engine accessibility acceptance audit

Include apps/web/package.json **together with pnpm-lock.yaml**, playwright.acceptance.config.ts, final-acceptance.spec.ts and scripts/summarize-acceptance.mjs. The package/lock delta is one development-only axe dependency and its resolutions, **19 added lockfile lines**, with no unrelated version churn. The audit imports that dependency; the new config selects the audit test, and the summarizer consumes its outputs plus .next JavaScript chunks.

Dependencies already tracked and required: guarded database URL helper, Prisma client/schema/migrations, browser seed product, base Playwright server configuration, existing mushroom-pizza asset and the existing build/runner scripts. The temporary photo update is inside the guarded test database and restored in afterAll; interruption can bypass cleanup, so it must remain a test-only fixture, not production seed/data work. Keep the fixture and guard; do not delete them as temporary artifacts. Execution also needs installed Firefox/WebKit engines and the existing optimized build; those binaries/builds stay outside Git.

C3 builds on C1's customer surfaces and C2's keyboard fix for the audited passing states. Default audit contexts are per viewport; combined and dom-only/screenshots-only modes remain diagnostic evidence, not equivalent extra axe passes.

### C4 ? Acceptance handoff and reviewed evidence

Suggested title: docs: preserve final acceptance evidence and UAT handoff

Include the two Stage 15.7 handoff documents, this readiness report and the reviewed C4 evidence in the appendix. First approve retention/access arrangements, preserve external archives and add durable manifest references where local trace/diagnostic links will no longer be in Git. Preserve failed-run records and the unresolved WebKit diagnostic; do not rewrite them into an unconditional pass. Update audited-artifact provenance for the resulting source commits where appropriate, without implying that the earlier HEAD alone was tested.

No migration/API/Admin redesign commit is warranted: none is pending. No standalone broad ignore/cleanup commit is authorized. If an owner approves a new narrow output policy, review its exceptions against audit/report dependencies first; existing audit-artifacts exclusions may already suffice.

### Validation before an approved future commit

Use explicit path/hunk review for each boundary, not git add . or a blanket docs add. Inspect the proposed staged patch/stat/name list and keep dependency pairs together. Validate each source boundary in a clean isolated checkout of that candidate snapshot, without disturbing this working tree. Relevant checks are the existing component/browser/ownership/auth regressions, TypeScript, lint, production build and frozen-lockfile consistency; database tests must use guarded local infrastructure. For evidence, verify retained references/hashes and privacy review rather than rerunning or replacing historical failures.

This audit **did not rerun** those checks. It inspected the retained Stage 15.6/15.7 validation reports and source dependencies. The prior Stage 15.7 evidence records 292 web tests, API unit/integration checks, 55 Chromium regressions, supplemental multi-engine audits, typecheck/lint/build and conditional UAT; source commit readiness does not turn that into production release approval.

## Deletion, unrelated-change and temporary-fixture findings

No tracked file deletion, rename, merge conflict, mode change or whitespace error was reported. The 423 deleted lines are diff-line removals, chiefly replacing verbose guest-tracking layout/timeline markup; they are not deleted files. The changed paths are confined to customer web presentation, associated test infrastructure, the axe development dependency and stage documentation/evidence. No pending API, schema, migration, session implementation or backend authorization edit was found.

No obvious stray root scratch scripts, private environment additions, database exports or untracked third-party build/cache trees were found. Archived failed runs, screenshots-only captures and DOM-only captures are purposeful audit outputs; old or duplicate does not mean unrelated or safe to discard. The seeded fixture product name/photo and synthetic order/customer fields are purposeful reproducible test inputs, not accidental production records.

## Remaining approval gates

- Approve the proposed C1?C4 boundaries, including how to attribute the mixed-stage presentation-test capture refinements.
- Confirm synthetic-data/publication review for the proposed screenshot, JSON, error-context and trace evidence.
- Decide the durable external location, access control, retention and manifest/report-link treatment for large and older audit evidence, including the currently ignored Firefox trace.
- Review the existing non-placeholder sample ADMIN_SEED_PASSWORD field without exposing its value; establish demo-only intent rather than assuming it is a live credential.
- Keep production UAT/release conditions separate from permission to commit source. No new feature, cleanup, commit or deployment starts from this audit.

**Status: audit complete; awaiting approval.** All original files remain in place. This report is the sole intended new file.

## Trace preservation manifest

Paths below are relative to docs/stage-15.7-evidence/. The initial Firefox trace is already ignored; the other five are untracked. Checksums describe original bytes and disclose no credential values.

| Trace path | Bytes | SHA-256 |
| --- | ---: | --- |
| webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | 42,212,436 | 6b1f4e970dc0190c561eb8ae5fdeceaad61b7a3a642f1a10e956d7a400da8c33 |
| webkit-no-axe-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | 15,152,159 | 391df45dae82445d1d56d3b38deeea5cefcbee249d7a84d7daed1010d1937d24 |
| webkit-rerun-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | 27,188,571 | 1627311354c1201d54ea993c34454622aedcb643b84d4f43569cad5d77e21c83 |
| webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/trace.zip | 5,284,637 | d15c09efb9fcf1c184a83541478fbac1b446cb35f638fdb11e2a0b82f6a48b69 |
| webkit-second-run-failures/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | 44,732,682 | b98301b8ac4b9b5109b90e21f2980faf1630f1ab9f0d26b51d0dd9da600e60fe |
| initial/test-results/final-acceptance-rendered--0ce94-tainment-across-four-widths-firefox/trace.zip | 133,817,622 | 64dbf8a3132f6cc8e7eafa13e497e210f280a8e19c5b9ac73d063e8057f6cf76 |

## Exhaustive input-file classification

C1/C2/C3/C4 are proposed commit candidates, with evidence subject to manual privacy review and archival-link decisions. Archive means preserve outside Git after approval; no move/deletion has occurred. The ignored initial-audit files and this newly created report are listed separately after the input inventory.

<details>
<summary>All 1,019 pending input paths</summary>

| Path | Status | Classification | Proposed disposition | Bytes |
| --- | --- | --- | --- | ---: |
| apps/web/package.json | modified | Dependency/configuration | C3 | 1,607 |
| apps/web/playwright.acceptance.config.ts | untracked | Tests and infrastructure | C3 | 606 |
| apps/web/src/app/(customer)/track-order/page.tsx | modified | Application source | C1 | 2,460 |
| apps/web/src/components/layout/app-header-shell.tsx | modified | Application source | C2 | 3,672 |
| apps/web/src/components/layout/mobile-navigation.tsx | modified | Application source | C2 | 6,376 |
| apps/web/src/components/layout/site-header.tsx | modified | Application source | C2 | 4,315 |
| apps/web/src/features/customer-auth/components/customer-auth-form.tsx | modified | Application source | C1 | 9,810 |
| apps/web/src/features/customer-orders/customer-order-detail-page.tsx | modified | Application source | C1 | 7,017 |
| apps/web/src/features/customer-orders/customer-order-status.tsx | modified | Application source | C1 | 465 |
| apps/web/src/features/customer-orders/customer-orders-loading.tsx | untracked | Application source | C1 | 824 |
| apps/web/src/features/customer-orders/customer-orders-page.tsx | modified | Application source | C1 | 8,681 |
| apps/web/src/features/order-tracking/components/lookup/order-lookup-form.tsx | modified | Application source | C1 | 6,809 |
| apps/web/src/features/order-tracking/components/result/order-status-timeline.tsx | modified | Application source | C1 | 3,374 |
| apps/web/src/features/order-tracking/components/result/order-tracking-details.tsx | modified | Application source | C1 | 2,472 |
| apps/web/src/features/order-tracking/components/result/order-tracking-error-state.tsx | modified | Application source | C1 | 2,023 |
| apps/web/src/features/order-tracking/components/result/order-tracking-header.tsx | modified | Application source | C1 | 2,809 |
| apps/web/src/features/order-tracking/components/result/order-tracking-loading-state.tsx | modified | Application source | C1 | 1,107 |
| apps/web/src/features/order-tracking/components/result/order-tracking-result.tsx | modified | Application source | C1 | 3,127 |
| apps/web/src/features/order-tracking/components/result/order-tracking-verification-state.tsx | modified | Application source | C1 | 1,429 |
| apps/web/src/features/order-tracking/components/result/tracking-order-summary.tsx | modified | Application source | C1 | 4,459 |
| apps/web/test/browser/critical-workflow.spec.ts | modified | Tests and infrastructure | C1 | 25,545 |
| apps/web/test/browser/final-acceptance.spec.ts | untracked | Tests and infrastructure | C3 | 22,544 |
| apps/web/test/browser/premium-auth-orders-tracking.spec.ts | untracked | Tests and infrastructure | C1 | 12,459 |
| apps/web/test/browser/premium-transactions.spec.ts | modified | Tests and infrastructure | C1 | 17,507 |
| apps/web/test/browser/scripts/run-playwright.mjs | modified | Tests and infrastructure | C1 | 2,447 |
| apps/web/test/browser/scripts/summarize-acceptance.mjs | untracked | Tests and infrastructure | C3 | 4,937 |
| apps/web/test/customer-auth-forms.test.tsx | modified | Tests and infrastructure | C1 | 7,844 |
| apps/web/test/mobile-navigation.test.tsx | modified | Tests and infrastructure | C2 | 10,718 |
| apps/web/test/premium-tracking-accessibility.test.tsx | untracked | Tests and infrastructure | C1 | 3,713 |
| docs/stage-15.6-premium-auth-orders-tracking-report.md | untracked | Documentation | C1 | 19,664 |
| docs/stage-15.6-visuals/after/login-1440.png | untracked | Screenshots | C1 | 45,775 |
| docs/stage-15.6-visuals/after/login-320.png | untracked | Screenshots | C1 | 35,511 |
| docs/stage-15.6-visuals/after/login-390.png | untracked | Screenshots | C1 | 35,694 |
| docs/stage-15.6-visuals/after/login-failure-320.png | untracked | Screenshots | C1 | 38,586 |
| docs/stage-15.6-visuals/after/login-invalid-1440.png | untracked | Screenshots | C1 | 51,165 |
| docs/stage-15.6-visuals/after/login-invalid-320.png | untracked | Screenshots | C1 | 40,359 |
| docs/stage-15.6-visuals/after/login-invalid-390.png | untracked | Screenshots | C1 | 40,452 |
| docs/stage-15.6-visuals/after/login-submitting-320.png | untracked | Screenshots | C1 | 36,848 |
| docs/stage-15.6-visuals/after/order-detail-1440.png | untracked | Screenshots | C1 | 64,892 |
| docs/stage-15.6-visuals/after/order-detail-320.png | untracked | Screenshots | C1 | 53,027 |
| docs/stage-15.6-visuals/after/order-detail-390.png | untracked | Screenshots | C1 | 53,402 |
| docs/stage-15.6-visuals/after/orders-1440.png | untracked | Screenshots | C1 | 63,995 |
| docs/stage-15.6-visuals/after/orders-320.png | untracked | Screenshots | C1 | 57,256 |
| docs/stage-15.6-visuals/after/orders-390.png | untracked | Screenshots | C1 | 55,335 |
| docs/stage-15.6-visuals/after/orders-empty-320.png | untracked | Screenshots | C1 | 55,371 |
| docs/stage-15.6-visuals/after/orders-error-320.png | untracked | Screenshots | C1 | 51,686 |
| docs/stage-15.6-visuals/after/orders-loading-320.png | untracked | Screenshots | C1 | 51,759 |
| docs/stage-15.6-visuals/after/register-1440.png | untracked | Screenshots | C1 | 53,515 |
| docs/stage-15.6-visuals/after/register-320.png | untracked | Screenshots | C1 | 41,590 |
| docs/stage-15.6-visuals/after/register-390.png | untracked | Screenshots | C1 | 41,958 |
| docs/stage-15.6-visuals/after/tracking-accepted-320.png | untracked | Screenshots | C1 | 75,492 |
| docs/stage-15.6-visuals/after/tracking-cancelled-320.png | untracked | Screenshots | C1 | 55,640 |
| docs/stage-15.6-visuals/after/tracking-completed-320.png | untracked | Screenshots | C1 | 69,289 |
| docs/stage-15.6-visuals/after/tracking-invalid-1440.png | untracked | Screenshots | C1 | 67,815 |
| docs/stage-15.6-visuals/after/tracking-invalid-320.png | untracked | Screenshots | C1 | 54,860 |
| docs/stage-15.6-visuals/after/tracking-invalid-390.png | untracked | Screenshots | C1 | 55,875 |
| docs/stage-15.6-visuals/after/tracking-loading-320.png | untracked | Screenshots | C1 | 22,205 |
| docs/stage-15.6-visuals/after/tracking-not-found-320.png | untracked | Screenshots | C1 | 25,812 |
| docs/stage-15.6-visuals/after/tracking-ready-320.png | untracked | Screenshots | C1 | 74,022 |
| docs/stage-15.6-visuals/after/tracking-refreshing-320.png | untracked | Screenshots | C1 | 74,496 |
| docs/stage-15.6-visuals/after/tracking-result-1440.png | untracked | Screenshots | C1 | 80,037 |
| docs/stage-15.6-visuals/after/tracking-result-320.png | untracked | Screenshots | C1 | 74,187 |
| docs/stage-15.6-visuals/after/tracking-result-390.png | untracked | Screenshots | C1 | 74,740 |
| docs/stage-15.6-visuals/after/tracking-search-1440.png | untracked | Screenshots | C1 | 62,005 |
| docs/stage-15.6-visuals/after/tracking-search-320.png | untracked | Screenshots | C1 | 51,370 |
| docs/stage-15.6-visuals/after/tracking-search-390.png | untracked | Screenshots | C1 | 51,301 |
| docs/stage-15.6-visuals/after/tracking-unavailable-320.png | untracked | Screenshots | C1 | 24,284 |
| docs/stage-15.6-visuals/after/tracking-verification-320.png | untracked | Screenshots | C1 | 24,742 |
| docs/stage-15.6-visuals/before/login-1440.png | untracked | Screenshots | C1 | 41,894 |
| docs/stage-15.6-visuals/before/login-320.png | untracked | Screenshots | C1 | 33,788 |
| docs/stage-15.6-visuals/before/login-390.png | untracked | Screenshots | C1 | 33,779 |
| docs/stage-15.6-visuals/before/login-failure-320.png | untracked | Screenshots | C1 | 36,778 |
| docs/stage-15.6-visuals/before/login-invalid-1440.png | untracked | Screenshots | C1 | 47,273 |
| docs/stage-15.6-visuals/before/login-invalid-320.png | untracked | Screenshots | C1 | 38,542 |
| docs/stage-15.6-visuals/before/login-invalid-390.png | untracked | Screenshots | C1 | 38,540 |
| docs/stage-15.6-visuals/before/order-detail-1440.png | untracked | Screenshots | C1 | 63,085 |
| docs/stage-15.6-visuals/before/order-detail-320.png | untracked | Screenshots | C1 | 51,255 |
| docs/stage-15.6-visuals/before/order-detail-390.png | untracked | Screenshots | C1 | 53,079 |
| docs/stage-15.6-visuals/before/orders-1440.png | untracked | Screenshots | C1 | 58,846 |
| docs/stage-15.6-visuals/before/orders-320.png | untracked | Screenshots | C1 | 51,863 |
| docs/stage-15.6-visuals/before/orders-390.png | untracked | Screenshots | C1 | 50,405 |
| docs/stage-15.6-visuals/before/orders-empty-320.png | untracked | Screenshots | C1 | 51,053 |
| docs/stage-15.6-visuals/before/orders-error-320.png | untracked | Screenshots | C1 | 48,055 |
| docs/stage-15.6-visuals/before/orders-loading-320.png | untracked | Screenshots | C1 | 42,894 |
| docs/stage-15.6-visuals/before/register-1440.png | untracked | Screenshots | C1 | 49,554 |
| docs/stage-15.6-visuals/before/register-320.png | untracked | Screenshots | C1 | 39,939 |
| docs/stage-15.6-visuals/before/register-390.png | untracked | Screenshots | C1 | 40,345 |
| docs/stage-15.6-visuals/before/tracking-invalid-1440.png | untracked | Screenshots | C1 | 83,565 |
| docs/stage-15.6-visuals/before/tracking-invalid-320.png | untracked | Screenshots | C1 | 72,081 |
| docs/stage-15.6-visuals/before/tracking-invalid-390.png | untracked | Screenshots | C1 | 72,765 |
| docs/stage-15.6-visuals/before/tracking-not-found-320.png | untracked | Screenshots | C1 | 26,894 |
| docs/stage-15.6-visuals/before/tracking-refreshing-320.png | untracked | Screenshots | C1 | 70,349 |
| docs/stage-15.6-visuals/before/tracking-result-1440.png | untracked | Screenshots | C1 | 74,623 |
| docs/stage-15.6-visuals/before/tracking-result-320.png | untracked | Screenshots | C1 | 70,105 |
| docs/stage-15.6-visuals/before/tracking-result-390.png | untracked | Screenshots | C1 | 70,831 |
| docs/stage-15.6-visuals/before/tracking-search-1440.png | untracked | Screenshots | C1 | 81,651 |
| docs/stage-15.6-visuals/before/tracking-search-320.png | untracked | Screenshots | C1 | 70,839 |
| docs/stage-15.6-visuals/before/tracking-search-390.png | untracked | Screenshots | C1 | 70,599 |
| docs/stage-15.6-visuals/before/tracking-unavailable-320.png | untracked | Screenshots | C1 | 25,085 |
| docs/stage-15.6-visuals/before/tracking-verification-320.png | untracked | Screenshots | C1 | 25,557 |
| docs/stage-15.7-evidence/api-integration.log | untracked | Generated evidence/reports/logs | C4 | 6,804 |
| docs/stage-15.7-evidence/api-lint.log | untracked | Generated evidence/reports/logs | C4 | 118 |
| docs/stage-15.7-evidence/api-unit.log | untracked | Generated evidence/reports/logs | C4 | 1,098 |
| docs/stage-15.7-evidence/browser-regression-before-fix.log | untracked | Generated evidence/reports/logs | C4 | 47,386 |
| docs/stage-15.7-evidence/browser-regression.log | untracked | Generated evidence/reports/logs | C4 | 47,386 |
| docs/stage-15.7-evidence/chromium-navigation-tab-diagnostic.json | untracked | Generated evidence/reports/logs | C4 | 1,864 |
| docs/stage-15.7-evidence/chromium-version.json | untracked | Generated evidence/reports/logs | C4 | 299 |
| docs/stage-15.7-evidence/chromium/account-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,106 |
| docs/stage-15.7-evidence/chromium/account-1440.png | untracked | Screenshots | C4 | 65,887 |
| docs/stage-15.7-evidence/chromium/account-320.json | untracked | Generated evidence/reports/logs | C4 | 2,098 |
| docs/stage-15.7-evidence/chromium/account-320.png | untracked | Screenshots | C4 | 52,480 |
| docs/stage-15.7-evidence/chromium/account-390.json | untracked | Generated evidence/reports/logs | C4 | 2,098 |
| docs/stage-15.7-evidence/chromium/account-390.png | untracked | Screenshots | C4 | 52,992 |
| docs/stage-15.7-evidence/chromium/account-768.json | untracked | Generated evidence/reports/logs | C4 | 2,105 |
| docs/stage-15.7-evidence/chromium/account-768.png | untracked | Screenshots | C4 | 60,470 |
| docs/stage-15.7-evidence/chromium/cart-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,797 |
| docs/stage-15.7-evidence/chromium/cart-1440.png | untracked | Screenshots | C4 | 152,798 |
| docs/stage-15.7-evidence/chromium/cart-320.json | untracked | Generated evidence/reports/logs | C4 | 2,054 |
| docs/stage-15.7-evidence/chromium/cart-320.png | untracked | Screenshots | C4 | 31,401 |
| docs/stage-15.7-evidence/chromium/cart-390.json | untracked | Generated evidence/reports/logs | C4 | 2,060 |
| docs/stage-15.7-evidence/chromium/cart-390.png | untracked | Screenshots | C4 | 32,734 |
| docs/stage-15.7-evidence/chromium/cart-768.json | untracked | Generated evidence/reports/logs | C4 | 1,795 |
| docs/stage-15.7-evidence/chromium/cart-768.png | untracked | Screenshots | C4 | 137,623 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,210 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-1440.png | untracked | Screenshots | C4 | 126,261 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-320.json | untracked | Generated evidence/reports/logs | C4 | 2,341 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-320.png | untracked | Screenshots | C4 | 110,928 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-390.json | untracked | Generated evidence/reports/logs | C4 | 2,341 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-390.png | untracked | Screenshots | C4 | 112,434 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-768.json | untracked | Generated evidence/reports/logs | C4 | 2,220 |
| docs/stage-15.7-evidence/chromium/checkout-delivery-768.png | untracked | Screenshots | C4 | 121,029 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,692 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-1440.png | untracked | Screenshots | C4 | 102,386 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-320.json | untracked | Generated evidence/reports/logs | C4 | 1,823 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-320.png | untracked | Screenshots | C4 | 88,076 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-390.json | untracked | Generated evidence/reports/logs | C4 | 1,823 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-390.png | untracked | Screenshots | C4 | 89,116 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-768.json | untracked | Generated evidence/reports/logs | C4 | 1,702 |
| docs/stage-15.7-evidence/chromium/checkout-pickup-768.png | untracked | Screenshots | C4 | 98,276 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-bottom-1440.png | untracked | Screenshots | C4 | 78,589 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-bottom-320.png | untracked | Screenshots | C4 | 20,884 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-bottom-390.png | untracked | Screenshots | C4 | 40,121 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-bottom-768.png | untracked | Screenshots | C4 | 50,618 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-top-1440.png | untracked | Screenshots | C4 | 83,149 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-top-320.png | untracked | Screenshots | C4 | 23,633 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-top-390.png | untracked | Screenshots | C4 | 39,298 |
| docs/stage-15.7-evidence/chromium/checkout-viewport-top-768.png | untracked | Screenshots | C4 | 51,238 |
| docs/stage-15.7-evidence/chromium/configurator-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,982 |
| docs/stage-15.7-evidence/chromium/configurator-1440.png | untracked | Screenshots | C4 | 422,967 |
| docs/stage-15.7-evidence/chromium/configurator-320.json | untracked | Generated evidence/reports/logs | C4 | 4,176 |
| docs/stage-15.7-evidence/chromium/configurator-320.png | untracked | Screenshots | C4 | 41,281 |
| docs/stage-15.7-evidence/chromium/configurator-390.json | untracked | Generated evidence/reports/logs | C4 | 4,182 |
| docs/stage-15.7-evidence/chromium/configurator-390.png | untracked | Screenshots | C4 | 67,973 |
| docs/stage-15.7-evidence/chromium/configurator-768.json | untracked | Generated evidence/reports/logs | C4 | 1,992 |
| docs/stage-15.7-evidence/chromium/configurator-768.png | untracked | Screenshots | C4 | 286,779 |
| docs/stage-15.7-evidence/chromium/confirmation-1440.json | untracked | Generated evidence/reports/logs | C4 | 680 |
| docs/stage-15.7-evidence/chromium/confirmation-1440.png | untracked | Screenshots | C4 | 44,807 |
| docs/stage-15.7-evidence/chromium/confirmation-320.json | untracked | Generated evidence/reports/logs | C4 | 800 |
| docs/stage-15.7-evidence/chromium/confirmation-320.png | untracked | Screenshots | C4 | 34,543 |
| docs/stage-15.7-evidence/chromium/confirmation-390.json | untracked | Generated evidence/reports/logs | C4 | 800 |
| docs/stage-15.7-evidence/chromium/confirmation-390.png | untracked | Screenshots | C4 | 34,356 |
| docs/stage-15.7-evidence/chromium/confirmation-768.json | untracked | Generated evidence/reports/logs | C4 | 679 |
| docs/stage-15.7-evidence/chromium/confirmation-768.png | untracked | Screenshots | C4 | 39,834 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-1440.json | untracked | Generated evidence/reports/logs | C4 | 628 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-1440.png | untracked | Screenshots | C4 | 41,049 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-320.json | untracked | Generated evidence/reports/logs | C4 | 748 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-320.png | untracked | Screenshots | C4 | 31,060 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-390.json | untracked | Generated evidence/reports/logs | C4 | 748 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-390.png | untracked | Screenshots | C4 | 30,991 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-768.json | untracked | Generated evidence/reports/logs | C4 | 627 |
| docs/stage-15.7-evidence/chromium/confirmation-missing-768.png | untracked | Screenshots | C4 | 37,798 |
| docs/stage-15.7-evidence/chromium/landscape-844.json | untracked | Generated evidence/reports/logs | C4 | 17,570 |
| docs/stage-15.7-evidence/chromium/landscape-844.png | untracked | Screenshots | C4 | 527,385 |
| docs/stage-15.7-evidence/chromium/login-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,173 |
| docs/stage-15.7-evidence/chromium/login-1440.png | untracked | Screenshots | C4 | 46,787 |
| docs/stage-15.7-evidence/chromium/login-320.json | untracked | Generated evidence/reports/logs | C4 | 1,293 |
| docs/stage-15.7-evidence/chromium/login-320.png | untracked | Screenshots | C4 | 35,819 |
| docs/stage-15.7-evidence/chromium/login-390.json | untracked | Generated evidence/reports/logs | C4 | 1,293 |
| docs/stage-15.7-evidence/chromium/login-390.png | untracked | Screenshots | C4 | 36,003 |
| docs/stage-15.7-evidence/chromium/login-768.json | untracked | Generated evidence/reports/logs | C4 | 1,172 |
| docs/stage-15.7-evidence/chromium/login-768.png | untracked | Screenshots | C4 | 41,724 |
| docs/stage-15.7-evidence/chromium/login-root-text-200-percent-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,173 |
| docs/stage-15.7-evidence/chromium/login-root-text-200-percent-1440.png | untracked | Screenshots | C4 | 107,520 |
| docs/stage-15.7-evidence/chromium/mobile-navigation-320.json | untracked | Generated evidence/reports/logs | C4 | 1,279 |
| docs/stage-15.7-evidence/chromium/mobile-navigation-320.png | untracked | Screenshots | C4 | 16,925 |
| docs/stage-15.7-evidence/chromium/mobile-navigation-390.json | untracked | Generated evidence/reports/logs | C4 | 1,285 |
| docs/stage-15.7-evidence/chromium/mobile-navigation-390.png | untracked | Screenshots | C4 | 22,167 |
| docs/stage-15.7-evidence/chromium/navigation-focus-after-390.png | untracked | Screenshots | C4 | 23,209 |
| docs/stage-15.7-evidence/chromium/order-detail-1440.json | untracked | Generated evidence/reports/logs | C4 | 771 |
| docs/stage-15.7-evidence/chromium/order-detail-1440.png | untracked | Screenshots | C4 | 65,441 |
| docs/stage-15.7-evidence/chromium/order-detail-320.json | untracked | Generated evidence/reports/logs | C4 | 763 |
| docs/stage-15.7-evidence/chromium/order-detail-320.png | untracked | Screenshots | C4 | 53,263 |
| docs/stage-15.7-evidence/chromium/order-detail-390.json | untracked | Generated evidence/reports/logs | C4 | 763 |
| docs/stage-15.7-evidence/chromium/order-detail-390.png | untracked | Screenshots | C4 | 53,637 |
| docs/stage-15.7-evidence/chromium/order-detail-768.json | untracked | Generated evidence/reports/logs | C4 | 770 |
| docs/stage-15.7-evidence/chromium/order-detail-768.png | untracked | Screenshots | C4 | 59,733 |
| docs/stage-15.7-evidence/chromium/orders-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,260 |
| docs/stage-15.7-evidence/chromium/orders-1440.png | untracked | Screenshots | C4 | 60,461 |
| docs/stage-15.7-evidence/chromium/orders-320.json | untracked | Generated evidence/reports/logs | C4 | 2,252 |
| docs/stage-15.7-evidence/chromium/orders-320.png | untracked | Screenshots | C4 | 54,122 |
| docs/stage-15.7-evidence/chromium/orders-390.json | untracked | Generated evidence/reports/logs | C4 | 2,252 |
| docs/stage-15.7-evidence/chromium/orders-390.png | untracked | Screenshots | C4 | 52,019 |
| docs/stage-15.7-evidence/chromium/orders-768.json | untracked | Generated evidence/reports/logs | C4 | 2,259 |
| docs/stage-15.7-evidence/chromium/orders-768.png | untracked | Screenshots | C4 | 55,956 |
| docs/stage-15.7-evidence/chromium/orders-empty-320.json | untracked | Generated evidence/reports/logs | C4 | 2,193 |
| docs/stage-15.7-evidence/chromium/orders-empty-320.png | untracked | Screenshots | C4 | 55,371 |
| docs/stage-15.7-evidence/chromium/orders-error-320.json | untracked | Generated evidence/reports/logs | C4 | 2,388 |
| docs/stage-15.7-evidence/chromium/orders-error-320.png | untracked | Screenshots | C4 | 51,686 |
| docs/stage-15.7-evidence/chromium/register-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,393 |
| docs/stage-15.7-evidence/chromium/register-1440.png | untracked | Screenshots | C4 | 54,541 |
| docs/stage-15.7-evidence/chromium/register-320.json | untracked | Generated evidence/reports/logs | C4 | 1,513 |
| docs/stage-15.7-evidence/chromium/register-320.png | untracked | Screenshots | C4 | 41,899 |
| docs/stage-15.7-evidence/chromium/register-390.json | untracked | Generated evidence/reports/logs | C4 | 1,513 |
| docs/stage-15.7-evidence/chromium/register-390.png | untracked | Screenshots | C4 | 42,266 |
| docs/stage-15.7-evidence/chromium/register-768.json | untracked | Generated evidence/reports/logs | C4 | 1,392 |
| docs/stage-15.7-evidence/chromium/register-768.png | untracked | Screenshots | C4 | 48,253 |
| docs/stage-15.7-evidence/chromium/security-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,027 |
| docs/stage-15.7-evidence/chromium/security-1440.png | untracked | Screenshots | C4 | 82,939 |
| docs/stage-15.7-evidence/chromium/security-320.json | untracked | Generated evidence/reports/logs | C4 | 2,019 |
| docs/stage-15.7-evidence/chromium/security-320.png | untracked | Screenshots | C4 | 66,757 |
| docs/stage-15.7-evidence/chromium/security-390.json | untracked | Generated evidence/reports/logs | C4 | 2,019 |
| docs/stage-15.7-evidence/chromium/security-390.png | untracked | Screenshots | C4 | 67,703 |
| docs/stage-15.7-evidence/chromium/security-768.json | untracked | Generated evidence/reports/logs | C4 | 2,026 |
| docs/stage-15.7-evidence/chromium/security-768.png | untracked | Screenshots | C4 | 75,927 |
| docs/stage-15.7-evidence/chromium/storefront-1440.json | untracked | Generated evidence/reports/logs | C4 | 17,574 |
| docs/stage-15.7-evidence/chromium/storefront-1440.png | untracked | Screenshots | C4 | 539,427 |
| docs/stage-15.7-evidence/chromium/storefront-320.json | untracked | Generated evidence/reports/logs | C4 | 17,711 |
| docs/stage-15.7-evidence/chromium/storefront-320.png | untracked | Screenshots | C4 | 260,596 |
| docs/stage-15.7-evidence/chromium/storefront-390.json | untracked | Generated evidence/reports/logs | C4 | 17,717 |
| docs/stage-15.7-evidence/chromium/storefront-390.png | untracked | Screenshots | C4 | 345,673 |
| docs/stage-15.7-evidence/chromium/storefront-768.json | untracked | Generated evidence/reports/logs | C4 | 17,572 |
| docs/stage-15.7-evidence/chromium/storefront-768.png | untracked | Screenshots | C4 | 449,343 |
| docs/stage-15.7-evidence/chromium/track-order-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,062 |
| docs/stage-15.7-evidence/chromium/track-order-1440.png | untracked | Screenshots | C4 | 62,877 |
| docs/stage-15.7-evidence/chromium/track-order-320.json | untracked | Generated evidence/reports/logs | C4 | 1,161 |
| docs/stage-15.7-evidence/chromium/track-order-320.png | untracked | Screenshots | C4 | 51,648 |
| docs/stage-15.7-evidence/chromium/track-order-390.json | untracked | Generated evidence/reports/logs | C4 | 1,161 |
| docs/stage-15.7-evidence/chromium/track-order-390.png | untracked | Screenshots | C4 | 51,606 |
| docs/stage-15.7-evidence/chromium/track-order-768.json | untracked | Generated evidence/reports/logs | C4 | 1,052 |
| docs/stage-15.7-evidence/chromium/track-order-768.png | untracked | Screenshots | C4 | 58,009 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-1440.json | untracked | Generated evidence/reports/logs | C4 | 968 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-1440.png | untracked | Screenshots | C4 | 68,668 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-320.json | untracked | Generated evidence/reports/logs | C4 | 1,067 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-320.png | untracked | Screenshots | C4 | 56,303 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-390.json | untracked | Generated evidence/reports/logs | C4 | 1,067 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-390.png | untracked | Screenshots | C4 | 56,171 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-768.json | untracked | Generated evidence/reports/logs | C4 | 958 |
| docs/stage-15.7-evidence/chromium/tracking-invalid-768.png | untracked | Screenshots | C4 | 62,942 |
| docs/stage-15.7-evidence/chromium/tracking-result-1440.json | untracked | Generated evidence/reports/logs | C4 | 754 |
| docs/stage-15.7-evidence/chromium/tracking-result-1440.png | untracked | Screenshots | C4 | 80,692 |
| docs/stage-15.7-evidence/chromium/tracking-result-320.json | untracked | Generated evidence/reports/logs | C4 | 874 |
| docs/stage-15.7-evidence/chromium/tracking-result-320.png | untracked | Screenshots | C4 | 74,333 |
| docs/stage-15.7-evidence/chromium/tracking-result-390.json | untracked | Generated evidence/reports/logs | C4 | 874 |
| docs/stage-15.7-evidence/chromium/tracking-result-390.png | untracked | Screenshots | C4 | 74,866 |
| docs/stage-15.7-evidence/chromium/tracking-result-768.json | untracked | Generated evidence/reports/logs | C4 | 753 |
| docs/stage-15.7-evidence/chromium/tracking-result-768.png | untracked | Screenshots | C4 | 77,389 |
| docs/stage-15.7-evidence/cross-browser-before-fix-results.json | untracked | Generated evidence/reports/logs | C4 | 14,806 |
| docs/stage-15.7-evidence/cross-browser-before-fix.log | untracked | Generated evidence/reports/logs | C4 | 9,080 |
| docs/stage-15.7-evidence/cross-browser-results.json | untracked | Generated evidence/reports/logs | C4 | 24,594 |
| docs/stage-15.7-evidence/cross-browser.log | untracked | Generated evidence/reports/logs | C4 | 15,648 |
| docs/stage-15.7-evidence/firefox-navigation-tab-diagnostic.json | untracked | Generated evidence/reports/logs | C4 | 1,864 |
| docs/stage-15.7-evidence/firefox-version.json | untracked | Generated evidence/reports/logs | C4 | 255 |
| docs/stage-15.7-evidence/firefox/account-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,146 |
| docs/stage-15.7-evidence/firefox/account-1440.png | untracked | Screenshots | C4 | 64,965 |
| docs/stage-15.7-evidence/firefox/account-320.json | untracked | Generated evidence/reports/logs | C4 | 2,122 |
| docs/stage-15.7-evidence/firefox/account-320.png | untracked | Screenshots | C4 | 48,645 |
| docs/stage-15.7-evidence/firefox/account-390.json | untracked | Generated evidence/reports/logs | C4 | 2,122 |
| docs/stage-15.7-evidence/firefox/account-390.png | untracked | Screenshots | C4 | 48,618 |
| docs/stage-15.7-evidence/firefox/account-768.json | untracked | Generated evidence/reports/logs | C4 | 2,145 |
| docs/stage-15.7-evidence/firefox/account-768.png | untracked | Screenshots | C4 | 56,265 |
| docs/stage-15.7-evidence/firefox/cart-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,824 |
| docs/stage-15.7-evidence/firefox/cart-1440.png | untracked | Screenshots | C4 | 209,680 |
| docs/stage-15.7-evidence/firefox/cart-320.json | untracked | Generated evidence/reports/logs | C4 | 3,750 |
| docs/stage-15.7-evidence/firefox/cart-320.png | untracked | Screenshots | C4 | 29,061 |
| docs/stage-15.7-evidence/firefox/cart-390.json | untracked | Generated evidence/reports/logs | C4 | 3,731 |
| docs/stage-15.7-evidence/firefox/cart-390.png | untracked | Screenshots | C4 | 31,207 |
| docs/stage-15.7-evidence/firefox/cart-768.json | untracked | Generated evidence/reports/logs | C4 | 1,822 |
| docs/stage-15.7-evidence/firefox/cart-768.png | untracked | Screenshots | C4 | 222,516 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,221 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-1440.png | untracked | Screenshots | C4 | 126,384 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-320.json | untracked | Generated evidence/reports/logs | C4 | 2,352 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-320.png | untracked | Screenshots | C4 | 98,857 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-390.json | untracked | Generated evidence/reports/logs | C4 | 2,352 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-390.png | untracked | Screenshots | C4 | 108,761 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-768.json | untracked | Generated evidence/reports/logs | C4 | 2,239 |
| docs/stage-15.7-evidence/firefox/checkout-delivery-768.png | untracked | Screenshots | C4 | 116,735 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,703 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-1440.png | untracked | Screenshots | C4 | 102,807 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-320.json | untracked | Generated evidence/reports/logs | C4 | 1,834 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-320.png | untracked | Screenshots | C4 | 77,173 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-390.json | untracked | Generated evidence/reports/logs | C4 | 1,834 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-390.png | untracked | Screenshots | C4 | 87,746 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-768.json | untracked | Generated evidence/reports/logs | C4 | 1,721 |
| docs/stage-15.7-evidence/firefox/checkout-pickup-768.png | untracked | Screenshots | C4 | 96,226 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-bottom-1440.png | untracked | Screenshots | C4 | 78,592 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-bottom-320.png | untracked | Screenshots | C4 | 19,761 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-bottom-390.png | untracked | Screenshots | C4 | 38,594 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-bottom-768.png | untracked | Screenshots | C4 | 49,532 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-top-1440.png | untracked | Screenshots | C4 | 84,219 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-top-320.png | untracked | Screenshots | C4 | 22,558 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-top-390.png | untracked | Screenshots | C4 | 38,534 |
| docs/stage-15.7-evidence/firefox/checkout-viewport-top-768.png | untracked | Screenshots | C4 | 49,162 |
| docs/stage-15.7-evidence/firefox/configurator-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,010 |
| docs/stage-15.7-evidence/firefox/configurator-1440.png | untracked | Screenshots | C4 | 511,008 |
| docs/stage-15.7-evidence/firefox/configurator-320.json | untracked | Generated evidence/reports/logs | C4 | 4,186 |
| docs/stage-15.7-evidence/firefox/configurator-320.png | untracked | Screenshots | C4 | 42,643 |
| docs/stage-15.7-evidence/firefox/configurator-390.json | untracked | Generated evidence/reports/logs | C4 | 4,201 |
| docs/stage-15.7-evidence/firefox/configurator-390.png | untracked | Screenshots | C4 | 77,065 |
| docs/stage-15.7-evidence/firefox/configurator-768.json | untracked | Generated evidence/reports/logs | C4 | 2,036 |
| docs/stage-15.7-evidence/firefox/configurator-768.png | untracked | Screenshots | C4 | 295,184 |
| docs/stage-15.7-evidence/firefox/confirmation-1440.json | untracked | Generated evidence/reports/logs | C4 | 682 |
| docs/stage-15.7-evidence/firefox/confirmation-1440.png | untracked | Screenshots | C4 | 44,914 |
| docs/stage-15.7-evidence/firefox/confirmation-320.json | untracked | Generated evidence/reports/logs | C4 | 794 |
| docs/stage-15.7-evidence/firefox/confirmation-320.png | untracked | Screenshots | C4 | 32,379 |
| docs/stage-15.7-evidence/firefox/confirmation-390.json | untracked | Generated evidence/reports/logs | C4 | 794 |
| docs/stage-15.7-evidence/firefox/confirmation-390.png | untracked | Screenshots | C4 | 32,221 |
| docs/stage-15.7-evidence/firefox/confirmation-768.json | untracked | Generated evidence/reports/logs | C4 | 681 |
| docs/stage-15.7-evidence/firefox/confirmation-768.png | untracked | Screenshots | C4 | 38,823 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-1440.json | untracked | Generated evidence/reports/logs | C4 | 630 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-1440.png | untracked | Screenshots | C4 | 41,433 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-320.json | untracked | Generated evidence/reports/logs | C4 | 742 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-320.png | untracked | Screenshots | C4 | 29,371 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-390.json | untracked | Generated evidence/reports/logs | C4 | 742 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-390.png | untracked | Screenshots | C4 | 29,372 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-768.json | untracked | Generated evidence/reports/logs | C4 | 629 |
| docs/stage-15.7-evidence/firefox/confirmation-missing-768.png | untracked | Screenshots | C4 | 35,551 |
| docs/stage-15.7-evidence/firefox/landscape-844.json | untracked | Generated evidence/reports/logs | C4 | 18,054 |
| docs/stage-15.7-evidence/firefox/landscape-844.png | untracked | Screenshots | C4 | 570,318 |
| docs/stage-15.7-evidence/firefox/login-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,175 |
| docs/stage-15.7-evidence/firefox/login-1440.png | untracked | Screenshots | C4 | 48,412 |
| docs/stage-15.7-evidence/firefox/login-320.json | untracked | Generated evidence/reports/logs | C4 | 1,287 |
| docs/stage-15.7-evidence/firefox/login-320.png | untracked | Screenshots | C4 | 35,594 |
| docs/stage-15.7-evidence/firefox/login-390.json | untracked | Generated evidence/reports/logs | C4 | 1,287 |
| docs/stage-15.7-evidence/firefox/login-390.png | untracked | Screenshots | C4 | 35,575 |
| docs/stage-15.7-evidence/firefox/login-768.json | untracked | Generated evidence/reports/logs | C4 | 1,174 |
| docs/stage-15.7-evidence/firefox/login-768.png | untracked | Screenshots | C4 | 43,439 |
| docs/stage-15.7-evidence/firefox/login-root-text-200-percent-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,175 |
| docs/stage-15.7-evidence/firefox/login-root-text-200-percent-1440.png | untracked | Screenshots | C4 | 100,800 |
| docs/stage-15.7-evidence/firefox/mobile-navigation-320.json | untracked | Generated evidence/reports/logs | C4 | 1,289 |
| docs/stage-15.7-evidence/firefox/mobile-navigation-320.png | untracked | Screenshots | C4 | 15,656 |
| docs/stage-15.7-evidence/firefox/mobile-navigation-390.json | untracked | Generated evidence/reports/logs | C4 | 1,304 |
| docs/stage-15.7-evidence/firefox/mobile-navigation-390.png | untracked | Screenshots | C4 | 22,777 |
| docs/stage-15.7-evidence/firefox/navigation-focus-after-390.png | untracked | Screenshots | C4 | 23,945 |
| docs/stage-15.7-evidence/firefox/order-detail-1440.json | untracked | Generated evidence/reports/logs | C4 | 781 |
| docs/stage-15.7-evidence/firefox/order-detail-1440.png | untracked | Screenshots | C4 | 63,839 |
| docs/stage-15.7-evidence/firefox/order-detail-320.json | untracked | Generated evidence/reports/logs | C4 | 757 |
| docs/stage-15.7-evidence/firefox/order-detail-320.png | untracked | Screenshots | C4 | 47,733 |
| docs/stage-15.7-evidence/firefox/order-detail-390.json | untracked | Generated evidence/reports/logs | C4 | 757 |
| docs/stage-15.7-evidence/firefox/order-detail-390.png | untracked | Screenshots | C4 | 47,613 |
| docs/stage-15.7-evidence/firefox/order-detail-768.json | untracked | Generated evidence/reports/logs | C4 | 780 |
| docs/stage-15.7-evidence/firefox/order-detail-768.png | untracked | Screenshots | C4 | 55,374 |
| docs/stage-15.7-evidence/firefox/orders-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,270 |
| docs/stage-15.7-evidence/firefox/orders-1440.png | untracked | Screenshots | C4 | 58,008 |
| docs/stage-15.7-evidence/firefox/orders-320.json | untracked | Generated evidence/reports/logs | C4 | 2,246 |
| docs/stage-15.7-evidence/firefox/orders-320.png | untracked | Screenshots | C4 | 50,585 |
| docs/stage-15.7-evidence/firefox/orders-390.json | untracked | Generated evidence/reports/logs | C4 | 2,246 |
| docs/stage-15.7-evidence/firefox/orders-390.png | untracked | Screenshots | C4 | 48,291 |
| docs/stage-15.7-evidence/firefox/orders-768.json | untracked | Generated evidence/reports/logs | C4 | 2,269 |
| docs/stage-15.7-evidence/firefox/orders-768.png | untracked | Screenshots | C4 | 51,447 |
| docs/stage-15.7-evidence/firefox/orders-empty-320.json | untracked | Generated evidence/reports/logs | C4 | 2,187 |
| docs/stage-15.7-evidence/firefox/orders-empty-320.png | untracked | Screenshots | C4 | 51,741 |
| docs/stage-15.7-evidence/firefox/orders-error-320.json | untracked | Generated evidence/reports/logs | C4 | 2,390 |
| docs/stage-15.7-evidence/firefox/orders-error-320.png | untracked | Screenshots | C4 | 48,102 |
| docs/stage-15.7-evidence/firefox/register-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,395 |
| docs/stage-15.7-evidence/firefox/register-1440.png | untracked | Screenshots | C4 | 57,183 |
| docs/stage-15.7-evidence/firefox/register-320.json | untracked | Generated evidence/reports/logs | C4 | 1,507 |
| docs/stage-15.7-evidence/firefox/register-320.png | untracked | Screenshots | C4 | 41,965 |
| docs/stage-15.7-evidence/firefox/register-390.json | untracked | Generated evidence/reports/logs | C4 | 1,507 |
| docs/stage-15.7-evidence/firefox/register-390.png | untracked | Screenshots | C4 | 42,017 |
| docs/stage-15.7-evidence/firefox/register-768.json | untracked | Generated evidence/reports/logs | C4 | 1,394 |
| docs/stage-15.7-evidence/firefox/register-768.png | untracked | Screenshots | C4 | 51,210 |
| docs/stage-15.7-evidence/firefox/security-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,067 |
| docs/stage-15.7-evidence/firefox/security-1440.png | untracked | Screenshots | C4 | 83,326 |
| docs/stage-15.7-evidence/firefox/security-320.json | untracked | Generated evidence/reports/logs | C4 | 2,043 |
| docs/stage-15.7-evidence/firefox/security-320.png | untracked | Screenshots | C4 | 62,649 |
| docs/stage-15.7-evidence/firefox/security-390.json | untracked | Generated evidence/reports/logs | C4 | 2,043 |
| docs/stage-15.7-evidence/firefox/security-390.png | untracked | Screenshots | C4 | 62,938 |
| docs/stage-15.7-evidence/firefox/security-768.json | untracked | Generated evidence/reports/logs | C4 | 2,066 |
| docs/stage-15.7-evidence/firefox/security-768.png | untracked | Screenshots | C4 | 71,822 |
| docs/stage-15.7-evidence/firefox/storefront-1440.json | untracked | Generated evidence/reports/logs | C4 | 18,058 |
| docs/stage-15.7-evidence/firefox/storefront-1440.png | untracked | Screenshots | C4 | 589,763 |
| docs/stage-15.7-evidence/firefox/storefront-320.json | untracked | Generated evidence/reports/logs | C4 | 18,177 |
| docs/stage-15.7-evidence/firefox/storefront-320.png | untracked | Screenshots | C4 | 271,089 |
| docs/stage-15.7-evidence/firefox/storefront-390.json | untracked | Generated evidence/reports/logs | C4 | 18,192 |
| docs/stage-15.7-evidence/firefox/storefront-390.png | untracked | Screenshots | C4 | 384,337 |
| docs/stage-15.7-evidence/firefox/storefront-768.json | untracked | Generated evidence/reports/logs | C4 | 18,056 |
| docs/stage-15.7-evidence/firefox/storefront-768.png | untracked | Screenshots | C4 | 505,200 |
| docs/stage-15.7-evidence/firefox/track-order-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,088 |
| docs/stage-15.7-evidence/firefox/track-order-1440.png | untracked | Screenshots | C4 | 58,959 |
| docs/stage-15.7-evidence/firefox/track-order-320.json | untracked | Generated evidence/reports/logs | C4 | 1,155 |
| docs/stage-15.7-evidence/firefox/track-order-320.png | untracked | Screenshots | C4 | 46,975 |
| docs/stage-15.7-evidence/firefox/track-order-390.json | untracked | Generated evidence/reports/logs | C4 | 1,155 |
| docs/stage-15.7-evidence/firefox/track-order-390.png | untracked | Screenshots | C4 | 47,083 |
| docs/stage-15.7-evidence/firefox/track-order-768.json | untracked | Generated evidence/reports/logs | C4 | 1,084 |
| docs/stage-15.7-evidence/firefox/track-order-768.png | untracked | Screenshots | C4 | 52,429 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-1440.json | untracked | Generated evidence/reports/logs | C4 | 999 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-1440.png | untracked | Screenshots | C4 | 61,979 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-320.json | untracked | Generated evidence/reports/logs | C4 | 1,066 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-320.png | untracked | Screenshots | C4 | 49,458 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-390.json | untracked | Generated evidence/reports/logs | C4 | 1,066 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-390.png | untracked | Screenshots | C4 | 49,720 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-768.json | untracked | Generated evidence/reports/logs | C4 | 995 |
| docs/stage-15.7-evidence/firefox/tracking-invalid-768.png | untracked | Screenshots | C4 | 55,217 |
| docs/stage-15.7-evidence/firefox/tracking-result-1440.json | untracked | Generated evidence/reports/logs | C4 | 764 |
| docs/stage-15.7-evidence/firefox/tracking-result-1440.png | untracked | Screenshots | C4 | 81,112 |
| docs/stage-15.7-evidence/firefox/tracking-result-320.json | untracked | Generated evidence/reports/logs | C4 | 876 |
| docs/stage-15.7-evidence/firefox/tracking-result-320.png | untracked | Screenshots | C4 | 69,523 |
| docs/stage-15.7-evidence/firefox/tracking-result-390.json | untracked | Generated evidence/reports/logs | C4 | 876 |
| docs/stage-15.7-evidence/firefox/tracking-result-390.png | untracked | Screenshots | C4 | 69,963 |
| docs/stage-15.7-evidence/firefox/tracking-result-768.json | untracked | Generated evidence/reports/logs | C4 | 763 |
| docs/stage-15.7-evidence/firefox/tracking-result-768.png | untracked | Screenshots | C4 | 71,878 |
| docs/stage-15.7-evidence/initial/chromium/cart-1440.json | untracked | Generated evidence/reports/logs | Archive | 224 |
| docs/stage-15.7-evidence/initial/chromium/cart-1440.png | untracked | Screenshots | Archive | 491,558 |
| docs/stage-15.7-evidence/initial/chromium/configurator-1440.json | untracked | Generated evidence/reports/logs | Archive | 224 |
| docs/stage-15.7-evidence/initial/chromium/configurator-1440.png | untracked | Screenshots | Archive | 459,489 |
| docs/stage-15.7-evidence/initial/chromium/storefront-1440.json | untracked | Generated evidence/reports/logs | Archive | 16,691 |
| docs/stage-15.7-evidence/initial/chromium/storefront-1440.png | untracked | Screenshots | Archive | 539,427 |
| docs/stage-15.7-evidence/initial/cross-browser-results.json | untracked | Generated evidence/reports/logs | C4 | 16,752 |
| docs/stage-15.7-evidence/initial/cross-browser.log | untracked | Generated evidence/reports/logs | C4 | 12,434 |
| docs/stage-15.7-evidence/initial/firefox/account-1440.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/account-1440.png | untracked | Screenshots | Archive | 64,962 |
| docs/stage-15.7-evidence/initial/firefox/account-320.json | untracked | Generated evidence/reports/logs | Archive | 229 |
| docs/stage-15.7-evidence/initial/firefox/account-320.png | untracked | Screenshots | Archive | 48,645 |
| docs/stage-15.7-evidence/initial/firefox/account-390.json | untracked | Generated evidence/reports/logs | Archive | 229 |
| docs/stage-15.7-evidence/initial/firefox/account-390.png | untracked | Screenshots | Archive | 48,618 |
| docs/stage-15.7-evidence/initial/firefox/account-768.json | untracked | Generated evidence/reports/logs | Archive | 229 |
| docs/stage-15.7-evidence/initial/firefox/account-768.png | untracked | Screenshots | Archive | 56,265 |
| docs/stage-15.7-evidence/initial/firefox/cart-1440.json | untracked | Generated evidence/reports/logs | Archive | 223 |
| docs/stage-15.7-evidence/initial/firefox/cart-1440.png | untracked | Screenshots | Archive | 520,966 |
| docs/stage-15.7-evidence/initial/firefox/cart-320.json | untracked | Generated evidence/reports/logs | Archive | 1,908 |
| docs/stage-15.7-evidence/initial/firefox/cart-320.png | untracked | Screenshots | Archive | 163,097 |
| docs/stage-15.7-evidence/initial/firefox/cart-390.json | untracked | Generated evidence/reports/logs | Archive | 222 |
| docs/stage-15.7-evidence/initial/firefox/cart-390.png | untracked | Screenshots | Archive | 193,856 |
| docs/stage-15.7-evidence/initial/firefox/cart-768.json | untracked | Generated evidence/reports/logs | Archive | 222 |
| docs/stage-15.7-evidence/initial/firefox/cart-768.png | untracked | Screenshots | Archive | 479,549 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-1440.json | untracked | Generated evidence/reports/logs | Archive | 231 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-1440.png | untracked | Screenshots | Archive | 126,384 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-320.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-320.png | untracked | Screenshots | Archive | 100,068 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-390.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-390.png | untracked | Screenshots | Archive | 108,761 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-768.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/checkout-delivery-768.png | untracked | Screenshots | Archive | 116,735 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-1440.json | untracked | Generated evidence/reports/logs | Archive | 231 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-1440.png | untracked | Screenshots | Archive | 102,807 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-320.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-320.png | untracked | Screenshots | Archive | 77,173 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-390.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-390.png | untracked | Screenshots | Archive | 87,746 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-768.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/checkout-pickup-768.png | untracked | Screenshots | Archive | 96,226 |
| docs/stage-15.7-evidence/initial/firefox/configurator-1440.json | untracked | Generated evidence/reports/logs | Archive | 223 |
| docs/stage-15.7-evidence/initial/firefox/configurator-1440.png | untracked | Screenshots | Archive | 872,108 |
| docs/stage-15.7-evidence/initial/firefox/configurator-320.json | untracked | Generated evidence/reports/logs | Archive | 2,279 |
| docs/stage-15.7-evidence/initial/firefox/configurator-320.png | untracked | Screenshots | Archive | 175,895 |
| docs/stage-15.7-evidence/initial/firefox/configurator-390.json | untracked | Generated evidence/reports/logs | Archive | 2,279 |
| docs/stage-15.7-evidence/initial/firefox/configurator-390.png | untracked | Screenshots | Archive | 238,998 |
| docs/stage-15.7-evidence/initial/firefox/configurator-768.json | untracked | Generated evidence/reports/logs | Archive | 222 |
| docs/stage-15.7-evidence/initial/firefox/configurator-768.png | untracked | Screenshots | Archive | 551,242 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-1440.json | untracked | Generated evidence/reports/logs | Archive | 288 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-1440.png | untracked | Screenshots | Archive | 44,936 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-320.json | untracked | Generated evidence/reports/logs | Archive | 287 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-320.png | untracked | Screenshots | Archive | 32,379 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-390.json | untracked | Generated evidence/reports/logs | Archive | 287 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-390.png | untracked | Screenshots | Archive | 32,221 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-768.json | untracked | Generated evidence/reports/logs | Archive | 287 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-768.png | untracked | Screenshots | Archive | 38,823 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-1440.json | untracked | Generated evidence/reports/logs | Archive | 236 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-1440.png | untracked | Screenshots | Archive | 41,433 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-320.json | untracked | Generated evidence/reports/logs | Archive | 235 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-320.png | untracked | Screenshots | Archive | 29,371 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-390.json | untracked | Generated evidence/reports/logs | Archive | 235 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-390.png | untracked | Screenshots | Archive | 29,372 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-768.json | untracked | Generated evidence/reports/logs | Archive | 235 |
| docs/stage-15.7-evidence/initial/firefox/confirmation-missing-768.png | untracked | Screenshots | Archive | 35,551 |
| docs/stage-15.7-evidence/initial/firefox/login-1440.json | untracked | Generated evidence/reports/logs | Archive | 228 |
| docs/stage-15.7-evidence/initial/firefox/login-1440.png | untracked | Screenshots | Archive | 48,412 |
| docs/stage-15.7-evidence/initial/firefox/login-320.json | untracked | Generated evidence/reports/logs | Archive | 227 |
| docs/stage-15.7-evidence/initial/firefox/login-320.png | untracked | Screenshots | Archive | 35,594 |
| docs/stage-15.7-evidence/initial/firefox/login-390.json | untracked | Generated evidence/reports/logs | Archive | 227 |
| docs/stage-15.7-evidence/initial/firefox/login-390.png | untracked | Screenshots | Archive | 35,575 |
| docs/stage-15.7-evidence/initial/firefox/login-768.json | untracked | Generated evidence/reports/logs | Archive | 227 |
| docs/stage-15.7-evidence/initial/firefox/login-768.png | untracked | Screenshots | Archive | 43,439 |
| docs/stage-15.7-evidence/initial/firefox/login-root-text-200-percent-320.json | untracked | Generated evidence/reports/logs | C4 | 229 |
| docs/stage-15.7-evidence/initial/firefox/login-root-text-200-percent-320.png | untracked | Screenshots | C4 | 85,428 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-1440.json | untracked | Generated evidence/reports/logs | Archive | 249 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-1440.png | untracked | Screenshots | Archive | 63,839 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-320.json | untracked | Generated evidence/reports/logs | Archive | 248 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-320.png | untracked | Screenshots | Archive | 47,733 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-390.json | untracked | Generated evidence/reports/logs | Archive | 248 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-390.png | untracked | Screenshots | Archive | 47,613 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-768.json | untracked | Generated evidence/reports/logs | Archive | 248 |
| docs/stage-15.7-evidence/initial/firefox/order-detail-768.png | untracked | Screenshots | Archive | 55,374 |
| docs/stage-15.7-evidence/initial/firefox/orders-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,630 |
| docs/stage-15.7-evidence/initial/firefox/orders-1440.png | untracked | Screenshots | Archive | 58,008 |
| docs/stage-15.7-evidence/initial/firefox/orders-320.json | untracked | Generated evidence/reports/logs | Archive | 1,629 |
| docs/stage-15.7-evidence/initial/firefox/orders-320.png | untracked | Screenshots | Archive | 50,585 |
| docs/stage-15.7-evidence/initial/firefox/orders-390.json | untracked | Generated evidence/reports/logs | Archive | 1,629 |
| docs/stage-15.7-evidence/initial/firefox/orders-390.png | untracked | Screenshots | Archive | 48,291 |
| docs/stage-15.7-evidence/initial/firefox/orders-768.json | untracked | Generated evidence/reports/logs | Archive | 1,629 |
| docs/stage-15.7-evidence/initial/firefox/orders-768.png | untracked | Screenshots | Archive | 51,447 |
| docs/stage-15.7-evidence/initial/firefox/orders-empty-320.json | untracked | Generated evidence/reports/logs | Archive | 1,569 |
| docs/stage-15.7-evidence/initial/firefox/orders-empty-320.png | untracked | Screenshots | Archive | 51,741 |
| docs/stage-15.7-evidence/initial/firefox/orders-error-320.json | untracked | Generated evidence/reports/logs | Archive | 1,569 |
| docs/stage-15.7-evidence/initial/firefox/orders-error-320.png | untracked | Screenshots | Archive | 48,102 |
| docs/stage-15.7-evidence/initial/firefox/register-1440.json | untracked | Generated evidence/reports/logs | Archive | 231 |
| docs/stage-15.7-evidence/initial/firefox/register-1440.png | untracked | Screenshots | Archive | 57,184 |
| docs/stage-15.7-evidence/initial/firefox/register-320.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/register-320.png | untracked | Screenshots | Archive | 41,965 |
| docs/stage-15.7-evidence/initial/firefox/register-390.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/register-390.png | untracked | Screenshots | Archive | 42,017 |
| docs/stage-15.7-evidence/initial/firefox/register-768.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/register-768.png | untracked | Screenshots | Archive | 51,210 |
| docs/stage-15.7-evidence/initial/firefox/security-1440.json | untracked | Generated evidence/reports/logs | Archive | 230 |
| docs/stage-15.7-evidence/initial/firefox/security-1440.png | untracked | Screenshots | Archive | 82,693 |
| docs/stage-15.7-evidence/initial/firefox/security-320.json | untracked | Generated evidence/reports/logs | Archive | 229 |
| docs/stage-15.7-evidence/initial/firefox/security-320.png | untracked | Screenshots | Archive | 62,755 |
| docs/stage-15.7-evidence/initial/firefox/security-390.json | untracked | Generated evidence/reports/logs | Archive | 229 |
| docs/stage-15.7-evidence/initial/firefox/security-390.png | untracked | Screenshots | Archive | 62,575 |
| docs/stage-15.7-evidence/initial/firefox/security-768.json | untracked | Generated evidence/reports/logs | Archive | 229 |
| docs/stage-15.7-evidence/initial/firefox/security-768.png | untracked | Screenshots | Archive | 71,888 |
| docs/stage-15.7-evidence/initial/firefox/storefront-1440.json | untracked | Generated evidence/reports/logs | Archive | 17,146 |
| docs/stage-15.7-evidence/initial/firefox/storefront-1440.png | untracked | Screenshots | Archive | 589,763 |
| docs/stage-15.7-evidence/initial/firefox/storefront-320.json | untracked | Generated evidence/reports/logs | Archive | 17,145 |
| docs/stage-15.7-evidence/initial/firefox/storefront-320.png | untracked | Screenshots | Archive | 271,089 |
| docs/stage-15.7-evidence/initial/firefox/storefront-390.json | untracked | Generated evidence/reports/logs | Archive | 17,145 |
| docs/stage-15.7-evidence/initial/firefox/storefront-390.png | untracked | Screenshots | Archive | 384,337 |
| docs/stage-15.7-evidence/initial/firefox/storefront-768.json | untracked | Generated evidence/reports/logs | Archive | 17,145 |
| docs/stage-15.7-evidence/initial/firefox/storefront-768.png | untracked | Screenshots | Archive | 505,200 |
| docs/stage-15.7-evidence/initial/firefox/track-order-1440.json | untracked | Generated evidence/reports/logs | Archive | 234 |
| docs/stage-15.7-evidence/initial/firefox/track-order-1440.png | untracked | Screenshots | Archive | 58,959 |
| docs/stage-15.7-evidence/initial/firefox/track-order-320.json | untracked | Generated evidence/reports/logs | Archive | 233 |
| docs/stage-15.7-evidence/initial/firefox/track-order-320.png | untracked | Screenshots | Archive | 46,975 |
| docs/stage-15.7-evidence/initial/firefox/track-order-390.json | untracked | Generated evidence/reports/logs | Archive | 233 |
| docs/stage-15.7-evidence/initial/firefox/track-order-390.png | untracked | Screenshots | Archive | 47,083 |
| docs/stage-15.7-evidence/initial/firefox/track-order-768.json | untracked | Generated evidence/reports/logs | Archive | 233 |
| docs/stage-15.7-evidence/initial/firefox/track-order-768.png | untracked | Screenshots | Archive | 52,429 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-1440.json | untracked | Generated evidence/reports/logs | Archive | 234 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-1440.png | untracked | Screenshots | Archive | 61,985 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-320.json | untracked | Generated evidence/reports/logs | Archive | 233 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-320.png | untracked | Screenshots | Archive | 49,440 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-390.json | untracked | Generated evidence/reports/logs | Archive | 233 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-390.png | untracked | Screenshots | Archive | 49,720 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-768.json | untracked | Generated evidence/reports/logs | Archive | 233 |
| docs/stage-15.7-evidence/initial/firefox/tracking-invalid-768.png | untracked | Screenshots | Archive | 55,217 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-1440.json | untracked | Generated evidence/reports/logs | Archive | 241 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-1440.png | untracked | Screenshots | Archive | 81,107 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-320.json | untracked | Generated evidence/reports/logs | Archive | 240 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-320.png | untracked | Screenshots | Archive | 69,523 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-390.json | untracked | Generated evidence/reports/logs | Archive | 240 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-390.png | untracked | Screenshots | Archive | 69,963 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-768.json | untracked | Generated evidence/reports/logs | Archive | 240 |
| docs/stage-15.7-evidence/initial/firefox/tracking-result-768.png | untracked | Screenshots | Archive | 71,874 |
| docs/stage-15.7-evidence/initial/performance.json | untracked | Generated evidence/reports/logs | Archive | 261,254 |
| docs/stage-15.7-evidence/initial/screenshots.html | untracked | Generated evidence/reports/logs | Archive | 14,223 |
| docs/stage-15.7-evidence/initial/summary.json | untracked | Generated evidence/reports/logs | Archive | 10,939 |
| docs/stage-15.7-evidence/initial/webkit/cart-1440.json | untracked | Generated evidence/reports/logs | Archive | 222 |
| docs/stage-15.7-evidence/initial/webkit/cart-1440.png | untracked | Screenshots | Archive | 1,128,120 |
| docs/stage-15.7-evidence/initial/webkit/configurator-1440.json | untracked | Generated evidence/reports/logs | Archive | 222 |
| docs/stage-15.7-evidence/initial/webkit/configurator-1440.png | untracked | Screenshots | Archive | 1,700,920 |
| docs/stage-15.7-evidence/initial/webkit/storefront-1440.json | untracked | Generated evidence/reports/logs | Archive | 16,689 |
| docs/stage-15.7-evidence/initial/webkit/storefront-1440.png | untracked | Screenshots | Archive | 1,774,079 |
| docs/stage-15.7-evidence/lint-final.log | untracked | Generated evidence/reports/logs | C4 | 364 |
| docs/stage-15.7-evidence/lockfile-validation.log | untracked | Generated evidence/reports/logs | C4 | 138 |
| docs/stage-15.7-evidence/navigation-before-fix/chromium-navigation-tab-diagnostic.json | untracked | Generated evidence/reports/logs | C4 | 1,858 |
| docs/stage-15.7-evidence/navigation-before-fix/firefox-navigation-tab-diagnostic.json | untracked | Generated evidence/reports/logs | C4 | 1,858 |
| docs/stage-15.7-evidence/navigation-before-fix/webkit-navigation-tab-diagnostic.json | untracked | Generated evidence/reports/logs | C4 | 2,522 |
| docs/stage-15.7-evidence/navigation-component-fix.log | untracked | Generated evidence/reports/logs | C4 | 1,320 |
| docs/stage-15.7-evidence/navigation-diagnostic-results.json | untracked | Generated evidence/reports/logs | C4 | 5,986 |
| docs/stage-15.7-evidence/navigation-diagnostic.log | untracked | Generated evidence/reports/logs | C4 | 3,662 |
| docs/stage-15.7-evidence/performance-before-fix.json | untracked | Generated evidence/reports/logs | C4 | 502,825 |
| docs/stage-15.7-evidence/performance.json | untracked | Generated evidence/reports/logs | C4 | 495,505 |
| docs/stage-15.7-evidence/screenshots.html | untracked | Generated evidence/reports/logs | C4 | 56,151 |
| docs/stage-15.7-evidence/state-captures-before-normalization.log | untracked | Generated evidence/reports/logs | C4 | 3,038 |
| docs/stage-15.7-evidence/state-captures.log | untracked | Generated evidence/reports/logs | C4 | 3,038 |
| docs/stage-15.7-evidence/states/login-1440.png | untracked | Screenshots | C4 | 45,775 |
| docs/stage-15.7-evidence/states/login-320.png | untracked | Screenshots | C4 | 35,511 |
| docs/stage-15.7-evidence/states/login-390.png | untracked | Screenshots | C4 | 35,694 |
| docs/stage-15.7-evidence/states/login-768.png | untracked | Screenshots | C4 | 40,798 |
| docs/stage-15.7-evidence/states/login-failure-320.png | untracked | Screenshots | C4 | 38,586 |
| docs/stage-15.7-evidence/states/login-failure-viewport-320.png | untracked | Screenshots | C4 | 19,510 |
| docs/stage-15.7-evidence/states/login-invalid-1440.png | untracked | Screenshots | C4 | 51,165 |
| docs/stage-15.7-evidence/states/login-invalid-320.png | untracked | Screenshots | C4 | 40,358 |
| docs/stage-15.7-evidence/states/login-invalid-390.png | untracked | Screenshots | C4 | 40,452 |
| docs/stage-15.7-evidence/states/login-invalid-768.png | untracked | Screenshots | C4 | 45,760 |
| docs/stage-15.7-evidence/states/login-invalid-viewport-320.png | untracked | Screenshots | C4 | 21,492 |
| docs/stage-15.7-evidence/states/login-submitting-320.png | untracked | Screenshots | C4 | 36,848 |
| docs/stage-15.7-evidence/states/order-detail-1440.png | untracked | Screenshots | C4 | 64,892 |
| docs/stage-15.7-evidence/states/order-detail-320.png | untracked | Screenshots | C4 | 53,027 |
| docs/stage-15.7-evidence/states/order-detail-390.png | untracked | Screenshots | C4 | 53,402 |
| docs/stage-15.7-evidence/states/order-detail-768.png | untracked | Screenshots | C4 | 59,092 |
| docs/stage-15.7-evidence/states/orders-1440.png | untracked | Screenshots | C4 | 63,995 |
| docs/stage-15.7-evidence/states/orders-320.png | untracked | Screenshots | C4 | 57,256 |
| docs/stage-15.7-evidence/states/orders-390.png | untracked | Screenshots | C4 | 55,335 |
| docs/stage-15.7-evidence/states/orders-768.png | untracked | Screenshots | C4 | 59,040 |
| docs/stage-15.7-evidence/states/orders-empty-320.png | untracked | Screenshots | C4 | 55,371 |
| docs/stage-15.7-evidence/states/orders-error-320.png | untracked | Screenshots | C4 | 51,686 |
| docs/stage-15.7-evidence/states/orders-loading-320.png | untracked | Screenshots | C4 | 51,759 |
| docs/stage-15.7-evidence/states/register-1440.png | untracked | Screenshots | C4 | 53,515 |
| docs/stage-15.7-evidence/states/register-320.png | untracked | Screenshots | C4 | 41,590 |
| docs/stage-15.7-evidence/states/register-390.png | untracked | Screenshots | C4 | 41,958 |
| docs/stage-15.7-evidence/states/register-768.png | untracked | Screenshots | C4 | 47,308 |
| docs/stage-15.7-evidence/states/tracking-accepted-320.png | untracked | Screenshots | C4 | 75,492 |
| docs/stage-15.7-evidence/states/tracking-cancelled-320.png | untracked | Screenshots | C4 | 55,640 |
| docs/stage-15.7-evidence/states/tracking-completed-320.png | untracked | Screenshots | C4 | 69,289 |
| docs/stage-15.7-evidence/states/tracking-invalid-1440.png | untracked | Screenshots | C4 | 67,812 |
| docs/stage-15.7-evidence/states/tracking-invalid-320.png | untracked | Screenshots | C4 | 56,008 |
| docs/stage-15.7-evidence/states/tracking-invalid-390.png | untracked | Screenshots | C4 | 55,875 |
| docs/stage-15.7-evidence/states/tracking-invalid-768.png | untracked | Screenshots | C4 | 62,134 |
| docs/stage-15.7-evidence/states/tracking-invalid-viewport-1440.png | untracked | Screenshots | C4 | 65,943 |
| docs/stage-15.7-evidence/states/tracking-invalid-viewport-320.png | untracked | Screenshots | C4 | 25,571 |
| docs/stage-15.7-evidence/states/tracking-loading-320.png | untracked | Screenshots | C4 | 22,205 |
| docs/stage-15.7-evidence/states/tracking-not-found-320.png | untracked | Screenshots | C4 | 25,812 |
| docs/stage-15.7-evidence/states/tracking-ready-320.png | untracked | Screenshots | C4 | 74,022 |
| docs/stage-15.7-evidence/states/tracking-refreshing-320.png | untracked | Screenshots | C4 | 74,496 |
| docs/stage-15.7-evidence/states/tracking-result-1440.png | untracked | Screenshots | C4 | 80,037 |
| docs/stage-15.7-evidence/states/tracking-result-320.png | untracked | Screenshots | C4 | 74,187 |
| docs/stage-15.7-evidence/states/tracking-result-390.png | untracked | Screenshots | C4 | 74,740 |
| docs/stage-15.7-evidence/states/tracking-result-768.png | untracked | Screenshots | C4 | 76,689 |
| docs/stage-15.7-evidence/states/tracking-search-1440.png | untracked | Screenshots | C4 | 62,005 |
| docs/stage-15.7-evidence/states/tracking-search-320.png | untracked | Screenshots | C4 | 51,370 |
| docs/stage-15.7-evidence/states/tracking-search-390.png | untracked | Screenshots | C4 | 51,301 |
| docs/stage-15.7-evidence/states/tracking-search-768.png | untracked | Screenshots | C4 | 57,160 |
| docs/stage-15.7-evidence/states/tracking-unavailable-320.png | untracked | Screenshots | C4 | 24,284 |
| docs/stage-15.7-evidence/states/tracking-verification-320.png | untracked | Screenshots | C4 | 24,742 |
| docs/stage-15.7-evidence/summary.json | untracked | Generated evidence/reports/logs | C4 | 16,483 |
| docs/stage-15.7-evidence/typecheck-final.log | untracked | Generated evidence/reports/logs | C4 | 560 |
| docs/stage-15.7-evidence/typecheck.log | untracked | Generated evidence/reports/logs | C4 | 560 |
| docs/stage-15.7-evidence/web-components-final.log | untracked | Generated evidence/reports/logs | C4 | 1,142 |
| docs/stage-15.7-evidence/web-components.log | untracked | Generated evidence/reports/logs | C4 | 2,220 |
| docs/stage-15.7-evidence/web-lint-final.log | untracked | Generated evidence/reports/logs | C4 | 114 |
| docs/stage-15.7-evidence/web-typecheck-final.log | untracked | Generated evidence/reports/logs | C4 | 226 |
| docs/stage-15.7-evidence/webkit-checkout-isolation.json | untracked | Generated evidence/reports/logs | C4 | 3,396 |
| docs/stage-15.7-evidence/webkit-checkout-page-errors.json | untracked | Generated evidence/reports/logs | C4 | 2,067 |
| docs/stage-15.7-evidence/webkit-dom-only-results.json | untracked | Generated evidence/reports/logs | C4 | 3,962 |
| docs/stage-15.7-evidence/webkit-dom-only.log | untracked | Generated evidence/reports/logs | C4 | 2,616 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit-version.json | untracked | Generated evidence/reports/logs | Archive | 290 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/account-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,147 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/account-320.json | untracked | Generated evidence/reports/logs | Archive | 2,145 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/account-390.json | untracked | Generated evidence/reports/logs | Archive | 2,145 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/account-768.json | untracked | Generated evidence/reports/logs | Archive | 2,145 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/cart-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,866 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/cart-320.json | untracked | Generated evidence/reports/logs | Archive | 2,123 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/cart-390.json | untracked | Generated evidence/reports/logs | Archive | 2,115 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/cart-768.json | untracked | Generated evidence/reports/logs | Archive | 1,863 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-delivery-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,308 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-delivery-320.json | untracked | Generated evidence/reports/logs | Archive | 2,434 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-delivery-390.json | untracked | Generated evidence/reports/logs | Archive | 2,434 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-delivery-768.json | untracked | Generated evidence/reports/logs | Archive | 2,313 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-pickup-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,746 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-pickup-320.json | untracked | Generated evidence/reports/logs | Archive | 1,871 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-pickup-390.json | untracked | Generated evidence/reports/logs | Archive | 1,872 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/checkout-pickup-768.json | untracked | Generated evidence/reports/logs | Archive | 1,751 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/configurator-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,098 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/configurator-320.json | untracked | Generated evidence/reports/logs | Archive | 2,187 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/configurator-390.json | untracked | Generated evidence/reports/logs | Archive | 2,193 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/configurator-768.json | untracked | Generated evidence/reports/logs | Archive | 2,073 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-1440.json | untracked | Generated evidence/reports/logs | Archive | 731 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-320.json | untracked | Generated evidence/reports/logs | Archive | 852 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-390.json | untracked | Generated evidence/reports/logs | Archive | 852 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-768.json | untracked | Generated evidence/reports/logs | Archive | 730 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-missing-1440.json | untracked | Generated evidence/reports/logs | Archive | 680 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-missing-320.json | untracked | Generated evidence/reports/logs | Archive | 800 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-missing-390.json | untracked | Generated evidence/reports/logs | Archive | 800 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/confirmation-missing-768.json | untracked | Generated evidence/reports/logs | Archive | 679 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/landscape-844.json | untracked | Generated evidence/reports/logs | Archive | 1,156 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/login-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,226 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/login-320.json | untracked | Generated evidence/reports/logs | Archive | 1,345 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/login-390.json | untracked | Generated evidence/reports/logs | Archive | 1,345 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/login-768.json | untracked | Generated evidence/reports/logs | Archive | 1,225 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/login-root-text-200-percent-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,226 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/mobile-navigation-320.json | untracked | Generated evidence/reports/logs | Archive | 1,333 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/mobile-navigation-390.json | untracked | Generated evidence/reports/logs | Archive | 1,340 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/order-detail-1440.json | untracked | Generated evidence/reports/logs | Archive | 820 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/order-detail-320.json | untracked | Generated evidence/reports/logs | Archive | 819 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/order-detail-390.json | untracked | Generated evidence/reports/logs | Archive | 819 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/order-detail-768.json | untracked | Generated evidence/reports/logs | Archive | 820 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/orders-1440.json | untracked | Generated evidence/reports/logs | Archive | 913 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/orders-320.json | untracked | Generated evidence/reports/logs | Archive | 911 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/orders-390.json | untracked | Generated evidence/reports/logs | Archive | 911 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/orders-768.json | untracked | Generated evidence/reports/logs | Archive | 913 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/orders-empty-320.json | untracked | Generated evidence/reports/logs | Archive | 912 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/orders-error-320.json | untracked | Generated evidence/reports/logs | Archive | 1,108 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/register-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,445 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/register-320.json | untracked | Generated evidence/reports/logs | Archive | 1,565 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/register-390.json | untracked | Generated evidence/reports/logs | Archive | 1,565 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/register-768.json | untracked | Generated evidence/reports/logs | Archive | 1,319 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/security-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,068 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/security-320.json | untracked | Generated evidence/reports/logs | Archive | 2,066 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/security-390.json | untracked | Generated evidence/reports/logs | Archive | 2,067 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/security-768.json | untracked | Generated evidence/reports/logs | Archive | 2,067 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/storefront-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,160 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/storefront-320.json | untracked | Generated evidence/reports/logs | Archive | 1,296 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/storefront-390.json | untracked | Generated evidence/reports/logs | Archive | 1,302 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/storefront-768.json | untracked | Generated evidence/reports/logs | Archive | 1,158 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/track-order-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,113 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/track-order-320.json | untracked | Generated evidence/reports/logs | Archive | 1,213 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/track-order-390.json | untracked | Generated evidence/reports/logs | Archive | 1,213 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/track-order-768.json | untracked | Generated evidence/reports/logs | Archive | 1,103 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-invalid-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,021 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-invalid-320.json | untracked | Generated evidence/reports/logs | Archive | 1,119 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-invalid-390.json | untracked | Generated evidence/reports/logs | Archive | 1,119 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-invalid-768.json | untracked | Generated evidence/reports/logs | Archive | 1,010 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-result-1440.json | untracked | Generated evidence/reports/logs | Archive | 807 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-result-320.json | untracked | Generated evidence/reports/logs | Archive | 927 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-result-390.json | untracked | Generated evidence/reports/logs | Archive | 927 |
| docs/stage-15.7-evidence/webkit-dom-only/webkit/tracking-result-768.json | untracked | Generated evidence/reports/logs | Archive | 806 |
| docs/stage-15.7-evidence/webkit-focus-before/.last-run.json | untracked | Generated evidence/reports/logs | Archive | 96 |
| docs/stage-15.7-evidence/webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/error-context.md | untracked | Generated evidence/reports/logs | C4 | 15,471 |
| docs/stage-15.7-evidence/webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/test-failed-1.png | untracked | Screenshots | C4 | 53,424 |
| docs/stage-15.7-evidence/webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | untracked | Generated evidence/reports/logs | Archive | 42,212,436 |
| docs/stage-15.7-evidence/webkit-isolated-width-results.json | untracked | Generated evidence/reports/logs | C4 | 7,188 |
| docs/stage-15.7-evidence/webkit-isolated-width.log | untracked | Generated evidence/reports/logs | C4 | 3,436 |
| docs/stage-15.7-evidence/webkit-isolation-results.json | untracked | Generated evidence/reports/logs | C4 | 3,955 |
| docs/stage-15.7-evidence/webkit-isolation.log | untracked | Generated evidence/reports/logs | C4 | 2,594 |
| docs/stage-15.7-evidence/webkit-navigation-tab-diagnostic.json | untracked | Generated evidence/reports/logs | C4 | 1,864 |
| docs/stage-15.7-evidence/webkit-no-axe-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/error-context.md | untracked | Generated evidence/reports/logs | C4 | 16,242 |
| docs/stage-15.7-evidence/webkit-no-axe-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/test-failed-1.png | untracked | Screenshots | C4 | 63,841 |
| docs/stage-15.7-evidence/webkit-no-axe-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | untracked | Generated evidence/reports/logs | Archive | 15,152,159 |
| docs/stage-15.7-evidence/webkit-no-axe-harness-path-error.log | untracked | Generated evidence/reports/logs | C4 | 7,104 |
| docs/stage-15.7-evidence/webkit-no-axe-results.json | untracked | Generated evidence/reports/logs | C4 | 8,491 |
| docs/stage-15.7-evidence/webkit-no-axe.log | untracked | Generated evidence/reports/logs | C4 | 7,104 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit-version.json | untracked | Generated evidence/reports/logs | Archive | 290 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,114 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-1440.png | untracked | Screenshots | Archive | 161,265 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-320.json | untracked | Generated evidence/reports/logs | Archive | 1,763 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-320.png | untracked | Screenshots | Archive | 122,415 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-390.json | untracked | Generated evidence/reports/logs | Archive | 1,763 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-390.png | untracked | Screenshots | Archive | 121,593 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-768.json | untracked | Generated evidence/reports/logs | Archive | 2,113 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/account-768.png | untracked | Screenshots | Archive | 140,057 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,818 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-1440.png | untracked | Screenshots | Archive | 1,064,324 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-320.json | untracked | Generated evidence/reports/logs | Archive | 2,075 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-320.png | untracked | Screenshots | Archive | 86,390 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-390.json | untracked | Generated evidence/reports/logs | Archive | 2,081 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-390.png | untracked | Screenshots | Archive | 91,201 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-768.json | untracked | Generated evidence/reports/logs | Archive | 1,816 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/cart-768.png | untracked | Screenshots | Archive | 689,554 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,275 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-1440.png | untracked | Screenshots | Archive | 325,097 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-320.json | untracked | Generated evidence/reports/logs | Archive | 2,401 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-320.png | untracked | Screenshots | Archive | 245,257 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-390.json | untracked | Generated evidence/reports/logs | Archive | 2,401 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-390.png | untracked | Screenshots | Archive | 276,298 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-768.json | untracked | Generated evidence/reports/logs | Archive | 2,280 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-delivery-768.png | untracked | Screenshots | Archive | 306,220 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,713 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-1440.png | untracked | Screenshots | Archive | 263,807 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-320.json | untracked | Generated evidence/reports/logs | Archive | 1,839 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-320.png | untracked | Screenshots | Archive | 189,469 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-390.json | untracked | Generated evidence/reports/logs | Archive | 1,839 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-390.png | untracked | Screenshots | Archive | 220,561 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-768.json | untracked | Generated evidence/reports/logs | Archive | 1,718 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/checkout-pickup-768.png | untracked | Screenshots | Archive | 249,707 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,017 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-1440.png | untracked | Screenshots | Archive | 1,640,260 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-320.json | untracked | Generated evidence/reports/logs | Archive | 2,154 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-320.png | untracked | Screenshots | Archive | 131,124 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-390.json | untracked | Generated evidence/reports/logs | Archive | 2,160 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-390.png | untracked | Screenshots | Archive | 234,992 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-768.json | untracked | Generated evidence/reports/logs | Archive | 2,027 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/configurator-768.png | untracked | Screenshots | Archive | 1,054,059 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-1440.json | untracked | Generated evidence/reports/logs | Archive | 699 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-1440.png | untracked | Screenshots | Archive | 101,878 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-320.json | untracked | Generated evidence/reports/logs | Archive | 820 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-320.png | untracked | Screenshots | Archive | 73,897 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-390.json | untracked | Generated evidence/reports/logs | Archive | 820 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-390.png | untracked | Screenshots | Archive | 73,818 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-768.json | untracked | Generated evidence/reports/logs | Archive | 698 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-768.png | untracked | Screenshots | Archive | 87,138 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-1440.json | untracked | Generated evidence/reports/logs | Archive | 647 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-1440.png | untracked | Screenshots | Archive | 95,361 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-320.json | untracked | Generated evidence/reports/logs | Archive | 768 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-320.png | untracked | Screenshots | Archive | 68,964 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-390.json | untracked | Generated evidence/reports/logs | Archive | 768 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-390.png | untracked | Screenshots | Archive | 68,643 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-768.json | untracked | Generated evidence/reports/logs | Archive | 646 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/confirmation-missing-768.png | untracked | Screenshots | Archive | 82,499 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,193 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-1440.png | untracked | Screenshots | Archive | 113,402 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-320.json | untracked | Generated evidence/reports/logs | Archive | 1,313 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-320.png | untracked | Screenshots | Archive | 81,676 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-390.json | untracked | Generated evidence/reports/logs | Archive | 1,313 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-390.png | untracked | Screenshots | Archive | 81,511 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-768.json | untracked | Generated evidence/reports/logs | Archive | 1,192 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/login-768.png | untracked | Screenshots | Archive | 96,348 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/mobile-navigation-320.json | untracked | Generated evidence/reports/logs | Archive | 1,301 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/mobile-navigation-320.png | untracked | Screenshots | Archive | 40,247 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/mobile-navigation-390.json | untracked | Generated evidence/reports/logs | Archive | 1,307 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/mobile-navigation-390.png | untracked | Screenshots | Archive | 56,619 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-1440.json | untracked | Generated evidence/reports/logs | Archive | 787 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-1440.png | untracked | Screenshots | Archive | 158,402 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-320.json | untracked | Generated evidence/reports/logs | Archive | 786 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-320.png | untracked | Screenshots | Archive | 122,370 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-390.json | untracked | Generated evidence/reports/logs | Archive | 786 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-390.png | untracked | Screenshots | Archive | 122,186 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-768.json | untracked | Generated evidence/reports/logs | Archive | 786 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/order-detail-768.png | untracked | Screenshots | Archive | 136,721 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-1440.json | untracked | Generated evidence/reports/logs | Archive | 880 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-1440.png | untracked | Screenshots | Archive | 147,696 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-320.json | untracked | Generated evidence/reports/logs | Archive | 879 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-320.png | untracked | Screenshots | Archive | 122,215 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-390.json | untracked | Generated evidence/reports/logs | Archive | 879 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-390.png | untracked | Screenshots | Archive | 122,601 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-768.json | untracked | Generated evidence/reports/logs | Archive | 879 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/orders-768.png | untracked | Screenshots | Archive | 129,074 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,413 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-1440.png | untracked | Screenshots | Archive | 135,108 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-320.json | untracked | Generated evidence/reports/logs | Archive | 1,407 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-320.png | untracked | Screenshots | Archive | 90,139 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-390.json | untracked | Generated evidence/reports/logs | Archive | 1,407 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-390.png | untracked | Screenshots | Archive | 89,586 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-768.json | untracked | Generated evidence/reports/logs | Archive | 1,412 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/register-768.png | untracked | Screenshots | Archive | 114,848 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-1440.json | untracked | Generated evidence/reports/logs | Archive | 2,035 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-1440.png | untracked | Screenshots | Archive | 205,790 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-320.json | untracked | Generated evidence/reports/logs | Archive | 2,034 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-320.png | untracked | Screenshots | Archive | 154,795 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-390.json | untracked | Generated evidence/reports/logs | Archive | 2,034 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-390.png | untracked | Screenshots | Archive | 155,829 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-768.json | untracked | Generated evidence/reports/logs | Archive | 2,034 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/security-768.png | untracked | Screenshots | Archive | 178,801 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,128 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-1440.png | untracked | Screenshots | Archive | 1,774,069 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-320.json | untracked | Generated evidence/reports/logs | Archive | 1,264 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-320.png | untracked | Screenshots | Archive | 820,289 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-390.json | untracked | Generated evidence/reports/logs | Archive | 1,270 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-390.png | untracked | Screenshots | Archive | 1,146,209 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-768.json | untracked | Generated evidence/reports/logs | Archive | 1,126 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/storefront-768.png | untracked | Screenshots | Archive | 1,546,645 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-1440.json | untracked | Generated evidence/reports/logs | Archive | 1,081 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-1440.png | untracked | Screenshots | Archive | 148,709 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-320.json | untracked | Generated evidence/reports/logs | Archive | 1,181 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-320.png | untracked | Screenshots | Archive | 121,415 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-390.json | untracked | Generated evidence/reports/logs | Archive | 1,181 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-390.png | untracked | Screenshots | Archive | 119,631 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-768.json | untracked | Generated evidence/reports/logs | Archive | 1,072 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/track-order-768.png | untracked | Screenshots | Archive | 134,155 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-1440.json | untracked | Generated evidence/reports/logs | Archive | 988 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-1440.png | untracked | Screenshots | Archive | 157,195 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-320.json | untracked | Generated evidence/reports/logs | Archive | 1,087 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-320.png | untracked | Screenshots | Archive | 128,518 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-390.json | untracked | Generated evidence/reports/logs | Archive | 1,087 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-390.png | untracked | Screenshots | Archive | 126,915 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-768.json | untracked | Generated evidence/reports/logs | Archive | 978 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-invalid-768.png | untracked | Screenshots | Archive | 141,040 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-1440.json | untracked | Generated evidence/reports/logs | Archive | 774 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-1440.png | untracked | Screenshots | Archive | 201,824 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-320.json | untracked | Generated evidence/reports/logs | Archive | 894 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-320.png | untracked | Screenshots | Archive | 178,587 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-390.json | untracked | Generated evidence/reports/logs | Archive | 894 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-390.png | untracked | Screenshots | Archive | 178,319 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-768.json | untracked | Generated evidence/reports/logs | Archive | 773 |
| docs/stage-15.7-evidence/webkit-no-axe/webkit/tracking-result-768.png | untracked | Screenshots | Archive | 183,686 |
| docs/stage-15.7-evidence/webkit-rerun-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/error-context.md | untracked | Generated evidence/reports/logs | C4 | 17,355 |
| docs/stage-15.7-evidence/webkit-rerun-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/test-failed-1.png | untracked | Screenshots | C4 | 55,450 |
| docs/stage-15.7-evidence/webkit-rerun-failure/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | untracked | Generated evidence/reports/logs | Archive | 27,188,571 |
| docs/stage-15.7-evidence/webkit-rerun-results.json | untracked | Generated evidence/reports/logs | C4 | 9,638 |
| docs/stage-15.7-evidence/webkit-rerun.log | untracked | Generated evidence/reports/logs | C4 | 7,850 |
| docs/stage-15.7-evidence/webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/error-context.md | untracked | Generated evidence/reports/logs | C4 | 12,872 |
| docs/stage-15.7-evidence/webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/test-failed-1.png | untracked | Screenshots | C4 | 56,172 |
| docs/stage-15.7-evidence/webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/trace.zip | untracked | Generated evidence/reports/logs | Archive | 5,284,637 |
| docs/stage-15.7-evidence/webkit-second-run-failures/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/error-context.md | untracked | Generated evidence/reports/logs | C4 | 16,454 |
| docs/stage-15.7-evidence/webkit-second-run-failures/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/test-failed-1.png | untracked | Screenshots | C4 | 555,513 |
| docs/stage-15.7-evidence/webkit-second-run-failures/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip | untracked | Generated evidence/reports/logs | Archive | 44,732,682 |
| docs/stage-15.7-evidence/webkit-version.json | untracked | Generated evidence/reports/logs | C4 | 290 |
| docs/stage-15.7-evidence/webkit/account-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,115 |
| docs/stage-15.7-evidence/webkit/account-1440.png | untracked | Screenshots | C4 | 161,265 |
| docs/stage-15.7-evidence/webkit/account-320.json | untracked | Generated evidence/reports/logs | C4 | 2,114 |
| docs/stage-15.7-evidence/webkit/account-320.png | untracked | Screenshots | C4 | 120,268 |
| docs/stage-15.7-evidence/webkit/account-390.json | untracked | Generated evidence/reports/logs | C4 | 2,114 |
| docs/stage-15.7-evidence/webkit/account-390.png | untracked | Screenshots | C4 | 120,307 |
| docs/stage-15.7-evidence/webkit/account-768.json | untracked | Generated evidence/reports/logs | C4 | 2,114 |
| docs/stage-15.7-evidence/webkit/account-768.png | untracked | Screenshots | C4 | 140,057 |
| docs/stage-15.7-evidence/webkit/cart-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,819 |
| docs/stage-15.7-evidence/webkit/cart-1440.png | untracked | Screenshots | C4 | 1,064,324 |
| docs/stage-15.7-evidence/webkit/cart-320.json | untracked | Generated evidence/reports/logs | C4 | 3,762 |
| docs/stage-15.7-evidence/webkit/cart-320.png | untracked | Screenshots | C4 | 86,390 |
| docs/stage-15.7-evidence/webkit/cart-390.json | untracked | Generated evidence/reports/logs | C4 | 2,082 |
| docs/stage-15.7-evidence/webkit/cart-390.png | untracked | Screenshots | C4 | 91,201 |
| docs/stage-15.7-evidence/webkit/cart-768.json | untracked | Generated evidence/reports/logs | C4 | 3,469 |
| docs/stage-15.7-evidence/webkit/cart-768.png | untracked | Screenshots | C4 | 689,428 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,276 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-1440.png | untracked | Screenshots | C4 | 325,097 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-320.json | untracked | Generated evidence/reports/logs | C4 | 2,402 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-320.png | untracked | Screenshots | C4 | 274,948 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-390.json | untracked | Generated evidence/reports/logs | C4 | 2,402 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-390.png | untracked | Screenshots | C4 | 276,298 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-768.json | untracked | Generated evidence/reports/logs | C4 | 2,281 |
| docs/stage-15.7-evidence/webkit/checkout-delivery-768.png | untracked | Screenshots | C4 | 306,220 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,714 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-1440.png | untracked | Screenshots | C4 | 263,807 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-320.json | untracked | Generated evidence/reports/logs | C4 | 1,840 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-320.png | untracked | Screenshots | C4 | 218,774 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-390.json | untracked | Generated evidence/reports/logs | C4 | 1,840 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-390.png | untracked | Screenshots | C4 | 220,561 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-768.json | untracked | Generated evidence/reports/logs | C4 | 1,719 |
| docs/stage-15.7-evidence/webkit/checkout-pickup-768.png | untracked | Screenshots | C4 | 249,707 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-bottom-1440.png | untracked | Screenshots | C4 | 205,586 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-bottom-320.png | untracked | Screenshots | C4 | 45,295 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-bottom-390.png | untracked | Screenshots | C4 | 101,439 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-bottom-768.png | untracked | Screenshots | C4 | 130,552 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-top-1440.png | untracked | Screenshots | C4 | 211,156 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-top-320.png | untracked | Screenshots | C4 | 53,848 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-top-390.png | untracked | Screenshots | C4 | 90,668 |
| docs/stage-15.7-evidence/webkit/checkout-viewport-top-768.png | untracked | Screenshots | C4 | 119,328 |
| docs/stage-15.7-evidence/webkit/configurator-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,018 |
| docs/stage-15.7-evidence/webkit/configurator-1440.png | untracked | Screenshots | C4 | 1,640,260 |
| docs/stage-15.7-evidence/webkit/configurator-320.json | untracked | Generated evidence/reports/logs | C4 | 2,155 |
| docs/stage-15.7-evidence/webkit/configurator-320.png | untracked | Screenshots | C4 | 131,124 |
| docs/stage-15.7-evidence/webkit/configurator-390.json | untracked | Generated evidence/reports/logs | C4 | 2,161 |
| docs/stage-15.7-evidence/webkit/configurator-390.png | untracked | Screenshots | C4 | 234,992 |
| docs/stage-15.7-evidence/webkit/configurator-768.json | untracked | Generated evidence/reports/logs | C4 | 2,028 |
| docs/stage-15.7-evidence/webkit/configurator-768.png | untracked | Screenshots | C4 | 1,054,059 |
| docs/stage-15.7-evidence/webkit/confirmation-1440.json | untracked | Generated evidence/reports/logs | C4 | 701 |
| docs/stage-15.7-evidence/webkit/confirmation-1440.png | untracked | Screenshots | C4 | 101,878 |
| docs/stage-15.7-evidence/webkit/confirmation-320.json | untracked | Generated evidence/reports/logs | C4 | 821 |
| docs/stage-15.7-evidence/webkit/confirmation-320.png | untracked | Screenshots | C4 | 73,897 |
| docs/stage-15.7-evidence/webkit/confirmation-390.json | untracked | Generated evidence/reports/logs | C4 | 821 |
| docs/stage-15.7-evidence/webkit/confirmation-390.png | untracked | Screenshots | C4 | 74,535 |
| docs/stage-15.7-evidence/webkit/confirmation-768.json | untracked | Generated evidence/reports/logs | C4 | 700 |
| docs/stage-15.7-evidence/webkit/confirmation-768.png | untracked | Screenshots | C4 | 88,180 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-1440.json | untracked | Generated evidence/reports/logs | C4 | 649 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-1440.png | untracked | Screenshots | C4 | 95,361 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-320.json | untracked | Generated evidence/reports/logs | C4 | 769 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-320.png | untracked | Screenshots | C4 | 68,964 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-390.json | untracked | Generated evidence/reports/logs | C4 | 769 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-390.png | untracked | Screenshots | C4 | 69,357 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-768.json | untracked | Generated evidence/reports/logs | C4 | 648 |
| docs/stage-15.7-evidence/webkit/confirmation-missing-768.png | untracked | Screenshots | C4 | 83,507 |
| docs/stage-15.7-evidence/webkit/landscape-844.json | untracked | Generated evidence/reports/logs | C4 | 17,713 |
| docs/stage-15.7-evidence/webkit/landscape-844.png | untracked | Screenshots | C4 | 1,751,214 |
| docs/stage-15.7-evidence/webkit/login-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,194 |
| docs/stage-15.7-evidence/webkit/login-1440.png | untracked | Screenshots | C4 | 113,402 |
| docs/stage-15.7-evidence/webkit/login-320.json | untracked | Generated evidence/reports/logs | C4 | 1,314 |
| docs/stage-15.7-evidence/webkit/login-320.png | untracked | Screenshots | C4 | 81,676 |
| docs/stage-15.7-evidence/webkit/login-390.json | untracked | Generated evidence/reports/logs | C4 | 1,314 |
| docs/stage-15.7-evidence/webkit/login-390.png | untracked | Screenshots | C4 | 81,511 |
| docs/stage-15.7-evidence/webkit/login-768.json | untracked | Generated evidence/reports/logs | C4 | 1,193 |
| docs/stage-15.7-evidence/webkit/login-768.png | untracked | Screenshots | C4 | 96,348 |
| docs/stage-15.7-evidence/webkit/login-root-text-200-percent-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,194 |
| docs/stage-15.7-evidence/webkit/login-root-text-200-percent-1440.png | untracked | Screenshots | C4 | 215,460 |
| docs/stage-15.7-evidence/webkit/mobile-navigation-320.json | untracked | Generated evidence/reports/logs | C4 | 1,302 |
| docs/stage-15.7-evidence/webkit/mobile-navigation-320.png | untracked | Screenshots | C4 | 40,247 |
| docs/stage-15.7-evidence/webkit/mobile-navigation-390.json | untracked | Generated evidence/reports/logs | C4 | 1,308 |
| docs/stage-15.7-evidence/webkit/mobile-navigation-390.png | untracked | Screenshots | C4 | 56,619 |
| docs/stage-15.7-evidence/webkit/navigation-focus-after-390.png | untracked | Screenshots | C4 | 53,271 |
| docs/stage-15.7-evidence/webkit/order-detail-1440.json | untracked | Generated evidence/reports/logs | C4 | 788 |
| docs/stage-15.7-evidence/webkit/order-detail-1440.png | untracked | Screenshots | C4 | 158,402 |
| docs/stage-15.7-evidence/webkit/order-detail-320.json | untracked | Generated evidence/reports/logs | C4 | 787 |
| docs/stage-15.7-evidence/webkit/order-detail-320.png | untracked | Screenshots | C4 | 122,370 |
| docs/stage-15.7-evidence/webkit/order-detail-390.json | untracked | Generated evidence/reports/logs | C4 | 787 |
| docs/stage-15.7-evidence/webkit/order-detail-390.png | untracked | Screenshots | C4 | 122,186 |
| docs/stage-15.7-evidence/webkit/order-detail-768.json | untracked | Generated evidence/reports/logs | C4 | 787 |
| docs/stage-15.7-evidence/webkit/order-detail-768.png | untracked | Screenshots | C4 | 136,721 |
| docs/stage-15.7-evidence/webkit/orders-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,274 |
| docs/stage-15.7-evidence/webkit/orders-1440.png | untracked | Screenshots | C4 | 147,696 |
| docs/stage-15.7-evidence/webkit/orders-320.json | untracked | Generated evidence/reports/logs | C4 | 2,273 |
| docs/stage-15.7-evidence/webkit/orders-320.png | untracked | Screenshots | C4 | 122,215 |
| docs/stage-15.7-evidence/webkit/orders-390.json | untracked | Generated evidence/reports/logs | C4 | 2,273 |
| docs/stage-15.7-evidence/webkit/orders-390.png | untracked | Screenshots | C4 | 122,601 |
| docs/stage-15.7-evidence/webkit/orders-768.json | untracked | Generated evidence/reports/logs | C4 | 2,273 |
| docs/stage-15.7-evidence/webkit/orders-768.png | untracked | Screenshots | C4 | 129,074 |
| docs/stage-15.7-evidence/webkit/orders-empty-320.json | untracked | Generated evidence/reports/logs | C4 | 2,214 |
| docs/stage-15.7-evidence/webkit/orders-empty-320.png | untracked | Screenshots | C4 | 127,815 |
| docs/stage-15.7-evidence/webkit/orders-error-320.json | untracked | Generated evidence/reports/logs | C4 | 2,409 |
| docs/stage-15.7-evidence/webkit/orders-error-320.png | untracked | Screenshots | C4 | 114,030 |
| docs/stage-15.7-evidence/webkit/register-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,414 |
| docs/stage-15.7-evidence/webkit/register-1440.png | untracked | Screenshots | C4 | 135,108 |
| docs/stage-15.7-evidence/webkit/register-320.json | untracked | Generated evidence/reports/logs | C4 | 1,534 |
| docs/stage-15.7-evidence/webkit/register-320.png | untracked | Screenshots | C4 | 99,276 |
| docs/stage-15.7-evidence/webkit/register-390.json | untracked | Generated evidence/reports/logs | C4 | 1,534 |
| docs/stage-15.7-evidence/webkit/register-390.png | untracked | Screenshots | C4 | 99,002 |
| docs/stage-15.7-evidence/webkit/register-768.json | untracked | Generated evidence/reports/logs | C4 | 1,413 |
| docs/stage-15.7-evidence/webkit/register-768.png | untracked | Screenshots | C4 | 114,848 |
| docs/stage-15.7-evidence/webkit/security-1440.json | untracked | Generated evidence/reports/logs | C4 | 2,036 |
| docs/stage-15.7-evidence/webkit/security-1440.png | untracked | Screenshots | C4 | 205,790 |
| docs/stage-15.7-evidence/webkit/security-320.json | untracked | Generated evidence/reports/logs | C4 | 2,035 |
| docs/stage-15.7-evidence/webkit/security-320.png | untracked | Screenshots | C4 | 154,795 |
| docs/stage-15.7-evidence/webkit/security-390.json | untracked | Generated evidence/reports/logs | C4 | 2,035 |
| docs/stage-15.7-evidence/webkit/security-390.png | untracked | Screenshots | C4 | 155,829 |
| docs/stage-15.7-evidence/webkit/security-768.json | untracked | Generated evidence/reports/logs | C4 | 2,035 |
| docs/stage-15.7-evidence/webkit/security-768.png | untracked | Screenshots | C4 | 178,801 |
| docs/stage-15.7-evidence/webkit/storefront-1440.json | untracked | Generated evidence/reports/logs | C4 | 17,596 |
| docs/stage-15.7-evidence/webkit/storefront-1440.png | untracked | Screenshots | C4 | 1,774,069 |
| docs/stage-15.7-evidence/webkit/storefront-320.json | untracked | Generated evidence/reports/logs | C4 | 17,732 |
| docs/stage-15.7-evidence/webkit/storefront-320.png | untracked | Screenshots | C4 | 820,289 |
| docs/stage-15.7-evidence/webkit/storefront-390.json | untracked | Generated evidence/reports/logs | C4 | 17,738 |
| docs/stage-15.7-evidence/webkit/storefront-390.png | untracked | Screenshots | C4 | 1,146,209 |
| docs/stage-15.7-evidence/webkit/storefront-768.json | untracked | Generated evidence/reports/logs | C4 | 17,594 |
| docs/stage-15.7-evidence/webkit/storefront-768.png | untracked | Screenshots | C4 | 1,546,645 |
| docs/stage-15.7-evidence/webkit/track-order-1440.json | untracked | Generated evidence/reports/logs | C4 | 1,083 |
| docs/stage-15.7-evidence/webkit/track-order-1440.png | untracked | Screenshots | C4 | 148,709 |
| docs/stage-15.7-evidence/webkit/track-order-320.json | untracked | Generated evidence/reports/logs | C4 | 1,182 |
| docs/stage-15.7-evidence/webkit/track-order-320.png | untracked | Screenshots | C4 | 121,415 |
| docs/stage-15.7-evidence/webkit/track-order-390.json | untracked | Generated evidence/reports/logs | C4 | 1,182 |
| docs/stage-15.7-evidence/webkit/track-order-390.png | untracked | Screenshots | C4 | 120,387 |
| docs/stage-15.7-evidence/webkit/track-order-768.json | untracked | Generated evidence/reports/logs | C4 | 1,073 |
| docs/stage-15.7-evidence/webkit/track-order-768.png | untracked | Screenshots | C4 | 134,155 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-1440.json | untracked | Generated evidence/reports/logs | C4 | 989 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-1440.png | untracked | Screenshots | C4 | 157,195 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-320.json | untracked | Generated evidence/reports/logs | C4 | 1,088 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-320.png | untracked | Screenshots | C4 | 128,518 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-390.json | untracked | Generated evidence/reports/logs | C4 | 1,088 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-390.png | untracked | Screenshots | C4 | 126,797 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-768.json | untracked | Generated evidence/reports/logs | C4 | 979 |
| docs/stage-15.7-evidence/webkit/tracking-invalid-768.png | untracked | Screenshots | C4 | 140,715 |
| docs/stage-15.7-evidence/webkit/tracking-result-1440.json | untracked | Generated evidence/reports/logs | C4 | 775 |
| docs/stage-15.7-evidence/webkit/tracking-result-1440.png | untracked | Screenshots | C4 | 201,824 |
| docs/stage-15.7-evidence/webkit/tracking-result-320.json | untracked | Generated evidence/reports/logs | C4 | 895 |
| docs/stage-15.7-evidence/webkit/tracking-result-320.png | untracked | Screenshots | C4 | 178,587 |
| docs/stage-15.7-evidence/webkit/tracking-result-390.json | untracked | Generated evidence/reports/logs | C4 | 895 |
| docs/stage-15.7-evidence/webkit/tracking-result-390.png | untracked | Screenshots | C4 | 178,319 |
| docs/stage-15.7-evidence/webkit/tracking-result-768.json | untracked | Generated evidence/reports/logs | C4 | 774 |
| docs/stage-15.7-evidence/webkit/tracking-result-768.png | untracked | Screenshots | C4 | 183,686 |
| docs/stage-15.7-final-production-acceptance-report.md | untracked | Documentation | C4 | 28,204 |
| docs/stage-15.7-manual-uat-checklist.md | untracked | Documentation | C4 | 4,951 |
| pnpm-lock.yaml | modified | Dependency/configuration | C3 | 343,170 |

</details>

### Additional already ignored evidence (not included in input totals)

| Path | Bytes | Proposed handling |
| --- | ---: | --- |
| docs/stage-15.7-evidence/initial/test-results/.last-run.json | 194 | Preserve in approved external initial-audit archive |
| docs/stage-15.7-evidence/initial/test-results/final-acceptance-rendered--0ce94-tainment-across-four-widths-firefox/error-context.md | 12,187 | Preserve in approved external initial-audit archive |
| docs/stage-15.7-evidence/initial/test-results/final-acceptance-rendered--0ce94-tainment-across-four-widths-firefox/test-failed-1.png | 20,067 | Preserve in approved external initial-audit archive |
| docs/stage-15.7-evidence/initial/test-results/final-acceptance-rendered--0ce94-tainment-across-four-widths-firefox/trace.zip | 133,817,622 | Preserve in approved external initial-audit archive |

### Audit-created file

- docs/git-commit-readiness-report.md ? documentation; proposed C4; not included in the 1,019 input-file totals.

### Read-only verification fingerprints

- Git index entry fingerprint (SHA-256 of git ls-files --stage): 98d49a70614859b0974f6327e75d735aa175adc89bd4523ae95c85360db7b184.
- Changed non-documentation file-content fingerprint: d9cf19e22ea1c5bf1e9f5ace72a9840f7144c6b125de5f34b8e008e43ed3a012.

These describe the source/index inspection, not an approval, staged tree or production artifact certification.
