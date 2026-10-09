# Home Day Addback Test 1

Control: Home Fitness Addback Test 1. Owner reported additional delay but still less than the full version on 2026-10-09 at 08:28 Israel time.

Restore six exact original nodes: sunrise 6121, day label 6122, unavailable text 80205, percentage 6123, sunset 6124, native gauge 82317. No change to native sources, scripts, existing 55 variables, conditions, DST/location behavior, gauge options, fonts, geometry or layer ordering. Add the original day-strip icons/track pixels to the existing card chrome canvas, preserving all other decoded pixels. Same image layer count and dimensions, new asset URL. After first load compare the day group including its artwork, not a provider in isolation.

1182 to 1188 nodes. Only original Home node still absent is graphite background 5001. Full chrome still replaced by extracted card/day regions; full rim, map frame, separator lines and navigation glow remain absent. All actual data-bearing layers are now restored. Other fields, map/GPS/city, complete Calendar, Weather and Fitness tabs remain exactly the control after reversing explicit additions and chrome URL/name/metadata.

Verified reverse diff against actual Fitness Addback artifact, only missing node assertion, exact original day pixels and unchanged remaining pixels, native gauge count one, unique IDs/navigation targets, script syntax, exact encrypted clipboard and fallback, configured full build. Extracted artwork inspected visually. Native speed and output await owner test. Keep Fitness Addback Test 1; compare three returns Calendar to Home after initial loading, report same/slightly slower/large slowdown and gauge/time correctness. Preview branch only; production untouched.

## Clarification before publication
At 08:29 the owner stated the Fitness copy might be as slow as full Home and cannot judge without second measurements. Full-versus-Fitness difference is unknown. Day copy was already prepared; its comparison may also be inconclusive. Accept no clear difference as a valid result; do not present subtle subjective changes as measured effects.
