# Native City Spelling Test 1 — 2026-10-09

FAILED: owner IMG_0105 at 07:22 shows no city/country and reports no speed
improvement. A concrete stacking defect covers the native group with opaque
chrome. Superseded by Spelling Test 2; see calendar-native-city-front-2-review.md.

The owner explicitly requires Ashkelon at 07:07, before the ungated native
candidate was delivered. Supersede that candidate; do not send its link.

Start from exact Compact Stable. Keep its original native city/country fallback
group 81871 and both children 81869/81870 byte-for-value, except delete the
group's outer calendar_city_prefix visibility condition. Remove competing prefix
row 80337. The existing spelling conditions remain: native Ashqelon selects
literal Ashkelon, other city values select the native City source. This is a
dynamic conditional correction, never a permanently fixed city. All 55 variables
and their order, Home, map/GPS, clock, gauges, Calendar data and navigation stay
exact. The group's geometry and every text style remain unchanged.

This isolates the outer prefix-dependent visibility path, not all conditions.
calendar_city_prefix synchronously parses async map_request; the previous main
row/fallback used complementary empty/nonempty conditions. Missing native values
and condition semantics cannot be established by a Node simulation. Native City
spelling guards remain a possible failure point if the row is still blank.
No proven root cause or speed claim. All variables are deliberately retained to
avoid conflating source removal with the display-path change. Native city timing
and selection may differ from the map geocoder; final agreement remains required.

Local gate: restore the two exact structural changes and metadata and compare
the entire document; preserve all source fields and geometry, unique 1189 IDs,
valid taps, exact encrypted clipboard and fallback. Run configured build before
preview only on f50-widget-test. Phone gate: check exact city/country text, then
Home and back once. Ashkelon spelling is required; keep Compact Stable alongside.

Prepublication: document whitelist, all 55 variables preserved, 1189 unique IDs,
valid taps, 64 parseable scripts, native gauge, exact clipboard and encrypted
load/integrity/manual fallback passed. Private output is 917642 bytes, SHA256
5b4677e0e543e7f93c27d23e5643f984ab47b698d26ded7a235d7f410e5767fa.
Only ciphertext is public. Key remains outside Git in a URL fragment.
Configured full build passed before preview publication.
