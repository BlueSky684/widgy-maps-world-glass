# Map Separate Layer 1

2026-10-05, branch `f50-widget-test`, source parent `064d4603e157ef832004ba73edd514644c613ba3`.

## New observation

At 12:28:43 Asia/Jerusalem, the owner confirms that Calendar stays visible after tapping Home during a stall, then Home and the map appear together. This identifies the visible phase before the replacement Home image appears. It does not rule out map URL evaluation, network/renderer/decode work or Widgy scheduling, and is not a measurement of any individual stage. The stable-URL trial gave no perceived improvement at 10:56. Lean 1 remains the control, retaining its earlier reported partial improvement and intermittent stalls. User priority remains map/location first, no Home source add-back yet.

Current-source audit reconfirms every HOME Tap uses `button_245-247,246,195` and has no extra explicit Reload action. The exact map layer 6170 is a child of Home group 245, so its parent is hidden by Calendar navigation and shown by Home navigation. Whether Widgy retains or recreates its image/source on these changes is unknown. This parent/visibility relationship has not been isolated by previous stable-URL, local-static-file, fixed-location or unused-variable experiments.

## One structural change

`withMapSeparateLayer` starts from `withHomeSyncMapLean`. Remove map 6170 from Home's child list and append the exact unchanged object at the back of the root list, behind Home/Calendar/Weather/Fitness. No additional map, layer, cover, tap action, variable or source is created or removed. Only parent/order and trial name/description change. Home's group has a neutral 1600×1600 frame and no translation, conditional visibility, clipping or effects to transfer. Existing builder code documents Widgy's topmost-first order. Map frame/options/ID, `${widgy.map_request}`, all 69 variables, synchronous script, exact GPS precision, minute t, existing server cache rules and full 3306×1558 lossless PNG stay identical.

The map is no longer a descendant of a tab whose visibility changes. No button targets it directly. It is intended to remain enabled behind the other tabs' opaque backgrounds. This describes exported structure, not guaranteed native caching, background prefetch, decoded-image retention or reduced request count. Widgy could still re-evaluate/re-render it on every tap or cull an occluded layer. Constant eligibility might instead increase work when another tab is visible; both directions must be checked.

Calendar's existing full-frame PNG is fully opaque in the entire mapped image rectangle: 1320×1377 asset, enclosing region x=25..1293/y=179..807, all alpha=255. Weather/Fitness have existing full-frame 100%-opacity graphite shapes. The actual background resources still must load on device. No backdrop or pixel is edited. Native geometry, occlusion, image availability and refresh behavior need phone verification.

## Validation

`node tools/test-map-separate-layer.mjs` passes using public C16 plus synthetic example.test calendar endpoints. Exact deep equality after restoring the single layer to its former parent and metadata confirms all other fields are unchanged, including every source, tap, remaining tab and root order. Total nodes remain 1289 and variables 69; Home now has 14 navigation children plus the separate unchanged map. IDs remain unique, variable references and tap targets resolve. All 29 unique tab/month actions leave one active tab and the independent map enabled in the exported visibility model. Source tests reject unexpected group transforms/conditions, hidden map/cover, direct map button targets and transparent background substitutions. Existing Calendar PNG alpha and other full-frame background geometry are checked. Actual copy/download/auth-expiry/retry/pageshow/blocked-clipboard controller flows pass with synthetic input. No owner export, calendar endpoint, real GPS or geocoder is accessed by the agent.

## Phone check and decision

Page: `/tools/widgy-map-separate-layer.html?v=map-separate-layer-1`, widget name `Widgy Map Separate Layer 1`.

Import separately in the same slot/network as Lean 1. Confirm Home map/marker at the original frame, Calendar fully covers it, and Weather/Fitness do too. Then make three Calendar-to-Home-and-back transitions. Ask only clearer/faster, similar or slower, with missing map, misplaced frame or slower Calendar reported separately. No stopwatch, video or second phone. If visually wrong or slower, restore Lean. If similar, record no perceived benefit and do not promote or repeat another reparenting variant without evidence. A speed benefit would implicate visibility/parent interactions, not prove a specific Widgy cache mechanism. Production/full Home and city restoration remain deferred.
