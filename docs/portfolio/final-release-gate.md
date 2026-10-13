# Final public portfolio release gate

Recorded 13 October 2026 (Australia/Sydney). **PASS WITH CONDITIONS: no confirmed release-blocking P0/P1 finding.** Ready for an approved documentation commit, normal PR checks, merge and `v1.0.0` release. This is a narrowly scoped exposure review, not a repeated functional/security audit or unconditional operational certification.

## Candidate and scope

- Branch: `stage-17/portfolio-packaging`; HEAD: `9c33c3482b81d48607559201797f5f77524ae489`; main: `81da702f0cde77c0527595d0a02cf2f94bdb8570`. Four commits ahead, zero behind at review. Preparation documents remain uncommitted.
- Application source, CI configuration and lockfile match main. Production consistency is verified by deployment metadata and owner dashboard confirmation for both hosting aliases; see the [release audit](final-release-report.md).
- Reviewed tracked artifacts and locally reachable Git history (`--all`), including historical blobs absent from HEAD. Unreachable objects, unadvertised remote refs, private hosting environments and production logs are outside this review. No production authentication or mutation was attempted.
- No full test suite, application/configuration change, credential rotation, database change, Git publication operation or deployment was performed. Only release documentation was updated; generated scan evidence remains under ignored `audit-artifacts/`.

## Sensitive-data findings

| Evidence | Result and disposition |
| --- | --- |
| Reachable history | 4,395 objects; 1,985 text blobs / 20,445,797 text bytes inspected. No recognizable private keys, provider/AWS/GitHub credentials or JWTs in those text blobs. An additional literal-assignment review classified 56 credential-field occurrences as placeholders/test fixtures; no unresolved value remained. This is bounded signature/context analysis, not a guarantee against every secret format. |
| Environment/auth-state/HAR paths | Only three environment example files are tracked; no private environment/key file paths found in tracked/history path review. No tracked standalone HAR or saved browser authentication-state file found. Authentication-state test source is application test code, not stored login state. |
| Trace ZIPs | Five current Stage 15.7 ZIPs and one history-only browser-failure ZIP: all 489 non-image text payloads read, including extensionless resources. Current five contain no matched authentication-secret signatures. Six remaining opaque resources were identified as PNGs, extracted and visually inspected. |
| Historical trace tokens | The history-only localhost trace contains two unique JWTs. Offline HMAC verification matched both to committed Playwright **test** signing keys. They are local synthetic-fixture sessions, not discovered production credentials. This conclusion does not rely on expiry: not every token is expired. No raw tokens are reproduced here and no token was tried against production. |
| Images and recordings | 1,732 extension-labelled trace images enumerated; 64 representative frames reviewed, plus all six extensionless PNGs. Synthetic identities/order/catalog content agrees with browser fixtures; password fields in sampled authentication frames are masked/empty. Five image metadata records were checked without author/GPS/workstation-path/credential matches. Portfolio media review from Stage 17.3 remains applicable: synthetic data, no public Admin credentials, and recording authentication occurs before capture. No complete pixel-by-pixel/OCR certification is claimed. |
| Personal-data context | Identity-bearing trace/error snapshots match committed synthetic fixtures using reserved example domains. Realistic phone-shaped test contacts are synthetic in provenance; that does not establish that a number is unassigned. Do not use these fixtures to contact anyone. No actual customer record or private customer identity was identified. Public Git attribution is expected repository metadata. |
| Workstation metadata | Four reports contain local user-directory paths. These expose workstation metadata, not a production credential or identified customer record: P3, non-blocking. Optional redacted derivatives/retention changes need a separate review; originals/history were not changed. |

The former trace-publication uncertainty is now assessed using complete text-payload inspection, offline token classification, fixture provenance and bounded visual review. It does **not** establish a confirmed P0/P1 exposure. The older C4 restricted-retention recommendation remains a historical policy/proposal; this gate does not approve deletion, relocation or history rewriting. Bulk trace curation remains a non-blocking maintenance decision, rather than a finding of a leaked production session. Removing a future tree entry would not erase public history.

## Ignore coverage and maintenance

`.gitignore` covers private `.env` variants, `audit-artifacts/`, `test-results/`, `playwright-report/` and normal build output. Probe paths verified these rules. Existing capture/test workflows use protected output locations and do not publish saved authentication state.

Standalone `playwright/.auth/admin.json`, `storage-state.json`, arbitrary `*.har` and `trace.zip` paths outside those folders are **not** covered. This is a P2 preventive-hygiene gap, non-blocking because no such standalone sensitive artifact is currently tracked. A separately reviewed follow-up can add scoped auth-state/HAR/recording-output rules. Ignore rules never remove already tracked blobs. Raw diagnostic bundles should continue to receive review before an explicit `git add`; do not blanket-stage generated evidence.

The five current ZIPs total 134,570,485 bytes (largest 44,732,682 bytes): repository weight, not an identified security blocker. The three portfolio videos remain below normal Git file limits and need no LFS. No retention operation is necessary to remedy a confirmed live-secret leak in this gate.

## Remaining acceptance conditions by exposure

| Condition | Current release classification | When it becomes blocking |
| --- | --- | --- |
| Real Resend delivery/domain/link acceptance | Non-blocking: public registration was observed in `direct` mode. Source disables mail delivery in direct mode; these accounts remain unverified. | Before enabling/claiming acceptance of verified registration and real email delivery. |
| Google deletion fresh-auth/provider behavior | Non-blocking security gate, unresolved functional/provider acceptance. Google is enabled, but deletion requires signed, after-intent, recent `auth_time`; missing/stale evidence is rejected. No fail-open fallback was found in this focused condition review. | Before claiming live Google-only deletion acceptance; any demonstrated bypass would be a release blocker. Provider rejection may limit that flow's availability and remains disclosed. |
| Backup/restore, populated migration/cutover | Non-blocking for this documentation/media release: no schema/runtime changes or database operations. Production restore capability is not certified. | Before destructive/populated migration, risky data rollout or claiming proven recovery. |
| Deployed log redaction / operator diagnostics | Non-blocking evidence gap here: no actual public secret-bearing diagnostic output identified. Private production logs were not inspected. | Before publishing production diagnostics or if actual credential/PII leakage is demonstrated. |
| Coordinated rollout and hosting rebuild | Normal publication condition: hosting integrations may rebuild on main merge even with identical application source. | Merge requires approval covering its hosting effect; verify resulting deployment metadata after any approved rebuild. |
| Cross-engine/device/assistive-technology matrix | Non-blocking, disclosed coverage limitation; no fabricated universal compatibility claim. Historical failures remain preserved. | Before claiming that expanded acceptance has passed. |
| Process-local throttling / lazy expired-record cleanup | Non-blocking documented V1 operating limitations; no new bypass established. | Reassess for multi-instance scaling or concrete abuse/capacity evidence. |

Owner functional UAT passed; exact execution date and detailed browser/device/provider matrix were not supplied. This attestation does not close the specific conditions above. Current Admin authorization and Security 2A/2B are unchanged; no public Admin demo or credentials are introduced.

## Approved-operation sequence (recommendation only)

The original staging commands described the pre-hygiene layout and are superseded. Review the completed hygiene diff, held exceptions and evidence disposition before any separately approved commit/push/PR/merge/tag. Require ordinary PR checks and approval covering hosting side effects, then record the resulting main/deployment revisions before publishing an annotated release tag. The [operations guide](../operations/release-guide.md#release-preparation-appendix) contains the retained draft release/About/topics copy. No Git publication operation, provider change, production data action or history rewrite is performed by Stage 17.4.


Validation: all local links in the four release documents resolve; Markdown fences are balanced and `git diff --check` passes. The final worktree contains only README changes and three new release documents. Runtime/CI/lockfile delta against main remains empty. Private scanner/token evidence is verified ignored and is excluded from the explicit staging sequence. No functional suite was rerun.


## Stage 17.4 retention amendment

The earlier statement that trace curation needed a separate decision is resolved by the owner's [13 October revised retention policy](../testing/evidence-retention.md). Redundant synthetic historical artifacts may be retired within the reviewed candidate scope without certified durable backup. This changes retention only, not the dated security/functional findings above. Both byte-version exceptions and dependencies of the unchanged held report remain. Current-tree deletion does not erase Git history. The validation paragraph above is the historical gate result; current hygiene validation is recorded in its local final cleanup report.
