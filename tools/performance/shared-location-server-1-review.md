# Shared location server candidate — 2026-10-11

Status: prepared and locally tested; NOT activated in the widget. Working copy
remains c411f53 (independent phone lookup). Phone evidence: direct lookup displays
Ashdod, Israel with no perceived slowdown. Earlier map-dependent text stayed
Map pending even after Home displayed its map.

## Architecture
- Native GPS feeds an ordinary map URL and an independent label request.
- Both routes use one shared server resolver. No async Widgy variable chaining.
- BDC authenticated server API (api-bdc.net/data/reverse-geocode), English names;
  client-only free API is never called from server.
- Vercel Runtime Cache shared by regional function instances, fresh 1 hour;
  exact-coordinate entries retained up to 6 hours solely for provider-error fallback.
  New coordinates never inherit a previous location's label.
- Bounded process memory (256 entries), single-flight within a process (32 pending).
  Regional cold misses on separate instances can still duplicate a lookup:
  Runtime Cache has no atomic distributed lock. This is not strict exactly-once.
- Cache reads/writes bounded at 400ms; provider fetch deadline 3500ms.
- Cache keys hash client credential, provider credential, exact GPS and language.
  Private/no-store HTTP responses; no application logging of GPS, city or secrets.
- Runtime Cache remains evictable, not a database. Cache failures fall back to
  authenticated provider; stale fallback is limited to identical GPS.
- GPS jitter can reduce hit rate; no coordinate rounding across city boundaries.
- opt-in shared_location=1 on night-map; label route is fetch-probe?location_shared=1.
  Existing calls unaffected. No additional Function slot or package installation.

## Activation requirements
1. Owner creates free BigDataCloud account / Reverse Geocoding key.
2. Set BIGDATACLOUD_API_KEY in Preview environment only (never widget/Git).
3. Generate a separate random 32-byte base64url WIDGY_LOCATION_ACCESS_TOKEN,
   set Preview env and pass to withSharedLocationWidget baseline transform.
4. Deploy backend to f50-widget-test Preview; verify authenticated cache MISS/HIT,
   same-coordinate reuse across routes, invalid credentials and error behavior.
5. Encrypt candidate JSON via existing key/AAD copy workflow, run copy tests,
   then publish copy page. Do not replace the working export before live checks.
6. Phone: city/country both tabs, map marker/name, transition speed, idle refresh,
   actual move to another city. No claim of speed improvement before measurement.

## Validation
- test-shared-location: same-process concurrency (8 requests → 1 provider call),
  new resolver/instance reads regional fixture cache, changed GPS, TTL,
  expired fallback refusal, provider mismatch, failed shared cache, auth,
  unconfigured route 503, method guard, private response cache policy;
  full-document whitelist confirms unrelated widget fields unchanged.
- test-server-city-reuse passed (existing path).
- npm run build passed.
- Historical test-night-map-isolation fails at obsolete v78/v80 redirect assertion
  before executing handler tests. vercel.json is unchanged by this candidate;
  that test targets retired repository cleanup, not current route configuration.
- No live provider call or device performance benchmark yet: key unavailable.

Official references checked:
https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free
https://www.bigdatacloud.com/reverse-geocoding/reverse-geocode-to-city-api
https://www.bigdatacloud.com/reverse-geocoding
https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package
