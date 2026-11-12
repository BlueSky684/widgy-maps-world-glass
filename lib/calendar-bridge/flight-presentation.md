# Automatic flight presentation

Clients opt in with `flight_mode=auto-v1` alongside `presentation=agenda-v2` or `metadata=native-v1`. The shared `context=home-v1` URL forwards the mode. Older clients and explicit legacy profiles retain their contract.

The resolver recognizes conventional English/Hebrew flight destinations, explicit origin/destination titles and IATA routes such as `JFK → LHR`, including prefixed or parenthesized flight numbers. A destination-only title uses the event location as departure. It never uses the phone or calendar time zone as an airport location. It does not perform flight-number lookups, read email, or change calendar events.

IATA airport codes take priority. Full airport names and city names resolve only to an unambiguous IANA zone. Closed airports are excluded from the generated lookup. A city with multiple airports in the same zone retains its city label; cities in different zones require a country or airport code. Missing or ambiguous endpoints keep a flight card but show an em dash for the unknown local time. Arbitrary event titles with no recognizable flight/route structure remain ordinary events. The widget requires matching server metadata to enable flight enrichment; native agenda data remains the fallback when metadata is unavailable.

Calendar instants remain authoritative. Conversion uses the departure zone for start and arrival zone for end, with date-aware DST rules. Arrival labels show the civil-date difference, including negative or +2 day changes across the date line. This is scheduled calendar data, not live airline status. Every date and flight number is processed afresh; the widget contains no flight-specific profiles.

`flightEvidence` binds the output to both absolute event instants. The native widget checks date, native title/location/clocks, unique row identity, zones, calculated endpoint times and arrival-day labels before accepting enrichment. The embedded module is reproduced in `tools/fixtures/native-calendar.cjs` for end-to-end calculation tests. Widget visibility references are repaired separately in the private export without moving design layers.

Run `node --test tools/test-calendar-auto-flights.mjs tools/test-calendar-agenda-v2.mjs tools/test-calendar-source-timezones.mjs tools/test-widget-context.mjs tools/test-calendar-resilient-handler.mjs tools/test-calendar-resilient.mjs`.

Airport data sources, hashes and license are in `airport-data-notice.txt`. No calendar token, event or personal itinerary is stored in the lookup or the public tests.
