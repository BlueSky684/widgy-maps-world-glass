# Native Steps Ring 1

2026-10-04. Branch: `f50-widget-test`. Control: **Widgy Compact Dots 1**.

The owner supplied native Ring Chart exports after selecting Pedometer / Steps,
setting the exclusive maximum to 10000, choosing a solid fill, and setting both
Start Scale and End Scale to 30%. Only the generic chart fields were transcribed;
the full private exports and their credentials are not included in the repository.

The candidate removes all 100 manual `Steps Goal Ring · N%` layers and inserts
one native Ring Chart in their exact draw-order position inside Home. It reuses
the original frame and lime material, with native scale fields 8/9 set to 30 and
maximum field 20 set to 10000. The imported sample's temporary green is replaced
through its verified fill field 10. No extra chart is left outside Home.

- Full control: 1613 layers. Candidate: 1514 layers.
- Owner export including the extra sample: 1614; preparation leaves 1514.
- All 81 variables retained for this isolated layer trial. The now-unused ring
  progress/goal variables are not removed in this test.
- Other Home/Calendar layers, images, data sources, buttons and map/city behavior
  are unchanged; the document name and description identify the trial.
- Normal export pages and previous control links are unchanged.

`node tools/test-native-steps-ring.mjs` verifies complete removal, native source
and goal, original fill/frame, full document equality after restoring the ring
block, and the copy/download controller with synthetic data. The current owner's
export was also inspected locally and passed equivalent structural checks without
saving or publishing it.

The phone screenshots showed clockwise/top-origin/360-degree defaults, rounded
ends, transparent inactive material, manual minimum zero and automatic min/max
off. The Pedometer selection with a 10000 maximum visibly showed approximately
80% at 8002 steps before the scale change. This is not a test of all data states.

Pending native checks: final thickness and track alignment at widget size, 0 and
missing data, full/over-goal behavior, daily reset, visibility on other tabs and
Calendar-to-Home transition speed. Scale 30 is a first device-derived trial value,
not a claim of pixel-identical stroke thickness or a measured speed improvement.
