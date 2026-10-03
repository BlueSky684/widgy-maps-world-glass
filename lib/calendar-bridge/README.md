# Private calendar bridge

Status: on 2026-10-03 the owner verified unified TODAY, month dots and Home data, including English-first ordering, 24-hour times and long Hebrew title alignment. The owner reported intermittent `Calendar unavailable` after tab changes with `perf-2`, plus only a small speed improvement. `perf-3` removes the intermediate snapshot/field-script dependency and optimizes map rendering without changing pixels; device verification is pending.

Entry page: `/tools/calendar-connect.html`. All setup and account authorization happens in a browser. This adds a private test export based on C16; it does not replace C16 or publish the canceled dynamic-color C17.

## Deployment configuration

Set these variables in Vercel's Preview environment for `f50-widget-test`, then redeploy:

| Variable | Value |
| --- | --- |
| `CALENDAR_SEAL_KEY` | 32 random bytes encoded as 64 hex characters |
| `CALENDAR_SETUP_KEY` | At least 43 characters generated from 32 cryptographically random bytes |
| `CALENDAR_GOOGLE_CLIENT_ID` | Google OAuth Web application client ID |
| `CALENDAR_GOOGLE_CLIENT_SECRET` | Corresponding client secret |
| `CALENDAR_ORIGIN` | Optional. Defaults to the existing branch host below; use an HTTPS origin without a trailing slash |
| `CALENDAR_TOKEN_VERSION` | Optional; defaults to `1`. Changing it and redeploying invalidates existing sessions and render links |

The page can generate the first two values locally in the browser. Save the setup key in the owner's password manager. Do not put credentials into Git, chat, screenshots, issue text, or public widget files. Google configuration is optional for an iCloud-only connection.

Enable Google Calendar API. Register this exact OAuth redirect URI:

`https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/calendar-bridge?op=google-callback`

The application requests `calendar.events.readonly` and `calendar.calendarlist.readonly` only. With Google's external OAuth consent screen in Testing, the refresh token expires in seven days; address the publishing/verification settings for continued use. No claim is made that an unconfigured OAuth project is already authorized.

iCloud uses an Apple app-specific password with two-factor authentication. The app-specific password itself is not read-only; this bridge restricts its CalDAV transport to read methods and Apple's CalDAV hosts. Never enter the main Apple password into this site.

## Privacy and scope

- Single owner, protected by a high-entropy setup key. The application is not designed as a multi-user service.
- Account credentials live in encrypted JWE cookies and an independently scoped encrypted render capability. There is no calendar database and no public personalized JSON upload.
- Setup cookie: Secure, HttpOnly, SameSite=Lax, 30 days. Writes additionally require the pinned Origin and JSON content type.
- Google OAuth: state, 10-minute authorization window, PKCE S256, exact callback URI, granted-scope check and offline refresh token.
- Legacy render capability: separate `calendar-render` audience, maximum 365 days, limited to day dots. New unified exports use a separate `calendar-widget` audience and endpoint for dots plus today's event titles, times and locations. An old dots-only link cannot read these event details. Neither capability can access the setup API. Keep exports private: anyone holding the new link can read those details. URLs may appear in infrastructure request logs but contain no plaintext credentials or event titles.
- Selected calendars are validated against the provider's calendar list. Up to six sources. Only selected providers' credentials are included in the export token.
- Responses disable shared caching; bounded in-process PNG reuse lasts at most 60 seconds. Widgy/iOS may refresh at a different cadence.
- Provider failures return an error, not a misleading transparent "no events" image. Widgy's display after a failed refresh must still be checked on-device.
- Revoke Google authorization or the Apple app-specific password to terminate provider access. Token-version/key rotation invalidates all exported links. A new selection requires a fresh export; a stateless old link retains its old selection until revoked/expired.
- A stolen setup key does not decrypt existing render links; the server encryption key is separate. Rotating the encryption key requires reconnection.
- Never enable verbose provider/body logging in production.

## Apple holiday subscription

The separately selectable public source `apple-holidays:il_he` reads the pinned `https://calendars.icloud.com/holidays/il_he.ics` feed without credentials. Both Hebrew holidays on 2026-10-03 were verified in the live feed against the owner's screenshots. Existing selections and exports do not silently gain this source: select it and generate a new export. Transport rejects redirects/arbitrary URLs and bounds plain/gzip input. Feed failures are explicit. Events without DTEND retain the iCalendar one-day default for DATE values.

## Rendering behavior

- Uses local month boundaries and Sunday-first grids with 4/5/6 weeks; supports offsets -12 through +12, matching C16.
- Google expands recurring events server-side. CalDAV requests bounded expanded responses; ICS parsing also handles recurrence, EXDATE and overrides. All-day end dates are exclusive. Floating times use the chosen widget timezone.
- Same UID and occurrence boundaries are deduplicated. Different holiday publishers remain separate when both are selected; holidays are not deduplicated by title.
- Up to four dots per day, in fixed blue, purple, amber and green. Color assignment is explicitly chosen by the owner; it is not inferred from native calendar colors.
- Client-only personalization adds 25 transparent image layers and clears native indicators on 75 month layouts. Unified exports also bind TODAY titles, times, locations, total and row accents to the same selected calendars and occurrence ordering used by the dots. Weather/Fitness, fonts, timed row frames and assets remain C16. Home event bindings are described below. The original C16 file is not modified.
- Each month image uses a full-URL Widgy variable, matching the existing map binding. Its URL changes in one-minute buckets when Widgy evaluates it, preventing indefinite reuse of a static PNG URL. The 25 small URL variables do no networking; the server still shares provider reads between TODAY and dots for 60 seconds. Existing exports need to be regenerated/imported to obtain these bindings. This does not force iOS to refresh a sleeping widget.
- Native Widgy JSON Endpoint sources bind 39 ready-to-display fields directly from the same literal private URL with `format=widgy&render=perf-3`. No calendar event field depends on another Widgy variable or a Javascript evaluation. The server computes title layout and detail-icon choices. This removes 40 script variables from perf-2. Event text is data, never executable source. The `encoded` response remains for existing perf-2 imports. Four conditional fixed-palette accents replace rank-based colors. Provider all-day flags replace the old midnight-time heuristic.
- TODAY keeps all events for the current day, including completed timed events, so its first four rows correspond to the day's first four dots. Titles beginning with a Latin letter (English) come first, Hebrew next, other or untitled entries last; leading emoji, punctuation and numbers are ignored. Within each language group, the existing start-time and tie-break ordering is preserved. This shared order is applied before the four-event limit in both panels. The full count is displayed even when more than four events exist. Shared occurrence logic handles duplicates and local-day overlap. Month navigation changes the grid while TODAY continues to show today.
- Home reads four native JSON fields from the same endpoint: full daily count, event word, selected title and status/time. Selection is an active timed event or earliest upcoming timed event today (chronological order, using the existing language order to break ties), then an all-day fallback. Finished timed events never masquerade as upcoming. Empty/finished days and unavailable data are explicit. The original-size grey status/time line sits above the full-width lime title, matching the owner's reference. Both reminder counts use Widgy's native Reminder Events Today source. The server computes the next-event state at request time, and the private HTTP cache expires no later than an event transition.
- API errors retain their HTTP status and include explicit unavailable fields instead of a successful empty calendar. A pending intermediate variable can no longer be converted into a false error by local field scripts. Native source refresh/reuse, offline behavior and crossing an event/day boundary require on-device verification; no custom timer forces iOS to refresh. Legacy encoded-snapshot clients retain their 15-minute/day-boundary checks.
- The setup page reports activity-day and today-event counts by selected calendar, plus today's first four titles and assigned colors. A selected calendar with zero events is shown explicitly. Built-in/local holiday calendars visible on the phone may not be exposed by either connected provider and must not be fabricated from native row counts.
- iPhone-local reminders, Siri suggestions and birthdays are not automatically included.

## Direct copy page

`tools/widgy-copy.html` prepares the latest personalized widget automatically using the existing owner session and saved selection. A user click copies the JSON; a download is available as fallback. No account listing, selection mutation, localStorage or public personalized file is involved. The existing setup page and this page share `calendar-widget-export.js`. If the session has expired, the page links to setup for sign-in.

## Validation

Run `node tools/test_calendar_bridge.mjs`, `node tools/test_calendar_unified.mjs` and `node tools/test_calendar_apple_holidays.mjs` (29 tests). Tests use synthetic credentials and provider responses, including the actual DAV XML parser and final PNG renderer. They cover encryption/audience/expiry/revocation, missing configuration, origin checks, OAuth callback state, calendar selection, pagination, provider failures, CalDAV read restrictions, recurring/overnight/DST/all-day events, fixed-palette PNG pixels, unified TODAY/dots language and time ordering, Home next-event/empty/stale behavior across time boundaries and DST, text-safe legacy bindings and direct native TODAY/Home field bindings, stale/error handling, minute-bucket image URLs across all 25 month offsets, old-link isolation, and preservation of unrelated C16 fields and row geometry.

The owner chose Google holidays=gold, Apple Hebrew holidays=blue, personal Google=blue, iCloud Home=purple, iCloud Work=green. Calendar matching, image refresh, Home data and long-title alignment were confirmed on-device. Google was moved to Production and reconnected on 2026-10-03.

## Tab-switch performance investigation, 2026-10-03

The owner reported that `perf-1` remained slow despite reducing 2,043 layers/932 conditions to 1,671/560. Vercel logs confirmed native widget requests carrying `render=perf-1` still arrived in repeated sequences. For example, calendar requests at 22:19:34.943, 35.872, 36.284, 36.757 and 37.363 Jerusalem time spanned 2.420 seconds. The final two sampled server responses took 226 ms and 148 ms, with 12 ms and 27 ms function execution. Private HTTP caching did not remove these repeated requests. The navigation actions were existing `button_` layer-visibility actions, without an explicit extra reload action.

`perf-2` replaces the shared async fetch plus four independent Home fetches with one native JSON source. At that stage map/city lookups, navigation, weather, fitness, date rendering and approved Calendar row geometry remained unchanged. Native JSON source fields (`JSON Endpoint`, `Endpoint`, `18` URL, `19` method, `23` key path) are grounded in an existing exported widget: https://gist.github.com/szymonkorytnicki/db8699b80f75faf8cc9d32aa963b1811 . The native-source evaluation order, minute refresh, and actual tap latency still require testing in Widgy on the iPhone; local tests do not emulate its rendering engine.

### perf-3 evidence and changes

At 22:36:42.926 Jerusalem time, the phone requested `view=today&format=widgy&render=perf-2` and received HTTP 200 in 155 ms (11 ms function execution). The next map request at 22:36:43.655 took 2.3 s (1.53 s execution). Thus calendar errors on tab changes were not accompanied by a failed HTTP request, and the calendar-only optimization did not address the expensive map renderer.

Direct flat JSON fields remove the URL-variable → JSON-snapshot → field-script chain that could turn a missing/not-yet-resolved value into `Calendar unavailable`. All 39 sources use an identical literal URL and existing private HTTP caching; request coalescing and tap latency are not claimed verified until measured on the phone. Native rendering cadence replaces the removed local freshness checks. Existing map/city client scripts and all month-dot refresh variables remain unchanged.

The map renderer now reuses the exact fully-night pixels and directly copies fully-day pixels, doing trigonometry/blending only in twilight. PNG encoding uses lossless level 6 instead of 9. Full 3306px output, color profile, marker, fonts, clipping and every decoded pixel remain identical to commit `65576a0`. Local warm full-render time was 860 → 491 ms; PNG size was 4,270,206 → 4,339,593 bytes (1.6% larger). Cold texture/engraving setup and phone/network latency are not represented by that warm benchmark. `tools/test-map-perf3.mjs` compares eight complete solar-pose/atlas renders and three complete PNG outputs against the approved baseline.

References:

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/protocols/oauth2#expiration
- https://developers.google.com/workspace/calendar/api/v3/reference/events/list
- https://support.apple.com/en-us/102654
- https://tsdav.vercel.app/cloud-providers/
