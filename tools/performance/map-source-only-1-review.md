# Map Source Only 1

2026-10-05, branch `f50-widget-test`, parent `e6ae78456dd4f230ebf076d1bfbb419cb5e635c7`.

## Device evidence and next split

At 14:28:20 Asia/Jerusalem the owner reports “אין המתנה בכלל” (no waiting at all) in Navigation Only 1. This is a subjective fast result, without measured time or known cycle count. Minimal Pair 1, with the same native navigation but the image/five source definitions present, previously waited intermittently. This supports investigating that combined map block. It does not identify the server, GPS, script, native source scheduling or image decoding/presentation as the cause; nor does it exclude rare native-navigation stalls or other costs in the full widget.

Keep Navigation Only as a fast negative control, Minimal Pair as the small live-map reproduction and Lean as the practical working baseline. Do not restore Home/weather/calendar data yet.

## Narrow probe

`withMapSourceOnly` starts from Minimal Pair. Replace only image6170 with a native Text layer consuming `${widgy.map_request}` through the existing Custom Text/Text syntax used by approved Steps and Calendar labels. Reuse the Home nav label's BarlowCondensed-Light font and lime color. Preserve the image's frame, node ID, parent and position among siblings. Keep every other node, navigation action, all five variable definitions/IDs/formatters, the exact synchronous script and four GPS placeholders, endpoint, minute timestamp, source and document setting unchanged. There are 21 layers and five variables; no image layers remain.

The map_request result is an HTTPS URL displayed locally as ordinary text, not a Web URL/Web View image source or tap link. The script does not fetch. No image rendering endpoint, city geocoder or calendar source is called by the probe's configured text consumer. Retaining the actual script result as an active text dependency is more informative than adding unconsumed variables that Widgy might skip. Native Text and Image may nevertheless schedule/evaluate dependencies differently; fast text cannot prove identical GPS latency inside the image path.

The preparation page uses the same public C16 template plus inert placeholder pipeline as both controls. It needs no calendar session/private export. The agent uses synthetic coordinates only and never invokes native GPS or any external geocoder. The phone may display its actual coordinates in the URL; the user need not share, open or copy that displayed URL.

## Validation and limits

`node tools/test-map-source-only.mjs` passes. Restoring the one display object and name/description makes the entire document deep-equal Minimal Pair. Removing the new text and five definitions makes it deep-equal the fast Navigation Only control. The full input is immutable. All source objects and dependency references remain exact; IDs/tap targets are unique/valid. Text syntax, geometry and reused font/color match the intended native schema. Source inventory is six Custom Text/Text consumers, four native GPS definitions and one synchronous JavaScript source; zero image layers or calendar endpoints/tokens.

Three synthetic value cases (zero coordinates, signed decimal example, explicit missing coordinates) resolve the original complete HTTPS map URL, full3306 resolution and minute timestamp in the local VM; a stub throws on any fetch. This verifies value semantics only, not Widgy scheduling or freshness. The actual public-only page controller is tested for copy/download, failure, stale-payload clearing, retry, pageshow and blocked clipboard. No private data, real location, map service request or phone timing is used in tests. Widgy text display and speed remain unverified.

## Device gate

Page `/tools/widgy-map-source-only.html?v=map-source-only-1`, name `Widgy Map Source Only 1`. Import separately in the same slot/network. Home should display a long resolved URL instead of a map; Calendar remains the static CALENDAR TEST page. Confirm the text begins with https. Blank text or unresolved `${widgy...}` invalidates this diagnostic; repair compatibility before interpreting speed. No screenshot, coordinate copy, stopwatch or second phone is needed.

Then three Calendar→Home-and-back cycles: is it still immediate or does intermittent waiting return? If fast, investigate the combined image consumer/retrieval/render/decode path, retaining the exact sources for controlled comparisons. If slow, investigate active GPS/script dependency scheduling before adding image/network costs. A few fast cycles do not exclude a rare stall; either result is not a single-component proof. Do not promote the URL-text widget as a finished design or change server hosting on the strength of this test alone.

## Device result — 2026-10-05 14:42:04 Asia/Jerusalem

Owner: “אין עיכובים” — no delays in Map Source Only 1. Record a positive subjective report, not a numeric speed or proof that native source scheduling is identical for text/images. The last instruction asked for resolved https text first, and for a report if missing; this reply does not separately confirm resolved text or valid coordinates. Treat the inference about active GPS/script consumption as conditional on that display gate, and do not claim all GPS acquisition is proven fast.

Together with the immediate Navigation Only control and intermittently slow Minimal Pair, this strengthens the image-consumption/retrieval/decode/presentation path as a hypothesis if text resolved. No individual cause or paid hosting need is established. Next: a direct full-size prepared static PNG in the exact small navigation document, with zero variables/JS/GPS and no per-request image render. This reuses an existing asset without resizing/re-encoding and differs from earlier static tests inside the full four-tab widget. See map-static-only-1-review.md.
