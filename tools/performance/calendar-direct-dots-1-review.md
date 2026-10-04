# Calendar direct dots 1 — separate candidate

2026-10-04, `f50-widget-test`. Baseline: **Widgy Consolidated Home Calendar 1** at `91c852692c81b8c89eafffeffad5d31afdc3ea5f`.

The consolidated baseline has a user-reported improvement of approximately one second in Calendar-to-Home transition. This is subjective phone feedback, not an instrumented latency distribution. Keep that baseline available.

## Audit finding and change

The 25 month layouts already share one layout calculation. The remaining month panes, today's date weight copies, conditional day positions, navigation targets and separator variants serve the approved display. Removing them is not a safe unused-layer cleanup.

Each month event-dot image currently reads a separate global JavaScript URL variable. Its script only appends a minute bucket to a private image URL. The candidate moves that **exact synchronous script** to the corresponding image's native `Javascript` provider/key `22`, and removes its now-unreferenced global variable. That image schema is documented in `build-widgy-v113.mjs` as copied from the user's native World Map Glass export dated 2026-09-22. It is not a newly guessed property. Compatibility and scheduling in the current complete widget still require native validation.

| Source inventory | Baseline | Candidate |
|---|---:|---:|
| Global variables | 81 | 56 |
| Global month-image URL variables | 25 | 0 |
| Synchronous month-image URL scripts, across all providers | 25 | 25 |
| Month panes | 25 | 25 |
| Total layers, including tab roots | 1,613 | 1,613 |
| Synthetic compact JSON bytes | 1,152,283 | 1,147,273 |

This shortens the image dependency chain; it does **not** demonstrate fewer native script executions, fewer image requests, hidden-pane skipping or faster transitions. The script count is unchanged. No speedup percentage is claimed.

Every other document property is retained, apart from the candidate title/description. This includes the whole Home, full 3306×1558 map, GPS/city request, clock, data bindings, fonts, frame geometry, event fields, date/layout conditions, source colors, ±12-month navigation and tap actions. The backend, cache policies, selected calendars and hosting region are unchanged. Minute URL buckets are identical for a given evaluation time; native evaluation frequency is not established by this equivalence.

The transform rejects unexpected scripts, providers, month offsets, multiple images/variables, or additional consumers of the removed variables. It parses the existing JSON URL literal without evaluating export code in the browser. The owner's personalized export stays in the browser; verification uses only synthetic endpoints.

## Verification

`node tools/test-calendar-direct-dots.mjs` passes:

- Restoring only the declared image-provider changes and variable list reproduces the complete baseline document exactly.
- All 25 original scripts and moved scripts yield identical URLs in 300 synthetic cases at minute boundaries, midnight, year changes and UTC instants around DST transitions.
- Extra variable consumers, duplicate month offsets and unexpected script/provider changes fail closed.
- The actual copy/download controller produces the complete candidate; failed exports clear stale payloads, retry and back navigation rebuild it, and blocked clipboard access leaves the download available. These are mocks, not an authenticated browser session.

Native Widgy import, the image provider's cache/evaluation behavior, event-dot refresh and latency are **pending**. No real location, calendar token, private owner export or authenticated calendar request was used by the agent.

## Phone gate and next decision

Import **Widgy Calendar Direct Dots 1** as a separate copy from `tools/widgy-calendar-direct-dots.html?v=direct-dots-1`.

First check dot images on months with known events and navigate between months. If dots are missing, revert to Consolidated 1; a fast blank image is not a performance result. If correct, compare several Home ↔ Calendar transitions in the same slot/network. Before adoption, verify a real event edit propagates after calendar sync, a minute boundary and a widget refresh. No permanent promotion occurs from import alone.

If it is functionally correct but equally fast, keep Consolidated 1 and stop pursuing this dependency as an assumed bottleneck. A larger reduction would need native evidence about hidden-pane evaluation and shared-source scheduling, or a verified native dynamic-position/state format. Do not replace the already fast map or change hosting based on this source inventory.

Both the original normal export and Consolidated 1 remain unchanged and reachable. This candidate's import graph contains only the existing exporter, consolidation and this transform; it does not load the old diagnostic controller.
