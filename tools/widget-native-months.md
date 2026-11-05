# Month heading repair candidate

The November 5, 2026 screenshot shows two dashes where the calendar browser's
month/year labels should appear. Its grid (previous February 28 on Sunday,
March 1 on Monday, 31 active days) is consistent with March 2027, four months
ahead. The screenshot alone does not establish the selected offset or a
provider-data failure.

In the supplied export the calendar grids are native date layers, whereas
46 month/year labels are independent JavaScript text sources. Their date
arithmetic is correct when executed outside Widgy. Missing or delayed JS
results during hidden-panel navigation are a plausible explanation, not a
proven iOS root cause.

This candidate uses native `Date And Time` sources (`MMMM` and `yyyy`) for all
50 headings. The 48 headings in non-current panels receive the same month
offset as their three grid variants. Day is set to 1 to avoid carrying a
29th, 30th or 31st into a shorter month. Existing frames, fonts, colors,
500 layer objects, 65 navigation actions, native Today overlays, map and
all URLs/global sources remain unchanged. The annual cache remains year-v2.
There are no calendar writes or deletions.

## Runtime limitation

The private Edit Date encoding is modeled as `year|month|day|hour|minute`,
with 0 unchanged, 1 replace, 2 add and 3 subtract. The export's existing day
offsets ground the field and add/subtract convention; month position and
day replacement are inferred from the component contract, not verified by
an on-device export with those exact settings. No iPhone/Widgy runtime is
available here. Arithmetic and structural checks must not be described as
verification of Widgy's decoder or a measured phone-speed improvement.

## Checks

- Original-to-candidate diff permits only source/date edits on 48 headings.
- 46 per-layer JS dependencies removed, without additional data requests.
- Navigation: 100 states/473 transitions with persistent state; 28/185 with
  reset state. All 25 months reachable, exactly one matching heading pair.
- Date contract model: 480,350 outputs per timezone over a 400-year cycle,
  first/last days, DST instants and year boundaries. Ran for Asia/Jerusalem,
  America/New_York and Pacific/Kiritimati. Includes March 2027 fixture.
- Archive decodes to the candidate and contains only `Widgy Weather.widgy`.

On-device acceptance: import/assign the candidate, open Calendar and step
forward/backward through December/January and the screenshot's +4 panel;
check visible month/year against the grid, then return to the current month
and confirm the Today circle. Also check a short-month transition at month
end before describing the change as fully device-validated. The prior ZIP
is retained in the same file's version history.

## Reproduce

```sh
python3 tools/build-widget-native-months.py original.json out --compressor /path/to/zopfli
python3 tools/test-widget-native-months.py original.json out
TZ=Asia/Jerusalem node tools/test-widget-month-dates.cjs original.json out/candidate.json
```

Private widget exports, calendar URLs and credentials must never be committed.
