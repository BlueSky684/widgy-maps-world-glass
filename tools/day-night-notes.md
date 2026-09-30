# Day/night widget test build

The Sept 29 approved Terrain Master and transparent Night Lights Master are
loaded losslessly and checked against their approved SHA-256 hashes. The
existing v142 combined artwork and all older versioned renderers are untouched.

## Integration

- `api/night-map.js`: opt-in PNG endpoint; current server UTC by default.
- `lib/home-map-day-night.js`: one full-resolution composition at 3306 × 1558.
- `tools/widgy-day-night.json`: full v142 widget with only map layer 6170's
  URL/script and the release name changed. All native data/layout are preserved.
- `tools/widgy-day-night.html`: copy/import page, adapting the JSON map endpoint
  to its own deployment origin. A protected preview must be accessible to Widgy
  before its JSON can be used on a device.

Source mapping: longitude −180..180, latitude +85..−61, as used to construct the
approved light assets. This is approximate registration of illustrated terrain,
not a survey-grade map. Seven landmark spot checks agreed with the land artwork
to within one source pixel; this does not establish global survey accuracy.
The old v142 renderer's −75° bottom bound must not be reused with these assets.

Solar position uses the repository's existing NOAA/Meeus calculation. Both the
terrain transition and alpha-only light mask use the same solar elevation.
The terrain transition is 50% at the geometric horizon and spans −1.5..+1.5°.
This symmetric visual feather sharpens the shadow without moving the horizon;
it is a styling choice, not a physical model of twilight duration. City lights
still fade in from 0 to −6°. Gain and ocean floor are provisional device-test
styling, not new visual approval. No atmospheric refraction is modeled.
The night terrain multiplier is 0.76; daylight is 1.08. The day ocean floor is
RGB(20,31,45), so the shadow stays visible over water; night oceans remain black.
The terrain gain endpoints, fully night pixels and city-light masking are
unchanged from day-night-1. The brighter ambient floor can also affect the darkest
daylit terrain pixels. No colored terminator outline is drawn.

The reference screenshot is 2013-05-23 09:24 UTC. Its southern turning point is
near −69.36°, outside this map's −61° southern edge. This build does not stretch
the geometry or extend the approved artwork to force the complete reference arc.
Near an equinox the boundary naturally approaches a vertical line.

`day-night-2` adopts the reference's clearer continuous shadow treatment while
retaining the date-dependent solar geometry. It does not promise the same U shape
year-round or recrop the approved map to expose a polar turning point.

Production HTTP checks passed for day-night-1, and the user confirmed the direct
image loads on the iPhone. The imported widget's map area was blank, so native
Widgy image-source inspection is still pending; this style revision does not
claim to fix that separate loading issue.

## Reproduce checks

```sh
npm ci
node tools/build-widgy-day-night.mjs
node tools/test-day-night.mjs
```

The tests verify hashes, native dimensions, geographic controls, solstice/polar
and seam geometry, UTC equivalence, day/night ocean order, alpha composition,
changes over 12 hours, image response size, no-store headers, ignoring client
cache-busting time, fixed-time test mode, and preservation of other widget layers.
They write the report and actual renderer output to `work/day-night/`.

Fixed-time requests use `?at=2013-05-23T09%3A24%3A00Z`. The normal widget never
sets `at`; `t` is only a cache buster. `X-Map-Rendered-At` and `X-Map-Time-Mode`
identify the calculation time without adding implementation labels to the map.
All image responses disable browser and CDN storage.

Device verification remains necessary: import as a separate widget, confirm the
native location marker and full canvas, manually reload, then observe a later
automatic data refresh. iOS/Widgy govern the refresh cadence; this is not continuous
animation and a timestamp query does not force an iOS refresh.
