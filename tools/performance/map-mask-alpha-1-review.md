# Alpha Mask1 — 2026-10-06

Status: offline representation, API and actual import-controller checks pass.
Publication verification required before handoff. Native result pending.

## Purpose and preserved baseline

The owner reports Appeared Off1 has fast navigation with no delays. Its video
still exposes the white/black night mask before the complete map. Preserve that
fast baseline. Alpha1 is a separate diagnostic, not a rollback, another hierarchy
variant, or a claim that the server caused the defect.

The new PNGs contain black RGB with alpha=255 minus the original grayscale
weight. Their image layers use native default Normal instead of Multiply. Over
opaque colour C, the byte-space formula is C*(1-alpha/255)=C*weight/255.
The two day/night groups and the Night group's Plus Lighter are retained.
There is no white colour plane in either new mask file. This does not guarantee
complete/atomic native composition: a black or missing region still fails.

Both522×246 masks retain the actual solar weights and D/N bitmap-time glyphs
through inverse alpha, over the existing fixed diagnostic white plates. No new
clock supplies the label. Four cached Web URL images, three synchronous scripts,
five-minute epoch evaluation, frames, paint order, all eight appeared-Off fields,
full3306×1558 static day/night textures, persistent hierarchy, blank Calendar
and native actions are unchanged. No location/account/weather/health source
is added. Approved masters are not modified.

The exact widget delta against Appeared Off1 is removal of the two image t
Multiply objects, two URL revisions live-1→alpha-1 and identifying text. Omitted
t is the existing native default Normal in the original full-map and static
image templates. No new blend enum or transition field is guessed.

## Offline comparison

Reproduce with `node tools/benchmark-map-alpha-mask.mjs` after the existing static
diagnostic assets have been built. Results: `map-mask-alpha-1-offline.json`.

All65,536 scalar colour/weight pairs satisfy the formula; every encoded alpha
byte round-trips as255 minus the old mask value, including glyphs. All RGB bytes
decode as zero. Three dates cover the observed October epoch and both solstices.

| Case | Old two masks | Alpha two masks |
|---|---:|---:|
|October6,12:35 Israel|39,241 bytes|29,679 bytes|
|June solstice sample|32,310 bytes|25,486 bytes|
|December solstice sample|34,956 bytes|27,136 bytes|

This changes representation, not lossy compression. Local independent Sharp
lanczos3 resampling at widths367/1101 produces a maximum difference of2 channel
levels relative to the current two-Multiply composition; average absolute
channel difference stays below0.007. There are nonzero changed pixels. It is
not exact parity, an approved appearance change or a simulation of Widgy colour
management. The current two-mask composition also remains an approximation to
the original renderer. Native final appearance must be compared to the retained
fast copy. No source resolution was reduced further.

## Implementation and validation

- `lib/map-mask-alpha.js` encodes black RGBA from shared solar weights/stamping.
- `/api/solar-mask?rev=alpha-1&part=day|night&t=<five-minute-epoch>` is a separate
  immutable revision. Original live-1 URLs keep their original generator and
  bytes. Each revision has its own bounded8-epoch pair cache and byte-derived
  ETags. Public solar-only data; no terrain/location/geocoder/account imports.
- `tools/map-mask-alpha.js` applies only the explicit widget delta.
- `tools/widgy-map-mask-alpha-1.html` reuses the verified controller and exact
  Persistent1 transform, then the verified appeared-Off and new alpha transforms.

Passing commands:

```sh
node tools/test-map-mask-alpha-widget.mjs
node tools/test-map-mask-alpha-api.mjs
node tools/test-map-mask-live.mjs
```

Tests cover whole-document reversal to Appeared Off1; input immutability; all
eight Off fields; exact static/frame/navigation preservation; synchronous URL
bindings and no extra fetch/timer; actual copy/download/error/recovery flows;
real route PNG inverse alpha; actual solar/stamp advancement; revision-isolated
cache/ETags;304/HEAD; strict invalid-query handling and original live PNG bytes.
The existing Live1 API, assets and widget regression test also passes.

## Native handoff

Keep **APPEARED OFF**. Import the separate **Widgy Map Mask Alpha1**, assign it
to the tested Home Screen widget and look for **ALPHA MASK**. After the initial
complete map, use a few ordinary Home/Calendar returns. Success requires all:

1. No white flash, black gap or staggered incomplete map.
2. The owner-reported fast navigation is retained.
3. Complete map colour/day-night boundary matches the retained control visually.
4. D/N remain matched and advance during normal use.

No manual effect edits, timed idle chore or new paid hosting. A short recording
can check composition; it does not alone establish refresh across epochs. If
only the flash colour changes, do not declare success or add arbitrary cover
layers. Full widget, city, Calendar, weather and fitness remain later gates.

Chrome handoff after public verification:
`googlechromes://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-mask-alpha-1.html?v=alpha-1`
