# Appeared Off1 device result — 2026-10-06

## Outcome, including the owner's clarification

**Partial success: navigation is subjectively fast; visual composition fails.**
At12:42:53 Asia/Jerusalem the owner explicitly reports that the transition to
the map is fast without delays. This supplements the12:38 recording and must
not be overridden by assuming the visible mask phase measures touch latency.
Retain Appeared Off1 as the owner's current fast comparison; do not automatically
roll back to Persistent1, abandon masks, or silently substitute the full-widget
Five Minute1 integration. It is not a finished visual or refresh solution.

The assistant initially described a visual regression. That applies to the
exposed black/white mask, **not** to navigation speed. No repeat recording,
manual animation toggling or stopwatch is needed to establish this report.

## Recording evidence

Source: `ScreenRecording_10-06-2026 12-38-10_1.zip`, supplied at12:39. Its one
MP4 is16,940,659 bytes,7.666667 seconds,1320×2868,460 HEVC video frames at60fps;
creation metadata2026-10-06T09:38:10Z. Reviewed local extracted frames and widget
crops. The raw recording, screenshots and unrelated phone UI are not committed.

The **APPEARED OFF** heading confirms the requested copy. The completed map's
two bitmap stamps read **D 06/10 12:35** and **N 06/10 12:35**; the phone shows
12:38. Both map contributions eventually display. Calendar covers the map.

Quarter-second frame sampling shows two Calendar-to-Home returns:

| Return | Visible transition / exposed grayscale mask | Complete map sampled by |
|---|---|---|
|1|around1.00s; a white-sided, black-centered mask remains visible at1.25 and1.50s|1.75s|
|2|around5.00s; the same type of mask remains visible at5.25 and5.50s|5.75s|

N is visible during the exposed-mask phase; D appears with the complete map.
Another exposed-mask frame occurs around2.75s before the outgoing transition;
around3.25s the mask is dimming beneath the Calendar transition. These are
approximate positions in the recording, not exact onset/duration or touch-to-
response measurements. The contact sheet was sampled every15th video frame.

Compared with Persistent1's N-only/black-day phase, this copy exposes a bright
grayscale mask before the map. The final composite's appearance has not received
a new exact fidelity approval. There is no five-minute epoch advancement inside
this short clip, and no independent network, decode, memory or request-count
measurement. A fast transition reported here is not a zero-delay guarantee at
a future epoch boundary or after idle.

## What this establishes and the next scope

- The eight captured appeared-Off fields did not eliminate partial composition.
- The owner reports fast navigation. Preserve this improvement and the exact
  current baseline while investigating display stability.
- The visible intermediate result is an unassembled mask contribution. The
  recording does not identify whether source evaluation, image availability,
  decoding or native blending/transition state caused it. A faster server is
  not established as the remedy.
- Do not repeat arbitrary hierarchy variants or more blanket animation toggles.
  Explicit Out serialization remains unknown, but its absence is not proof
  that toggling it would solve this defect.

The next bounded mask question is whether a representation that cannot expose
a white grayscale plane can preserve the complete final map. One candidate to
evaluate offline is black RGBA masks carrying inverse weight in alpha under
Normal composition: in byte-space arithmetic, black at alpha(1-w) over C gives
C*w, as the current grayscale Multiply aims to do. This has **not** been
implemented, measured or verified in Widgy. Native color handling, independent
sampling and partial source availability must be checked; simply replacing a
white flash with a black/missing map does not pass the visual gate. Keep the
known fast navigation and identical source cadence as explicit constraints.

No runtime or import page was changed in response to this recording. The
working Five Minute1 remains an additional control; full Home/calendar/weather/
fitness integration remains pending, without discarding the owner's mask priority.
