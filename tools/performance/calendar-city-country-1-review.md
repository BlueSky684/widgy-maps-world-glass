# Calendar City Country 1 — 2026-10-09

## Report and bounded conclusion

The user supplied a Home Screen Calendar capture showing `Ashkelon,` with no
country. Home Direct Data 1 still contains the native `Location / Country`
source in both spelling branches. The missing country is not explained by a
removed source. A screenshot cannot establish why the native provider returned
or displayed an empty result.

The existing phone geocoder response includes `countryName`; the current map
runtime discarded it. This candidate retains it alongside the exact-coordinate
city observation. It makes no additional network call. The server neither
reverse-geocodes nor guesses a country from IP or city spelling.

## Changes

- Keep optional country metadata in the phone memory cache, map URL and the
  existing private process-local city cache. Same exact GPS identity and original
  observation timestamp/one-hour expiry. A new private cache scope prevents old
  country-less records from masking the change; cold-start lookup count is unchanged.
- Calendar prefers a complete city/country pair from that same map observation.
  Missing, malformed or expired metadata produces an empty pair, not invented text.
- Keep native City/Country plus the existing Ashqelon-to-Ashkelon branch as fallback.
  When native Country is also empty, retain the native city and omit the comma.
- All new location text uses the original font, colour and frame, in front of
  the static chrome. All month tap actions remain byte-for-byte unchanged.
- Every unrelated field/source/layer is unchanged from Home Direct Data 1.
  1187 to 1192 nodes and 61 to 63 variables; this is a correctness change, not a
  performance optimization. The live map remains the full lossless 3306×1558 image.

## Native limitation and previous failed trial

Earlier map-derived Calendar city trials were retired after native blank-city
reports. Their success in a JS harness did not establish Widgy scheduling. This
candidate does NOT remove the native fallback or reintroduce the known opaque
background stacking error. The complete pair is an additional conditional path;
native binding and country restoration still require real-device confirmation.
It is not presented as a confirmed native fix, speed improvement, or resolution
of the transient black map. No recurring background monitor is installed.

## Verification

- Full-document restoration whitelist: only map country metadata, location row,
  two location variables and identifying metadata may differ.
- Original native full-location branches, navigation targets and all 48 month
  action strings retained; text geometry/font/colour unchanged; unique IDs.
- Native fallback state matrix: one visible location row for each tested native
  city/country/paired-label state; no dangling comma on missing country.
- Mocked phone tests: 2 fetches on cold cache (existing cache read + geocoder),
  1 on server hit, 0 on surviving memory hit; exactly one map callback. Country
  survives both cache paths. GPS change, offline, invalid/mismatched GPS and
  IP-derived responses remain safe; no external geocoder called during testing.
- English, Unicode, quotes, ampersands and apostrophes; actual JS text template
  parsing; duplicate/malformed/expired/future metadata safely rejected.
- Existing server city tests passed (TTL, scope, LRU, errors, privacy). API harness
  confirms country metadata leaves render options, image body, ETag and cache
  reuse unchanged and is absent from diagnostic logs.
- Encrypted copy page verifies exact JSON bytes/hash before enabling Copy Full
  JSON; correct key, rejected bad key/tamper, clipboard and manual selection tested.
- Complete configured Vercel build required before branch publication.

JSON: `Widgy_Calendar_City_Country_1.json`, 925634 bytes.
SHA-256: `27da272a0b6cf0d01d5ea9dfe3ab89f6b75665f06e680f18973d121da6f2cd17`.
Private JSON and its fragment key are not committed in plaintext.

Provider schema reference: official BigDataCloud React client documentation,
https://www.npmjs.com/package/@bigdatacloudapi/react-reverse-geocode-client
(`countryName` in the GPS reverse-geocoder result).
