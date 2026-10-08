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

## Native outcome — 20:59 Israel: no perceived speed improvement

At19:26 the owner reported a black map after import. At20:52 they clarified
that this was ONLY the Widgy import preview; the widget had not been assigned
to the Home Screen. At20:59:23, after assignment and the requested navigation
check, the owner reports that the map appears but the return feels unchanged.
This is a positive Home Screen display result for this run, not a fix for the
intermittent import/editor black image and not a demonstrated speed benefit.
Do not ask for the same two-cycle city test again or promote this trial.

Deployment8ed4134 / dpl_FqAAds9HydeVBeBd1hVcsF76Rwbw; no agent network probes
occur in the20:51–21:00 correlation window. The earlier20:55–20:56 window
contains mixed sources, including one old city_trace_v1=fetch:212 response;
do not assign every request to the new export or infer per-tap request counts.

In the later instanceea20a970-7bbf-44cd-aac1-74464ca905cf:

| Local time | Map cache | Handler ms | Full PNG body bytes |
| --- | --- | ---: | ---: |
|20:57:01.896|MISS|1502.3|4331025|
|20:57:05.895|HIT|0.7|4331025|
|20:57:51.123|MISS|817.7|4332278|
|20:58:04.443|HIT|0.6|4332278|
|20:59:01.611|MISS|855.1|4332542|
|20:59:09.590|HIT|0.6|4332542|

All these map responses are prepared HTTP200 with conditional=false. The
20:57:50 render key differs in coordinates from the preceding native key;
later keys match. The20:59 MISS is past the previous image's60-second lifetime,
even though the preceding HIT request was56seconds earlier. Hits do not extend
expiry. Do not label this cache failure or round away accurate GPS to hide it.

The same later instance records11city-cache HITs at0.1–0.5ms and2MISSes. This
confirms the server returns remembered city data; it does not directly time
the phone fetch/JSON processing or prove every cached response is accepted by
the client. This trial still has a network dependency for cache reads.
Calendar today REUSE is5.5–8.2ms in the later interval, with provider MISSes
245.6/227.7ms and dots1.4–75.9ms. No slow Google/iCloud request is demonstrated
for the last return. Server-prepared bodies do not measure phone delivery,
native decode/display or tap-to-visible latency.

The complete remote PNG probe at19:28 used synthetic0,0/Example and a fixed
instant, not owner GPS. HTTP200 delivered4,224,042bytes; actual decoding
confirmed3306x1558 and3,260,061visible nonblack pixels. Visual inspection showed
the map. Request pxslw-1791476919886-93284517e915 is an agent probe, not native.
A separate attempted local-vs-remote raw-array assertion exhausted the local
Node heap; cross-environment exact pixel equality was NOT established by it.

## Current source audit and next boundary

server-city-cache-1-source-audit.json inspects the exact current private export
but stores only counts and symbolic dependencies. It finds one Home map layer;
calendar_city_prefix depends on map_request. Reading a variable is not proven
to retain an already completed result between Widgy evaluations. The current
export still contains25separate Calendar dot-URL scripts,39JSON field bindings
to one URL,300Calendar separator rectangles and two unreachable old step
variables. These are definitions, not measured requests/painted layers.

The earlier compact external-map trial combined separators, shared the dot
clock and inlined single-use text fields, but used a different map provider
without live personal GPS/city. Those reductions have not been integrated
into this current1415-node stable-map/native-gauge export. A bounded follow-up
can port that structural work while proving current Home/map/city/clock/gauge
preservation, rather than sending another cache-duration variation. Native
benefit must still be measured. Avoid another arbitrary static-map, local-file,
half-resolution, weather-art-off or clock-off test: earlier full-widget runs
did not establish a useful improvement from those changes. No code, existing
export, production setting or deployment is changed by this outcome record.
