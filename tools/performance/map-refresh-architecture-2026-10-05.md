# Live map refresh: capability boundary and architecture measurements

Date: 2026-10-05. Repository: BlueSky684/widgy-maps-world-glass. Target branch: f50-widget-test. Baseline read and verified remotely: f56c6cdc5688e4bb48bae8c6c3e50676e0412be2.

## Outcome

No verified Widgy-only solution yet meets all three requirements: a fresh map/location, immediate Home navigation, and the approved full 3306×1558 lossless appearance. No runtime, widget export, URL TTL, production branch, or source master is changed by this research commit. The five-minute URL trial remains unverified and is not the next requested device import.

The most useful architectural direction is to remove network acquisition from the navigation/render path: display a completed local image; download a replacement separately; validate and commit it; then ask for a refresh. Apple documents the necessary app-author lifecycle hooks. No corresponding arbitrary background image handoff or last-good-image API exposed to Widgy JSON/JavaScript was verified. This is a capability gap in available evidence, not proof that Widgy can never implement it.

## New primary-source evidence

1. Widgy developer duke4e directly answered a user whose cached web image did not refresh and whose No Caching image disappeared when the host was unavailable. The developer replied that they had no solution. This historical exchange closely matches the required last-good-image behavior; it does not establish current v27.0.1 behavior or uniquely diagnose this phone.
   https://www.reddit.com/r/widgy/comments/v3jslo/widgywatchy_faq_and_feature_requests_megathread/ (exchange beginning with the question about a web URL image that changes server-side under the same URL).
2. Current official release history v27/v27.0.1 documents per-slot refresh, variable reuse, improved image memory, and async-script fixes. The developer's v27 announcement documents improved local-image refresh and slot-specific Reload Shortcuts. Neither source documents a user-supplied background download/completion/atomic image swap API.
   https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481
   https://www.reddit.com/r/widgy/comments/1w5rb1m/announcing_widgy_v27_public_beta_next_week/
3. Read the complete Apple Markdown documentation this session, successfully fetched directly after web extraction returned a JavaScript-only page. Widgets are not continuously active; background URLSession events can complete downloads and request a new timeline. These are Swift app-author hooks, not commands a Widgy template can be assumed to call.
   https://developer.apple.com/documentation/widgetkit/making-network-requests-in-a-widget-extension.md
4. Apple distinguishes predicted timeline entries, timeline reloads, and live date displays. Its typical 40–70 daily reload budget is adaptive, not a guaranteed cadence or a universal cap on all display changes. App-intent interactions are among budget-exempt cases. Do not use this budget as an explanation of the Calendar-to-Home stall or promise a periodic JavaScript timer.
   https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date.md
5. A creator describes updating PNG files with Shortcuts and displaying them through an image-from-file source; another firsthand report describes file replacement refreshing on an iPad but not an iPhone, with the developer discussing memory/device differences. This establishes precedent and contrary evidence, not validation on the owner's current phone.
   https://www.reddit.com/r/widgy/comments/uhr9t8/i_made_this_widget_so_i_can_see_the_battery_level/
   https://www.reddit.com/r/widgy/comments/w6iaqu/widget_not_updating/
6. Apple's current iOS27 Shortcuts guide documents event/time-of-day triggers with daily/weekly/monthly recurrence. It does not provide evidence for an unrestricted reliable one-minute background loop. A local-file design still needs a separately validated, acceptable update trigger and location cadence.
   https://support.apple.com/en-ph/guide/shortcuts/apd932ff833f/ios

## New measured experiment: static terrain plus exact replacement pixels

This is an actual split of the image, unlike the previously rejected experiment that only reparented the existing full map layer. The benchmark runs the current renderer with approved source assets, then constructs an immutable terrain base and an RGBA overlay holding current pixels wherever they differ from that base. All seven locations/dates are synthetic; no personal coordinates, city lookup, or calendar data are read.

Reproduce from repository root:

```sh
node tools/build-map-cache.mjs
node tools/benchmark-map-refresh-architecture.mjs > work/architecture-report.json
```

Create `work/` first if missing. The cache builder is the existing deployment preparation, not a new pre-rendered future-frame schedule. Raw results and environment versions are in `map-refresh-architecture-2026-10-05.json`.

| Case | Whole PNG bytes | Changing overlay bytes | Recurring bytes saved | Full-size differing pixels | Differing pixels at width 367 |
| --- | ---: | ---: | ---: | ---: | ---: |
| october-evening | 4,319,404 | 2,267,643 | 47.5% | 0 | 14,126 |
| october-morning | 4,079,714 | 1,588,616 | 61.06% | 0 | 8,491 |
| march-equinox | 3,942,118 | 1,385,757 | 64.85% | 0 | 10,022 |
| june-solstice | 4,152,286 | 1,847,436 | 55.51% | 0 | 7,902 |
| december-solstice | 4,172,236 | 1,877,911 | 54.99% | 0 | 14,819 |
| synthetic-zero-marker | 4,329,622 | 2,280,989 | 47.32% | 0 | 14,090 |
| synthetic-edge-label | 4,166,171 | 1,865,567 | 55.22% | 8 | 8,428 |

The immutable base is 3,256,497 bytes, paid additionally on first acquisition/cache eviction. The recurring overlays range from 1.39 to 2.28 MB decimal, not tiny solar metadata. The theoretical RGBA allocation for two full-size surfaces is 41,205,984 bytes versus 20,602,992 for one; these are buffer sizes, NOT measured Widgy RSS or proof of a memory-limit failure.

All encoded base/overlay PNGs round-trip their own RGBA pixels exactly. Recombining at full size is exact for six cases. The deliberately edge-positioned synthetic marker differs by one channel level at eight pixels because the tested compositor rounds partial-alpha colors. The first strict run stopped on this case; the benchmark was changed to report rather than hide the failed parity gate. No runtime workaround or tolerance was adopted.

For each case, compare resizing the original single image with resizing each layer independently and then composing them. At widths 1102 and 367, all cases differ. At width367 there are 7,902–14,819 changed pixels, with mean absolute channel errors about0.15–0.38 and maxima27–58. This uses local sharp/libvips Lanczos sampling; it is not a measurement of Widgy/CoreGraphics. It is sufficient to reject a claim that full-size parity guarantees unchanged widget appearance. Sparse transparent overlays and independent resampling do not generally commute.

The prototype still renders the entire map before extracting an overlay. Its render/extract/encode times are local single-run samples, not an optimized service benchmark or an iPhone speed comparison. The experiment validates encoded byte reductions and the compositing limitation; it does not validate faster navigation.

Decision: do not deploy this split or ask for an import. It retains a network image dependency, adds a full-size image surface, and has an unresolved appearance gate. A more elaborate native mask/tile approach would require verified Widgy schema and measured sampling semantics; do not invent either.

## Alternatives and remaining gates

| Candidate | What it can remove | What remains / decision |
| --- | --- | --- |
| Longer-lived cached URL | Some repeated requests | Has already shown stale pixels; does not meet live freshness. |
| Shorter/five-minute URL or No Caching | May cause retrieval of new pixels | Fetch/decode may still be on navigation path; no independent commit mechanism. |
| Pre-render ready global frames on server/CDN | On-request solar render and some origin latency | Download/decode/lifecycle still remain; personalized marker must remain private or be separate. No deployment justified as a complete fix. |
| Static terrain + dynamic raster | 47–65% of recurring encoded bytes in this prototype | Sampling parity, additional surface, and blocking image fetch remain. Not adopted. |
| Local PNG + separate Shortcuts updater | Navigation need not start a network image request if Files reads the already-local bytes | Current Files linkage/replacement behavior, refresh/state retention, device decode cost, lock-screen execution, scheduling and location freshness unverified. Best bounded feasibility direction, not a promised final solution. |
| App-author WidgetKit implementation | Explicit control of last-good pixels, background download, validation, state and reload | Requires native app work or Widgy developer support; OS scheduling still applies. Not a drop-in Widgy JSON fix. |

## Smallest useful device capability check, if continuing with Files

Do not ask for another time-bucket import. First obtain a tiny native export that proves current image-from-Files serialization and permissions. Use a new disposable widget containing one Image linked through the actual Files picker to a harmless PNG, or inspect the current image-source picker before giving exact v27 UI labels. Do not handcraft a security-scoped bookmark, reuse another app's sandbox path, or embed a phone-local URL guessed from examples. No matching Files-bound image node was found in the currently inspected public F50 template.

Then use one isolated copy of the minimal map diagnostic, with a local 3306×1558 PNG and no web-image/GPS/script sources left in the widget. The external updater will ultimately own acquisition/GPS; merely changing the image source while leaving active request sources would not isolate the local display path.

Feasibility sequence (not an automatic live solution):
1. Read completed local frame A and verify navigation.
2. Independently obtain frame B with a visibly different burned-in map time. Preserve raw PNG bytes; do not resize or use an image-conversion action.
3. Replace the selected file only after successful download and validation; request a supported slot reload after completion. A generic Shortcuts Save File action is not evidence of atomic replacement. Verify file bookmarks survive replacement instead of silently losing the reference.
4. Verify new B is visible, no old-A regression through navigation, and retained last-good pixels on offline/failure. This is manual transfer/retention evidence, not cadence proof.
5. Only after those gates: pick and verify supported automatic triggers, background execution while locked, location availability and freshness. Shortcuts must not be attached to the Home navigation tap, which would put the wait back into that path.

No developer message was sent, no new service or automation was installed, and no paid plan change was made. A higher Vercel/GitHub tier is not supported by the present evidence as the cure for the missing client lifecycle control.
