# City label path diagnostic

This is an isolation test, not a completed speed optimization. The user reports
approximately 3 seconds for both initial and repeated Home/Calendar changes,
and 1.5–2 seconds for both initial and repeated month changes on the working
native-month-heading baseline. The native-divider trial was reported slower
and is not used as this test's input.

Recent server logs show cached TODAY preparations around 2–3 ms, full annual
refreshes around 345–351 ms, city responses around 1–6 ms, and several dots
preparations around 2–68 ms. These are server-side timings of recent requests,
not full phone/network timings or an exact trace correlated to each reported
tap. They do not establish the cause of the remaining delay.

The city label is an asynchronous JavaScript source with a separate request.
It is visible in Calendar and hidden in Home under the existing button state
model. The probe replaces only layer 83204's source with native static text
`City lookup paused`. This bypasses that label's script/fetch/callback path.
All 500 objects, layer order, styles, 65 button actions, global definitions,
calendar URLs, events, map, health/weather sources, refresh policies and native
month headings remain unchanged. Coordinates are still used by other sources;
this does not disable the whole widget's location work. No data is deleted or
written to calendar providers. The normal location label is absent only in
this separate diagnostic copy. The working archive remains untouched.

The builder restores the one modified field in a copy and asserts equality
with the entire input export, then checks ZIP/raw-deflate round-trip integrity.
This validates isolation, not performance. No simulated microbenchmark is
substituted for actual Widgy timing.

On-device procedure: assign the diagnostic copy, wait for its initial display,
confirm the `City lookup paused` label in Calendar, and repeat the same three
Home↔Calendar and month-forward/back cycles as for the baseline. Report both
approximate delays and whether anything else appears wrong. A repeatable gain
would implicate the city label path collectively, without separating JS start,
network, parsing or callback scheduling. No gain would make this path a lower
priority; it would not by itself prove a particular iOS or rendering cause.
Return to the working baseline after the short test; the probe is intentionally
missing the live city label and is not suitable as the normal version.

```sh
python3 tools/build-widget-city-path-probe.py /private/baseline.json /private/probe --compressor /path/to/zopfli
```

Never commit private exports, endpoint credentials or raw personal logs.
