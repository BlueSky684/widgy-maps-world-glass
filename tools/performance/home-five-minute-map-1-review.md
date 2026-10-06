# Home Five Minute Map 1 — full-widget integration gate

2026-10-06, f50-widget-test. Prior remote checkpoint17c79bafc79a67c4fdf543cef23afb2367e279aa.

## New phone evidence and scope

At08:47:22 Asia/Jerusalem the owner reports that Map Five Minute1's time advances, transitions are relatively fast, and no serious slowdown was noticed. This is a positive initial result under the clarified tolerance for occasional refresh delay. It is qualitative, without exact timestamps, durations, request counts, or long-idle/location-change evidence. Do not call it zero-delay, an idle detector, a guaranteed cadence, or a completed full-widget fix. Retain this minimal copy as the working comparison.

## Candidate

`withHomeFiveMinuteMap` starts from the complete Map Sync Recovery1 baseline and transfers the exact `map_request` script from the tested minimal Five Minute1. It preserves all1514 layers and81 variables, their identities, full Home layout/clock/weather/fitness, complete Calendar/month navigation, existing Calendar native-city fallback, and the unchanged Weather/Fitness placeholder tabs. Those future tabs are not newly implemented.

Both prepared baselines have byte-equivalent map Image objects and primary native coordinate definitions. The transformer asserts this compatibility. Map variable metadata/source mode match; only script text and trial name/description differ from full Map Sync Recovery1. No additional animation settings are inserted or guessed. The map stays cached Web URL, full3306×1558 lossless PNG, exact native coordinates, diagnostic MAP TIME, private reuse60 and the existing renderer. The script uses five-minute wall-clock URL buckets when evaluated; native coordinate changes can change the URL sooner. It neither schedules refresh nor guarantees one download per bucket or fast first return.

The full baseline already bypasses both custom city lookups. This candidate keeps that behavior: Home temporarily displays coordinates on the map; Calendar retains its existing native city fallback, still requiring a correctness check on the phone. It does not restore the slow custom reverse-geocoder or claim the city feature is finished. The complete full baseline was not fast enough earlier; transferring the newly promising minimal map source is the new integration question.

## Private export and validation

The separate preparation page reuses the existing same-origin `prepareWidget` flow and owner session. The personalized payload is prepared in browser memory for copy/download. The assistant uses only public templates and synthetic example.test calendar endpoints in tests; no actual calendars, credentials, GPS, or health values are read or stored. No existing import page is replaced.

`node tools/test-home-five-minute-map.mjs` passes:
- Input remains unchanged; restoring script/name/description yields deep equality with full Map Sync Recovery1, covering layout, fonts, providers, variables, all tabs and navigation.
- Full map variable, image and primary coordinate definitions exactly match the tested minimal source;1514 unique layer IDs and81 variables remain.
- The embedded script runs without fetch/timer/async callbacks; same-location reuse, next-bucket identity change, fine coordinate changes and missing coordinates retain tested behavior.
- The actual private export helper and actual new controller run against synthetic responses: copy/download payloads match the transformer; authorization failure clears stale downloadable/copyable content; retry/pageshow and blocked clipboard fallback work.

No new server or renderer implementation is involved. This validation is not native Widgy execution, a signed-in real-calendar test, or a phone performance measurement. Previously passing Five Minute1 tests cover the shared source's64 synthetic coordinate/time cases.

## Native handoff

Preserve Map Five Minute1. Import and assign the separate **Widgy Home Five Minute Map 1** copy on the iPhone Home Screen, keeping prepared settings. After initial loading, check map/marker, clock/weather/fitness, Calendar events and Calendar city. Use ordinary Home↔Calendar/month navigation and observe advancing MAP TIME with no image disappearance or backward time. No timed idle chore, private export upload, travel, stopwatch or video is required.

The next useful report is whether the whole widget remains relatively fast or brings back the delay. A regression is evidence about integration with the rest of the widget, not proof of a single provider or a reason to immediately buy hosting. A positive result must retain freshness and functioning data. City restoration and future tab development follow this integration gate.

Page: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-home-five-minute-map.html?v=home-five-minute-map-1

Public deployment/byte verification is required before presenting this link as ready. Native result pending.

## Publication verified; mask investigation requested first

Runtime commit5668c4abd0e420580293ce0a290ed19e54bcf6b2 has successful Vercel deployment status. All three public runtime files returnedHTTP200 with exact local bytes: HTML4859, controller2351, transformer2694. Private export behavior was tested with synthetic responses only; native full-widget result remains pending.

At08:53:34, while publication was completing, the owner asks to prioritize static-map/network-mask feasibility. The ready full-widget candidate is retained, but not handed off as the immediate required test. Continue with the harmless native schema probe described in `map-mask-capability-2026-10-06.md` and retain the fast minimal Five Minute1 on the phone.
