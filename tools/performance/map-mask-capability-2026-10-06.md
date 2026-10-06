# Small solar mask: measured payload, native capability still required

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
