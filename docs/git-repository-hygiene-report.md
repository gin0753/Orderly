# Orderly Git repository hygiene audit

Date: 8 October 2026, Australia/Sydney. Baseline HEAD: `22899c4` (`chore: acceptance audit`). This is a Git hygiene review, not another release audit. No application code, tests, migrations, lockfiles, deployed configuration, credentials, or history were changed by this task.

## A. Current repository health

The initial index contained **493 tracked files**. Cleanup leaves **457 tracked files**, with **36 generated-artifact removals staged**. HEAD still contains the old files until a reviewed cleanup commit is made. Every other previously tracked path remains in the index and on disk.

Preserved inventory includes 93 API source paths, 224 web source paths, 71 test/fixture/helper paths (including API colocated specs), all 11 SQL migrations, six existing `docs/` files, manifests/lockfile, Prisma schema, CI/Docker configuration, environment examples, runtime menu assets, and the documented source image bundle. Category counts overlap where tests are colocated in source.

Pending authentication-investigation changes were preserved and not staged by this task:

- Modified `apps/web/src/features/customer-auth/components/customer-auth-bootstrap.tsx`.
- Modified `apps/web/test/browser/scripts/run-playwright.mjs`.
- Untracked `apps/web/test/browser/customer-anonymous-auth.spec.ts`.
- Untracked `apps/web/test/customer-auth-bootstrap.test.tsx`.
- Untracked `docs/customer-anonymous-auth-investigation.md`.

These are intended source/tests/final documentation to review and commit separately, not disposable output. This hygiene report is also intended documentation and remains untracked pending review. `.gitignore` is modified but unstaged. Only the 36 artifact removals are staged.

Ignored local entries verified after cleanup:

```text
.pnpm-store/
.stage138d-proxy-test/
apps/api/.env
apps/api/dist/
apps/api/node_modules/
apps/web/.env.local
apps/web/.next/
apps/web/next-env.d.ts
apps/web/node_modules/
apps/web/test-results/
apps/web/tsconfig.tsbuildinfo
audit-artifacts/
node_modules/
```

The traditional ignored-status traversal encountered stale dependency links inside the old `.stage138d-proxy-test` directory. `git status --ignored=matching --short` completed with no warnings and correctly lists the parent as ignored. These local dependency links were not tracked and were not deleted or repaired.

## B. Unnecessary currently tracked files

The following **36 paths were tracked at audit start** and are now staged for index removal. They are execution logs, an automatically captured failure screenshot/trace, and generated failure context, not application fixtures or final reports. All local copies were preserved and verified byte-for-byte with SHA-256 hashes.

```text
audit-artifacts/api-e2e-final.log
audit-artifacts/api-e2e.log
audit-artifacts/api-start-smoke.log
audit-artifacts/api-unit.log
audit-artifacts/browser-first-failure/error-context.md
audit-artifacts/browser-first-failure/test-failed-1.png
audit-artifacts/browser-first-failure/trace.zip
audit-artifacts/build.log
audit-artifacts/docker-build-final.log
audit-artifacts/docker-build.log
audit-artifacts/docker-runtime-check.log
audit-artifacts/format-changed.log
audit-artifacts/format-check.log
audit-artifacts/install-retry.log
audit-artifacts/install.log
audit-artifacts/lint-final-2.log
audit-artifacts/lint-final.log
audit-artifacts/lint.log
audit-artifacts/migration-diff-final.log
audit-artifacts/migration-diff.log
audit-artifacts/migration-status.log
audit-artifacts/p2-hardening/cache-focused-final.log
audit-artifacts/p2-hardening/cache-focused-rerun.log
audit-artifacts/p2-hardening/cache-focused.log
audit-artifacts/p2-hardening/checkout-focused.log
audit-artifacts/p2-hardening/lint.log
audit-artifacts/p2-hardening/quality.log
audit-artifacts/p2-hardening/typecheck.log
audit-artifacts/prisma-generate.log
audit-artifacts/prisma-validate.log
audit-artifacts/production-readonly.log
audit-artifacts/quality-final-rerun.log
audit-artifacts/quality-final.log
audit-artifacts/typecheck.log
audit-artifacts/web-tests-final.log
audit-artifacts/web-tests.log
```

No other clearly generated tracked paths were identified by the inspected filename patterns. Runtime WebP assets, tests/helpers, schema/migration SQL, and final acceptance/P2 reports remain tracked. No blanket `*.log`, screenshot, ZIP, or image exclusion was added that could hide an intentional fixture elsewhere.

## C. Historical unnecessary files

Recent commit statistics (20 commits) and filenames across all locally reachable refs were inspected. All 36 generated paths above were introduced in **`22899c4` — `chore: acceptance audit`** and remain in HEAD until the prepared removal is committed. No additional historical generated paths in the inspected build/cache/log categories were found that had already been removed in earlier commits.

The nine anonymous-auth execution logs were only untracked local output and have never been committed in the inspected history. New hygiene inspection manifests/scripts are also ignored local output.

`cadab08` introduced the separately documented menu-image bundle. Its 12 WebP images are byte-identical to their runtime counterparts, but the bundle includes installation, ownership, mapping, and versioning documentation; it is an intentional asset source/distribution package, not automatically generated disposable test output.

Git reports approximately 3,936 KiB in packs, 27 KiB in loose objects, and no garbage objects. There is no exceptional repository-size justification for rewriting history. Ordinary removal in a future commit is sufficient; the old artifact content will remain accessible in prior commits.

## D. Sensitive-file assessment

**No confirmed production credential exposure was found.** Historical sensitive filenames consisted only of `.env.example`, `apps/api/.env.example`, and `apps/web/.env.example`; no tracked real `.env`, private-key filename, or credential bundle was found in the inspected reachable history. Current real API/web environment files remain ignored; their values were not printed or needed for this review.

A value-redacted heuristic scan covered 1,094 eligible reachable text blobs, including UTF-16 PowerShell logs, for recognizable provider tokens, private-key material, literal JWTs, database URIs, and quoted credential assignments. Binary/large blobs were excluded from the general text scan; the known tracked trace ZIP was additionally inspected in memory without extracting files. This is not an exhaustive secret-detector certification: it does not prove absence of arbitrary encoded credentials, scan unreachable objects, or verify credentials against external services.

Reviewed findings, without credential values:

| Path / historical reference | Category | Assessment |
|---|---|---|
| `apps/api/src/prisma/seed-safety.spec.ts:34`; blob `5f736f09e6c54beea8a42286b89bc66c7b6e3c33`, commits `4524ad3` / `cadab08` | Database-URI indicator | Synthetic unit-test URI using an interpolated test host in seed-safety assertions; no confirmed live connection-string exposure. Keep the test. |
| `audit-artifacts/browser-first-failure/trace.zip`; commit `22899c4` | Session JWTs in captured traffic | 12 JWT matches, all signatures verified against the documented local browser-fixture keys; local storefront/API origins present. These are local test-session credentials, not confirmed production tokens. The trace is removed from current tracking and future traces are ignored. |

Known local/CI fixture credentials and environment placeholders are intentional test/configuration examples, not production credentials. Real deployments must use their own values. No credential rotation, secret-value publication, remote verification, or history rewrite was performed or recommended for these reviewed fixture findings.

## E. Changes prepared

Root `.gitignore` now adds:

```gitignore
.env.*
!.env.example

# Local audit output and validation caches (keep reports and tests tracked)
/audit-artifacts/
/.pnpm-store/
/.stage138d-proxy-test/
```

The environment rules cover variants such as `.env.production` while keeping all three existing examples eligible for tracking. The other rules are scoped to known root-local generated directories; existing dependency/build/test-result rules are retained.

Tracking removal executed after a dry run:

```powershell
git rm -r -n --cached -- audit-artifacts
git rm -r --cached -- audit-artifacts
```

Only generated paths under this exact root directory were staged. `.gitignore`, this report, and pending auth source/tests were not staged. No local deletion occurred. Final reports still refer to local audit evidence; that evidence remains available in this workspace but will not be included in a fresh clone after the cleanup commit.

Verification passed:

- 457 required tracked paths retained; no missing local files.
- All 11 migrations, lockfile, schema, source/tests/fixtures, environment examples, CI/Docker configuration, assets, and final reports preserved.
- All 36 removed-from-index local copies retain their original SHA-256 hashes.
- All 36 staged paths are the approved generated-artifact candidates; no unrelated staged paths.
- `git check-ignore` confirms outputs/caches/environment variants are ignored and intended examples/tests/reports remain eligible for tracking.
- Working-tree and staged `git diff --check` pass. Only ignore rules and tracking metadata changed, so application test suites were not rerun.

Local evidence: `audit-artifacts/hygiene/inventory.json`, `recent-20-stats.txt`, `historical-filenames.txt`, `tracking-removal-dry-run.txt`, `local-copy-hashes.json`, `verification.json`, and `ignored-status.txt`.

## F. Uncertain files

No currently tracked file with an unexplained purpose required automatic removal. The following owner decisions remain optional:

- **Image-bundle consolidation:** the 13-file `orderly-menu-images-v1/` package has a documented purpose but duplicates 12 runtime images. Keep it now; only consolidate if the owner decides a separate distributable asset package is unnecessary. Do not remove runtime versioned images referenced by snapshots.
- **Scratch dependency links:** `.stage138d-proxy-test/` contains leftover dependency directories/links. It is now ignored; any local deletion must separately confirm link behavior and target containment. Nothing in this directory was deleted.
- **Ignored local environments:** retain local environment files; this task did not inspect values or propose deleting them.

## G. Recommended cleanup

Review the exact prepared hygiene changes, keeping the separate auth investigation out of this commit:

```powershell
git diff --cached --name-status
git diff -- .gitignore
git add -- .gitignore docs/git-repository-hygiene-report.md
git diff --cached --check
git diff --cached --stat
```

After owner review, make a normal cleanup commit through the existing workflow. No commit or push was made automatically. Do not use `git add .` if the auth changes should remain a separate review.

Optional local disk cleanup is **not required** for Git hygiene. `audit-artifacts/hygiene/local-delete-dry-run.txt` records 53 disposable audit-output paths present when the snapshot was produced; later inspection outputs are not automatically included. The manifest is a preview, not authorization. Obtain explicit owner approval before any local deletion, re-resolve each approved absolute path within `C:\dev\Orderly\audit-artifacts`, and use native PowerShell `Remove-Item -LiteralPath` only for those approved files. No deletion command was executed or scheduled. Never delete ambiguous directories, local environment files, source/tests, assets, or dependency junction targets through a broad cleanup command.

## H. Final recommendation

**The prepared repository tree is clean enough for Stage 14 Packaging and public portfolio presentation after the hygiene changes are reviewed and committed.** Generated audit outputs are excluded from the index and future accidental additions; useful source, tests, documentation, migrations, configuration, and assets are preserved.

The working tree intentionally remains dirty: staged hygiene removals, unstaged ignore rules, this new report, and separate auth-investigation work await review. Prior commits still contain local audit evidence; the reviewed tokens are fixture credentials, and no sensitive production exposure or exceptional size issue was established that warrants rewriting history. No local data was deleted, no production data/configuration was changed, and no history rewrite, force push, or automatic commit occurred.
