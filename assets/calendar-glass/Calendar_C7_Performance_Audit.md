# Calendar C7 — performance audit, 2026-10-02

The user reports a small improvement with C6, asks for a deeper investigation,
and requests event dots below the day numbers with clearance from Today's disc.

## Changes implemented

1. **Overdraw:** C6 selected every progress shape up to the current integer
   percentage. At 65% steps and 58% day progress, that meant 123 overlapping
   filled shapes. C7 selects only the exact existing shape for each value: two
   fills in this example. All 100 levels, geometry, colors and 10,000-step goal
   remain. Zero/unavailable progress still shows no fill.
2. **Layer wrappers:** removed 116 one-child conditional groups by transferring
   the same condition to the unchanged child, excluding button-target groups
   and groups with transforms/effects. Total layers: 2,000 → 1,884.
3. **Agenda inputs:** 132 text sources now reuse the 16 existing native Agenda
   variables instead of declaring the same native fields again. Titles remain
   native strings; untrusted event text is never interpolated into JavaScript.
   This reduces source duplication; Widgy may already cache some such reads.
4. **Static chrome:** two constant-image JavaScript sources become direct Web
   URLs. The image files, dimensions and appearance remain the same.
5. **Unused globals:** removed unreferenced Sunrise, Sunset and City variables.
   The actual native sunrise/sunset display sources remain. Variables: 35 → 32.
6. **City lookup:** optional one-entry, 60-second cache in the phone's existing
   JavaScript context, exact GPS match required. This is best effort: context
   persistence in Widgy is not established. Missing/reset/read-only contexts
   follow the original fetch. No timer, filesystem, localStorage or server-side
   call to the client-only geocoder is introduced. Failures are not retained.
7. **Server PNG work:** replaced two intermediate PNG encode/decode stages with
   raw RGBA buffers. Only the final output is PNG-encoded, with the same sRGB,
   lossless compression and resolution. The approved compositor and assets are
   unchanged. C6's private bounded minute cache remains.

## Measured and verified

With the deployed Sharp version 0.34.5, full-resolution warm renders measured
994 → 721 ms (no marker) and 1,005 → 781 ms (synthetic test marker), in one local
comparison. Reduced-width diagnostic/F50 cases also improved. All four final
PNG files were byte-for-byte identical to C6, including alpha and profile.
These timings are server-render work in a local test, not phone tap timings.

Widget checks cover all 101 progress percentages, exact native Calendar and
button equality, group visibility equivalence for every Hebrew letter, mixed
and Latin titles, locations/all-day branches, shared source equivalence,
client cache expiry/GPS change/clock rollback/fallback and the original copy
flow. Native iPhone comparison remains necessary.

## Event-dot placement: verified input still required

The user's native template proves Calendar keys `44` (month offset), `53` and
`54` (Agenda source), but contains no customized symbol-offset setting.
Public creator examples and release documentation did not establish the
serialized offset key or its coordinate scale. An old example linked by the
developer returned 401 and was not accessed further. No key is guessed in C7;
dot placement is unchanged, and the importer says so explicitly.

Needed: a small native Calendar export after changing the event symbol's
vertical offset in the editor. Setting Today Color to black in that same
sample would also identify its native field and may let us replace the 315
layers currently needed for the custom Today badge. A screenshot of those
controls is useful if the names/options differ on the installed beta.

Target geometry after identification: dot below the date, clear of the 31 px
disc radius plus glow, within its own week row for all 4/5/6-row layouts. The
actual native symbol size and offset scale must be verified before committing
the numerical offset; shifting the complete calendar would move the dates too.

## Remaining constraints and research

- 75 native Calendar instances implement 25 offsets with 4/5/6-row layouts.
  Reducing them properly needs a verified dynamic-frame/state binding; reducing
  the month range or swapping the native agenda for a remote service would be
  a functional change. Neither is done here.
- The 27-letter Hebrew condition tree preserves approved Latin typography and
  native Hebrew fallback. Its structure can only be collapsed further once a
  supported safe regex/OR/native font fallback mechanism is known.
- Cold caches, minute boundaries, moving GPS and fresh server instances still
  require map work. Reverse geocoding can still add network latency.
- Apple's widget interaction flow reloads the timeline after an intent. Widgy's
  developer also confirms that many agenda items can slow rendering. These are
  plausible contributors, not a measured diagnosis of this user's phone.

Primary sources reviewed:
- https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities
- https://www.reddit.com/r/widgy/comments/1kghea6/load_times/ (developer reply)
- https://www.reddit.com/r/widgy/comments/1azp7nv/announcing_widgy_32/ (Today Color, memory changes)
- https://apps.apple.com/il/app/widgy-widgets-home-lock-watch/id1524540481

No phone version/settings change, cache wipe, calendar deselection, font
replacement or resolution reduction is required by C7.
