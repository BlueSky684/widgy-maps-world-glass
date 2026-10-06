# Live Mask1 screen recording — 2026-10-06

## Source and visible result

Owner supplied `ScreenRecording_10-06-2026 11-00-27_1.zip` at11:27 Asia/Jerusalem. It contains a16.035-second1320×2868 HEVC recording,959 video frames, creation metadata08:00:28Z. Reviewed the existing attachment locally; no recording or unrelated phone UI is committed to the repository.

The recording shows **LIVE MASK**, identifying Live1 rather than the new Persistent1 copy. D and N both show **06/10 11:00** whenever the composite is complete. This confirms that both actual mask bitmaps for that epoch reached native display. No five-minute advancement occurs in this16-second clip; it cannot establish later freshness, timer cadence or non-regression across epochs.

Three Calendar-to-Home returns are visible. On each, the night contribution and N stamp are visible before the day contribution and D stamp settle. During the partial interval, the daytime region over Europe/Africa/Asia is black or much darker. Calendar headings and Home headings also crossfade. This is not just a new five-minute data boundary: all visible bitmap stamps remain11:00 throughout repeated returns.

Approximate recording positions from quarter-second sampling (not touch latency):

| Return | Transition visible around | Partial N-only composition | Complete D/N composition by |
| --- | --- | --- | --- |
| 1 | 2.5s | 2.75–3.0s | 3.25s |
| 2 | 7.25s | 7.5–7.75s | 8.0s |
| 3 | 12.5s | 12.75–13.0s | 13.25s |

The first return was also inspected at10 samples/second. Finer sampling shows short additional fluctuations, so these coarse bounds should not be sold as exact frame counts or a complete blink inventory. Finger taps are not marked; there is no defensible tap-to-response measurement. The persistent map eventually appears on all three returns; there is no long blank Home interval in this short recording. That does not establish acceptable perceived speed or fix the visible composition defect.

## Interpretation and next bounded test

The day and night contributions are not presented together during tab transitions. The clip alone cannot distinguish Widgy visibility animation, compositing, image/source reevaluation, decoding or cache behavior. It does not prove a server failure, separate HTTP requests, mask epoch mismatch or memory pressure. Do not repeat the prior generic Interpolate→Off test, which the owner found slower.

Latest branch head already contains `tools/widgy-map-mask-persistent-1.html` in commit `79b2f40e9a0b142d81609c962c1b36c246482662`. Reused and verified that existing candidate instead of creating a duplicate Live2.

Persistent1 moves the unchanged night group84020, day group84010 and graphite background84040 together into root group84100. The new group copies Home's neutral1600×1600 coordinate/effect container and remains outside all navigation visibility targets. Home245 contains its title/navigation; Calendar247 and its existing full graphite cover remain unchanged. The four Web URL images, three bucket scripts, frames, effects, URLs, assets and API are identical to Live1. Calendar covers the map when selected; this is intended scene structure, not guaranteed background rendering, memory residency or atomic updates.

The earlier **Map Separate Layer1** experiment on a single full bitmap had no perceived speed benefit. This trial is justified by new repeatable native evidence of the two-contribution display defect. Its primary success gate is **joint appearance without the black daytime blink**. It is not a renewed claim that reparenting alone accelerates a full-map fetch. Stop this route if the same defect remains; do not create more arbitrary hierarchy variants.

`node tools/test-map-mask-persistent.mjs` checks the actual published page script with synthetic endpoints, exact reversal to Live1, unchanged sources/frames/effects/navigation, persistent visibility under both actions, unique IDs, and real copy/download/failure/recovery controller behavior. Native occlusion and compositing remain the device gate.

Next device check: import **Widgy Map Mask Persistent1** separately, verify its heading says **PERSISTENT MASK**, confirm Calendar covers the entire map, then make ordinary Home returns. Report whether D and N reappear together and whether navigation feels faster/same/slower. Existing Live1 and Five Minute1 are preserved. Later advancing matching stamps are still required before live refresh is considered verified. Weather, fitness, city and full Calendar reintegration remain deferred.

## Publication verification

Runtime commit79b2f40 has a successful Vercel deployment. The public Persistent1 page returned HTTP200,10,267 bytes, exactly matching the committed source; SHA-256 `ac90725e4e835dd6a998e2cdf23a84ab08446640756bf51f5fe307bf04910f09`. Tests passed with29 layers,4 images and3 variables. No runtime modification was needed in this review.

Chrome: `googlechromes://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-mask-persistent-1.html?v=map-mask-persistent-1`.
