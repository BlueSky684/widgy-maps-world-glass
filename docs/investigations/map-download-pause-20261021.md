# Investigation: 21 October 2026 map download pause

Scope: BlueSky684/widgy-maps-world-glass, f50-widget-test, Vercel Preview.
No renderer, runtime client, resolution, scheduler, paid plan or Production
change is made by this investigation. Installed client in the screenshot is
0.6.2; 0.6.3 has the same download and publication pipeline.

## Observations

The owner's 08:01 Israel screenshot reports a failed update approximately
25 minutes earlier: DOWNLOAD_LATE_HTTP, script elapsed 289.1 seconds,
HTTP phase 288.9 seconds, HTTP 200, download observation gap 283.2 seconds,
and operation-trace gap 283.1 seconds. Publication of a new map had not begun.
Later notifications report successful script runs of 6.0 and 9.0 seconds.

Read-only runtime-log queries covered 2026-10-21 04:15–05:05 UTC, including
all Preview deployments for /api/night-map. The relevant records are:

| Israel time: function start | Handler finished | City decision | PNG bytes | Status |
| --- | ---: | ---: | ---: | ---: |
| 07:35:06.734 | 2.1043 s | 0.3124 s | 2,709,583 | 200 |
| 07:45:21.500 | 1.7833 s | 0.2531 s | 2,702,276 | 200 |
| 08:00:31.409 | 1.7954 s | 0.2800 s | 2,689,539 | 200 |

07:35 request: js9t6-1792557305890-37a444a8d99f, deployment
 dpl_A8Sx7ePhrzLUMHufXyQUJzSDuHu7.
Later requests: tvjq6-1792557920382-65c15e4b5195 and
4fztb-1792558830080-4ed707742334, deployment
 dpl_Fgu2jSivfsFXaXaTArVV5M2iKPiQ.
The latter deployment changes Scripting sources only; server rendering is
identical. No runtime failures or early-close phase appears in these map
requests. Fontconfig warnings coexist with successful completed PNGs.

The 07:35 request is the only retrieved map request matching the failed
notification's time. This is strong temporal correlation, not a proven
client/server request-ID match: the screenshot does not expose an ID, and
this Vercel route does not currently emit the X-Map-Request-Id header that
DownloadTrace optionally accepts. A server finish event establishes handoff
to the server transport, not arrival, decoding or display on the iPhone.

## Findings

1. The matching handler generated and handed off its PNG in about 2.1 seconds,
   not 289 seconds. City lookup took about 0.31 seconds. This does not identify
   the exact timing of DNS, connection setup, iOS request dispatch or delivery.
2. Both independent JS timer observers stopped advancing for about 283 seconds.
   A delay/suspension in the client execution environment is strongly indicated.
   Native networking/OS scheduling may be involved. The data cannot distinguish
   iOS suspension, a blocked host queue, or a wall-clock adjustment conclusively.
3. The fetch timeout uses documented seconds, not incorrectly supplied
   milliseconds. A native timeout plus an AbortController and a JS deadline
   already exist. Wall-clock guards recheck immediately after fetch, body
   completion, conversion, decode and before current-file replacement.
4. A JS timeout cannot execute while its runtime is paused. Increasing its
   value does not grant background execution time. Accepting an expired result
   would weaken the freshness/publication protections; a 289-second-old input
   also exceeds the existing 120-second location-input acceptance window.
5. The route has a 10-second maxDuration. City enrichment is independently
   bounded to 1500 ms. The observed PNG is about 2.7 MB, with normal 2400 x 1131
   output. Neither renderer failure nor a size-limit rejection is evidenced.
6. The automatic writer performs one attempt. The foreground/manual path can
   retry, but that is not evidence that replaying a timed-out background intent
   with its old coordinates and deadline would be safe or effective.
7. The persistent writer mutex is released on the observed caught error path.
   A killed process is a separate limitation: its retained row intentionally
   cannot be stolen merely because a timer expires. Do not add unsafe stale-lock
   deletion as a response to an event that already recovered successfully.

## Native API options checked

- Scripting fetch: timeout in seconds and AbortSignal are supported; the
  existing usage conforms to the documentation.
- BackgroundURLSession: native background transfer is available only in the
  main app (Script.env === "index"), not this intent.tsx execution context.
- DownloadManager (TestFlight): also main-app-only. This is not a drop-in
  replacement or a reason to require the user to install a beta.
- BackgroundKeeper: main-app-only, with no guarantee against OS suspension
  or termination. Adding it to this intent is not a valid fix.
- Main Script Sessions: do not launch, wake or keep the main app alive.
- Apple LongRunningIntent: a host-app protocol; it is not a permission that
  this JavaScript package can grant itself. No support for opting into it was
  established in the Scripting intent documentation reviewed here.
- Moving download work to Shortcuts' native HTTP action is an architectural
  experiment, not a demonstrated cure. It would require new data/file handoff,
  failure handling and native verification, so it was not silently substituted.

## Focused verification

Extended verify-download-053.cjs with the actual 289100 ms delay boundary and
a two-invocation recovery scenario. All 29 focused download/failure checks
passed (27 prior cases plus 2 new cases). The suspended-timer simulation verifies:
HTTP 200 is rejected when late; no response-body consumption or candidate write
starts; saved bytes are unchanged; the writer lock and timers are released;
a subsequent invocation with fresh input can publish successfully.

This simulates the observed ordering and elapsed time; it does not reproduce
the iPhone's OS scheduling or prove why the pause occurred. Other suites were
already passed for 0.6.3 and were not repeated for these test-only additions.

## Decision

Do not reduce image quality, increase server duration, buy a hosting upgrade,
loosen freshness checks or add an in-process retry after a multi-minute pause
on the basis of this incident. None addresses the demonstrated timer gap.
Keep the existing protected publication pipeline and failure reporting during
ordinary use. No new phone stress test or replacement package is required by
this investigation.

A concrete optional resilience change is ONE fresh Shortcut invocation after a
caught long-pause failure, reacquiring location and timestamps and using a new
intent budget. It could shorten time to recovery after the host resumes, but
cannot prevent the host pause itself. It requires an explicit bounded attempt
counter, no recursive Shortcut loop, and final-outcome notification handling.
It has not been implemented or represented as a verified fix. If recurring
pauses justify changing the working flow, this is the first targeted design to
implement, ahead of a renderer or hosting migration.

## Primary documentation reviewed

- https://scriptingapp.github.io/guide/Utilities/Request/fetch
- https://scriptingapp.github.io/guide/Utilities/URLSession/BackgroundURLSession
- https://scriptingapp.github.io/guide/Utilities/URLSession/URLSessionDownloadTask
- https://scriptingapp.github.io/guide/Device%20Capabilities/BackgroundKeeper
- https://scriptingapp.github.io/guide/Intent/Quick%20Start
- https://scriptingapp.github.io/TestFlight/guide/Utilities/DownloadManager
- https://scriptingapp.github.io/TestFlight/guide/Changelog/3.2.2/Script%20Timers%20and%20Scheduling
- https://scriptingapp.github.io/TestFlight/guide/Changelog/3.2.2/Main%20Script%20Sessions
- https://developer.apple.com/documentation/appintents/longrunningintent
