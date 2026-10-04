# Home and Calendar self-audit — consolidated-1

2026-10-04. Branch: `f50-widget-test`. Control: normal personalized **Widgy Calendar Unified** at `a2136e2bff63e75b75cda8128a48ea6483d76b2c`.

The user reports the original full-resolution live map and city load quickly in the otherwise empty Home. This shifts the investigation toward the rest of Home and interactions. It does not supply numeric timings or establish that every map request is always fast. The subsequent map-plus-clock prototype was not published: the user requested a comprehensive self-audit instead.

## Completed changes

| Area | Before | After | Change |
|---|---:|---:|---|
| Home descendants | 389 | 339 | Share repeated native weather predicates |
| Home weather groups | 91 | 41 | Factor common conditions across contiguous drawings |
| Calendar descendants | 1,230 | 1,222 | Remove 4 neutral accent wrappers and 4 single-title wrappers |
| Whole widget including tab roots | 1,671 | 1,613 | 58 fewer groups |
| Variables | 81 | 81 | All source definitions retained exactly |
| Synthetic compact JSON | 1,164,188 bytes | 1,152,283 bytes | Approximately 1% smaller; not a speed estimate |

All 46 weather drawings remain unchanged and in the same order. Each drawing has the exact same conjunction of existing native conditions. This avoids introducing a JavaScript weather classifier, a new data dependency, different icons, rasterization or a changed fallback.

Calendar's four accent wrappers have no conditions, geometry or effects. Each of the four title wrappers has one drawing and one condition; that condition moves onto the drawing. No month pane or navigation target is removed. Guards reject unexpected effects, frames, manual visibility, template structure and targeted wrapper IDs.

The candidate is a separate **complete** export, `Widgy Consolidated Home Calendar 1`. Its copy page imports none of the previous diagnostic transforms. The regular export stays available as the control.

## Home mechanisms inspected

- Original map layer, full 3306×1558 PNG pipeline, GPS sources, city lookup/validation, minute refresh and map cache settings are retained exactly.
- Original live timer and custom font are retained. Earlier full-widget old/new clock comparison showed no perceived benefit.
- 100 step segments are cumulative: removing them or changing their conditions to exclusive would damage the approved ring. The existing 101-state ring regression passes.
- 100 day-progress shapes have different rounded geometry. They are not identical duplicates and are retained.
- Three nearby day-number text layers implement the approved weight; they are not discarded as duplicates.
- Four greeting variants remain to preserve their exact native visibility and missing-source behavior.
- Home and Calendar share the same literal native calendar JSON endpoint. No previous JavaScript snapshot experiment is reintroduced.
- The complete widget's 313 embedded shape libraries contain no unselected extra items. All selected shapes resolve.
- All 81 variable definitions are referenced; the static dependency graph has no cycles. This is a source audit, not a native scheduling profile.

Earlier removal of progress artwork or weather artwork did not yield a noticeable full-widget improvement. Therefore the new structural reduction must not be called the identified fix before a device result.

## Calendar review

The 25 month panes preserve navigation from -12 through +12 months. They contain 75 native month drawings for 4/5/6-week layouts. The current-month pane has 498 descendants, including 95 possible highlighted-day positions; the other month panes have 22 or 23. Each day highlight contains a disc and three deliberate text-weight layers. These are alternative states, not 95 simultaneous dates.

There are **39 native JSON field bindings to one identical URL**, and 25 month-image URL sources. The code does not prove whether Widgy coalesces these requests or evaluates invisible month panes on a tab change. Do not equate binding count with measured network calls. Replacing them with an unproven shared JavaScript chain would reintroduce earlier dependency and update-order risks.

The calendar API shares a pending provider read by private token and month within a function instance for up to 60 seconds. Private device cache lifetimes are bounded by event transitions, provider expiry and a 30-second cap. Event errors remain distinct from an empty day. The supplied single calendar log had 11 ms execution / 52 ms response finished; it is not a phone transition measurement.

The current self-checks retain full-day totals, the active/upcoming Home event, all-day fallback, four TODAY rows, language layout, detail icons, calendar colors, midnight/DST behavior, month dots, refresh URLs and every tap action. Further large reductions would require a tested native way to position or select calendar state dynamically; removing month panes or replacing native text is not a safe cleanup.

## Accumulated experiments

The normal export import graph contains only its export/personalization, TODAY and city-map modules. Old diagnostic code is not serialized into the normal widget. Existing branches and old static files are not automatically executed by that widget.

There is genuine archival material: `/api/home-map` imports historical renderers, whereas the current widget uses `/api/night-map`. The latter does not import the former. The current `assets/earth/**` function inclusion rule is broad and may package historical files. Effective deployed package size has not been inspected; repository bytes must not be represented as measured function storage or cold-start cost. The currently fast map-only test also does not support claiming this archive is the Home-transition cause.

No historic public URLs, master images or controls were deleted. They may serve older imported widgets. The unpublished clock prototype was removed, and the consolidated copy uses a small independent controller. Backend behavior, region and asset delivery remain unchanged.

## Verification and limits

Run from the repository root:

```sh
node tools/test-widget-consolidation.mjs
node --test tools/test_calendar_unified.mjs tools/test-home-steps-ring.mjs
node tools/audit-widget-runtime.mjs --write
```

- Ordered display-list proof: every drawing's data, source, frame, style, complete predicate set and manual visibility ancestry match the control. This is independent of status locale and native numeric parsing.
- 18,450 additional weather/wind fixtures, including missing strings, invalid wind and the 30 threshold.
- Unique IDs, valid tap targets, unchanged actions, fonts, map, clock, progress drawings, other tabs and variable definitions.
- Synthetic copy/download flow, failure cleanup, retry, back-navigation refresh and blocked-clipboard fallback.
- 22 existing calendar/ring tests pass, using synthetic data and mocked network calls.

These checks do **not** run the native Widgy renderer, its group compositor, widget memory scheduling, GPS, Health or actual phone transitions. Native appearance/import and latency remain unverified. No speedup percentage or root cause has been established. No owner export, real GPS request or private calendar was read by the agent.

Machine-readable counts, dependencies and active import closures are in `consolidated-1-audit.json`. This records a safe structural improvement and an evidence-based boundary for subsequent investigation, not a declaration that the slowdown is solved.
