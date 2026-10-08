# Server City Cache Test 1 — 2026-10-08

Purpose: the18:57 native timing pair measured repeated accepted phone geocoding
at618/605ms for identical GPS/city/options. Try avoiding that repeated lookup;
do not claim it explains or solves all Home/Calendar navigation latency.

Start from the owner's16:54 City Reuse Test1 export. The strict transformation
changes only map_request's script and identifying document metadata. All81
variables,1,415 nodes,89 scripts, native gauge/step ring, original image binding,
GPS placeholders, Calendar shared city, taps and design remain. The map renderer
is unchanged and still produces full3306x1558 lossless PNG. Production and other
exports remain unchanged. No Shortcuts changes.

## Opt-in behavior

Before the existing phone geocoder, read a tiny private JSON result from the same
night-map function using an unguessable128-bit scope generated for this export
and the exact normalized latitude/longitude. A hit supplies the previously
observed city. A miss, error, malformed or mismatched result follows the existing
phone-side geocoder. No server calls the free client geocoder. Missing/invalid
GPS retains its existing map fallback; sendToWidgy completes only once.

The next map request carries the city and its original observation timestamp.
The function stores at most256 scoped coordinate entries in process memory.
Expiry is one hour from the original observation, including when the phone uses
its existing memory cache. Neither city reads nor repeated map requests extend
freshness. Older observations cannot replace newer ones. Exact GPS changes miss;
coordinates are never rounded further. A fresh function instance can miss.

City HIT responses permit private device caching only for their remaining life;
MISS/invalid responses are private no-store. Both CDN controls remain no-store.
The client independently checks GPS, nonempty sanitized city and age. Logs emit
only fixed HIT/MISS/INVALID status, duration and opaque function instance ID;
no coordinates, city, scope, raw URL or credentials are logged by this code.

This uses no external cache dependency, account change, subscription or paid
service. It is a best-effort warm-instance/device cache, not durable or shared
across instances. A cold miss adds a round trip and can be slower. If a native
fetch never settles, the existing Widgy timeout still applies; no unsupported
timer/cancellation API is invented. The native benefit is an open test gate.

No city timing suffix is included in this trial. Its stable scoped URL carries
the same city observation time across hits, plus the original minute timestamp.
Cache metadata never changes renderer/cache identity or PNG pixels. The first
new URL naturally differs from the older export. This does not fix a proved
native map decode issue; actual black-map root cause remains unresolved.

## Validation and artifact

test-server-city-reuse executes the actual route and generated client script:
fresh-JS-context HIT, cold-instance fallback, precise GPS/scope separation,
private HTTP responses, no rendering for JSON reads, unchanged image content,
TTL without extension, bounded LRU, outdated-write rejection, cache failures,
bad/stale/future/mismatched entries, unavailable GPS and one final callback.
The same strict one-script-only comparison passes against the owner's export.
Existing parent-equivalent route/cache tests and full-size PNG regression pass.
The configured Vercel build is run before publication.

Widgy_Server_City_Cache_Test_1.json:915,150 bytes; SHA256
01a12fa7d13bdfde50e987deecd2d989ccadeb2a86f3893484f1579b153c49c5.
Copy page uses authenticated AES-GCM/gzip ciphertext and a private fragment key,
kept out of Git. Actual controller VM checks exact clipboard bytes, missing/wrong
keys, tampering and manual fallback. Structural checks retain1,415 unique IDs,
valid taps,89 parseable scripts, one native gauge and original map binding.

Publish only f50-widget-test preview. Phone gate: import separately, assign the
trial to the same Home Screen slot, confirm map/city, perform two Home–Calendar–
Home cycles, report completion and whether the second Home return improves.
Correlate subsequent city-cache logs, excluding the agent's synthetic probe.
Do not declare success from synthetic server measurements alone.
