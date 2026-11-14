import test from "node:test";
import assert from "node:assert/strict";
import { geometrySTL, estimate, gcodeStats, costs } from "../assets/core.mjs";
function cube() {
  const points = [
    [0, 0, 0],
    [20, 0, 0],
    [20, 20, 0],
    [0, 20, 0],
    [0, 0, 20],
    [20, 0, 20],
    [20, 20, 20],
    [0, 20, 20],
  ];
  const faces = [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
    [0, 1, 5],
    [0, 5, 4],
    [1, 2, 6],
    [1, 6, 5],
    [2, 3, 7],
    [2, 7, 6],
    [3, 0, 4],
    [3, 4, 7],
  ];
  const a = new ArrayBuffer(84 + faces.length * 50),
    v = new DataView(a);
  v.setUint32(80, faces.length, true);
  faces.forEach((t, i) =>
    t.forEach((j, k) =>
      points[j].forEach((n, c) =>
        v.setFloat32(84 + i * 50 + 12 + k * 12 + c * 4, n, true),
      ),
    ),
  );
  return a;
}
test("valid STL cube: 20 mm in all axes and 8000 cubic mm", () => {
  const a = geometrySTL(cube());
  assert.deepEqual(a.size, [20, 20, 20]);
  assert.ok(Math.abs(a.volume - 8000) < 0.01);
});
test("higher infill costs more filament", () => {
  const a = geometrySTL(cube());
  assert.ok(
    estimate(a, { material: "abs", layer: 0.2, infill: 80, support: false })
      .total >
      estimate(a, { material: "abs", layer: 0.2, infill: 10, support: false })
        .total,
  );
});
test("GCode extrusion after G92 reset", () => {
  const r = gcodeStats(
    "M82\nG90\nG1 F1200 X10 E1\nG1 X20 E2\nG92 E0\nG1 X30 E1",
    1.04,
  );
  const expected = (3 * Math.PI * (1.75 / 2) ** 2 * 1.04) / 1000;
  assert.ok(Math.abs(r.total - expected) < 1e-7);
});
test("GCode support category", () => {
  const r = gcodeStats(
    "M82\nG1 F1200 X0 E0\n;TYPE:WALL-OUTER\nG1 X10 E1\n;TYPE:SUPPORT\nG1 X20 E2",
    1.04,
  );
  assert.ok(Math.abs(r.markedSupport - r.total / 2) < 1e-7);
});
test("costs have no sales margin", () => {
  const c = costs(100, 2, 25.99);
  assert.ok(Math.abs(c.total - (2.599 + 0.14)) < 1e-7);
});
test("invalid input fails", () =>
  assert.throws(() => geometrySTL(new ArrayBuffer(4))));
test("retraction and recovery do not count as deposited filament", () => {
  const r = gcodeStats("M83\nG1 F1200 X10 E1\nG1 E-2\nG1 E2\nG1 X20 E1", 1.04);
  const expected = (2 * Math.PI * (1.75 / 2) ** 2 * 1.04) / 1000;
  assert.ok(Math.abs(r.total - expected) < 1e-7);
});
test("ASCII STL matches binary geometry", () => {
  const v = new DataView(cube());
  let text = "solid cube\n";
  for (let i = 0; i < 12; i++) {
    text += "facet normal 0 0 0\nouter loop\n";
    for (let k = 0; k < 3; k++)
      text +=
        "vertex " +
        [0, 1, 2]
          .map((c) => v.getFloat32(84 + i * 50 + 12 + k * 12 + c * 4, true))
          .join(" ") +
        "\n";
    text += "endloop\nendfacet\n";
  }
  text += "endsolid cube";
  assert.ok(
    Math.abs(geometrySTL(new TextEncoder().encode(text).buffer).volume - 8000) <
      1e-7,
  );
});
test("non-finite coordinates are rejected", () => {
  const a = cube();
  new DataView(a).setFloat32(96, NaN, true);
  assert.throws(() => geometrySTL(a), /Koordinaten/);
});
test("support and material density change the estimate", () => {
  const a = { ...geometrySTL(cube()), downArea: 200 },
    s = { material: "abs", layer: 0.2, infill: 15, support: true };
  const r = estimate(a, s);
  assert.ok(r.support > 0);
  assert.equal(estimate(a, { ...s, support: false }).support, 0);
  assert.ok(estimate(a, { ...s, material: "petg" }).total > r.total);
});
