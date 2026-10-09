# Home Source Addback Test 1 — 2026-10-09

Owner at 07:34: Live Map Only Home 1 returns to Home significantly faster.
At 07:35: entry to Calendar has not improved; Calendar city now displays
correctly. This validates the city stacking repair in this check, not permanent
stability or Home city agreement. No stopwatch measurements or per-copy logs.

The removed Home content/source group contributes to the reported difference
with the same live map. This does not identify a single provider or prove the
map has no cost. Preserve the fast copy as the control.

Restore only ten removed variable definitions, exact IDs/sources/original
ordering, from Native City Spelling 2. Keep all 1063 nodes and every other field
identical to the actual fast export, except title/description. Home remains
map/navigation only. Variables 45 to 55; layers do not change. No backend,
image, GPS/city, Calendar or design changes.

These restored definitions are unreferenced. A slowdown would implicate their
presence/evaluation or interactions, not uniquely a provider. No slowdown would
not clear those providers when demanded by active text/gauge layers. The next
addback must account for this limitation rather than claim rendering alone is
proven. Test whole-document parity after reversing variables and metadata.

After first load compare three returns to Home against Live Map Only Home 1;
report whether the new copy stays fast or slows. Calendar is expected to remain
identical but report missing content. This is one definition-presence experiment.

Prepublication: exact document parity, 1063 unique layer IDs, 55 variables,
61 scripts, valid navigation, encrypted clipboard and configured build pass.
Output 826386 bytes; SHA256
4b1da43974f95ec51ac725aef660529b8db66c438a94205a3790128ab39cd8b6.
No Home day gauge intentionally. Public ciphertext only, key outside Git.

## Owner outcome — 2026-10-09 07:43 Asia/Jerusalem
Owner reported no effect / same behavior. Home remains fast after restoration of the ten definitions. No numeric timing or new Calendar speed improvement was reported. This does not clear providers when active layers consume their data. Next paired experiment restores only the complete Home weather card.
