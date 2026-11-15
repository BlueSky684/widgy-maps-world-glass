# Widgy World Glass

Server supporting Home Glass, Calendar, Weather, location and the live PNG map.

`npm run build` prepares the map cache and publishes only files listed in
`tools/public-site-files.json`. `npm run test:cleanup` verifies publication,
its dependencies and the release cleanup. Vercel bundles `api/` separately.
Keep required map masters, font licenses and runtime regression tests.

The active Home Glass deployment retains the `f50-widget-test` branch URL.
Existing widgets and calendar connections use this compatibility address.
Do not remove it without migrating every client. The `main` branch serves
older production map addresses and retains their runtime behavior.

Calendar connection, privacy, terms and its generic export template remain
available, along with Music Glass installation. Never commit private keys or
personalized installation files. Revision identifiers remain where required
by live routes or stored data; they are not additional installation releases.

Release cleanup removes obsolete trial installers, comparison pages,
prototype builders, reports and the isolated map-stability endpoint.
Exact removed paths are recorded in `docs/release-100-cleanup.json`.
Normal Git history is retained for recovery.
