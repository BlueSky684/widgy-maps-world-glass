# Map Minimal Pair 1

2026-10-05, branch `f50-widget-test`, parent `57396e4268061d7e6771d1ab1722a2d595f3f393`.

## Evidence and purpose

At 13:26 Asia/Jerusalem the owner reports no improvement in City Prefix Clean 1. Do not adopt it. Home Sync Map Lean 1 remains the current partially improved control, with intermittent pre-Home stalls. Widgy 27.0.1 is installed. Stable URL and separate-parent tests also gave no benefit. No new source-stage timing has been measured.

The previous sparse Home still has 1289 layers and 69 variables across the entire four-tab document. This probe isolates the whole remaining widget, rather than making another small URL, async-prefix or parent change. It is intentionally a broad diagnostic, not an individually causal test and not the full usable design. It follows the owner's map/location-first priority.

## Exact retained and removed scope

`withMapMinimalPair` starts from Lean, preserving the full map layer ID6170 under Home245 byte-for-byte at the object level: Web URL binding, image cache flag, frame and source. Keep the complete five-variable closure unchanged, in order: Latitude, Longitude, map_latitude_max5, map_longitude_max5, map_request. The synchronous source, GPS validation/formatters, fallback placeholders, full 3306x1558 live PNG, endpoint, minute timestamp and reuse60 remain exact. No live geocoder, new provider, resolution/format change or backend modification.

Retain Home245 and Calendar247. Home has the map plus eight original Home/Calendar navigation nodes. Calendar has its eight original Home/Calendar navigation nodes, its existing title object changed to CALENDAR TEST and widened, and the existing native opaque graphite background formerly in Weather. It deliberately has no calendar data or city display. Preserve the nav geometry/colors/fonts; actions now target only the two retained groups, dropping the Calendar month reset. Weather/Fitness groups, all actual Calendar contents and all 64 non-map variable definitions are deleted from this diagnostic copy, not merely hidden. Total: 21 layers, five variables. All other document settings/font/color metadata remain unchanged, so this is not an isolation of every possible imported font/cache/resource cost.

Home still shows coordinates instead of city, just like Lean. The finished city mechanism and full Home components are not restored. The complete approved widget is untouched.

## Preparation and validation

The new import page fetches the public C16 template only. It runs the established preparation pipeline with inert same-origin calendar URL placeholders, then strips them with the minimal transform. The transform refuses any surviving calendar URL or token and any surviving removed-variable reference by name or UUID. No owner session/export, calendar data, real GPS or client-only geocoder is requested by the agent or preparation page. The resulting widget's native GPS inputs are for the user's phone, just as in Lean.

`node tools/test-map-minimal-pair.mjs` passes: exact map and five source objects, immutable full input, unchanged other settings/resources, 21 unique layer IDs, one image and exactly the allowed sources (five static text sources, four native GPS sources, one synchronous map script). Assert all discarded references/endpoints absent. Navigation frames and non-tap nav objects are exact; simulate three two-direction cycles and current-tab taps with one visible root and no dangling targets. Static native Calendar background/title are checked. Unsafe unexpected source structures are rejected. The real controller is exercised with only synthetic/public fixtures: copy, download, template failure, retry, pageshow, blocked clipboard and stale-payload clearing. Its only mocked request is the public template GET. No network timing or native drawing is inferred from these checks.

## Device gate and interpretation

Page `/tools/widgy-map-minimal-pair.html?v=map-minimal-pair-1`, widget `Widgy Map Minimal Pair 1`. Import separately, same slot/network as Lean; retain Lean and the full copy. Wait for map/live marker, then Calendar (intentionally blank except title/navigation) to Home, three cycles. Report faster/similar/slower and missing map separately. No stopwatch, second phone or video.

If clearly faster, investigate groups of removed sources/content and interactions; do not assert every hidden layer was evaluated or name a specific provider. If similar, retain this small reproduction and investigate the unchanged map/location/native presentation path, without declaring Widgy or the map server proven responsible. First-load/native import, marker freshness, map reliability and performance remain device-unverified. Do not promote or restore full components based solely on source tests.
