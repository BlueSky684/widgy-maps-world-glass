# Native City Ungated Test 1 — 2026-10-09

After Direct City and Direct Data failed native city-display gates, isolate
Calendar location visibility and source substitution on Compact Stable.
The existing main row depends on nonempty calendar_city_prefix; its fallback
group depends on empty prefix and its children on calendar_native_city spelling.
The prefix itself parses the async map_request variable synchronously. Local
tests previously injected resolved strings and modelled missing values as empty;
they cannot establish Widgy's evaluation order or pending-condition semantics.
Both dependencies and condition handling remain hypotheses, not a proven cause.

Copy the exact native City / comma / Country source list from fallback layer
81869 into the existing row 80337, remove that row's guard, and remove the
overlapping fallback group 81871 with its two children. Preserve the row's font,
color, position and dimensions. Keep every variable source, ID and ordering;
all Home/map/GPS/gauges/clock and Calendar data remain exact. No extra geocoder,
endpoint or network request is added. The retired parser still exists as a
variable to avoid conflating source removal with display diagnosis.

This is temporary: native city may say Ashqelon or differ from the map resolver.
It is not a final dynamic-map-city solution, speed optimization, or claim of
fixed location accuracy. A successful phone display narrows investigation to
the previous dependencies/guards; it does not distinguish them conclusively.
If the row remains blank, capture the displayed result before changing anything
else. If only country is visible, native City availability remains suspect.

Test the exact whole-document delta and valid navigation. Expected 1187 nodes,
55 unchanged variables. Verify encrypted copy integrity and exact clipboard,
run the configured build, then publish only preview on f50-widget-test.
The phone gate is one Calendar display check, then Home and back once. Report
exact visible city/country text and whether it persists; speed is not the gate.
Keep Compact Stable alongside and do not replace production.

Prepublication results: document whitelist, 1187 unique IDs, navigation, all 55
variables unchanged, 64 scripts parse, native day gauge and map preserved.
Configured build passed. Exact 916750-byte clipboard, wrong/missing key and
tampered ciphertext rejection, manual clipboard fallback passed. Private output
Widgy_Native_City_Ungated_Test_1.json SHA256
12f9ade1dee7b811a72d643293386f4181347c440dea31e079dc23055a20ac09.
Only AES-GCM encrypted gzip is published; key remains in the URL fragment
outside Git. Phone correctness remains unverified at publication.
