# C4 evidence retention and commit preparation

Prepared 11 October 2026 (Australia/Sydney). Audited HEAD: 85d90468901ea3211a864e2c844509a538ea2a47. **Preparation only: no commit, staging, push, deployment, archival, moves, deletion, historical-report edits or application changes are authorized or performed.**

## Reconciled inventory

The expected 920 untracked files match the previous audit minus C1–C3, plus the Phase 1 execution record. No unexpected tracked/staged changes were present. Audited sizes and available original SHA-256 fingerprints match.

| Scope | Files | Bytes | Treatment |
| --- | ---: | ---: | --- |
| Remaining untracked | 920 | 209094784 | Complete per-file A/B/C/D assignment |
| Relevant pre-existing ignored repository evidence/helpers | 114 | 137635220 | 4 ignored initial-audit files plus 110 existing audit-artifacts files; no ignore changes |
| Phase 1 external temporary evidence | 18 | 2160146 | Preserved failure and generated evidence/helpers from its existing isolated snapshot |
| New ignored preparation helpers | 8 | 2705627 | Scripts, review data and five contact sheets; category D, retention pending |

No untracked application code, migration, schema, required test fixture or build dependency remains. Fixture identities occur inside screenshots/captures; these are evidence, not new fixtures to remove. The committed test suites, database guards, seeds, migration history and photo assets remain required. Build/cache/dependency trees are excluded from forensic file traversal and remain ignored; their reproduction prerequisites are documented in the index. Older ignored audit records are listed conservatively, not classified as disposable.

| Remaining file type | Count |
| --- | ---: |
| axe_result | 283 |
| browser_trace | 5 |
| diagnostic_dom_result | 136 |
| diagnostic_log | 26 |
| documentation | 9 |
| generated_gallery | 2 |
| screenshot | 431 |
| structured_result | 28 |

## Exclusive categories and intended disposition

A recommends Git after explicit execution/publication approval. B recommends restricted external preservation. C requires manual privacy review and has an intended A/B disposition. D leaves generated/historical retention pending. No category permits deletion. Category counts below are exclusive; proposed Git paths include one unresolved C file and therefore are conditional.

| Scope | A | B | C | D |
| --- | ---: | ---: | ---: | ---: |
| remaining_untracked | 301 | 214 | 402 | 3 |
| ignored_repository_evidence | 0 | 99 | 13 | 2 |
| phase1_temporary_evidence | 0 | 0 | 3 | 15 |
| new_ignored_preparation_helpers | 0 | 0 | 0 | 8 |

## Proposed minimal Git boundary

[Explicit inventory](c4-proposed-commit-paths.txt): **302 original files plus 7 new planning artifacts = 309 paths**, subject to privacy/link-policy approval. It includes four existing human documents, 40 representative PNGs, the complete 210 final engine axe JSONs, compact original run logs/results/version/keyboard/performance records, the initial Firefox stress scan and failed-run records, and these manifests/index/decisions. The 210 raw axe files are necessary to substantiate the reported 70 scans per engine and review every incomplete result; retaining only a handful would weaken traceability. This is a 40-screenshot proposal, not a 287-image gallery commit.

The previous C4 recommendation had 561 original candidates plus the later audit/execution records. This new selection intentionally reduces image publication; it is a proposal requiring approval, not execution of the previous broad boundary. Neither original HTML gallery is selected. Their generated format is reproducible, but their historical contents and referenced originals must be preserved as a complete archive package if retained. The archive list explicitly records gallery dependency copies, including selected Git images, rather than silently breaking the archived gallery.

Screenshots cover all four widths for storefront/configurator/delivery/detail/tracking; additional cart, pickup, confirmation, login/registration, account/security, order-history and state/failure examples remain. Identity-bearing selected views were inspected at full size in addition to contact-sheet coverage; visible contacts/orders match committed synthetic fixtures. No unmasked password, browser chrome, token or unrelated desktop was observed. This is a bounded visual review, not OCR or proof that a realistic phone fixture is unassigned. Publish only after the owner's fixture-policy decision.

## Privacy review and limitations

All manifest-listed non-image/non-ZIP text files were scanned in memory with UTF-8 BOM/UTF-16LE decoding as required. Pattern checks cover recognized keys/provider tokens/JWTs, serialized auth/session/cookie fields, credential assignments, OAuth callback query parameters, identity-shaped strings and local/private infrastructure metadata. Findings record rule names and paths, never matched values. No recognized private key/provider token/JWT was found in proposed Git inputs. That does not establish the absence of arbitrary secrets or real customer data.

The apparent JSON parse issue in webkit-checkout-page-errors.json was a UTF-8 BOM: decoding in memory parses its single event correctly, without changing bytes. The private-network-like hit in the Stage 15.7 report is its Windows OS version with an invalid IPv4 octet, not a private network address. The Phase 1 execution report still exposes local user-directory metadata and remains category C, intended A. Trace privacy relies only on unchanged hashes and the prior six-trace pattern review; frames/opaque payloads remain unreviewed here. Older ignored/temporary ZIP payloads are not newly certified.

Unselected PNGs/error contexts/traces remain category C for restricted review; older ignored logs with identity/credential-like hits are not public Git candidates. Localhost timings/paths and synthetic examples are not proof of live secrets, but owner review is needed before public publication. [Unresolved decisions](c4-unresolved-privacy-decisions.md) specify the remaining gates. No values, cookies, OAuth callback payloads or real customer exports are reproduced in new reports.

## External archive contract

[Machine manifest](c4-evidence-manifest.json) fingerprints every original in scope. [Archive candidate list](c4-external-archive-candidates.json) contains 797 candidate/pending/dependency-copy records, explicitly distinguished by archive_role. Proposed paths preserve original repository layout under a commit-keyed namespace. The archive URI, provider, access, retention and verification receipt remain undecided. No archive object exists merely because a proposed path appears here.

All five untracked Stage 15.7 traces and the ignored original Firefox trace remain present, along with the four ignored initial-run files. Preserve failed histories, DOM-only and screenshots-only diagnostics, HTML dependencies and Phase 1 failure evidence. Do not deduplicate by deleting paths: path/role mappings are significant even when SHA-256 matches. Before any later archive action, approve location/access, copy without destroying originals, verify each byte size/hash and dependency closure, and issue a durable catalog/receipt. Cleanup would require separate approval.

New preparation helper scripts/data/contact sheets are ignored under audit-artifacts and are reproducible work products. They are cataloged separately from the pre-existing manifest baseline, are not public evidence candidates, and must not be mistaken for archived originals. No helper or temporary output is removed in this preparation. The main manifest does not hash itself or new deliverables recursively; those are listed separately as category A/proposed planning artifacts and can receive detached checksums at publication time.

## Documentation integrity

[Link audit](c4-documentation-link-audit.json) enumerates Markdown file/directory links and both HTML galleries. **3 historical evidence link occurrences** would lose a target in a minimal Git snapshot; all their original targets still exist locally. Fragment anchors are not validated; remote URLs are omitted to avoid exporting URL payloads.

- docs/stage-15.7-final-production-acceptance-report.md:52 → docs/stage-15.7-evidence/screenshots.html
- docs/stage-15.7-final-production-acceptance-report.md:124 → docs/stage-15.7-evidence/webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/test-failed-1.png
- docs/stage-15.7-final-production-acceptance-report.md:124 → docs/stage-15.7-evidence/webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip

The existing final gallery points to 287 distinct PNGs, while this proposal keeps only a representative subset. Do not commit that original HTML with missing images. The new [evidence index](c4-evidence-index.md) provides the curated local views and archive ID/hash mapping without changing old reports. It is an additive resolver design, not an automatic fix for old Markdown links. Before C4 publication, approve an immutable complete companion bundle with original paths, or explicitly approve those precise historical link edits. A plain minimal clone alone will not resolve every old link.

## Acceptance provenance and stop point

C1–C3 source is committed, but the historical Stage 15.7 report is an earlier working-tree audit with PASS WITH CONDITIONS and unexecuted manual UAT. The Phase 1 report separately records a storefront decode timeout and Docker-dependent validation limits. Preserve both timelines; do not claim fresh matching deployment/device/a11y acceptance. Reproduction instructions use existing guarded local infrastructure and an isolated output tree; no tests or database operations were run during this preparation.

Only the seven listed deliverables and ignored review helpers are newly written. Verify HEAD/index, original hashes and remaining inventory before any approved later stage. Stop here pending decisions and separate execution authorization.

## Preparation verification

Completed read-only checks: HEAD and Git index fingerprint unchanged; zero tracked/staged differences; all 1,060 manifest records have matching original/helper byte sizes and SHA-256; unique evidence IDs and archive paths; all 309 proposed paths exist; exactly 40 selected PNGs and 210 final engine scans (70 per engine), plus the separately retained initial stress scan; archive-list hashes match the main manifest; both historical galleries have no currently missing image targets. The three impacted Markdown links describe a future minimal-clone retention issue, not missing files today.

Resulting untracked count is 927: the original 920 plus seven new deliverables. Eight ignored review helpers are cataloged separately. No application code, original documentation or retained evidence changed; no test/database operations, staging, commit or archive execution occurred.
