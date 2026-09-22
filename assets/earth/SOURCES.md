# World map sources and behaviour

The map is rendered from georeferenced data, not generated geography or a crop of the approved widget mockup.

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
