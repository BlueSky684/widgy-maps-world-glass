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

## Budget guard added 2026-10-11 (not deployed)
- BIGDATACLOUD_API_KEY metadata verified: sensitive, Preview only, f50-widget-test.
- No installed Vercel integrations found. Persistent Redis connection remains
  required; use a claimed/owned Free database, never a temporary 72-hour database.
- budget.js reserves a request atomically via Redis EVAL before each BDC attempt.
  Shared constant account ledger across instances/deployments; no credential-based
  reset. Keep one ledger for all uses of this BDC account. External account usage
  is not counted by this project.
- Cap 40,000 over current UTC day plus prior 31 days (conservative superset of
  any rolling 31 days), and 10 attempts per UTC minute. No refund on failure.
- Ledger stores daily integer counts only, no GPS, city or provider key.
  No TTL; missing/corrupt ledger, missing credentials, HTTP/timeout errors fail
  closed. Same-GPS stale fallback still applies. Cache hits do not call Redis.
- Provision UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for this Preview
  branch only. Initialize `_initialized=1` once on a NEW ledger only after checking
  account usage and any pre-existing budget history. Never auto-reset or restore
  a stale ledger backup; use no-eviction storage. Do not enable paid auto-upgrade.
- New tests passed: JS transport/fail-closed/provider-call guard; actual Lua run
  via lupa with Redis-command fixture, separate Lua runtimes sharing ledger,
  40k/minute boundaries, conservative rollover, missing/corrupt state.
  Live Upstash EVAL and simultaneous-request behavior still need verification.
- No widget artifact or live deployment changed by this budget preparation.
