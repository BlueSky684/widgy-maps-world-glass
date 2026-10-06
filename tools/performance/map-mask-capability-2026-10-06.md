# Small solar mask: native flat composition works; real-map fidelity unresolved

Current continuation after the owner's09:55 request: **do not stop at the offline mismatch**. Read `map-mask-compare-1-review.md`. Color-managed IMG_9923 samples match expected sRGB blending closely;522×246 masks retain the exact master aspect ratio and sharply reduce mask payload/surfaces. `Map Mask Compare1` provides MASK versus ORIGINAL at one fixed time in the same native widget. Two actual color-profiled mask PNGs total41,984 bytes. No live refresh is claimed. One-file cropping is a concrete lead supported by published Frame/Crop availability, but native crop serialization/atomic replacement are unverified. Keep Five Minute1 as the working control.

Latest: IMG_9923 qualitatively confirms the controlled gold/navy gradient on the iPhone Home Screen. Read `map-native-split-2026-10-06.md` and its reproducible benchmark before another import. Native flat masking is supported by this observation, but the actual renderer also darkens some terrain channels; three measured real-map decompositions fail exact independent-resampling parity. No live split is published and no speed improvement is established. Historical capability questions below have been superseded where noted.

2026-10-06, branch f50-widget-test, baseline 30de2d60d1b385f046f7abb9df24266374d4e82d.

## Why this is the next bounded step

The owner asks how to proceed after requesting the most efficient whole-widget architecture and suggesting fixed terrain/lights with a changing mask. Before another import or a paid hosting trial, verify whether the current Widgy Image effects can apply an arbitrary image mask to the approved layers. The inspected public map layer has no explicit non-default blend/mask configuration. Do not guess numeric Widgy effect fields.

## New offline measurement

Run `node tools/benchmark-map-mask-payload.mjs`; output is recorded in `map-mask-payload-2026-10-06.json`. This is distinct from the earlier replacement-pixel overlay, which included modified terrain pixels and weighed 1.39–2.28 MB.

Five synthetic seasonal/time cases use the actual approved terrain, lights and r6 engraving. A full-size 3306×1558 8-bit grayscale solar mask encodes to 108,130–144,218 bytes. Encoding/decoding the mask preserves all its grayscale samples. Reconstructing the current unquantized formula matches the approved raw RGB renderer exactly in all five cases.

Quantizing solar weights to eight bits changes 6,838–9,760 full-size pixels, by at most one 8-bit channel level. After first composing and then resizing to width367, 141–208 pixels differ, also by at most one level. These are measured differences, not an approved tolerance or proof of an imperceptible native result.

This model composes BEFORE resize. It does not simulate independently sampled native layers, native color management or Widgy memory. It excludes marker, city, timestamp and rounded-corner clipping. It is not a completed full-image split or a device-speed result. The small PNG still represents a full-size decoded mask. No deployment/import or visual change was made.

## Native question to resolve

Ask for one screenshot of the map image's Effects options (the sliders icon visible in the user's editor screenshots), including Blend Mode/Mask options if present. No source/provider/value change is needed for that screenshot. A later minimal native export may be necessary to establish serialization; do not request a private full-widget/calendar export.

The required operation is an actual mask or equivalent isolated composition, not simply drawing a grayscale image over the map. Coast engraving and night lights have distinct sequential alpha operations in the approved renderer. Location must stay independent of the solar mask. Confirm group isolation, scaling, transparency and behavior through tab navigation before claiming compatibility. A list of blend-mode names alone does not prove these semantics.

Public primary creator reports provide limited leads, not a current native implementation contract:
- https://www.reddit.com/r/widgy/comments/1o2jbvc/sharing_my_fully_adaptable_widgets_for_ios_26_free/ — creator uses Plus Lighter but reports dependence on background/layer setup.
- https://www.reddit.com/r/widgy/comments/whuouq/ — creator reports using Plus Lighter for text.
- https://www.reddit.com/r/widgy/comments/p3dh8n/ — creator describes the Effects tab and blend modes; full page retrieval failed in this session, so only indexed text was available.

No evidence yet verifies the required arbitrary-image mask. Do not equate Plus Lighter, CSS masks, CoreGraphics/SwiftUI APIs or an image edit in another app with an exposed Widgy feature.

## Continue after the screenshot

If an applicable operation exists, capture a tiny harmless native example, then build an isolated split on the existing minimal Home/Calendar diagnostic. Gate on full approved appearance and actual image freshness, followed by repeated native transitions. If no suitable operation is exposed, do not keep inventing split variants: return to a ready-image delivery comparison or an independently updated local snapshot path, retaining the previous contrary evidence for CDN and Files. Whole-widget source ownership remains documented in `whole-widget-delivery-2026-10-06.md`.

## Effects screenshots received at 07:48:57 Asia/Jerusalem

The owner supplied IMG_9912–IMG_9919. The images are visible directly in the conversation despite failed automatic local-path reads; no additional Library retrieval was necessary. Do not copy the displayed location into reports or test requests.

Observed on the 21-layer map diagnostic:
- Object Alpha100%, Blend Mode Normal, Blur0, Edges Rounding0%, Stretching Yes and Clip To Frame Yes.
- Layer Contents Updated Animation: Interpolate.
- Layer Appeared Transition: Opacity.
- Layer Disappeared Transition: Reversed 'In' Transition.
- The captured Effects sections do not show an explicit image-mask source control. The Blend Mode selector itself is NOT open. The screenshots therefore confirm a blend-mode setting, but neither its available modes nor arbitrary mask support.
- The editor still displays MAP TIME07:01:13 while the phone clock is07:47–07:48. This is evidence of the displayed editor bitmap only, not a fresh-render test, download count or measured Home transition. Images14.7MB is an editor label, not measured process RSS.

No controlled animation-off trial was found in the current investigation notes. The three animation settings are a new candidate to isolate, not a diagnosis of the stall. The current blend is Normal, so historical reports of a non-default blend/transition interaction do not directly explain this baseline.

Next minimal input: the available choices inside Blend Mode, currently Normal. Do not request another scroll through all Effects or alter image source/cache/animation simultaneously. Keep these observed defaults as the control for a later isolated animation test if needed. No image/export/native settings were modified by the assistant.

## Numeric selector and Plus Lighter result, received 08:02:57 Asia/Jerusalem

IMG_9920 showed the numeric Blend Mode editor with range0–17 and current value0, previously labelled Normal. At the assistant's request the owner tried17. IMG_9921(2), phone clock08:01, now explicitly labels Blend Mode Plus Lighter. Verified mappings are only0=Normal and17=Plus Lighter; do not infer the other16 values or exported JSON field names.

The map is not visible in the captured editor frame, while Object Alpha remains100%, Blur0, and the header reports21 layers and Images0.0MB. This screenshot alone cannot distinguish compositing against the backdrop from an unavailable/unloaded image or another editor state. The editor's size label is not a process-memory measurement. Do not claim successful masking, a performance improvement, or an image deletion. No coordinates were copied, and the visible attachment needed no Library retrieval.

Restore Blend Mode0/Normal before any timing comparison. Recovery has been requested, not yet reported. This blend name does not establish arbitrary image masking, isolated groups, sampling parity, or a safe native split. The small-mask route remains unverified; no renderer, service, native export, or subscription was changed.

Next bounded device check, only once the map is visibly restored: change the map image's Layer Contents Updated Animation from Interpolate to Off. Keep the existing source, URL, blend, and appeared/disappeared transitions as the control. Try ordinary Calendar-to-Home returns and observe whether delay changes, plus whether the burned-in map time actually advances during normal use. No timed idle chore is required. If it makes no difference, restore Interpolate. If Off is not offered, report the available label rather than guessing a numeric enum.

This is an unperformed single-setting trial of update animation, not proof that animations caused the network/refresh wait and not a test of all transition animations. Fast returns with a frozen bitmap still do not satisfy the live-refresh goal. A positive result needs the same-source Interpolate/Off comparison with comparable freshness before broader changes.

## Owner feedback at 08:11:27 Asia/Jerusalem

In response to the proposed animation-off trial, the owner reports that the transition feels slower. Treat this as a subjective negative result, not a measured causal attribution. No new settings screenshot, comparable MAP TIME observations, or explicit confirmation of the preceding Normal restoration accompanied the report.

Rollback requested: Layer Contents Updated Animation to Interpolate, Blend Mode0/Normal. The owner has not yet reported the rollback result. Do not adopt Off as an optimization or repeat this unchanged trial. Confirm ordinary navigation has returned to its previous behavior before adding another change. The original refresh bottleneck and arbitrary-image-mask capability remain unresolved; this result does not isolate network, decoding, or Widgy scheduling. No runtime/service changes were made.

## Restored baseline, 08:14–08:40 Asia/Jerusalem

At08:14 the owner asks which copy to use and supplies IMG_9922, with the truncated title Widgy Map Refresh Clo… and the temporary image-freshness diagnostic description. The assistant confirms this Refresh Clock copy and clarifies that navigation should be tested in the assigned iPhone Home Screen widget after saving. The overview lists19 layers and2 groups, three variables and two data sources; do not confuse this with the editor's21-layer count or infer that layers were removed. The displayed MAP TIME08:09:48 is newer than the earlier07:01:13, but the screenshot alone does not prove ongoing automatic refresh or frequency. No coordinates were transcribed.

At08:40:13 the owner reports that speed has returned after the rollback instruction. Record restored perceived navigation speed; do not claim measured timings, verified settings serialization, or a resolution of the refresh delay. Retain Interpolate and Normal. The Off trial is closed as an unhelpful candidate. Resume the existing, not yet phone-tested Five Minute1 reuse/freshness experiment under the owner's clarified tolerance for occasional refresh delay. No new mask implementation has been validated.

## Static-map/network-mask priority and harmless schema probe, 08:53 Asia/Jerusalem

After reporting advancing time and relatively fast transitions in Five Minute1 at08:47, the owner asks to test a static map with only the mask loaded from the network. Keep Five Minute1 as the working phone control. A full-widget integration copy has been prepared/published separately; do not require that import before answering this mask request.

The108–144KB scalar mask measurement is a reason to pursue feasibility, not an implemented native mask. Terrain and light textures can be fixed, but the approved coast/lights compositing, location marker, sampling and memory behavior still need separate treatment. A simple dark rectangle over a full night map is not equivalent. No new offline benchmark was necessary; the existing scalar-mask and replacement-overlay results remain authoritative.

New public `Mask Blend Probe1` is a schema-capture artifact, not a map rendering/performance trial. It contains exactly one native group, one generic public date-image asset (`assets/calendar-glass/today-c13/1.png`), and zero variables. It has no location, account/calendar bindings, map API, weather/health sources or navigation. It uses known image/group structures and inserts no guessed blend/mask/effect properties. Keep the current Home Screen widget assigned to the working map.

The owner should import the probe separately, select the named Multiply mode on Probe Image if available, and select the named Plus Lighter mode on Probe Group if available, then share ONLY this harmless diagnostic's native widget file. If either option is absent, report that rather than guessing a numeric mode. These two saved native objects allow a subsequent isolated-composition prototype without inventing image/group effect serialization. Group mode behavior and actual isolation remain unproven even after capturing a file. The prior image0=Normal/17=Plus Lighter mapping does not establish group serialization or Multiply's numeric value.

`node tools/test-mask-blend-probe.mjs` passes: input unchanged, one group/image, no source variables/API/token references, original native image fields retained except name/public asset URL, and actual public controller copy/download/error/retry flows with synthetic inputs. Current export/controller tests are not native masking tests. No approved master is edited or generated, no GPS is persisted, and no private widget export is requested.

Page: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-mask-blend-probe.html?v=mask-blend-probe-1

After native file receipt: identify exact image/group blend fields, verify group isolation with controlled flat samples before using approved textures, then assess native map appearance, advancing mask and repeated navigation. Do not equate a successful two-color composition with pixel parity or a full-widget speed fix.

## Native schema captured and controlled composition prepared, 09:09 Asia/Jerusalem

The owner shared the harmless Mask Blend Probe1 as a3402-byte UTF-8 JSON text export. It has the expected name/author, one Probe Group and one Probe Image, zero variables, and the generic public asset. No private location/account data or approved map texture is present. The upload itself is not committed.

The native export establishes the exact relevant effect field on both object types: `t.a[0].a=1` on Probe Image selected by name as Multiply, and `t.a[0].a=17` on Probe Group selected by name as Plus Lighter. The complete saved effect objects are respectively `{a:[{a:1,b:547,c:0,d:547}],b:0}` and `{a:[{a:17,b:548,c:0,d:548}],b:0}`. Treat only these two captured objects/mappings as verified. The neighboring identifiers are preserved for this isolated document; their general semantics and the other numeric modes remain unknown.

Prepared `Mask Composition Probe1` using those native objects. It contains one normal outer group with a static navy base and, above it, an isolated Plus Lighter group containing an opaque gold image plus an opaque white-to-black gradient set to Multiply. Layer order is front-to-back: mask, gold, then the lighting group above base. All three technical PNG inputs are losslessRGBA640×300 and public under `assets/diagnostics/mask-composition-probe/`. The probe has zero variables and no API/location/calendar/weather/health/navigation. No approved asset, renderer or runtime endpoint is changed.

The bounded capability signal is gold where the mask is white, navy where black, and a smooth transition. A wholly gold/black/navy result, missing content, or leakage outside the group rejects this construction as a mask equivalent. Even the expected result would prove only this flat native composition, not the approved terrain/lights/engraving formula, independent resizing parity, time refresh, decoded memory or navigation speed.

`node tools/test-mask-composition-probe.mjs` passes: exact captured blend objects on only the intended group/image, verified technical PNG dimensions/end colors/mid-gradient, distinct existing layer IDs, zero variables/API/private references, and public copy/failure/recovery flow. Native screenshot remains required.

Page: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-mask-composition-probe.html?v=mask-composition-probe-1

## Native flat composition result, 09:20 Asia/Jerusalem

IMG_9923 shows the expected gold left side, navy right side and smooth transition in the assigned Home Screen widget. Record a successful qualitative result for this exact controlled composition. Do not infer lossless pixel/color equality from the supplied screenshot or claim the mask has advanced in time. This test has no time variable, real map, GPS or tab navigation.

The follow-up offline benchmark now applies actual approved textures. Adding light alone cannot match136,964 pixels where at least one night channel is darker than terrain. A complementary day/night construction is substantially closer than a residual split, and its two changing masks total216–292KB at full resolution, but it requires four image inputs and changes the approved formula slightly. A single RGB correction mask is exact before scaling but1.67–2.26MB and diverges after separately resizing inputs. Full details and limits are in `map-native-split-2026-10-06.md`; no production change or new import was made. Keep Five Minute1 as the successful freshness/navigation control.
