# Calendar C4

The 2026-10-02 08:31:22 UTC user export establishes these native Calendar
settings without inferred property numbers:

| JSON property | Observed setting |
| --- | --- |
| `44` | Month Offset, scalar kind 688, observed value 1 |
| `53` | Data category `Agenda` |
| `54` | Data field `Calendar Events` |

The sanitized Calendar layer is retained in
`Native_Calendar_Agenda_Month_Template.json`. It contains bindings and settings,
not event values. C4 uses these settings on the existing native month layouts.
Agenda indicator shape, color and position use Widgy defaults; those settings
were not changed in the supplied export and their keys are not guessed.

Month navigation uses the same `button_SHOW-HIDE,HIDE` visibility mechanism
already used by Home/Calendar/Weather/Fitness tabs. Exactly one of 25 month
panes is visible, spanning offsets -12 through +12 relative to the current
month. Boundary arrows are subdued and have no tap action; there is no wrap.
The month title and selected Calendar tab return to offset zero. Browsing other
months leaves the TODAY agenda unchanged. The grid retains its Apple Calendar
tap action. Date selection within the grid is not added.

The native grid, JavaScript month/year title and 4/5/6-week layout all use the
same offset. All JavaScript constructs the first day of the target month to
avoid end-of-month overflow. The approved C3 Today badge is preserved at offset
zero. Other panes have transparent native Today highlights and no custom badge.

Build: `node tools/build_widgy_calendar_c4.mjs`

Verify: `node tools/test_widgy_calendar_c4.mjs`

Verification covers 10,800 month/date combinations across 2024–2032, 73
navigation transitions, both range boundaries, resets from all 25 panes,
unique layer IDs, and unchanged Home/Agenda/date headers/weekday labels/chrome.
Native event-indicator appearance and nested group navigation still require
on-device review. No local test is presented as iPhone rendering validation.

C4 importer preserves C3's visible selectable JSON and manual-copy fallback.
