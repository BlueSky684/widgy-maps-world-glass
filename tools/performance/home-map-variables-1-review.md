# Home Map Variables 1

Prepared 2026-10-05, on `f50-widget-test`, based on `3a3aee5f58c57db73ecaa33fd7e537ed05de8160`.

The owner reported at 07:18:51 Asia/Jerusalem that Calendar-to-Home transitions are significantly slower this morning. No native timing or cause has been established. Repeat the sparse control today rather than treating yesterday's subjective result as a current baseline.

At 07:20:42 the owner clarified that a dynamic-map-only version **without the city display** has no slowness. Its exact variant name was not supplied. Do not treat it as identical to the Map Only City control. Next ask for a current run of the existing map-only **with-city** control first; deliver the prepared variable add-back only if that control is also fast. If it is slow, isolate city lookup from the same baseline before adding Home variables. The owner also raised Widgy itself as a possible cause; neither this observation nor prior layer removals establishes an application-level defect.

## Isolated change

`withHomeMapVariables` calls the existing `withHomeMapOnlyCity` transformation on the regular personalized export. It then restores the exact original 81-variable array, including the 12 Home-only definitions removed by the sparse control. Array order, IDs, sources and bindings are preserved. Name and description identify the new diagnostic.

Home remains one original live map and 14 navigation nodes. All 1297 document nodes, all other tabs, metadata except name/description, map frame/options, full-resolution PNG, GPS and city scripts are identical to Map Only City. No consumers of the restored variables are added. This does not modify the full Native Steps Ring 2 copy or any existing diagnostic.

The restored names are `wx_status`, `wx_wind_speed`, `day_greeting`, `day_progress`, `steps_today`, `steps_goal`, `steps_progress`, `steps_label`, `calendar_home_count`, `calendar_home_event_word`, `calendar_home_title`, `calendar_home_meta`.

## Verification

`node tools/test-home-map-variables.mjs` passes using the public C16 template and synthetic endpoint values. It verifies exact document equality except the variable array and trial metadata; original array restoration; map/other-tab identity; 15 Home nodes and 1297 total; unique layer IDs; no missing variable references or tap targets; unchanged input; rejection of malformed templates; and copy/download, expired-session clearing, retry/page restoration and clipboard-failure fallback through the actual controller with mocked browser APIs.

No owner export endpoint was opened by the agent. Personalization occurs in the owner's browser using the existing export flow. No private export, real coordinates or calendar data is included in committed files. Native rendering, source evaluation and transition performance still require the phone comparison.

## Comparison

Import `Widgy Home Map Variables 1` as an extra diagnostic copy. Wait for map and city to appear, then compare a few Calendar-to-Home transitions with `Widgy Home Map Only City Diagnostic`, in the same widget slot and network during this morning's session. The page links to the control if needed and to the full Native Steps Ring 2 copy.

- Control fast, candidate slower: added definitions are implicated; next split the 12 into weather/Home events and greeting/day/steps groups, preserving dependencies.
- Both fast: no demonstrated cost from definition presence. Widgy may evaluate unused definitions lazily. Next inspect/add back visible consumers from the same control.
- Both slower than yesterday: account for the changed common conditions before attributing the delay to these definitions.
- Missing map/city or indistinguishable results: do not claim improvement or a diagnosed cause.

Public page: `/tools/widgy-home-map-variables.html?v=home-variables-1`.
