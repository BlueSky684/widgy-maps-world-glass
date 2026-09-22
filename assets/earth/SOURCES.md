# World map sources and behaviour

Coastlines, country borders, city lights and solar geometry are rendered from georeferenced data. From v121 onward the land material additionally uses generated artwork derived from the approved mockup; see the v121 provenance below.

- Day texture: NASA Blue Marble Next Generation, September 2004, with topography. https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/
  Download: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/september/world.topo.200409.3x5400x2700.jpg
- Night texture: NASA Black Marble, 2016 colour composite. https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/
  Download: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg
- Country outlines: Natural Earth 1:50m countries, public domain. https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson
- Solar geometry: NOAA/Meeus equations. https://gml.noaa.gov/grad/solcalc/calcdetails.html
- Label font: Barlow Condensed by Jeremy Tribby, SIL Open Font License (bundled OFL.txt). https://github.com/google/fonts/tree/main/ofl/barlowcondensed

Image textures are historical composites; they are **not live satellite imagery**. The day/night illumination is computed for each requested UTC instant. City light brightness is illustrative, using the NASA composite.

Projection: equirectangular, longitude -180 to +180; latitude +85 to -65, output 1484×640. All pixels, grid lines, and marker coordinates use these same bounds. Locations outside the displayed latitude interval are not falsely pinned to the edge.

Location: the exported World Map Glass URL does not send phone GPS coordinates. Its existing backend uses Vercel IP geolocation. The v113 renderer preserves that mechanism and explicitly identifies it in response headers. Approximate IP city/coordinates and the marker are rendered from a single source to avoid mixing IP coordinates with a different native GPS city. Explicit lat/lon/city URL parameters are supported for a future verified native GPS integration. No location history is persisted or logged by the renderer.

v114 refines the same georeferenced data with darker relief, a geographic coastal rim, clearer country borders, brighter warm city lights and a broader blue twilight band. Lights remain confined to the night/twilight blend. The solar horizon is not artificially curved to match the reference picture; its shape follows the date and the equirectangular projection. Missing IP city names show coordinates only, without inventing a city. A city name, when available, remains approximate IP information rather than GPS.

The `v=113` image URL retains the original renderer and textures. `v=114` selects the refined version. Their native JSON files can therefore be compared without silently replacing v113's map appearance. `tools/prepare-earth-assets.py` builds the v114 textures; `tools/prepare-earth-assets-v113.py` reproduces the original textures.

v115 uses the same solar calculation and geographic projection, with a clearer day/night contrast and no decorative blue terminator halo. Its soft texture blend is centred on solar-centre elevation 0°: 50% day at the geometric horizon, fully night at -6°, fully day at +6°. This symmetric rendering transition does not model local terrain, refraction, cloud cover or the Sun's angular radius. The boundary is never artificially bent; it can be nearly straight near an equinox. The day/night mask is computed for the current server UTC time on every image request. Widgy displays a new image when it refreshes the data source; this is not continuous animation. Historical texture imagery and approximate IP geolocation limitations still apply.

Use `v=115` for the new shading. `v=113`, `v=114`, and the previous unversioned default retain their earlier rendering. The v115 native export changes only the map image URL and root release metadata.

v116 balances night visibility: its night-texture gain is the arithmetic midpoint between v114 (1) and v115 (.32 to 1 depending on source brightness), now .66 to 1. Bright city lights are preserved while dark land and coast detail become more visible. The v115 day rendering, solar geometry and horizon-centred twilight blend are unchanged. Select `v=116`; earlier versioned URLs retain their renderers. Only the native map URL and release metadata change in the v116 export.

v119 restyles both georeferenced textures toward the approved Master image. Less saturated slate land, finer silver-grey country borders and restrained coastal highlights replace the stronger blue outlines. At night, a higher ambient floor makes the land readable, while the historical Black Marble urban signal gets warmer bright cores and a small geographic bloom. Vignetting and the lower-left text veil are gentler. These are illustrative cartographic treatments, not measurements of actual sky brightness.

The geographic bounds, NOAA/Meeus solar calculation and symmetric -6° to +6° blend are identical to v116. City lights are still present only in the night/twilight component. The dynamic map is not a pixel-for-pixel extraction of the flattened reference: the reference's fixed illumination and baked-in text cannot act as a geographically accurate live day/night texture. `v=119` selects the new renderer; `v=116` retains its archived renderer, so v117 and v118 exports keep their original map.

v119 renders at **2400×1188**, about three times as many pixels as 1484×640. The native map frame retains its width, but changes from 2.32:1 to **2.02:1**, close to the measured 1090×540 map panel in the approved reference. The same geographic extent is mapped to this taller frame; textures, solar shading and marker all use the revised pixel scale. This is a changed display aspect ratio, not a crop or a claim of a new equal-area projection. Clock/agenda move down 70 native units, the day-progress section 84, and weather/fitness cards and their contents 42 to clear the taller map. All data sources, visibility conditions, fonts and text sizes remain intact, including the v118 native 24-hour no-seconds timer.

v119 replaces 1:50m country/coast polygons with **Natural Earth 1:10m countries** (258 features), including more detailed shorelines. Texture preparation uses three-times supersampling. Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson . Download: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson . Retrieved source SHA-256: `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255` (13,287,234 bytes). Save as `work/map/countries-10m.geojson` before running `tools/prepare-earth-assets-v119.py`. NASA texture inputs remain the same. The prior Basemap work was found in conversation history, but a specific previously installed high-resolution add-on was not identified or claimed to have been reused.

v120 changes the cartographic material, keeping the v119 frame and all native layers intact. Two-scale contrast from the Blue Marble texture adds restrained relief to cool-slate land. A separate shoreline treatment avoids doubling the country polygon edge along the coast. Warm light networks now use the **13,500×6,750 NASA Black Marble 2016 colour composite**, replacing the 3,600×1,800 input. Download: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg . Save as `work/map/black-marble-2016-3km.jpg`, then run `python tools/prepare-earth-assets-v120.py` from the repository root. The other inputs are the same as v119.

A restrained atmospheric blue tint in v120 is a function of solar elevation at both actual day/night boundaries. It does not use a screen-space circle, change the solar calculation, displace the horizon or affect the city-light mask. The colour is a graphic treatment, not an atmospheric radiative-transfer model. The unchanged twilight blend remains 50% at solar-centre elevation 0°. The real current boundary can therefore differ from the artistic curve in the flattened Master. This release is a style refinement, not a claim of pixel-identical reproduction. Use `v=120`; `v=119` retains its renderer and original textures.

## v121: restored Master material, with geographic illumination

The approved original Home Master was recovered as the generated PNG `לוח מחוונים עתידני עם מפת עולם לילית.png`, created 17 September 2026. Its source record does not establish an external map URL. A clean map was reconstructed from that complete dashboard, then imagegen removed its labels, city lights, political borders, grid and baked atmospheric arc to prepare `master-material-v121.png`. This is **illustrative terrain artwork, not satellite imagery or measured topography**. It is intentionally recorded as a separate material input, not misattributed to NASA.

`tools/prepare-master-map-v121.mjs` registers the material using thin-plate interpolation of measured artwork landmarks. These controls align appearance only. The output's actual land, coastline and country geometry still comes from Natural Earth 1:10m. NASA Blue Marble contributes a small geographically registered component and a fallback at material registration gaps. All projected layers use longitude −180..180, latitude 85..−65, at 2400×1188; raster resizing explicitly preserves the entire longitude extent. Material interpolation is approximate and the artwork is not a pixel-identical match to the Master.

The output has **three separate layers**: `day-v121.png`, `night-v121.png` and `lights-v121.png`. Night lights use the 13500×6750 historical Black Marble 2016 composite listed above. Their intensity is multiplied by the night/twilight contribution at render time, so lights in South America appear when those places are in darkness. No fixed illuminated city networks or curved Atlantic halo survive in the material. A new faint geographic grid is rendered separately. The solar model and its 0° horizon / symmetric −6..+6° illustrative blend remain unchanged. Colour near the horizon depends on solar elevation and therefore follows both boundaries; it is not a circle painted on the screen.

v121 changes only native image layer 6170's URL/script plus root release metadata. All native positions, fonts, weather visibility rules, variables, health sources and the **Live Timer (24 hours, No Seconds)** remain as in v120. `v=120` is now served by the archived `lib/home-map-v120.js`. Refresh cadence and approximate IP location limitations remain unchanged.

To rebuild, install the project dependencies, restore the NASA/GeoJSON inputs described above under `work/map`, then run `node tools/prepare-master-map-v121.mjs` and `node tools/build-widgy-v121.mjs`. The generated clean material is included in the repository so reproducing a release never requires generating it again.

## v122: country borders at widget scale

The v121 screenshot showed that subpixel borders baked into the terrain became too weak when reduced to the device's widget size. v122 adds `land-v122.png` and `borders-v122.png`, generated from the same pinned Natural Earth 1:10m source with `tools/prepare-map-lines-v122.mjs`. The masks share the exact 2400×1188 geographic extent. Linework is composed separately from terrain/atmospheric tint and before city lights, with a visible night floor. A land-only graphite tone curve reduces the pale grey floor and saturation while retaining relief highlights. The v121 materials and all earlier renderers remain intact.

This improves legibility and style; it is not a pixel-identical copy of the flattened approved dashboard. Solar geometry, historical light sources, geographic projection, approximate IP location and Widgy refresh behavior remain as documented for v121. Only native map layer 6170's URL/script and root release metadata change. `v=122` explicitly selects the new renderer. Build the masks with `node tools/prepare-map-lines-v122.mjs`, then build the export and copy page with `node tools/build-widgy-v122.mjs`.

## v123 approved static map

`approved-map-v123.png` is the exact clean map image approved by the user on 2026-09-22, generated by editing the user-provided dashboard reference. It is copied without resizing, cropping, tinting or re-encoding. Dimensions: 1828 x 860. SHA-256: `a0879c5994551a4297a5416952268fa4dfaab1b7c3d85f49747e57f0ce0a2761`.

v123 loads this PNG directly. Its image-layer frame matches the original aspect ratio. Illumination, city lights and the Atlantic halo are fixed artwork. No dynamic location pin or label is added. Other native widget layers retain their v122 data and settings. This illustrative artwork is not a georeferenced map. Archived dynamic endpoints are unchanged.

## v124: dynamic day and night restored

v124 replaces the static v123 URL with `/api/home-map?v=124&t=<current-client-timestamp>`. The server computes shading for the actual UTC request time; the client timestamp only prevents URL cache reuse. Private no-store headers apply at both browser and CDN levels. Widgy obtains an updated image when its data source refreshes; this is not continuous animation.

The renderer uses separate registered v121 day, night and historical NASA light textures, plus v122 Natural Earth masks, all mapped to 1828 x 860 and the same geographic extent. The native image frame and all other native layers remain as in v123. It restores the approximate IP location pin and rounded frame. The frozen approved PNG is not part of this renderer. No static lights or atmospheric arc are baked into its terrain. This necessarily differs from the flattened approved artwork.

Local contrast reveals the terrain texture; night land and borders are darker to distinguish darkness. The entire warm city-light layer and its bloom are multiplied by the local night/twilight weight. Blue colour peaks at the solar horizon on both boundaries, following the same NOAA/Meeus solar equations documented above. The border may appear almost straight near the equinox: no artificial curve is forced into the astronomical result. The blue glow is an artistic treatment, not an atmospheric measurement.

`node tools/build-widgy-v124.mjs` checks native preservation and full copy-payload integrity. `node tools/test-dynamic-map-v124.mjs` verifies actual rendered day/night changes in New York, Sao Paulo, Tokyo and London across four UTC times, a moving ocean horizon glow, solstice polar shading, server-time routing, cache headers, archived v122 output and the native dynamic source.

## v125: richer graphite terrain

v125 reduces the washed-out appearance of daylight land in the v124 device screenshot. It lowers daylight midtones and the solar brightness gain, retains more of the cool terrain colour, and softens the independent daylight border layer. An interior land mask attenuates local-contrast enhancement along the coast: the prior blur crossed into dark ocean and created a pale shoreline halo. Night ambience, geographic extent, solar equations, twilight weights, dynamic atmospheric glow and the complete city-light treatment are otherwise preserved from v124. This is shader styling of the live renderer; it does not modify or restore the static v123 artwork.

Only native image layer 6170's URL and root version metadata change in the export. Earlier versioned renderers remain available. Build with `node tools/build-widgy-v125.mjs`.
