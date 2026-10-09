# Live Map Only Home Test 1 — 2026-10-09

PHONE OUTCOME: at 07:34 the owner reports significantly faster return to Home.
At 07:35 Calendar entry is unchanged, and Calendar city displays correctly.
Preserve this as the fast control. No single removed source/layer is identified;
the live map itself still has a cost. Home city agreement not separately stated.

At 07:27 the owner explicitly requests the latest unchanged live map and city
mechanism alone in Home, with Calendar complete, to investigate the cost of
other Home content. Use Native City Spelling Test 2 as the matched full-Home
control so both include exactly the same city stacking correction. That fix
still needs phone confirmation; do not mix it into the speed comparison.

Home keeps original map layer 6170 and 14 navigation layers (including four tap
areas); every retained field and ordering is exact. Remove the remaining 126
Home nodes including background/chrome, clock, date/greetings, events, weather,
health and gauges. Remove exactly ten unreferenced Home-only variable definitions
after checking both name tokens and UUID references across the retained widget.
141 Home descendants become 15; full widget 1189 to 1063 nodes, 55 to 45 variables.

Calendar, Weather and Fitness groups remain byte-for-value identical. Shared
sources are retained. In particular map_request, native GPS, exact coordinates,
async city resolver/client/server reuse, marker, minute URL, live day/night mask,
image frame/options and full 3306x1558 lossless output are unchanged. No static
image, altered refresh policy, synthetic city or backend change. The now-unused
Calendar prefix variable is deliberately preserved, matching the control.

This measures the combined removed Home content/source group, not an isolated
provider. Definition counts are not measured request counts; unused definitions
are not proven to have been evaluated. Other tabs may still trigger shared
native work, so this is not a map-only standalone widget. Older similarly named
trials used different map/GPS sources; this one preserves the current sources.

Tests restore the exact removed Home group and variables and compare the whole
document, compare retained map/navigation nodes and all other tabs, check unique
IDs, navigation and all variable references. Encrypted clipboard and build gates
must pass before preview publication. After first map/city load, compare three
Calendar–Home–Calendar cycles against Native City Spelling Test 2. Report each
direction separately; missing map/city/content invalidates the intended check.
No speed gain is claimed until the owner reports one.

Prepublication: exact document delta, full Calendar/map source parity, valid
references and navigation, encrypted exact clipboard and configured build pass.
Output 817954 bytes, SHA256
2aabeb9a64be436920dafd327ab877afa2e058e1c7c34415d6b1cee7d164e4b0.
58 scripts parse. Home native day gauge intentionally absent. Ciphertext only
is public; URL-fragment key stays outside Git. No production publication.
