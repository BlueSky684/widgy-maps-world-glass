# Map Mask Appeared Off1 — 2026-10-06

Status: implementation and import-controller tests pass; runtime commit
`7cb061306eca7e9f043ed04a94ecfd60ceb8ddd4` has a successful Vercel deployment.
Five public files (new page, both transition modules, template and unchanged
Persistent1 control page) return HTTP200 with correct content types and exact
local bytes. See `map-mask-appeared-off-1-public-verification.json`. Native
result pending.

## Reason for this trial

Persistent1 still showed night/N before day/D and a transient black daytime
region on both Home returns in the owner's12:01 recording. Hierarchy changes
did not solve it. Current Widgy screenshots explicitly warn that combining
blend modes and transitions within a layer/group breaks blend modes. The owner
then captured the actual appeared-Off setting on an image, a group and a shape.
This supports a bounded transition trial, not a proven cause of all latency.

## Exact change

The separate `widgy-map-mask-appeared-off-1.html` import starts with generated
Persistent1. Its existing persistent transform is copied verbatim and checked
against the control page in the test; the control is unchanged. A new final
transform applies the captured native `r0` only to these nodes:

| Nodes | Kind | Native b/d source | Native value |
|---|---|---|---|
|84011,84012,84021,84022|Four images|736|-1|
|84100,84020,84010|Three map groups|747|-1|
|84040|Map background shape|747|-1|

The full effect objects are in the sanitized native-field fixture. Document
name/description and Home heading identify **Widgy Map Mask Appeared Off1** /
**APPEARED OFF**. No field is inferred from an adjacent numeric source ID.

Everything else equals generated Persistent1:29 layers, four cached Web URL
images, three synchronous bucket/URL scripts, URLs, bitmap assets, sources,
blend modes, paint order, geometry, persistent hierarchy, Calendar, tap actions
and settings. No uploaded round-trip shape encoding or normalized bounds are
adopted. No coordinates, accounts, raw exports or screenshots are committed.

The group option explicitly says **Will Disable All Child Animations**. Stored
Auto/Interpolate content-animation settings are unchanged, but their effective
behavior can be overridden by that group setting. This inherited behavior is
part of this trial. The existing disappeared setting is retained; no explicit
out-transition field or unverified enum has been added. Do not claim that the
actual exit transition is independently known to be Off.

## Validation

`node tools/test-map-mask-appeared-off.mjs` passes:

- Actual page-generated JSON has exactly the eight captured effects, keyed to
  the independent native fixture; no wrong-type application.
- Remove those fields and identifying text and the entire document equals
  generated Persistent1. Input unchanged; invalid hierarchy/type rejected.
- Same sources, scripts, navigation, blank Calendar and persistent map group.
- Actual inline controller exercised for copy, JSON download, clipboard denial,
  failed preparation (no stale copy/download), retry/pageshow recovery and Chrome URL.

`node tools/test-map-mask-image-appeared-off.mjs` verifies the image helper.

Public URL after deployment:
`https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-mask-appeared-off-1.html?v=appeared-off-1`

## Device gate

Import and assign the separate copy; look for APPEARED OFF on the iPhone Home
Screen. Once the initial map is complete, make a few ordinary Calendar/Home
returns. Does the entire map return together, without N-before-D/black-day blink,
and is navigation faster or worse? Calendar should fully cover the map. During
normal use observe whether D/N time advances and stays matched. No timed idle
chore or manual settings needed. Preserve the working Five Minute1 and other
controls. No atomic paired-load or scheduled five-minute background-refresh
guarantee follows from source checks or a single short video. No paid migration
or full-widget reintegration before the native result.
