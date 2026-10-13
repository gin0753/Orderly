# Stage 17.3 — final portfolio release audit

Recorded 13 October 2026 (Australia/Sydney). **Verdict: PASS WITH CONDITIONS for the portfolio candidate; this is not unconditional provider/operational release acceptance.** No commit, merge, push, tag, publication or deployment was performed.

## Candidate and production consistency

| Item                          | Evidence                                                                                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audited branch / commit       | `stage-17/portfolio-packaging` / `9c33c3482b81d48607559201797f5f77524ae489`                                                                                                                                                                                           |
| Main / deployed source record | `81da702f0cde77c0527595d0a02cf2f94bdb8570`                                                                                                                                                                                                                            |
| Starting worktree             | Clean; packaging branch matches the public remote, four commits ahead of main, zero behind                                                                                                                                                                            |
| Runtime difference            | None between main and candidate: `apps` tree `9c8e09cd2aa3f5758043f2f4c2d0a67a68944029`, `.github` tree and pnpm lockfile are identical. Differences are README, portfolio assets/docs/scripts and the root `portfolio:capture` script                                |
| Frontend production record    | [Vercel deployment 7029611721](https://api.github.com/repos/gin0753/Orderly/deployments/7029611721), SHA `81da702`, latest status success at 03:53 UTC (14:53 AEDT)                                                                                                   |
| API production record         | [Railway deployment 7029596450](https://api.github.com/repos/gin0753/Orderly/deployments/7029596450), same SHA, latest status success at 04:17:33 UTC (15:17:33 AEDT). Earlier failure/in-progress statuses remain historical; they are not omitted from the evidence |
| Candidate web build           | [Vercel preview deployment 7032287658](https://api.github.com/repos/gin0753/Orderly/deployments/7032287658), SHA `9c33c34`, success                                                                                                                                   |
| Main CI                       | [Quality run 38343697130](https://github.com/gin0753/Orderly/actions/runs/38343697130), exact main SHA, success: lint, typecheck, tests and build steps passed                                                                                                        |
| Candidate CI                  | No separate Quality run found for candidate HEAD; workflow triggers on PRs/main pushes. Candidate has a successful Vercel preview check. Runtime source equality supports reusing main's evidence; require ordinary PR checks before merge                            |

**Production consistency conclusion: VERIFIED BY DEPLOYMENT METADATA.** Both Vercel Production and Railway Production have successful deployment records associated with `81da702f0cde77c0527595d0a02cf2f94bdb8570`. The owner additionally confirmed through the hosting dashboards that Vercel is **Current / Ready** for `orderly-web-gamma.vercel.app` and Railway's GitHub-triggered deployment is **Active** for `orderly-production-1ac4.up.railway.app`. This closes the public-alias association condition. GitHub deployment records were independently inspected; dashboard state and alias association are owner-supplied evidence. Packaging HEAD is not the production commit, but its application code is identical to that deployed revision.

The protected frontend deployment URL prevented direct bundle comparison, and the API health response contains no revision field. Those limitations do not negate the deployment metadata and dashboard confirmation; successful HTTP 200 responses alone were not used as revision proof. Record this as source/deployment consistency, not a byte-level runtime attestation or acceptance of every provider workflow.

Read-only observations: the public Customer root returned its Orderly storefront HTML; `/api/customer/auth/registration/status` returned `direct`; `/api/customer/auth/google/status` returned `enabled=true`. Enabled Google configuration is not proof of fresh-auth deletion/provider acceptance. No production login, order, account or database mutation was attempted.

## Manual acceptance record

The owner confirmed successful manual functional UAT in the Stage 17.3 request and subsequent deployment-confirmation reply. This is recorded as **owner-confirmed functional UAT**, not an independently repeated test. The production deployment identifiers and aliases are now confirmed as described above; exact UAT execution date, detailed browser/device matrix, per-flow checklist and specific provider cases were not formally supplied. The record date above is not an invented UAT execution date. Existing historical checklists and failed runs are preserved; their boxes/results were not retroactively changed. Broad acceptance does not silently close specific Resend, Google-freshness, restore, logging or cross-engine evidence gaps.

## Portfolio verification

- README local links: no missing targets across seven packaging documents; required local commands match root/API/web manifests and Node 22.12+/pnpm 10.14.0. No migration/seed/test reset commands executed.
- Actual [GitHub packaging README](https://github.com/gin0753/Orderly/tree/stage-17/portfolio-packaging): five featured screenshots loaded and Mermaid rendered in GitHub's viewer. Local desktop/mobile preview also passed without page overflow. The default main README remains the older presentation until an approved merge.
- Canonical Admin MP4: 74.96s, 1440x900, H.264, full decode and local Chromium playback/seeking passed. The public candidate raw download matched the locally tested file byte-for-byte (SHA-256 `6678df8c62a090a42597a3ef844c66c4ac96218c33acb693b293fd2a76ac083e`). Separate polished version: 80.36s, 1920x1080, H.264; playback/seeking passed. No video selection/promotion or upload was performed; README still links the canonical 75-second recording.
- Videos: original MP4 2,197,915 bytes; polished MP4 2,786,231 bytes; WebM 5,208,504 bytes. All are real Git blobs, not LFS pointers, and well below GitHub's 50 MiB warning/100 MiB regular-Git limit. **No Git LFS or alternative host is required for these videos.** [GitHub file limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
- README now records owner UAT, the observed direct mode and provider-reported revision evidence while retaining implemented/UI/API-only/local-test distinctions and outstanding acceptance conditions. Existing 164 unit / 188 DB integration / 342 component / 45 selected Chromium results remain attributed to their earlier report, not fabricated new executions.

## Privacy and repository hygiene

Current tracked text scan: **1,026 files**, no matched private-key, provider-key, AWS-key, GitHub-token or JWT signatures. Only three `.env.example` files are tracked; no private environment/key file paths were found in the tracked tree or history filename scan. Test fixtures/placeholders are not public production Admin access. This is a bounded signature/path review, not a proof against every possible secret format.

The subsequent [final public release gate](final-release-gate.md) supersedes the earlier extension-based trace scan: all 489 text payloads across five current and one historical ZIP were inspected, including extensionless resources. Two historical JWTs were cryptographically matched offline to local Playwright fixture signing keys; no production credential exposure was identified. Sixty-four representative frames and all six extensionless PNGs were visually reviewed against synthetic fixture provenance. This is bounded visual review, not exhaustive pixel/OCR certification. Bulk trace retention and workstation-path metadata are non-blocking hygiene decisions; no original or history was changed.

## Issues and conditions

**Outstanding P0/P1:** none confirmed by this scoped audit. Previously fixed security linking/deletion revocation findings remain closed; no security control changed.

**Closed consistency condition:** production revision and public-alias association are verified by deployment metadata and owner dashboard confirmation.

**P2 conditions:** require candidate PR checks; retain real Google after-intent freshness/silent-SSO rejection, backup/restore/populated upgrade, deployed log-redaction and focused Firefox/Safari/assistive-technology evidence. Real Resend acceptance remains required before enabling verified signup; the observed direct demo does not exercise email delivery. Owner generic UAT does not certify these specific cases.

**P2/P3 documented limitations:** process-local HTTP rate counters, unverified direct/legacy emails, lazy expired-metadata cleanup, global identity coordination throughput tradeoff, API-only product lifecycle controls and the captured blank category Order column. These do not establish a new P0/P1 implementation failure. Polished-video selection and About/topics updates are optional presentation follow-ups. No payment provider, analytics or Admin settings UI is claimed.

## Release preparation and job applications

[Release preparation](../operations/release-guide.md) contains commit/merge/tag recommendations, release copy, About/topics and final URLs. Baseline candidate was clean; this audit's README/report drafts are intentionally **uncommitted**, so a final clean RC requires an approved reviewed commit. No `v1.0.0` tag was present in the public tag response.

**Readiness:** the implementation, revision-consistent and owner-accepted Customer demo, engineering evidence and portfolio media are ready to discuss in job applications with the stated boundaries. The finalized default-branch portfolio/tag remains conditional on approved Git publication steps and normal PR checks. The final exposure gate found no confirmed P0/P1 release blocker; trace curation is non-blocking maintenance. Do not describe V1 as fully provider-accepted, universally browser-tested or security-certified. No expensive suite was rerun; normal PR CI remains the release check.
