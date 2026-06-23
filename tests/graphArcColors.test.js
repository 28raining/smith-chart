import { expect, test } from "vitest";
import { arcColors, impedanceArcColor, impedanceArcColorPlan } from "../src/commonFunctions.js";
import { calculateImpedance } from "../src/impedanceFunctions.js";

test("impedanceArcColorPlan for black-box circuit", () => {
  const plan = impedanceArcColorPlan({ arcCount: 3, sparamType: null });

  expect(plan.drawable).toEqual([
    { dp: 0, color: arcColors[0] },
    { dp: 1, color: arcColors[1] },
    { dp: 2, color: arcColors[2] },
  ]);
  expect(plan.lastDpColor).toBe(arcColors[2]);
  expect(plan.lastDpColor).toBe(plan.drawable[plan.drawable.length - 1].color);
});

test("impedanceArcColorPlan for s1p skips loadTerm pass-through", () => {
  const plan = impedanceArcColorPlan({ arcCount: 4, sparamType: "s1p" });

  expect(plan.drawable).toEqual([
    { dp: 0, color: arcColors[0] },
    { dp: 1, color: arcColors[1] },
    { dp: 2, color: arcColors[2] },
  ]);
  expect(plan.lastDpColor).toBe(arcColors[2]);
  expect(plan.lastDpColor).toBe(plan.drawable[plan.drawable.length - 1].color);
});

test("impedanceArcColor loadTerm pass-through uses previous dp color", () => {
  expect(impedanceArcColor({ dp: 3, arcCount: 4, sparamType: "s1p" })).toEqual({
    color: arcColors[2],
    skipDraw: true,
  });
  expect(impedanceArcColor({ dp: 2, arcCount: 4, sparamType: "s1p" })).toEqual({
    color: arcColors[2],
    skipDraw: false,
  });
});

test("s1p circuit arc colors align with calculateImpedance dp count", () => {
  const circuit = [
    {
      name: "sparam",
      type: "s1p",
      data: {
        1000000000: {
          S11: { magnitude: 0.5, angle: 0 },
          zS11: { real: 25, imaginary: 0 },
        },
      },
      noise: [],
      settings: { freq_unit: "Hz", param: "S", format: "RI", zo: 50 },
      error: null,
    },
    { name: "seriesInd", value: 10, unit: "nH", esr: 0 },
    { name: "shortedCap", value: 1, unit: "pF", esr: 0, esl: 0 },
    { name: "loadTerm", real: 50, imaginary: 0 },
  ];

  const arcs = calculateImpedance(circuit, 1e9, 2);
  const plan = impedanceArcColorPlan({ arcCount: arcs.length, sparamType: "s1p" });

  expect(arcs.length).toBe(4);
  expect(plan.drawable.map((d) => d.color)).toEqual([arcColors[0], arcColors[1], arcColors[2]]);
  expect(plan.lastDpColor).toBe(arcColors[2]);
});
