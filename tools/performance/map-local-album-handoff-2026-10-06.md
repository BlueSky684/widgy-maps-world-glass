# Complete server PNG to a native album source: initial handoff

## Correction — no Shortcut run before full-widget check, 2026-10-06 22:56 Israel

The owner clarifies that they did NOT run the update Shortcut before checking the
new full widget and sending its screenshot. The previous 22:48 interpretation of
the unchanged MAP TIME as a failed full-widget update was premature. The displayed
22:18:15 frame is the last saved image and is expected without another producer
run. Full-widget replacement freshness is UNTESTED, not a demonstrated failure.

The reported navigation improvement, residual delay compared with the small
consumer, Files selection and source audit remain valid. Automatic scheduling
has not been configured, so no new production was expected merely by waiting or
switching tabs. Do not diagnose caching, file mismatch or save failure from the
old timestamp. The proposed Files-output investigation is not needed unless an
actual update attempt fails.

Next: run the already working map update Shortcut once and let it finish, then
return to the new full widget and switch Calendar -> Home. Observe whether MAP
TIME advances and whether navigation remains improved. This is the first explicit
producer-to-full-widget replacement check, not a repeat of the completed small
consumer checks. Preserve the diagnostic strip for this observation and continue
the Home dependency work without attributing all delay to variable count.

## Current result — full widget uses Files; freshness unresolved, 2026-10-06 22:48 Israel

The small consumer's successful manual replacement and fast navigation remain
valid. Do not repeat those completed tests or generalize them to the full widget.

Export of the working small consumer was blocked: the supplied native dialog
says Image Upload Failed, HTTP 422, for HOME / Home Hero World Map / Both Modes /
Files. The owner reports that JSON export also fails. No Files source
serialization, bookmark or native export was obtained. Do not fabricate one.

The owner was guided to Edit As A Copy of Widgy Native Steps Ring 2 and selected
Home Hero World Map -> Image -> System -> Files, using the same map-current.png.
Aspect Fit and Both Modes were retained. The 22:42 editor screenshot shows Files
selected, 1514 layers and MAP TIME 22:18:15; the 22:45 Home Screen screenshot shows
the full widget and that same map time. The native Images indicator changed from
38.8 MB to 13.0 MB; this is not a measured extension RSS or performance result.
The diagnostic strip overlaps the Home event area and is not final artwork.

After being asked to run the existing update Shortcut and return Calendar -> Home,
at 22:48 the owner reports that the map time does not change, and navigation is
faster but still slower than the small map test. Record this as partial speed
improvement with unresolved full-widget freshness. The owner also explicitly
requests attention to additional Home variables. Their causal contribution has
not yet been isolated. Automatic scheduling is still not configured.

### Source audit for the installed full baseline

The public Native Steps Ring 2 generation chain was inspected using inert
example.test calendar URLs only. Its 1514 layers and 81 variables match the
visible native counts, but no export verifies all current phone-side fields.

- Replacing the map image consumer does not itself delete variable definitions.
  With the old map_request consumer excluded, map_request, steps_goal and
  steps_progress are unreachable by name/ID from the remaining generated
  document. The last two were already unused after the native ring replacement.
  Widgy may skip unused definitions; pruning them is not a proven speed fix.
- calendar_city_prefix remains an active, separate asynchronous city lookup,
  with dependencies on Latitude, Longitude, map_latitude_max5 and
  map_longitude_max5. Do not delete these four coordinate definitions while that
  consumer remains. A shared saved English city binding is still unverified.
- Home still consumes weather status/wind, greeting/day-progress calculations,
  the steps_today -> steps_label formatting chain and four calendar_home_* JSON
  fields. It also has direct native weather, sunrise/sunset, clock, reminders,
  distance, energy and ring bindings. Four JSON fields do not prove four requests.
  Native data must remain functional; blanket variable deletion is inappropriate.
- The phone-side Files edit is not reflected in the generated public JSON.
  No new widget import, variable removal, runtime deployment or source mutation
  has been performed by this checkpoint.

Next discriminating observation: inspect the actual map-current.png in Files
after the last Shortcut run and read its burned-in MAP TIME. A new time there
locates the unresolved problem downstream of saving (consumer binding/refresh);
an old time there requires inspecting the producer/output path first. Do not
assume caching, a wrong file, or a failed Shortcut from the unchanged widget alone.
Keep the diagnostic strip until this is resolved. Then optimize the active
full-widget dependencies while preserving layout/data, verify the shared
Calendar city, and configure native automatic updates.

Raw screenshots, GPS coordinates, personal resolved URLs and calendar data are
not committed.

## Current result — English city, coordinates and fast navigation, 2026-10-06 22:20 Israel

This supersedes the location-pending status at 20:50 below. The update Shortcut
now obtains Current Location once, extracts latitude and longitude, and calls
BigDataCloud's reverse-geocode-client endpoint on the phone with those current
coordinates and localityLanguage=en. Get Dictionary Value with key city reads
that GET response. Its output replaces the native Hebrew City token after the
final city_text parameter of the existing map URL. The map GET and fixed-file
overwrite remain in place. Geocoding belongs to the update Shortcut, outside
Home/Calendar tap actions; no backend geocoder was added.

At 22:18 the supplied image shows the English city label, location marker,
coordinate caption and MAP TIME 22:18:15. At 22:20 the owner explicitly confirms
that repeated Calendar -> Home transitions remain fast, the city and location
are displayed correctly, and the new timestamp remains. This is a positive
manual update and qualitative navigation result in the small test consumer.

Two earlier issues were isolated: the resolved map URL contained the literal
separator =lon& instead of &lon=, producing no valid location; correcting it
restored marker/coordinates. The native Hebrew city then rendered missing-glyph
boxes in the map font. The phone-side English city lookup resolves the observed
label issue. Do not misdiagnose an actual URL separator error as bidi display.
Keep city_text last because the parser consumes the entire remaining tail.

Remaining work: preserve this working Shortcut and small consumer; integrate
the fixed-file image into a separate copy of the full widget; verify a shared
city binding for Calendar; then configure and test automatic updates. Freshness
while staying on Home, scheduled/locked-device execution, failed-download
retention, locality fallback for an empty city, and full-widget performance are
not yet verified. Do not promise automatic refresh or zero local storage.
The temporary Show Content diagnostic still exists unless the owner removes it.

No runtime code, masters, layout or service plan changed in this checkpoint.
No device screenshots, raw GPS coordinates or resolved personal URLs are stored.

## Current result — fixed-file replacement and fast navigation, 2026-10-06 20:50 Israel

The owner returned to the Shortcuts/iCloud route after reviewing web alternatives.
The working native Shortcut downloads the complete server PNG using URL -> Get
Contents of URL -> Save File. It does not use Render Widgy Widget To Image.
The expanded Save File screenshot shows destination Shortcuts, Ask Where to Save
off, subpath `map-current.png`, and Overwrite If File Exists on. The instructed
destination is iCloud Drive/Shortcuts; the full destination-picker path was not
independently captured. No Photos action is part of this producer.

The initial output and native consumer show MAP TIME 20:16:42. After a later
manual Shortcut run, the Home screen shows 20:48:08. The owner explicitly confirms
that the image updated without editing Widgy or reselecting the source, and that
Calendar -> Home remains fast and retains the new timestamp. This supersedes the
earlier untested-Files status below: same-file replacement and qualitative fast
navigation now have a positive native-device result in the small test consumer.

The test URL keeps explicit empty lat/lon and renders no device location. Its
server PNG was separately verified as 3306x1558. Native byte preservation, refresh
while staying on Home, scheduled or locked-device execution, failed-download
recovery, cache retention, and performance in the full widget remain unverified.
Do not infer a timer, zero local storage, or full-widget success from this result.

Next: add one native Get Current Location action to the update Shortcut, then
derive latitude, longitude and city from that location. The existing renderer
can composite marker, coordinates and city into the PNG. Verify native numeric
formatting and city language before connecting the URL; the explicit-coordinate
server path does not reverse geocode. Use the same saved city for Calendar only
after its binding is verified. Keep acquisition outside Home/Calendar taps.
Automatic scheduling follows the location test and is not configured yet.

No runtime, approved master, widget layout or service plan changed. Raw device
images and personal coordinates are not committed.

## Owner storage constraint — 2026-10-06 17:14 Israel

The owner does not want accumulated images on the phone and requests cloud
storage. Stop the proposed growing Photos-album automation. The prior successful
album A-to-B/navigation result remains valid evidence, not the final architecture.
No photos are deleted and no new account, paid resource or runtime change is made.

The map renderer already runs on Vercel. Adding remote object storage alone does
not establish the fast local-consumer behavior for Web URL sources. Official
Vercel Blob public-storage documentation supports hosted image URLs and browser
conditional requests, with a minimum configurable cache lifetime of60seconds;
it does not prove Widgy sends conditional requests or updates a stable URL quickly.
No direct-URL speed or cache-retention promise follows from these service features.
Source: https://vercel.com/docs/vercel-blob/public-storage (checked2026-10-06).

Next bounded-storage candidate: one fixed-name PNG in iCloud Drive, overwritten
rather than appended. iCloud Drive is accessible through Files (Apple source:
https://support.apple.com/en-us/118443). A local downloaded copy/cache can remain;
cloud storage is not zero device storage. Do not claim exactly one native cache.
The owner's Image->System menu visibly includes Files, but live image replacement
through that source has NOT been tested. It may import a snapshot or lose access
when replaced. Existing album evidence cannot substitute for a Files A-to-B test.

Smallest next setup: inspect the native Shortcut Save File action's expanded
options for an explicit destination, stable filename and overwrite behavior.
Use a dedicated map-only folder/file. Then test one existing PNG and a later PNG
at that same path through an isolated native Files image consumer, confirming
both freshness and fast Calendar-to-Home navigation. Preserve the album control.
Do not invent native bookmarks/IDs, automatic cleanup or a reliable schedule.
The no-accumulation/cloud constraint takes precedence over the earlier next step.

## Latest result — album replacement with fast navigation, 2026-10-06 17:11 Israel

The earlier 15:26 speed result was for a fixed Photos image: the 16:20 source
screenshot showed `Image Library (With PNG Transparency)` selected. That also
explains why the first attempted album replacement was inconclusive.
At16:25 the owner reached the native Albums picker after being instructed to
select `Image Library - Newest Photo From Album (With PNG Transparency)`.
The dedicated album is displayed as `Widgy Map Local Tes`.
At16:27 the Home widget showed MAP TIME15:31:41, establishing the new baseline.
After the owner was asked to save a fresh PNG to that same album, the 17:08
Home screenshot shows MAP TIME17:07:26 and the changed day/night composition.
At17:10:38 the owner explicitly says the update happened when tapping Calendar
and then Home. At17:10:59 and17:11:25 they confirm transitions remain fast.

This is a positive manual producer-to-album replacement and qualitative
navigation result in the small consumer. It does not establish exact latency,
background refresh while remaining on Home, automatic scheduling, locked-device
execution, original-byte retention in Photos/Widgy, or full Home performance.
No native source JSON or album identifier has been extracted or invented.

Next: build a separate native Shortcut with URL -> Get Contents of URL (GET)
-> Save to Photo Album, using the existing full PNG endpoint and the selected
album. Verify one actual run and the resulting MAP TIME through normal navigation.
Keep the existing images until the new frame is validated; no automatic deletion,
blank placeholder, Render Widgy action, image resizing, conversion, or new reload
step is introduced in this initial producer test. Reload is not yet demonstrated
necessary for this navigation-based refresh. Scheduling/locked execution and
last-good-image retention under failed acquisition are separate remaining gates.
Do not attach downloading to each Home tap or promise a five-minute timer.

Apple primary sources checked on2026-10-06:
- https://support.apple.com/he-il/guide/shortcuts/apd58d46713f/ios documents URL
  input, Get Contents of URL and GET requests.
- https://support.apple.com/he-il/guide/shortcuts/apdaf74d75a5/ios documents saving
  photos into a specified album. Exact on-device fields remain screenshot-led.

No runtime, approved master, template, animation setting or hosting plan changed.
Raw phone screenshots and personal album listings are not stored in this repo.

2026-10-06, after the owner agreed at14:48 Israel to the distinct local-image route.
Branch f50-widget-test; baseline401df3632713bcd319a23526d095356c0d695c6c.

## Scope

The failed Widgy-rendered Alpha output is not reused. Use the existing approved
server renderer for a complete original-size PNG, saved separately on the phone.
This changes recurring acquisition from tiny masks to approximately4MB images.
Local native decoding/rendering, album ordering, refresh and automatic scheduling
remain device gates. No faster-navigation or background-update success is claimed.
No rendering/updating Shortcut is attached to the Home button.

## Verified existing producer

The existing endpoint was checked with explicit empty lat/lon, preventing both
GPS and IP-derived location. It renders a new complete server-now image and burns
the actual map time into a temporary diagnostic strip. No server/cache change.

URL: https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&diagnostic=refresh-v1&lat=&lon=

HTTP200, PNG3306×1558, 3942092 bytes.
SHA256 of inspected response: 7a717ddd23857564eb7cb14bde066604b2e54f11aec47ec66e1b2ce6a82ada1e.
Response render time: 2026-10-06T11:50:23.983Z (14:50 Israel).
X-Map-Location-Source: unavailable. Cache-Control: private,no-store,max-age=0.
The original server image was visually inspected: complete day/night composition,
no missing-night white plate. Original PNG file remains a scratch inspection
input, not a newly published art asset or an approved-master edit.

## Native consumer setup

Reuse the existing minimal `Widgy Map Static Only 1`, not Alpha's four images
or Five Minute's active coordinate/script variables. Its original21-node baseline
has zero variables and one Web URL map; it is NOT a local consumer until the
owner changes that one image source. All navigation/fonts/frame remain intact.
Existing import page fetchedHTTP200 and byte-identical to the branch.

1. Open the current PNG in Chrome, save the image into Photos and add it to a
   dedicated album, `Widgy Map Local Test`. Preserve the PNG without conversion,
   cropping or scaling. Native Photos/Widgy original-resolution retention is a
   device check, not proven just by server dimensions.
2. Import a separate Static Only1 from its existing copy page, or use a copy.
3. Select its Home Hero World Map image. In Image → System choose the option
   already observed in the owner's screenshot:
   `Image Library - Newest Photo From Album (With PNG Transparency)`.
   Select the dedicated album using the native picker; no album ID, bookmark or
   source-schema fields are guessed. This menu was observed; selection/output
   still need phone confirmation. If a different picker appears, inspect it.
4. Once the saved current MAP TIME is visible, verify ordinary Calendar→Home
   navigation. A fixed saved image establishes only the initial local-display
   gate, not live refresh. Request the observed result, not another timed video.

Then add a later complete image B to the same album, verify the shown timestamp
changes and does not regress to A. If it needs reload, inspect the observed
Widgy Reload action and selected slot; do not assume a reload preserves the tab.
Keep A until B is validated. Test offline/failed acquisition separately, then
an acceptable automated producer trigger. Native local serialization may be
captured from this non-private diagnostic when needed for repeatable imports.

No runtime files, endpoint, master image, template or paid hosting plan changed.
This checkpoint records a verified producer link and native setup instructions;
it does not claim the phone consumer is already configured or tested.

## First owner speed result — 2026-10-06 15:26:40 Israel

After the local-image instructions, the owner reports: “המעברים מהירים מאוד”
(the transitions are very fast). Preserve this positive qualitative result for
the current small consumer and saved map. It is not measured zero latency,
full Home integration, automatic updating or confirmed original-byte retention.
At15:24 the owner described a Photos-only image picker; we clarified Files →
Share → Save Image, then add to the dedicated Photos album. No new screenshot
or native export yet verifies the exact newest-album binding, so a successful
A→B replacement is still a meaningful gate and cannot be assumed.

Next: save a later current complete PNG B into the same album, retain A, return
to the existing Home widget without editing its source or manually reloading.
Observe whether MAP TIME changes to B. If it does, make two normal Calendar→Home
returns and report speed and whether the timestamp stays at B. If it does not,
inspect the actual source/album selection before assuming a scheduling fault
or adding Reload. No new import, animation change, server or paid service.
The link may add a literal diagnostic t value to avoid reopening the old browser
page; the existing server ignores t for solar time and still renders server-now.
