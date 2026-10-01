# Day/night widget test build

## October 1: F50 live integration and full-resolution device test

Publication authorization: on October 1 at 07:09 Asia/Jerusalem, the user
explicitly approved publishing code to branch `f50-widget-test` in the public
`BlueSky684/widgy-maps-world-glass` GitHub repository for a preview link only.
This supersedes the earlier automatic approval rejection. Main/production must
remain unchanged. Command-line Git has no credentials; use the authorized
GitHub connector for this same scoped publication. No deployed URL verified yet.

The user authorized proceeding with the live F50 test and reiterated that the
final upload must be high-quality lossless. The primary widget now explicitly
requests PNG 3306 × 1558, with no reduction in source resolution. A separately
labelled 1653 × 779 loading diagnostic is available only to investigate the
previously blank native map; it is not the final-quality deliverable.

`lib/engraved-coasts.js` derives the fixed coastal field once from the locked
terrain. The date-driven renderer applies the night gate and original light
alpha. Its illustrative-pose output matches the selected F50 PNG exactly:
decoded RGBA SHA256 `188ba82a67bd6c5d9f2232da7afe68a95e08ea6e5ea872dfe4a260231e57d1c3`.
Tests cover source integrity, all golden pixels, full-resolution PNG round-trip,
day/night preservation across six dates, timezones, solar geometry, endpoint
responses, and preservation of every unrelated native widget layer.

Only preview deployment is authorized at this stage. Native image loading and
later iOS/Widgy refresh still require a device check. Do not claim the blank-map
cause is proven: the lower-resolution diagnostic only tests a possible loading
constraint. Current Vercel connector account lists no projects; inspect the
existing Git integration for preview deployment instead of changing accounts
or disabling authentication protections.

## Current approved choice — October 1: F at +50%

On October 1, after comparing +50% and +60%, the user chose to keep +50%.
The selected visual is `World_Map_F_Engraved_Coasts_50_Percent.png`:
inner two engraving signals +50% relative to original F, inner widths +25%,
outer signal gains 1.16 and 1.08 with unchanged outer widths.
Use gains [1.50,1.50,1.16,1.08] and Gaussian scales [2,2,1.6,1.6].
Library identity: `libfile_00d52257e3448191b786e9570c88c64d`, version 0.
This is the approved F styling for further work; +60% is an unselected study.
The original approved terrain and night lights remain locked. This choice
does not change the live renderer or deployment; implementation remains next.

## September 30: engraving preview history

After reviewing +50%, the user requested +60%. This preview changes only the
inner two signal gains to 1.60 relative to original F; their +25% width stays
identical to the +50% preview. Outer gains remain 1.16 and 1.08. Reproduce with
`node tools/preview-researched-masks.mjs --creative --only=F --f-60`.
The full native preview is `World_Map_F_Engraved_Coasts_60_Percent.png`.
The prior previews remain intact; visual approval and deployment are pending.

The user found +35% too faint and chose to try +50% before considering +60%.
The +50% preview also applies the proposed +25% width to the inner two lines:
signal gains [1.50,1.50,1.16,1.08], Gaussian scales [2,2,1.6,1.6] source pixels.
Outer lines retain the previous strength and width. Width metadata now reports
exact Gaussian FWHM rather than the older rounded nominal width. Reproduce with
`node tools/preview-researched-masks.mjs --creative --only=F --f-50`.
The full native preview is `World_Map_F_Engraved_Coasts_50_Percent.png`; previous
versions remain intact. The later request above authorizes the +60% preview.

The next requested preview raises ONLY the two inner engraving signals from
1.28 to 1.35 relative to original F. The outer signals remain 1.16 and 1.08.
Reproduce with `node tools/preview-researched-masks.mjs --creative --only=F --f-35`.
The separate `World_Map_F_Engraved_Coasts_35_Percent.png` preserves both previous
images for comparison. This remains a technical preview pending visual review,
with no changes to the live renderer, widget, or deployment.

On September 30 the user selected F / Engraved Coasts and requested a technical
preview of the proposed subtle line strengthening. F itself remains unchanged.
`node tools/preview-researched-masks.mjs --creative --only=F --f-stronger`
creates a separate preview with line-signal gains [1.28,1.28,1.16,1.08] from
nearest to farthest coast offset. These are engraving signal gains, not global
brightness changes. Geometry, widths, chamfer distance, night alpha, water fill,
terrain and approved light composition all remain the same. The strengthened
version is pending user review; do not publish or deploy it automatically.
`node tools/preview-f-strengthening-comparison.mjs` verifies identical mask
coverage and creates two equally sized, ungraded detail crops for comparison.
The main preview retains the complete 3306 × 1558 map. Sun pose is illustrative,
20° latitude / −165° longitude, as in all preceding comparisons.

## Active rule after the user's September 30 reset

Work only from the original September 29 approved terrain and lights. The user
reconfirmed the unchanged `World_Map_Night_Preview_3306x1558.png` and explicitly
forbade recoloring/redrawing the source or substituting generated lights.
The approved composite's SHA256 is
`e01c9714cc6d881be54c4f374ea38a9d0d19ad63f4b3c039a1fe0ac9cd68fcda`.
The two approved source layers reproduce its decoded pixels exactly (zero
channel mismatches). September 30 generated concepts and terrain/ocean color
experiments below are superseded, unapproved studies, not the active baseline.

`node tools/preview-locked-map-mask.mjs` is the current LOCAL ONLY visual proposal.
It keeps daytime terrain unchanged, gates the approved light alpha by night,
and inserts one separate graphite veil under the city lights: RGB(120,125,135),
20% maximum opacity, soft night-only transition from solar elevation 0° to −6°.
No terrain grade, day-ocean fill, image blur or bright outline is present.
This is an explicitly styled night-region indicator, not physical darkening:
a purely dark shadow cannot be visible over the approved pure-black oceans.
It lifts black night water to RGB(24,25,27) so the region can be seen. The user
must judge this visible change; do not claim the visible masked pixels are
identical to the source, only that the sources remain unchanged and the only
added color effect is this separate overlay.
The illustration uses the same sun pose as earlier comparisons (20°, −165°),
not the current time. The code emits a native PNG, separate mask intermediate,
and source-integrity report. No API or production site has been updated.

At the user's request for additional visual options, `--options` renders three
separate local candidates: Graphite RGB(75,83,94) at 20% opacity / 6° feather;
Ink Blue RGB(50,76,106) at 28% / 8°; Soft Slate RGB(145,151,161) at 18% / 12°.
Only the overlay parameters vary. All candidates keep the light visibility
transition fixed at 0° to −6°, so changing mask softness does not move or fade
different city lights. Each uses the same locked geometry and approved source
layers, verified by exact reconstruction and unchanged daytime pixel checks.
They were inspected at 707 px width and remain unapproved; no deployment.

## September 30: research-based alternatives after Ink Blue feedback

The user said Ink Blue (option 2) looked okay and requested genuinely different
additional previews informed by Internet examples. This is design exploration,
not permission to publish. `node tools/preview-researched-masks.mjs` creates four
new LOCAL ONLY studies, labelled A–D to avoid confusion with earlier numbering:

- A / Satin Depth: continuously varying neutral overlay depth rather than a
  flat night fill. RGB(84,94,109), opacity 10–32% within the night region;
  0–10° edge transition, gradual inner depth from 6–65° below the horizon.
- B / Twilight Layers: three softened tint/depth stages inspired by civil,
  nautical and astronomical twilight. This is artistic styling, not a measured
  atmospheric scattering model. No hard categorical lines or image blur.
- C / Clear Terrain: the night indicator overlays source-defined black water
  only; RGB(39,66,79), 44% alpha, 0–7° feather. Original terrain and full-night
  light composite outside this water mask remain pixel-identical to approval.
  Exterior flood fill and six sea seeds handle disconnected narrow straits;
  only exact-black pixels may enter this map-derived water mask.
- D / Bronze Contour: a thin, non-glowing bronze line on the night side of the
  terminator, plus a much fainter 18% fill. The line is 3.4 native pixels wide,
  about 0.7 pixels at 707 px map width, with screen-space antialiasing. This is a
  new minimalist option, not reinstatement of the rejected broad pale halo.

Research inspected NASA's downloadable flat-map frame and Esri's terminator and
twilight illustrations. NASA's frame is the same visual example the user had
attached earlier. Reference artwork is inspiration only and is never composited
into these previews. Primary references:

- https://svs.gsfc.nasa.gov/5477/
- https://www.timeanddate.com/worldclock/sunearth.html
- https://www.esri.com/arcgis-blog/products/arcgis-living-atlas/mapping/day-night-terminator-now-available
- https://github.com/joergdietrich/Leaflet.Terminator
- https://geodataviewer.com/tools/day-night-map/

All four studies use the unchanged approved source assets, the same illustrative
sun vector (20°, −165°) as Ink Blue, and the same 0–6° approved-light alpha gate.
Only mask geometry/tint/opacity treatment varies. They preserve daytime pixels
exactly, reconstruct the full approved composite exactly before masking, and
apply no terrain grade, replacement lights, day-water fill or raster blur.
They were inspected at both 707 and 360 pixels wide. These are styled indicators:
the original water is black, so the visible fill necessarily lifts night-water
values instead of physically darkening them. No API or widget change, no push,
no deployment, and no claim that the separate native Widgy loading issue is fixed.

## September 30 follow-up: E–H material studies

The user did not rule out A–D but did not like them enough, and requested much
deeper research and more creative directions. A–D remain unapproved. The
research expanded into watchmaking, engraving and atlas design. The most
relevant discovery was Breguet's Marine Hora Mundi 5555: a Black-Marble-inspired
night-world dial with guilloche below transparent sapphire and city lights.
Patek's transparent enamel over curved guilloche, and Esri's shoreline vignette
and waterline examples, supplied additional material/structure ideas. These
are original adaptations, not copied dials or external map imagery.

Primary design references inspected:

- https://www.swatchgroup.com/en/services/archive/2025/breguet-marine-hora-mundi-5555
- https://www.patek.com/en/manufacture/artisans-of-time/guillochage
- https://www.breguet.com/en/breguet-house/1775-1801/appearance-guilloche-watchmaking
- https://www.esri.com/arcgis-blog/products/arcgis-pro/mapping/how-to-make-this-map-of-indonesia
- https://www.esri.com/about/newsroom/arcuser/vignette

Additional physical-object evidence: Christie's own catalogue description of
the Vacheron Constantin Overseas 7700V smoky sapphire day/night disc:
https://onlineonly.christies.com/s/watches-online-dubai-edit/vacheron-constantin-overseas-ref-7700v-110a-b172-fine-attractive-155/195954

`node tools/preview-researched-masks.mjs --creative` renders four native previews
using `tools/creative-mask-styles.mjs`, while A–D are left untouched:

- E / Smoked Sapphire: a 30% translucent base, soft diagonal material reflection,
  and a very fine directionally-lit inner edge. No image refraction or blur.
- F / Engraved Coasts: four understated decorative waterlines radiate from the
  approved major coastlines inside night water. Tiny islands remain unchanged
  in the source but do not emit concentric engraving rings. These lines are
  design ornament, not depth contours or new geographic data.
- G / Guilloche Enamel: fine repeated curved engraving lines in night water,
  inspired by translucent enamel over engine-turned dials. No artificial lights
  or speckled star textures; land remains exactly source-derived.
- H / Celestial Atlas: a fine decorative graticule centered on the antisolar
  point, visible in night water. It does not indicate weather, seismic activity,
  or routes. It uses night-depth circles and bearings for its structure.

E–H use the same illustrative sun position (20°, −165°), approved master assets,
and 0–6° night-light alpha gate as the earlier set. No published API, JSON or
production asset changed. The source composite reconstruction and unchanged
daytime checks have zero differences. F–H also verify unchanged full-night
non-water pixels. All exports receive a complete lossless PNG round-trip check,
and visual inspection at 707 and 360 px width. No deployment or approval implied.

## September 30: alternatives to shortlisted F

The user found F genuinely interesting and requested more options before
choosing between them and F. This is a shortlist, not final appearance or
publication approval. F's delivered PNG remains byte-identical (SHA256 checked).

`node tools/preview-researched-masks.mjs --coastal` produces I–K from the same
approved layers and illustrative sun position, using `coastal-mask-styles.mjs`:

- I / Relief Engraving: directional highlight/shadow pairs on five fine coastal
  offsets, suggesting subtle engraved relief without changing terrain pixels.
- J / Bronze Inlay: three more widely spaced pairs of fine coastal lines with
  warm bronze highlights, while original amber city lights stay untouched.
- K / Maritime Etching: fine coastal-rake strokes taper into open night water.
  This is decorative hatching, not depth, weather or current data.

Further primary references:
https://www.esri.com/arcgis-blog/products/arcgis-pro/mapping/coastal-edge-hack
https://www.esri.com/arcgis-blog/products/arcgis-living-atlas/mapping/super-easy-way-to-make-vintage-coastal-hatching

I–K use an exact Euclidean distance field of the approved major land components
for smooth ornamental offsets. The earlier F geometry and renderer are retained.
All three effects are restricted to night water. Full-night non-water pixels
and daytime pixels each match their approved references exactly. Original light
RGB/alpha retain the fixed night-visibility gate used in all earlier comparisons.
Native 3306×1558 PNGs pass a complete pixel-exact encode/decode round trip and
are visually checked at 707 and 360 px. No push, production change or deployment.

## Archived technical comparison preview (not deployed)

`node tools/preview-approved-masters.mjs --day-ocean --slate` creates a native
3306 × 1558 lossless preview from the approved September 29 assets. The user
requested the exact approved terrain geometry and lights, then found the night
mask invisible over black water and the source terrain too navy. This candidate
adds RGB(22,35,52) only to exterior-connected pure-black ocean pixels in daylight,
fading monotonically to black inside the night region. It adds no bright rim.
The optional terrain grade retains 45% of original chroma around luminance;
it has no spatial filter, and is applied before shadow and original city lights.
This grade is a new preview proposal, not an approved replacement master.
Approved PNGs and their hashes remain unchanged. The night lights keep their
original RGB and alpha; only solar visibility gates their alpha. A 22% black
shadow lies under the lights. No production endpoint has changed.
The sun vector (latitude 20°, longitude −165°) is an illustrative comparison
pose that exposes the desired curved night silhouette, not the current time.
The mask and geometry must remain date-dependent in any live implementation.
The preview was visually checked at 707 px width. User approval of its appearance
and native Widgy loading are still pending; do not publish it automatically.

## Latest visual review: rejected previews

On 2026-09-30 the user rejected preview 4 because the veil was not visible,
then rejected preview 5 because its pale inner rim looked terrible. Preview 5's
edge treatment has been reverted locally. Neither preview was published.
The restored preview 4 is also unapproved and must not be published as a fix.
The required appearance remains a continuous translucent night-region shadow
with a soft transition and sharp city lights, without a bright rim or halo.

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
The terrain is rendered first at daylight gain 1.08, then receives a translucent
cool-gray veil, RGB(30,40,55), at up to 22% opacity. The veil starts at solar elevation 0° and
softly increases inward to full strength at −6°; at −3° its opacity is 11%.
No shadow is applied on the sunlit side. These are visual styling choices;
they do not model atmospheric scattering or refraction.

The approved city lights are composited AFTER the shadow in normal source-over.
Their RGB and sharpness are preserved; only alpha fades from 0 to −6° as before.
There is no blur on either source asset or on the final map. The day-side ocean
floor has been removed completely: no colored fill is added on the day side.
This fixes the day region reading visually as the mask. To show the mask over
black water, the local preview instead adds its subtle gray only on the NIGHT
side. At full night a source black ocean pixel becomes RGB(7,9,12), while day
ocean remains black. This is a deliberate visualization compromise: night ocean
is slightly lighter than the black source, rather than physically darkening
black. It requires user approval and is not yet published.

The earlier dated reference screenshot is 2013-05-23 09:24 UTC. Its southern turning point is
near −69.36°, outside this map's −61° southern edge. This build does not stretch
the geometry or extend the approved artwork to force the complete reference arc.
Near an equinox the boundary naturally approaches a vertical line.

`day-night-4-preview` follows the later reference's soft translucent shadow and sharp
city-light treatment. It retains date-dependent solar geometry and does not
claim an identical reference silhouette year-round, reposition darkness over
sunlit land, or recrop the approved map to expose a polar turning point.

Production HTTP checks passed for day-night-1 and day-night-2; the user confirmed the direct
image loads on the iPhone. The imported widget's map area was blank, so native
Widgy image-source inspection is still pending; this style revision does not
claim to fix that separate loading issue.

The day-night-4-preview changes are LOCAL ONLY, pending user review of the rendered
preview. Do not push or deploy a further visual change before that approval.
The preview uses 2026-09-30 08:26:50.357 UTC, matching the preceding image, so the
comparison isolates the removal of the day fill rather than elapsed solar motion.

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
