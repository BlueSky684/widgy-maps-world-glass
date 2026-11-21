# Widgy Home Glass

Home Glass 1.0.0 renders the world map on the iPhone. Widgy reads `map-current.png` from Files. The authenticated city service resolves coordinates with BigDataCloud.

Existing installations use the `f50-widget-test` branch address for Calendar, Weather, city lookups and widget assets. The calendar connection page exports a widget with a local map image layer. Select the phone's map file after import.

Run `npm run build` and `npm run test:cleanup` to verify the public site and export template. Vercel bundles the API functions separately.
