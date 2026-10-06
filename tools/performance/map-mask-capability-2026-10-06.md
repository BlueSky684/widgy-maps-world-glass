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
