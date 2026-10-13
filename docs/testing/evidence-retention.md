# C4 and Stage 17.4 evidence retention

Owner-approved revision recorded 13 October 2026. Source checkpoint `9c33c3482b81d48607559201797f5f77524ae489`. This policy explicitly supersedes C4's requirement for long-term preservation and durable-backup verification of every historical trace, screenshot, scan, log and intermediate artifact. It does not authorize history rewriting, publication of private output or deletion outside the approved Stage 17.4 candidate list.

## Owner decision

Orderly is the owner's personal public portfolio project, not a commercial compliance archive. Preserve application/test source, migrations, authentication/security protections and CI; current portfolio media; concise final acceptance/security conclusions, known limitations and unresolved regression findings; dates, test revisions/scopes and relevant evidence identifiers. Keep selected public evidence when it has continuing value. Redundant historical Playwright/axe/log/diagnostic artifacts may be removed without a separate durable backup after reviewing their role and external-obligation/active-investigation/release-critical dependencies.

No external retention obligation was identified in the reviewed repository evidence/operational records. The owner's revised decision supplies project context; this is not certification about unknown external agreements. Provider/customer-data retention is a different operating concern and is not waived by disposal of synthetic development test artifacts. A specific external obligation or unresolved release-critical raw-evidence dependency would require retaining that file and recording an exception.

The reviewed repeated-loading, hydration, logout, registration-fixture and image findings retain causal distinctions, failures and uncertainty in [browser investigations](browser-investigations.md), [acceptance chronology](acceptance.md) and [UI regressions](ui-regressions.md). No active release-critical investigation was identified that requires blanket preservation of all old runs. The held historical report's unchanged navigation still imposes particular dependencies; these remain available, as do selected evidence and the two holds below.

## Historical C4 checkpoint

Original source `85d90468901ea3211a864e2c844509a538ea2a47` had 1,067 original/planning files copied and checksum-verified under a restricted local root. The [original archive manifest](../c4-archive-verification-manifest.json) records that event and original path/hash mappings. Stage 17.4 independently verified the readable current counterparts mapped by that manifest: 925 exact current/archive matches out of 927 mapped repository files, with two byte-version differences. That check was not a recertification of every ignored/temporary archive file, backup, access policy, retention period or restore durability.

**Durable backup/restore, long-term retention and continued retrievability are not established.** Existing local copies and supplemental byte receipts do not imply a durable archive or public download. Under the revised owner policy these missing durability assurances no longer block reviewed redundant-artifact deletion. The local archive itself has not been deleted, moved or rewritten; access remains subject to owner control and privacy review. Do not publish local archive paths as working retrieval links or promise that removed originals can be restored.

The frozen [37-path C4 public inventory](../c4-public-git-evidence-paths.txt), [original inventory checksums](../c4-public-inventory-checksums.json), [privacy classifications](../c4-privacy-review.json) and [211-scan catalog](../c4-public-axe-scan-catalog.json) remain unchanged. Their paths are historical IDs, not assertions that every referenced raw object belongs in today's public tree. A separate Stage 17.4 deletion manifest records later disposition; do not change frozen hashes or counts to erase history.

The selected [25 public PNGs](../c4-public-evidence-index.md#representative-screenshots) and [acceptance handoff](../c4-acceptance-publication-handoff.md) remain. They preserve four-width findings and distinct failures/blocked outcomes. Raw axe incomplete rules remain manual-review observations; local synthetic browser checks and captions do not certify WCAG, real-device/provider behavior or unconditional production readiness.

## Two byte-version exceptions remain held

- `docs/stage-15.7-final-production-acceptance-report.md`: current 29,476-byte amended report differs from original archived 28,204-byte version. Both roles matter. Stage 17.4 copied the current bytes to a separate supplemental revision and independently read/checksummed them; the original archive version remains unchanged. The current held source itself is unchanged. Later amendments, failures and resumption outcomes are not conflated with the original checkpoint.
- `docs/stage-15.7-evidence/webkit-checkout-page-errors.json`: current 2,044-byte and original archived 2,067-byte versions have different SHA-256 values. Newline-normalized text and parsed JSON are equal; the difference is formatting-only. Both byte revisions and hashes are retained in the supplemental receipt, with no silent normalization of the held source.

The local implementation receipt `audit-artifacts/stage-17-4/implementation/supplement-receipt.json` records exact original/current hashes, roles and supplemental paths. It is an ignored operator record, not a durable-backup certification or public download. Both existing files remain on hold until independently resolved. Their active dependencies are retained or provided with explicit compatibility navigation; no held byte was overwritten.

## Public provenance and retiring navigation

Historical IDs/hashes remain searchable even when an object is retired. Resolver text must say **retired under owner policy; durable retrieval not guaranteed**, rather than falsely claiming a download. The original HTML gallery can become a clearly labelled curated resolver at the same URL, while retaining original gallery fingerprint and collection counts in catalogs. It must never pretend a smaller collection is the original complete gallery.

Short compatibility pages preserve historical Markdown paths that the held report cannot update. They point to complete consolidated findings and the dated Git source checkpoint; they are not new acceptance results. Selected before/after and native-zoom evidence remains, along with original full-run manifest IDs and a separate curation record.

## Privacy and future output

The final exposure gate records bounded trace-text inspection, fixture-origin token classification and sampled visual review with no confirmed P0/P1 credential exposure. This is not exhaustive pixel/OCR or arbitrary-secret certification. Realistic phone-shaped fixtures are synthetic in provenance but not proof of an unassigned number; do not contact them. Local user-directory metadata is reviewable workstation data, not itself a leaked production credential. Retiring a current-tree entry does not remove any old public Git blob.

Raw traces may contain session/cookie/DOM/network data and should remain ignored unless reviewed for a specific public purpose. Do not bulk-stage diagnostic trees. Future acceptance/layout/timeline output defaults to ignored per-run directories; explicit existing output overrides are preserved. Scoped `.auth/`, storage-state and HAR ignore rules protect common generated sensitive paths without hiding all JSON/PNG/ZIP/video deliverables. Public media and required assertions remain unchanged.
