# Continue mask research: small masks and an actual native map comparison

2026-10-06, branch `f50-widget-test`.

The owner explicitly asks why we are not investigating masks more deeply. The previous decision to stop at offline differences was premature: Sharp is not Widgy and a measured color delta is not, by itself, a user-visible rejection. Continue with a bounded native appearance comparison while retaining the successful Five Minute1 control. Do not present the approximation as the final approved map.

## New evidence: the phone screenshot's color profile

IMG_9923 has an embedded536-byte Display P3 profile. Comparing its raw JPEG RGB bytes directly with sRGB input pixels is misleading. After converting through Pillow/ImageCms to sRGB, the plateau medians are:

| Region | Byte-arithmetic expectation | Screenshot median converted to sRGB |
| --- | --- | --- |
| Navy | 14,34,58 | 13,33,58 |
| Navy plus gold | 232,185,108 | 231,185,108 |

A40-pixel-high band, x150–1169/y430–469, was compared with the known640-pixel source gradient mapped to the observed rectangle x115–1203. Mean absolute channel difference is0.555 levels; the95th percentile is1, and maximum difference of the median-per-column colors is3. This supports ordinary sRGB component multiplication/addition for this probe. It does not establish exact native pipeline internals: the screenshot is JPEG, the rectangle estimate is approximate and group/image resampling still matters. The uploaded screenshot and native export are not committed. No private coordinates are used.

## New evidence: reduce only the solar mask

`node tools/benchmark-map-mask-resolution.mjs` evaluates five synthetic dates and four mask sizes against the same full-size approved textures. The recorded JSON is `map-mask-resolution-2026-10-06.json`. Map texture dimensions remain3306×1558 throughout.

The masks use exact87:41 aspect ratio, matching the master and the inherited Aspect Fit behavior. A522×246 mask avoids a new letterboxing mismatch that rounded512×241 would introduce.

| Two masks, each width | Combined grayscale PNG bytes | Theoretical two RGBA mask inputs |
| --- | ---: | ---: |
| 3306 | 216,281–292,380 | 41,205,984 bytes |
| 1044 | 45,993–53,821 | 4,109,184 bytes |
| 522 | 14,892–17,186 | 1,027,296 bytes |
| 261 | 4,652–5,222 | 256,824 bytes |

At output width367, reducing masks from3306 to522 changes the modeled endpoint composition by at most1–2 channel levels; width261 reaches8–24. At width1101,522 differs by up to7–11 levels, so neither a pixel-perfect nor an imperceptibility claim is justified. The model resizes each input separately with Sharp/lanczos3. Its numerical results are a reason to test the actual device, not proof of native rendering or speed.

The phone fixture deliberately uses explicit sRGB ICC profiles on every PNG. That expands the two grayscale-valued mask images to RGB and makes the actual published pair **41,984 bytes**, rather than quoting the smaller unprofiled grayscale result as the delivered size. The extra bytes are small enough to prefer an unambiguous color comparison at this stage. Both complete map textures remain full-size lossless PNGs. Theoretical split inputs total42,233,280 RGBA bytes before any compositor buffers; actual Widgy memory is unknown. The reference image in this comparison adds another potential input and makes this unsuitable for a final performance claim.

## Single-mask route investigated, not silently declared solved

Multiply plus Plus Lighter is now supported by the native probe. It still cannot simply add lights where the approved map lowers a channel. The current real-map comparison therefore uses complementary day/night masks.

A single detailed RGB correction mask was measured previously; although exact at full size, it weighs1.67–2.26MB and has larger modeled independent-resampling errors. This remains a distinct fallback, not the108–144KB solar mask.

The publisher's App Store history confirms that Crop moved from Effects to Frame in3.4 and that group effects were expanded. This provides a concrete lead for packing day/night masks into one PNG and selecting two subregions, potentially sharing a URL and image identity. It does **not** establish crop serialization, cache sharing, atomic replacement, low memory, or the correct clipping behavior in the current native version. No guessed crop field or blend enum was added. Capture a harmless native crop example only if the real-map appearance is acceptable and the shared-file route is worth pursuing.

Primary source consulted:
https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481

Historical forum crop/mask statements conflict with later published features, so do not use a2022 “no cropping” answer as a current capability limit. No WebView/CSS mask, timer, background downloader or SwiftUI-only API is assumed available in a Widgy JSON.

## Prepared phone comparison

`Widgy Map Mask Compare 1` starts from the known minimal Five Minute1 navigation. It has two native groups with the existing button actions and no Reload action:

- **MASK** (Home): fixed3306×1558 day and full-night derivatives, plus522×246 complementary masks. Normal day group behind Plus Lighter night group; each mask is Multiply above its static image. Uses only the exact previously captured native effect objects.
- **ORIGINAL** (Calendar): the actual approved r6 renderer at the identical fixed2026-10-06T04:30Z instant, without location, label or timestamp overlays.

Both views have the exact same image frame, explicit sRGB profile and rectangular corners. This deliberately isolates terrain, lights and engraving before restoring the marker and clipping. The time is frozen. All GPS/JavaScript variables, account endpoints, weather/fitness and live map requests are removed from this diagnostic. This is a visual comparison with stable images, not a live-refresh or speed solution.

Public assets are reproducibly derived during the Vercel build by `tools/build-map-mask-compare.mjs`; no multi-megabyte copies are added to git. The manifest records sizes and hashes. Existing renderers/approved masters/normal exports are unchanged. The only deployment configuration change appends this fixture builder.

Tests: `node tools/test-map-mask-compare.mjs` passes. Checks include unchanged input, unique IDs, exact inherited frames, captured effects and layer order, existing tab actions, zero private source references, native tab labels, PNG hashes/profiles/dimensions, reference pixels equal to the renderer, complementary mask pixels and exact aspect ratio, plus real copy/download/failure/recovery controller flow using synthetic inputs. Mask resolution benchmark completes with complementary-weight assertions. Native map appearance remains untested.

Handoff after public file verification:
https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-map-mask-compare.html?v=map-mask-compare-1

Ask the owner to import this one separate copy, assign it temporarily, wait for first loading, switch MASK/ORIGINAL, and send one screenshot of each. Keep Five Minute1 available. No timed idle chore and no repeated flat-color or blend-enum test.

If appearance is acceptable, the next step is a deterministic time-bucket mask endpoint and a native live-navigation trial, with a clear new-mask indicator and investigation of one-file crop sharing. Do not confuse fixed-image fast transitions with fresh-mask speed. The mask's public solar data needs no location; any future GPS marker stays independent and retains exact coordinate sources. Weather, fitness and calendar work remain in scope after this map boundary is stable.
