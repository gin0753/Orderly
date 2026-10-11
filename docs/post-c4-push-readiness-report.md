# Post-C4 push and deployment readiness audit

Prepared 11 October 2026 (Australia/Sydney). Read-only repository/remote/provider inspection; this report is the only new repository file created during this audit. No push, fetch, merge, staging, commit, deployment, configuration change, cleanup or production-data operation was performed.

**Decision: the local commits pass the inventory/publication checks, but a push is not yet established as deployment-safe. Vercel trigger settings and Railway automatic-deployment settings remain unverified. Obtain a separate push authorization after resolving those unknowns.**

## 1. Git state and remote verification

| Item | Observed value |
| --- | --- |
| Branch | `stage-15/frontend-ui-polish` |
| HEAD | `ff668c16d49b9ce3fd3a4e7150b327fc44375dba` |
| Remote | `origin`, fetch/push URL `https://github.com/gin0753/Orderly.git` |
| Embedded URL credentials | None present; credentials were not retrieved or printed |
| Upstream | `origin/stage-15/frontend-ui-polish` |
| Live upstream branch SHA | `f6855d9faa6701d6109b5204ce7fd03e36507eee` |
| Ahead/behind | **4 ahead, 0 behind**; cached upstream matches the read-only live `git ls-remote --heads` observation |
| Live `main` SHA | `811c1e3425fe4de7b5336f25c9d54425980dc5fe`; matches cached `origin/main` |
| Tracked/staged differences | None |
| Untracked before this report | 901 retained documentation/evidence files |
| Untracked after this report | Expected 902; report remains unstaged |

No remote refs were fetched or updated. These observations are a point-in-time snapshot; recheck immediately before any separately approved push.

GitHub's public repository API identifies the repository as public, default branch `main`, and not archived. The branch API reports `main` protected and the current feature branch unprotected. The public active **main-protection** ruleset applies to `~DEFAULT_BRANCH` and requires:

- The **Quality** status check, associated with the configured GitHub integration.
- A pull request; zero mandatory approving reviews, no mandatory code-owner approval or review-thread resolution in this ruleset.
- Squash as the only allowed merge method in this ruleset.
- Protection against non-fast-forward updates and branch deletion.

The strict up-to-date status-check policy is disabled. Classic branch-protection API requests returned HTTP 401, so classic settings and any private administrative controls remain unknown; the observed ruleset is not proof that no additional restriction exists. Feature-branch protection is not a deployment control.

Sources: read-only `git` commands and GitHub API endpoints for [repository metadata](https://api.github.com/repos/gin0753/Orderly), [main branch](https://api.github.com/repos/gin0753/Orderly/branches/main), [current branch](https://api.github.com/repos/gin0753/Orderly/branches/stage-15%2Ffrontend-ui-polish), and [repository rulesets](https://api.github.com/repos/gin0753/Orderly/rulesets), including the returned ruleset detail endpoint. No authenticated GitHub administrative session was available.

## 2. CI triggers and required checks

The only tracked workflow is [CI](../.github/workflows/ci.yml), named `CI`, with one job named **Quality**. The workflow is unchanged by C1–C4, and GitHub reports it active.

| Event | Configuration | Expected result |
| --- | --- | --- |
| Push to current feature branch | Push filter includes only `main` | This workflow will not run from that push alone |
| Push to `main` | Included | Quality job runs |
| Pull request | No branch/path filter or custom activity types | Quality job runs for the default pull-request activities, including opening, synchronization and reopening |
| Manual dispatch | No `workflow_dispatch` | No manual-dispatch entry point in this workflow |
| Other workflow events | None declared | No additional repository workflow trigger found |

Quality uses Ubuntu, Node 22, frozen pnpm installation, a PostgreSQL 16 service with a local guarded test database, generated Prisma client and installed Chromium. It runs workspace lint, TypeScript, `pnpm test:quality`, and production builds. The quality script includes API unit/integration tests, web component checks and the production-backed Chromium browser wrapper. The wrapper's default sequence names eleven regression suites; it does **not** execute `final-acceptance.spec.ts` through the separate multi-engine acceptance configuration. Firefox/WebKit acceptance, real-device UAT and live OAuth are therefore not established by this CI job.

No workflow step invokes Vercel/Railway deployment, SSH, infrastructure provisioning, a deployment hook or production migration. The workflow does create and mutate its ephemeral local test database, install dependencies/browser tooling and build artifacts. Provider Git integrations can still act independently of GitHub Actions.

GitHub reported no Actions runs for the current feature branch. The latest observed `main` run completed successfully for **811c1e3425fe4de7b5336f25c9d54425980dc5fe**, not current local HEAD: [CI run](https://github.com/gin0753/Orderly/actions/runs/37871187018), created 9 October 2026 at 01:43:53 UTC. That success cannot certify C1–C4. No test, build or CI run was initiated in this audit.

## 3. Deployment-trigger findings

| Environment | Evidence inspected | Pushing this feature branch | Pushing/merging `main` |
| --- | --- | --- | --- |
| Vercel frontend | Tracked README/web deployment notes; no tracked Vercel trigger configuration, no local root/web project-link file found, no available authenticated Vercel configuration inspection | **Unknown**, including preview deployments | **Unknown current provider settings**; README says frontend deploys from Git, but does not establish the configured branch or gating |
| Railway backend, linked production environment | Read-only `railway status --json`, Git source and active/latest deployment metadata | **Unknown**; configured automatic triggers, branch selection and CI gating are not exposed by status output | Git-connected `main` deployment history is confirmed; **future automatic trigger behavior remains unknown** |
| Other deployment environments/providers | Tracked workflow/configuration search; linked Railway status reports one production environment/service | No other repository-driven deployment mechanism found; **external apps, hooks and other accounts remain unknown** | Same limitation |

Railway's linked production API service uses repository `gin0753/Orderly`. Both its latest and active deployment report `SUCCESS`, branch `main`, and SHA **811c1e3425fe4de7b5336f25c9d54425980dc5fe**. Its deployment manifest uses the Dockerfile builder and `/apps/api/Dockerfile`. The historical deployment metadata has an empty watch-pattern array and a **Prisma migrate deploy** pre-deploy command. An API deployment can therefore apply migrations; a documentation/frontend-only change must not be assumed unable to trigger backend work.

The Railway status schema exposes Git source and deployment history but not the current automatic-deploy toggle, configured source-branch rule, wait-for-CI policy, effective trigger/path filters, or PR/preview settings. Empty historical watch patterns are not proof of a current trigger policy. No variable values, database credentials, deployment logs or production records were retrieved.

Tracked [README](../README.md) and [API Docker notes](api-docker.md) document Vercel/Railway hosting and migration responsibilities. They describe intended operation, not current provider dashboard settings. The API Dockerfile builds/packages the application; its runtime command starts the API rather than automatically migrating at startup. The observed Railway pre-deploy command is a separate provider deployment operation. Template NestJS deployment suggestions are not evidence of an AWS/Mau integration.

Required owner/provider verification before calling a push deployment-safe:

- Vercel linked repository, production branch, preview branch rules, automatic Git deployments, ignored-build logic, deploy hooks and integration permissions.
- Railway service/environment Git branch, autodeploy, watch/path filters, CI waiting, preview environments and pre-deploy behavior.
- Other GitHub installed applications/webhooks, linked hosting projects and external automation. Those administrative settings were not accessible in this audit.

No provider configuration was changed to disable or enable deployment.

## 4. C1–C4 publication and evidence audit

The four commits are the exact consecutive descendants of the audited pre-C1 upstream SHA:

| Commit | SHA | Changed files |
| --- | --- | ---: |
| C1: authentication/orders/tracking presentation and regression | `8438b679e64ca106574af5172b9bb83231c42d9c` | 92 |
| C2: customer drawer keyboard fix | `596d8a46d78a783c42ef83d13f5c3f34a052699a` | 4 |
| C3: multi-engine accessibility acceptance infrastructure | `85d90468901ea3211a864e2c844509a538ea2a47` | 5 |
| C4: final acceptance evidence and UAT handoff | `ff668c16d49b9ce3fd3a4e7150b327fc44375dba` | **37** |

C4's committed paths exactly match [approved explicit inventory](c4-public-git-evidence-paths.txt): **25 PNGs plus 12 documentation/catalog/manifest/UAT files**, all additions. No restricted/manual-review original from the evidence classification entered these four commits. No ZIP trace, private environment file, local audit/test-results directory, excluded raw Stage 15.7 scan or unapproved generated evidence body was introduced in C1–C4. Public manifests contain paths, hashes and privacy classifications of restricted objects, not their payloads.

All touched text blobs at each of the four commits were checked for recognized private-key, provider-token, JWT and private user-directory signatures; no such signatures were found. Historical fixture/test identities and controlled test configuration are not treated as proof of real customer data or production secrets. The approved C4 image review is bound to unchanged original fingerprints; no selected C4 image is still restricted/privacy-pending. Signature checks and bounded visual review are not an exhaustive secret/PII guarantee or certification of older repository history.

The previous final C4 checks recorded 169 local Markdown links with no missing target/anchor in the tracked-plus-approved snapshot, and 720 archived gallery references plus the three disputed historical targets verified. Original private traces, galleries, logs and raw scans remain outside the public boundary. See [public evidence index](c4-public-evidence-index.md), [privacy review](c4-privacy-review-summary.md) and [verified archive manifest](c4-archive-verification-manifest.json).

The approved archive remains a private local destination, `C:\Orderly-Archives\V1\stage-15-evidence`, with 1,067 verified originals/planning artifacts. The previous post-commit audit rechecked all destination/source hashes and the receipt unchanged. This remote/CI audit did not move, edit or delete any evidence or re-run tests. Existing untracked/ignored files remain preserved and must not be bulk-added before a push.

## 5. Explicit blockers and outstanding conditions

1. **No push authorization** has been given by this request.
2. **Automatic deployment safety is unknown** for Vercel, Railway and inaccessible external integrations. A non-main branch is not a sufficient safeguard.
3. **No successful current-HEAD CI result** is published. A feature-branch push alone will not trigger the repository's Quality workflow; a PR would trigger CI and might independently trigger provider previews.
4. Classic branch-protection/private integration settings remain inaccessible. The public main ruleset's Quality/PR requirement is verified, but it does not guarantee deployment waits for checks.
5. Release acceptance remains conditional: C1's storefront decode timeout, incomplete C2 browser confirmation and blocked C3 live multi-engine run remain disclosed. Initial Firefox enlargement overflow and intermittent WebKit loading findings remain open/conditional; no new passing result was claimed.
6. Real-device/native zoom, screen-reader, live Google OAuth, deployed artifact/configuration equivalence and production performance/operations UAT remain outstanding in [manual UAT](stage-15.7-manual-uat-checklist.md).
7. Archive backup/restore and long-term retention duration remain unverified. Unresolved privacy decisions apply to excluded evidence and prevent its wider publication; they do not authorize expanding C4.

These are different gates: evidence publication readiness does not establish deployment safety or release acceptance.

## 6. Recommended future safe push procedure

This is a proposed procedure only; none of its push/PR/provider actions was executed.

1. Have the operator inspect the provider settings above and record the expected effects of both a feature-branch push and PR creation. If the requirement is no deployment, obtain separate authorization for any necessary provider-side prevention and verify it before proceeding. Do not assume a CI check or branch name prevents deployment.
2. Obtain explicit approval for the push and any intended preview/deployment side effects. Keep merge and production release approval separate.
3. Recheck branch, HEAD, upstream and live remote SHA with read-only commands. Confirm only the reviewed four commits are ahead, the index/tracked working tree are clean and retained evidence is unchanged. Do not stage this report or other remaining evidence without separate authorization.
4. After authorization, optionally inspect the exact proposed update with `git push --dry-run origin HEAD:refs/heads/stage-15/frontend-ui-polish`. A dry run previews the Git update; it does **not** certify provider webhook/deployment behavior.
5. Push only that explicit branch/ref, without force, tags, `--all` or `--mirror`: `git push origin HEAD:refs/heads/stage-15/frontend-ui-polish`. Stop and reassess if the remote has changed; do not rewrite history to force the operation.
6. Verify the remote branch SHA. If separately approved and preview effects are understood, open a PR to `main` and obtain a successful **Quality** check for the intended revision. Complete or explicitly disposition the acceptance conditions before any merge/release decision. Main's observed ruleset permits squash only; changing merge policy or performing a merge is outside this audit.
7. Treat later merge/main publication as a distinct deployment decision. Reconfirm Vercel/Railway behavior, migration implications and rollback/operations readiness before separate approval.

## Audit limitations and verification

Remote Git and public GitHub/Railway metadata queries were read-only. Initial sandbox/network failures were retried using approved read access; the successful observations above were used. No hosting secrets or production data were inspected. GitHub classic protection returned 401, and Vercel provider configuration was unavailable; those findings remain unknown, not passed. No fetch was used, so local remote-tracking refs remain unchanged. Only this requested unstaged report was created.
