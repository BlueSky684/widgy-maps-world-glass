# Full Weather 15 host comparison — 2026-10-11

Owner authorized two full copies; requested exact names A and B. Daily Weather
15 remains unchanged. Only f50-widget-test Preview is in scope.

Both exports retain the native Web URL layer 6170 and its map_request variable.
The native Custom Text URL is replaced by a fixed image address. Name and test
description are the only other differences. Whole-document restoration checked
with isDeepStrictEqual, without printing private objects. Baseline SHA-256:
433b9715ea3081e6cc11dc179ba790a0e62f685ca4e925ae81cf2e5f2a43a892.

Single complete approved-renderer lossless PNG, 3306×1558, 4,038,763 bytes.
SHA-256 ac1a690089d666cd65c2f5b49784dd0781c2ee1b8cacd5e36bf1fa1fcfdc93fb.
It is the earlier public synthetic Ashdod point (31.8,34.65) probe, not the
owner's GPS. Fixed daylight and marker intentionally do not update. No health,
calendar, credentials or personal coordinates are in the image.

A serves this ready image as a Vercel static asset. B serves identical bytes
through jsDelivr pinned to the snapshot commit. Native source type, image,
dimensions, geometry and remaining full-widget contents are matched. Provider
cache headers and network routing are part of the delivery comparison; this
does not isolate one provider feature or exercise live rendering/geocoding.

Private full JSON stays local. Public envelopes use AES-256-GCM with distinct
AAD per copy and gzip. Random key stays in the URL fragment only. Browser code
verifies bytes, digest and title before enabling synchronous clipboard copying.
Verification includes exact full clipboard payload, wrong-key rejection and
independent copy-load failure. Existing daily export and Device Glass files are
not modified. Manifest changes must be merged with fresh remote head.

Owner checks two separate slots under normal navigation and idle returns. If a
map disappears, check the other copy promptly and record time/name/screenshot.
Two slots also add workload and are not simultaneous network observations;
avoid claiming either a positive or negative outcome proves a root cause.
Device stability, native export, dynamic freshness and last-good retention are
not yet verified. Halo changes deferred to keep the experiment focused.
