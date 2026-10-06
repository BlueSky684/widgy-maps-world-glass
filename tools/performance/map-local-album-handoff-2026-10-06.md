# Complete server PNG to a native album source: initial handoff

2026-10-06, after the owner agreed at14:48 Israel to the distinct local-image route.
Branch f50-widget-test; baseline401df3632713bcd319a23526d095356c0d695c6c.

## Scope

The failed Widgy-rendered Alpha output is not reused. Use the existing approved
server renderer for a complete original-size PNG, saved separately on the phone.
This changes recurring acquisition from tiny masks to approximately4MB images.
Local native decoding/rendering, album ordering, refresh and automatic scheduling
remain device gates. No faster-navigation or background-update success is claimed.
No rendering/updating Shortcut is attached to the Home button.

## Verified existing producer

The existing endpoint was checked with explicit empty lat/lon, preventing both
GPS and IP-derived location. It renders a new complete server-now image and burns
the actual map time into a temporary diagnostic strip. No server/cache change.

URL: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&diagnostic=refresh-v1&lat=&lon=

HTTP200, PNG3306×1558, 3942092 bytes.
SHA256 of inspected response: 7a717ddd23857564eb7cb14bde066604b2e54f11aec47ec66e1b2ce6a82ada1e.
Response render time: 2026-10-06T11:50:23.983Z (14:50 Israel).
X-Map-Location-Source: unavailable. Cache-Control: private,no-store,max-age=0.
The original server image was visually inspected: complete day/night composition,
no missing-night white plate. Original PNG file remains a scratch inspection
input, not a newly published art asset or an approved-master edit.

## Native consumer setup

Reuse the existing minimal `Widgy Map Static Only 1`, not Alpha's four images
or Five Minute's active coordinate/script variables. Its original21-node baseline
has zero variables and one Web URL map; it is NOT a local consumer until the
owner changes that one image source. All navigation/fonts/frame remain intact.
Existing import page fetchedHTTP200 and byte-identical to the branch.

1. Open the current PNG in Chrome, save the image into Photos and add it to a
   dedicated album, `Widgy Map Local Test`. Preserve the PNG without conversion,
   cropping or scaling. Native Photos/Widgy original-resolution retention is a
   device check, not proven just by server dimensions.
2. Import a separate Static Only1 from its existing copy page, or use a copy.
3. Select its Home Hero World Map image. In Image → System choose the option
   already observed in the owner's screenshot:
   `Image Library - Newest Photo From Album (With PNG Transparency)`.
   Select the dedicated album using the native picker; no album ID, bookmark or
   source-schema fields are guessed. This menu was observed; selection/output
   still need phone confirmation. If a different picker appears, inspect it.
4. Once the saved current MAP TIME is visible, verify ordinary Calendar→Home
   navigation. A fixed saved image establishes only the initial local-display
   gate, not live refresh. Request the observed result, not another timed video.

Then add a later complete image B to the same album, verify the shown timestamp
changes and does not regress to A. If it needs reload, inspect the observed
Widgy Reload action and selected slot; do not assume a reload preserves the tab.
Keep A until B is validated. Test offline/failed acquisition separately, then
an acceptable automated producer trigger. Native local serialization may be
captured from this non-private diagnostic when needed for repeatable imports.

No runtime files, endpoint, master image, template or paid hosting plan changed.
This checkpoint records a verified producer link and native setup instructions;
it does not claim the phone consumer is already configured or tested.
