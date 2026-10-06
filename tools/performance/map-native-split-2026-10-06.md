# Real-map split after the native flat-mask result

Superseded continuation decision: the owner asks for deeper mask investigation at09:55. Read `map-mask-compare-1-review.md`. The measurements below remain valid, but their offline differences do not justify stopping the native experiment. New small masks reduce decoded input cost, the phone screenshot's Display P3 profile explains the flat-sample color discrepancy, and a fixed-time native real-map A/B comparison is prepared.

2026-10-06, branch `f50-widget-test`. The owner supplied IMG_9923 showing the controlled gold-to-navy gradient on the iPhone Home Screen. This is positive qualitative evidence for the captured Multiply-image / Plus-Lighter-group construction. It is not proof of matching the real map, a refreshed mask, reduced memory, or fast navigation. No location was copied from any screenshot.

Run `node tools/benchmark-map-native-split.mjs`. The complete measurements are in `map-native-split-2026-10-06.json`. This offline script uses the approved full-size textures and current r6 renderer at five synthetic dates. It writes no assets and changes no runtime, import, endpoint, subscription or approved master.

## Why simply adding masked city lights is wrong

The approved renderer blends the coast first, then alpha-composites city lights. Full-night output is darker than daytime in at least one channel at **136,964 pixels**, by as much as166 levels. There are also14,107 pixels where nonzero ocean engraving overlaps nonzero light alpha. Adding a nonnegative masked image to unchanged terrain cannot reproduce those darker channels. The flat gold sample did not exercise that case.

The approved formula, before final integer rounding, is:

`F = (T × (1 − q) + E × q) × (1 − a × n) + L × a × n`

Here n is the solar night weight, a the static light alpha, and q is the quantized coast opacity on ocean pixels only. Static all-day/all-night images blended with n approximate this formula but do not reproduce its coast quantization and cross-term exactly.

## Three measured constructions

All inputs remain3306×1558. The counts below are image inputs, not group counts. Bytes are decimal. Independent resampling explicitly uses Sharp/lanczos3 on each input before blending; the reference is the approved composite resized as one image. Widths367 and1101 are representative test sizes, not measured Widgy surfaces.

| Construction | Image inputs | Changing PNG bytes per date | Maximum channel error, full size | Maximum error after separate resize to367 /1101 |
| --- | ---: | ---: | ---: | ---: |
| Static day + static full night, complementary masks | 4 | 216,281–292,380 total | 1–3 | 5–8 /4–8 |
| Static channel minimum + positive day/night residuals, complementary masks | 5 | 216,281–292,380 total | 1–3 | 14–17 /17–23 |
| Static upper bound multiplied by a color correction mask | 2 | 1,673,377–2,262,496 | **0** | 37 /29–55 |

The raw approved RGB reference PNGs weigh3,795,067–4,117,507 bytes. These exclude markers, text, clipping and profiles; do not substitute them for previous complete production PNG measurements.

The endpoint pair is the closest of these constructions. At width367,1,768–2,058 of63,491 pixels differ, with68–182 pixels differing by more than one level in at least one channel. This is a numerical comparison, not a perceptual approval. Its fixed day/night PNGs total7,733,519 bytes and need initial loading. The two complementary mask files reduce subsequent transferred image bytes by roughly93–94% in these cases, but their actual refresh/download frequency is unknown.

The multiplicative correction uses a conservative static per-channel upper bound E. Each mask channel is `round(255 × F / E)` (white where E=0). This reproduces every raw8-bit target sample after final rounding at full size, verified for all five cases. It is a detailed RGB correction, not the previously measured108–144KB grayscale solar mask. Its failed independent-resampling result shows why full-resolution equality alone is insufficient.

## Cost and native limits

Four full-size RGBA inputs represent82,411,968 bytes (78.6MiB), compared with20,602,992 bytes (19.65MiB) for one. Five inputs represent103,014,960 bytes; two represent41,205,984 bytes. These are only hypothetical decoded input surfaces: they exclude intermediate group surfaces and do not measure Widgy allocation, caching, sharing, GPU work or RSS. Small compressed mask files do not establish lower memory use or quicker Home transitions.

Two independently loaded complementary masks also introduce an unresolved update issue: if only one switches to a new time, their sum need not be one and the map may temporarily brighten or darken. No atomic multi-image handoff is verified in Widgy.

Sharp is not the native renderer. These differences refute a claim that arbitrary independent resizing necessarily preserves exact appearance; they do **not** prove that the iPhone exhibits the same errors. Native color space, intermediate precision, resampling order, caching and refresh scheduling are still unknown. A captured gold/navy JPEG is not an exact color calibration.

## Decision and continuation

Record the flat native capability test as successful at the qualitative level. Do not repeat the enum capture or animation-off trial. None of these splits passes exact appearance parity at both tested scales, and none has native performance evidence. Do not publish an approximate split as the approved map or replace the working Five Minute1 control.

The mask request remains open. The closest measured candidate is a **two-mask static day/night comparison**, not a finished single-mask optimization. Any later device trial must be labelled as a real-map appearance comparison first, preserve the successful control, and resolve independently updated masks and memory before a live/navigation claim. Do not ask for another native import merely to reproduce the already successful flat gradient.

The full Home Five Minute Map1 candidate remains prepared and separately published, without a phone result. It is not silently substituted for the owner's current mask investigation. There is no evidence here that a paid server is necessary or that it fixes the native layer cost.
