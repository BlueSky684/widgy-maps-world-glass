# Native City URL 1

2026-10-05, test branch `f50-widget-test`, source parent `ab619abb980121c1dcf23f920e19bb58cb9b1d86`.

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
