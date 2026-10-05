# Native City URL 1

2026-10-05, test branch `f50-widget-test`, source parent `ab619abb980121c1dcf23f920e19bb58cb9b1d86`.

## Device result and recovery, 07:50 Asia/Jerusalem

FAILED: the owner reports the map did not load; IMG_9894 shows a black map panel. Calendar transition is fast, Home slower. This failed-image state is not a valid performance comparison. Correct Calendar city was not explicitly confirmed, so do not infer it from the speed report or Home screenshot.

A public synthetic request using live mode, width 3306, glass/r6, reuse 60, explicit 0,0, minute timestamp and final `city_text=Example` returned HTTP 200, image/png, 4,201,434 bytes, valid PNG dimensions 3306x1558, location source coordinates. No real location, private export or geocoder request was used. This confirms server handling for that concrete synthetic request, not the phone's actual composed URL. Do not conclude that Widgy universally rejects multiple placeholders or that the server is never responsible.

The import page now creates `Widgy Native City Recovery 1`. Starting from the failed candidate, change ONLY the map image Web URL back to `${widgy.map_request}`, plus name/description. Preserve both immediate empty-city scripts and Calendar's native fallback unchanged. Home temporarily shows live GPS coordinates without city. This restores the exact image definition used by the working full-widget control while keeping the native Calendar city path available for inspection. It is not a completed city replacement.

`node tools/test-native-city-url.mjs` now additionally verifies that recovery's only change from the failed candidate is image binding/metadata, its entire image definition equals the original control, and the public controller copies/downloads the recovery with session/error handling. Existing synthetic script/parser/fallback checks remain passing. No backend or renderer changes in recovery. Native map recovery and correct Calendar city still await the device.

Current link: `/tools/widgy-native-city-url.html?v=native-city-recovery-1`. Keep the old constructor only for source reproducibility; do not send users the failed trial again. First check the map and actual Calendar city, then compare against the working City Lookup Bypass 1 if both are present. Further city-on-map work remains open and should not repeat a failed mixed-provider binding without new evidence.

## Recovery device result, 08:04 Asia/Jerusalem

The owner confirms the map loads, Calendar transition is fast, and Home remains a little slower. Actual Calendar city accuracy is still not explicitly confirmed. The owner asks whether external map loading can explain the remainder. This is possible but not established: native transfer count, decode work and source scheduling have not been measured. The current Home image remains Web URL (not its No Caching variant), the builder includes a minute timestamp plus live coordinates, and the API permits bounded private reuse up to 60 seconds while disabling shared CDN caching for real-location requests. Changing minute/GPS values changes the URL; how Widgy uses cached bytes or decoded images is unknown. Prior static/local/host comparisons changed other factors or showed only small/no perceptible differences, so do not claim a new host alone is the fix or repeat an old test as a new finding. Next work should distinguish fresh remote loading from repeated native image/source handling in the current full-widget control.

## Intermittent failure confirmed, 08:11 Asia/Jerusalem

The owner now reports occasional missing maps after Calendar-to-Home transitions; IMG_9895 shows a black map panel with the remaining Home content present. Initial successful loading is not a stability pass. The next candidate, Map Sync Recovery 1, changes only the current map URL script's completion mode; see `map-sync-recovery-1-review.md`. Native City Recovery 1 remains available as the control, not an approved reliable final version.

## Evidence

The owner reports City Lookup Bypass 1 substantially faster in both directions, with residual Home delay. Restore city functionality while retaining its bypass of both custom reverse-geocoders. This is a compatibility trial, not an accepted permanent replacement or measured speed improvement.

The owner-uploaded export at 07:39 is Direct Image URL Diagnostic. Local inspection (without fetching any of its private URLs) shows:

| Property | Uploaded Direct Image URL | Current City Lookup Bypass 1 |
| --- | --- | --- |
| Total layers / variables | 1671 / 81 | 1514 / 81 |
| Home / Calendar descendants | 389 / 1230 | 240 / 1222 |
| Map image field | Literal URL | `${widgy.map_request}` |
| Map coordinates | Fixed synthetic 0,0 | Live native coordinates |
| Map timestamp | Absent | Minute bucket |
| Map / Calendar city source | Literal text | Two immediate JavaScript sources |
| Custom geocoder | None | None |
| Steps ring | 100 segments | One native ring |

The owner finds the uploaded copy slightly faster entering Home. Multiple data and layer differences prevent attributing that difference to variable expansion, JavaScript, GPS or cache behavior alone. Higher layer count with a faster reported transition makes layer count alone an inadequate explanation. It does not prove drawing cost is zero. No private URLs, owner export, tokens or real coordinates are copied into this repository or used in agent network requests.

## Implementation

`withNativeCityURL` starts from the same full Native Steps Ring 2 pipeline, applies City Lookup Bypass 1, then changes only:

- The two synthetic CITY TEST literals become empty strings. Both scripts still complete immediately, once, with unchanged mode, coordinate validation and function arguments.
- The Home image Web URL field becomes `${widgy.map_request}&city_text=${widgy.calendar_native_city}`. The map URL variable remains one JavaScript source. Native city is appended as data, never interpolated into JavaScript source.
- Trial name and description.

All 1514 layers, 81 variables, geometry, fonts, full-resolution map, refresh bucket and other data remain. An empty Calendar prefix activates its existing native fallback, including the existing Ashqelon-to-Ashkelon layer. The map's existing safe-tail parser now applies that same English spelling alias only to `city_text`; ordinary `city=` requests are unchanged. `city_text` remains the final parameter so an embedded ampersand or plus remains city data.

Previous failed native-location trials built a variable from mixed text/location providers or appended a native provider to the JavaScript variable's source array. This trial instead appends the native city in the image Web URL field. That different binding requires native confirmation; source tests cannot demonstrate it works in Widgy.

The native City provider may perform its own network work. No claim that all city networking is eliminated. Native city language, freshness and synchronization with the separate GPS values are not proven. The source code no longer performs the old external returned-coordinate validation, so wrong or stale city must block acceptance.

## Validation

`node tools/test-native-city-url.mjs` passes. It verifies exact narrow widget differences, input immutability, counts, one immediate callback with no custom fetch, live GPS arguments, missing/out-of-range GPS with no IP fallback, modeled URL substitution, Unicode/quotes/ampersands/plus and attempted parameter injection as data, English spelling alias, ordinary URL regression, exclusive Calendar native fallback layers, and actual page controller copy/download/session recovery with synthetic data. No native runtime claim follows from this model.

## Phone gate

First import `Widgy Native City URL 1` and confirm the full map, real GPS marker and correct actual city in Home and Calendar. If either fails, report that before timing; return to the known fast bypass control. If both work, compare both transition directions with City Lookup Bypass 1 in the same slot/network. Movement to another city, language and refresh also require confirmation before permanent promotion. Preserve the existing real-city export and fast diagnostic separately.

Page: `/tools/widgy-native-city-url.html?v=native-city-url-1`.
