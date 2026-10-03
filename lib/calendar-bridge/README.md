# Private calendar bridge

Status: implementation and synthetic-provider tests complete; live Google/iCloud authorization and Widgy phone rendering have not yet been verified.

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
- Render capability: separate audience, maximum 365 days, limited to day dots. It cannot access the setup API. Anyone holding a widget's link can see those activity dots; keep the export private. The encrypted URL can appear in infrastructure request logs, but never contains plaintext credentials or event titles.
- Selected calendars are validated against the provider's calendar list. Up to six sources. Only selected providers' credentials are included in the export token.
- Responses disable shared caching; bounded in-process PNG reuse lasts at most 60 seconds. Widgy/iOS may refresh at a different cadence.
- Provider failures return an error, not a misleading transparent "no events" image. Widgy's display after a failed refresh must still be checked on-device.
- Revoke Google authorization or the Apple app-specific password to terminate provider access. Token-version/key rotation invalidates all exported links. A new selection requires a fresh export; a stateless old link retains its old selection until revoked/expired.
- A stolen setup key does not decrypt existing render links; the server encryption key is separate. Rotating the encryption key requires reconnection.
- Never enable verbose provider/body logging in production.

## Rendering behavior

- Uses local month boundaries and Sunday-first grids with 4/5/6 weeks; supports offsets -12 through +12, matching C16.
- Google expands recurring events server-side. CalDAV requests bounded expanded responses; ICS parsing also handles recurrence, EXDATE and overrides. All-day end dates are exclusive. Floating times use the chosen widget timezone.
- Same UID and occurrence boundaries are deduplicated. Different holiday publishers may have distinct UIDs, so select one holidays source rather than deduplicating by title.
- Up to four dots per day, in fixed blue, purple, amber and green. Color assignment is explicitly chosen by the owner; it is not inferred from native calendar colors.
- Client-only personalization adds 25 transparent image layers and clears native indicators on 75 month layouts. It preserves every other C16 value. Native TODAY rows still use device sources and rank-based colors; source-color parity with those rows is a later integration step.
- iPhone-local reminders, Siri suggestions and birthdays are not automatically included.

## Validation

Run `node tools/test_calendar_bridge.mjs` (12 tests). Tests use synthetic credentials and provider responses, including the actual DAV XML parser and final PNG renderer. They cover encryption/audience/expiry/revocation, missing configuration, origin checks, OAuth callback state, calendar selection, pagination, provider failures, CalDAV read restrictions, recurring/overnight/DST/all-day events, fixed-palette PNG pixels, and exhaustive preservation of unrelated C16 fields.

Still required: live authorization for both accounts; actual event/date comparison; device verification of PNG alignment, caching, month navigation and refresh; agreement on the color assigned to each calendar.

References:

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/protocols/oauth2#expiration
- https://developers.google.com/workspace/calendar/api/v3/reference/events/list
- https://support.apple.com/en-us/102654
- https://tsdav.vercel.app/cloud-providers/
