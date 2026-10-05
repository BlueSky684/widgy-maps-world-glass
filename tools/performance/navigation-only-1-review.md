# Navigation Only 1

2026-10-05, branch `f50-widget-test`, parent `9024008f859978ceae437579b105557ccc475a1c`.

## Evidence and decision

At 13:44:34 Asia/Jerusalem the owner reports that Minimal Pair 1 sometimes waits and sometimes does not. Intermittence survived whole-widget reduction to 21 layers/five map definitions. This does not quantify improvement or establish which stage waits; no separate missing-map report. Preserve Lean as working control and Minimal Pair as the small live-map reproduction. No server, asset, full-design or city-path change is warranted from this report alone.

Build one negative control on this exact small baseline. Previous no-map tests retained the rest of the original four-tab widget and its sources, so they did not measure this minimal two-screen navigation with no variable definitions. This is not another cache-buster, reparenting, native-ring or empty-city-prefix variant.

## Change

`withNavigationOnly` starts from `withMapMinimalPair`. Delete Home map image6170 and the five remaining variable definitions; change only version name/description additionally. All other fields deep-equal Minimal Pair: both roots, native background/title, 20 remaining layers, Home/Calendar buttons/actions, frame, fonts, colors and metadata. No scripts, Location providers, image layers or calendar URLs remain. Home is intentionally empty apart from navigation; Calendar still shows CALENDAR TEST and navigation. No sources are restored. The full widget and earlier diagnostic stay intact. Font resource metadata remains, so do not claim zero possible OS/network work or a wholly identical rendering workload.

The controller uses the same public-only C16 preparation pipeline and inert placeholders stripped before copy/download. No account connection, private calendar export, location/geocoder request, server telemetry or new provider is needed.

## Validation

`node tools/test-navigation-only.mjs` passes. Deep comparison verifies exactly one image/five definition removals plus metadata. Input full widget is immutable. There are 20 unique IDs, zero variables/images and five remaining Custom Text/Text sources; no variable reference by name/UUID, API URL or token remains. All four navigation actions target the surviving roots. Three modeled cycles plus current-tab taps keep exactly one root enabled. Real page controller copy/download/public-template failure/retry/pageshow/blocked clipboard paths pass with synthetic fixtures; stale output is cleared on failure. No actual iPhone transition or OS scheduling is simulated or timed.

Page: `/tools/widgy-navigation-only.html?v=navigation-only-1`, name `Widgy Navigation Only 1`. Native import and native speed remain unverified until the owner tries it.

## Device question and stopping rule

Same slot/network as Minimal Pair; retain the old copy. After the widget appears, make three Calendar→Home→Calendar cycles. No map should appear. Ask only whether there is still occasional waiting. No stopwatch/video/second phone/permission reconnect.

If waiting also occurs, the map block is not necessary for the observed symptom on this sample. Shift toward native widget presentation/runtime/device context; do not assert a confirmed Widgy bug or rule out additional map costs in the real widget. If consistently immediate, the result supports investigating the combined map block on this small baseline; it does not isolate GPS, script, transport, renderer or decode. Three fast cycles cannot exclude a rare stall. Avoid promoting this intentionally empty test or restoring other sources before map stability is resolved.
