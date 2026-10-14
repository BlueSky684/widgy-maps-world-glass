# Weather 15 device export audit — 14 October 2026

Scope: `BlueSky684/widgy-maps-world-glass`, `f50-widget-test`, Preview only.

The owner's 05:57:43 UTC export is **Widgy Weather 15 - Recovery**. It contains
1,204 layers, 31 image layers, 74 variables and no duplicate layer IDs.

Comparison with the delivered Recovery JSON found 178 raw field differences:
177 base64 shape payloads and root field `9`. Decoding all 177 payloads as JSON
showed identical shape objects; their key ordering was serialized differently.
Root field `9` changed from 38715 to 38835. No meaning is assigned to that field
by this audit. Every image layer, variable, navigation action and visibility flag
was otherwise unchanged. There is no observed import corruption in those fields.

The Lime commit changed one widget field, the Weather chrome URL. Old/new PNGs
are 1135 × 1184, 8-bit RGBA. The new PNG is smaller on disk; dimensions and
theoretical decoded pixel size did not increase. This does not prove native
rendering succeeds. Timing of the Home Screen failure remains relevant, and its
cause is unproven.

## Initial tab state

The actual device export enables Shared Home/Calendar, HOME, WEATHER and HEALTH,
while CALENDAR is hidden. This state also existed in the earlier source export;
it was not introduced by the Lime change. All four HOME tap actions explicitly
show HOME + Shared and hide CALENDAR + WEATHER + HEALTH.

The **Home Start** handoff applies exactly that existing HOME state at startup:
two `a:false` flags on WEATHER (246) and HEALTH (195), plus a distinguishable name.
It is built from the latest device export, preserving the reserialized shapes,
all URLs, current single 3306-wide composite map, live clock and Lime artwork.
Tabs remain available through unchanged navigation actions.

This is a focused correction of initial visibility, not a proven fix for the
Home Screen failure or earlier intermittent map blackouts. Native loading and
tab transitions must be checked on the owner's iPhone. The editor's 190.1 MB
image statistic is not a measurement of resident widget-extension memory.

Private source and cleartext output stay outside the repository. Only an
AES-GCM encrypted envelope is published; its key is supplied via URL fragment.
