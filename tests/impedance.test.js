// const { calculateImpedance } = require('../src/impedanceFunctions.js');
import { calculateImpedance } from "../src/impedanceFunctions.js";
import { expect, test } from "vitest";

test("Transmission line impedance test", () => {
  const circuit = [
    { name: "blackBox", real: 25, imaginary: -25 },
    { name: "transmissionLine", value: 30, unit: "mm", zo: 50, eeff: 1 },
  ];
  const impedance = calculateImpedance(circuit, 2440e6, 3);

  const expected = [
    [{ real: 25, imaginary: -25 }],
    [
      { real: 25, imaginary: -25 },
      { real: 19.127360088725794, imaginary: -1.8022511881224714 },
      { real: 23.13903818769952, imaginary: 20.867214473980738 },
      { real: 46.53103192423643, imaginary: 48.109436254243874 },
    ],
  ];
  expect(impedance).toEqual(expected);
});
