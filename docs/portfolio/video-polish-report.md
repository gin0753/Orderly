# Admin walkthrough polish — manual review copy

Prepared 13 October 2026. [Polished MP4](assets/admin-walkthrough-polished.mp4) · [Original MP4](assets/admin-walkthrough.mp4) · [FFmpeg editing script](../../scripts/portfolio/polish.mjs) · [Caption timeline/hashes](assets/polished-chapters.json)

## Inspection and before/after

The original in-browser captions are actually visible. Their 17px text is small in embedded playback, disappears briefly during navigation, and the category caption describes available controls rather than operations demonstrated. Two chapter labels lag their visible scenes: product-list navigation and category dragging. The existing `timeScale=1.1137` stretches duration (about 10% slower playback); it does not accelerate the recording. No further playback retiming was applied.

| Before                                    | Review export                                                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 74.96 seconds, 1440x900                   | **80.36 seconds, 1920x1080**, 25 fps                                                                                        |
| Small recorded overlays only              | 16 short English FFmpeg-burned captions, **44px white text**, semi-transparent black boxes, consistent bottom-center footer |
| Caption gaps during navigation            | Continuous caption intervals throughout the walkthrough                                                                     |
| Product/reorder labels lag the scene      | Product label starts at source 26.80s (output 29.20s); reorder label at source 64.15s (output 66.55s)                       |
| Broad category feature description        | “Manage menu categories,” followed by actual availability and reorder actions                                               |
| API-only operations labeled in small text | Explicit “API-only” availability/archive captions in the larger footer                                                      |
| Immediate opening/ending                  | 2.4-second branded intro and three-second closing with Customer demo and repository URLs                                    |
| 2,197,915 bytes                           | **2,786,231 bytes** (2.79 MB)                                                                                               |

The complete recorded viewport is scaled to 1344x840 and centered within the new canvas; no application pixels are cropped. New captions occupy a separate 240px footer and sit above the native player toolbar at the tested 720px player width. **Original in-browser overlays remain visible** inside the footage; removing them would require reconstructing covered pixels or recapturing. This export deliberately retains them and adds a more readable editorial layer. Operation order, data and meaning remain unchanged.

## Validation

- FFmpeg 6.1.1 export: **H.264 High, level 4.1, yuv420p, square pixels, 25 fps**; no audio stream. Fast-start `moov` precedes `mdat`.
- Full decode completed without errors. Beginning, middle, end, API-only and reorder frames inspected, including eight local Chromium seek samples.
- Chromium loaded the actual 1920x1080/80.36s media, played and sought successfully, with no media/runtime errors. Native-control overlap found in an initial layout was corrected and the final layout rechecked.
- Sixteen caption intervals validated as continuous and positive. Both original chapter JSON files are unchanged; the new timeline records the two reviewed timing adjustments.
- Original and backup SHA-256 match: `6678df8c62a090a42597a3ef844c66c4ac96218c33acb693b293fd2a76ac083e`. Export SHA-256: `47301a3b165880e3e21e0a4446538636bc2fb5a588b1bcc183358e877a87a356`.
- Editing-script syntax and diff checks passed. [Workflow instructions](../../scripts/portfolio/README.md) describe reproducibility and font/encoder requirements.

The original remains at its existing path and a byte-identical backup is retained at `audit-artifacts/video-polish/admin-walkthrough.original.mp4`. The README still links the original; the polished version is **awaiting manual approval**, with no automatic promotion or backup deletion.

No application changes, database changes, production interactions, full Playwright recapture, new dependencies, music, narration, commits, pushes, uploads or deployment occurred. GitHub upload/playback was not tested; compatibility evidence is the standard H.264 export and local Chromium playback. Existing provider/release limitations and captured UI findings remain unchanged.
