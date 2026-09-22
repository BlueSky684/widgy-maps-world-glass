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
