# Home Events Addback Test 1

Control: Home Clock Addback Test 1. Owner reported very small slowdown but still fast at 08:05 Israel time on 2026-10-09; no numeric or repeatability claim.

Restore only seven original event-summary nodes: calendar icon 6191; counts/labels 6111/80206/80207/80208; next-event metadata/title 6112/6113. Their real data sources, fields, fonts, frames and relative layer order are exact. All 55 definitions are retained verbatim. This activates consumers of existing calendar_home variables plus native reminder count; it does not introduce new definitions. Layer count 1168 to 1175.

Clock/header/weather, existing cropped chrome, live map/GPS/city resolver, full Calendar and other tabs remain deep-equal after reversing only the seven additions and metadata. Full Home chrome remains absent, including the decorative event divider embedded in it. No additional image or backend mutation; no fitness/day gauge. Scope is active event-summary layers, not a complete decorative Home rebuild.

Verified: exact reverse diff against actual Clock Addback artifact, unique IDs and navigation, embedded script syntax, authenticated encrypted copy roundtrip and fallback, full configured project build. Native performance/events rendering remain unverified until phone test.

Compare three Calendar-to-Home returns each after initial load against Clock Addback Test 1; report stays fast/slower plus event-summary correctness. If slowdown returns, result implicates this whole added group and its interaction with current content, not uniquely a provider. Preview f50-widget-test only; production untouched.

## Owner outcome — 2026-10-09 08:13 Asia/Jerusalem
Owner reports a further very slight slowdown in overall feel. No numeric timing, repeatability, separate Calendar entry or visual confirmation supplied. Possible cumulative cost remains a hypothesis; no individual bottleneck established. Next paired experiment restores the original fitness card.
