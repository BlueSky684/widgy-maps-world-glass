# Map disappears after Calendar → Home on Google Cloud

Owner-reported incident: October 15, 2026, approximately 09:12 Asia/Jerusalem
(06:12 UTC). Trial branch: `f50-widget-test`. Google runtime source remains
`49d0ae66865881905ae8647aa4a940fa5609ef6f`; this report changes no runtime.

## Observations

- Initial image display after the instructed Google-origin change was reported
  successful. The installed widget was not exported again for independent review.
- On Calendar → Home the map disappeared again. IMG_0420.jpeg shows the Home
  navigation selected, the navigation controls still visible, and native Memory
  Used text reading 19.7 MB. The full widget was not replaced by an assignment
  placeholder in this screenshot.
- This document has the original combined 3306×1558 PNG map and navigation in
  Home; 106 other Home nodes had been removed. Other tabs remain present.
- IMG_0421.png and IMG_0422.png show an operator's Cloud Run application-log
  query for 06:10–06:14 UTC. Visible records finish with status 200. Near the
  reported minute, large responses are:

| UTC timestamp | Server phase | Status | Server elapsed | Content-Length |
| --- | --- | ---: | ---: | ---: |
| 06:12:16.520493 | finished | 200 | 840 ms | 4,129,677 bytes |
| 06:12:26.470317 | finished | 200 | 4 ms | 4,129,677 bytes |

Several interleaved 135-byte responses also finish with 200. This query does
not include route or HTTP method, so do not label those rows as map images or
claim an exact native-client attribution. The two screenshots are not a raw
machine-readable export of the full result set.

## Interpretation and boundaries

The Google-hosting trial failed the native stability gate. Successful budget,
Firestore and server checks remain valid, but they are separate from native
image visibility. No service rollback, budget reversal or resource deletion
was performed in response to this incident.

`cloud_map_http_v1` records the Node response finish event and Content-Length.
Node documents finish as handoff to the operating system, not client receipt:
https://nodejs.org/api/http.html#event-finish_2
The timing is not end-to-end iPhone download/decode/display latency. These
records do not establish a specific memory, cache, networking or Widgy bug.
19.7 MB is a displayed sample, not proof of the allocation scope or peak.

Previously tested transport/host alternatives and smaller images must not be
presented as new proven solutions: the prior 1653-wide map also disappeared;
the WebP candidate failed its native gate; full-size PNG subsequently loaded
again. A prior main-app exit-watchdog report did not match this event or prove
widget-extension memory exhaustion. Earlier absence of a matching Jetsam log
must not be used to block progress or rule out allocation failures.

The next useful escalation is native image-loading diagnostics: received body
length/error, image decoding error, source/cache state, and image assignment
during the Home-group visibility change. This requires native Widgy visibility
not provided by our server logs. Do not invent JSON fields or claim access to
that instrumentation. Preserve the current PNG and debug layer while asking
the developer for a supported diagnostic or minimal reproduction requirement.

## Short developer update (draft; not sent)

The intermittent missing-map issue also reproduces after moving delivery from
Vercel to Google Cloud Run. At approximately 09:12 Israel time on October 15,
switching Calendar → Home left the map blank, while navigation and the native
Memory Used label (19.7 MB) stayed visible. Initial image loading had succeeded.

The image is a single 3306×1558 PNG. Nearby server responses completed with HTTP
200 and Content-Length 4,129,677 bytes (840 ms and 4 ms server-side). We understand
this does not prove successful receipt or decoding on the phone. Smaller-image
and reduced-Home-content tests have also shown disappearance.

Can you provide a way to capture Widgy's image-download/decoding/cache error
during a group visibility change, or specify the smallest useful reproduction?
I can attach the failed-widget screenshot and the sanitized server records.

Device: iPhone 17 Pro Max, iOS 27.0.1. Reconfirm the currently installed Widgy
version/build before sending; historical reports mix a user-reported public
27.0.1 installation and an earlier 27.1 build 360 TestFlight main-app report.
