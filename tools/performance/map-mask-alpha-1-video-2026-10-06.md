# Alpha1 device result and fixed-URL control — 2026-10-06

## Result

**Alpha1 fails the complete-map presentation gate.** White mask exposure is
absent from the reviewed samples, but the black daytime gap and N-before-D
sequence remain on both Home returns. Do not call changing white to black a fix.
The owner's earlier report that Appeared Off1 navigation is fast remains valid;
this clip provides no touch timestamps or new explicit Alpha1 speed assessment.

Source: `ScreenRecording_10-06-2026 13-09-06_1.zip`, supplied at13:11 Israel.
The actual MP4 (excluding the macOS resource fork) is20,537,593 bytes,
9.585 seconds,1320×2868,575 HEVC frames at60fps; creation metadata10:09:06Z.
Reviewed 38 samples at4fps, cropped locally to the widget. No raw video,
frame, unrelated phone UI or personal data is published in the repository.

The heading is **ALPHA MASK**. Complete map stamps both read **06/10 13:05**.
Approximate sample positions (not exact event onsets or touch latency):

| Direction | Visible evidence | Complete/covered state |
|---|---|---|
|Home → Calendar first|around1.00s, day area disappears and only N remains before the cover|Calendar blank by1.50s|
|Calendar → Home first|around3.00–3.50s, night contribution and N appear, central day area black|complete D/N by3.75s|
|Home → Calendar second|around5.00s, incomplete map while cover begins|Calendar blank by5.50s|
|Calendar → Home second|around7.00–7.50s, same N-only black-day phase|complete D/N by7.75s|

The repeated defect occurs within the same displayed epoch. A new five-minute
bucket is not necessary to explain its occurrence. This does **not** establish
absence of HTTP requests, cached-image decoding, source reevaluation or native
blend/animation work. Night still uses Plus Lighter; changing the two mask images
to Normal did not remove every blend. Native final-color fidelity and long-term
refresh are not approved by this clip.

## Next bounded question: literal URLs versus variable sources

Earlier fixed Compare1 uses a different mask representation and does not have
this exact Alpha1 transition setup. Its screenshots do not supply a controlled
navigation recording for the current configuration. The next control therefore
holds the current render setup fixed, instead of changing hierarchy or effects.

`Widgy Map Mask Alpha Fixed 1` changes only:

- The two mask image bindings become literal alpha-1 URLs at10:05Z/13:05 Israel,
  the same epoch seen above.
- Remove mask_epoch, mask_day_request and mask_night_request variables.
- Identifying document text and heading **FIXED ALPHA**.

All29 layers, four cached Web URL sources/providers, the two fixed3306×1558
textures,522×246 alpha masks, paint order, groups, frames, all eight appeared-Off
fields, remaining blends and native Home/Calendar actions stay identical to
Alpha1. No asset/API/hosting change or new blend enum. Calendar remains blank.
The actual source URLs remain network URLs; this is not an offline control.

Interpretation:

- If the defect remains, native variable evaluation and epoch change are not
  necessary to reproduce it. Investigate image-source/native composition next;
  do not infer that the network is entirely excluded.
- If it disappears, the variable/source resolution path is implicated, but one
  clip does not prove root cause or provide a live-refresh solution. Live epoch
  delivery would still need a separately verified approach.

This is a deliberately frozen diagnostic, not another cadence adjustment or a
replacement for the live map. Two ordinary Calendar → Home returns after initial
complete loading are enough to look for the known defect; no idle/five-minute
wait, manual effects change or timing chore. Preserve Alpha1, owner-reported fast
Appeared Off1 and Five Minute1 controls. Full widget/weather/fitness integration
remains pending until a complete live map is stable.

## Implementation checks

`node tools/test-map-mask-alpha-fixed.mjs` passes. The test executes the actual
import page, verifies its Persistent transform is unchanged, reverses only the
allowed delta back to the complete Alpha1 document, verifies zero remaining
native script/variable bindings and literal epoch URLs, and exercises copy,
download, failed preparation clearing, clipboard fallback, pageshow and retry.
`git diff --check` passes. Original Alpha1 page/transform and API are untouched.

Runtime commit6cea0ccb5abdc5376987b72e9f1d2705d1d088b0 deployed successfully.
`map-mask-alpha-fixed-1-public-verification.json` records five HTTP200 responses
with local byte identity: the fixed page/transform, unchanged Alpha1 page and
both actual13:05 alpha PNGs. The pair totals29,624 bytes, with correct revision,
time and immutable-cache headers. Native fixed-control result remains pending.
No successful visual or performance outcome is claimed.

Verified Chrome handoff:
`googlechromes://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-mask-alpha-fixed-1.html?v=alpha-fixed-1`
