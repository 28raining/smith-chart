// const { calculateImpedance } = require('../src/impedanceFunctions.js');
import { expect, test } from "vitest";
import { readFileSync/*, writeFileSync*/ } from "fs";
import { join } from "path";
import { allImpedanceCalculations, calculateImpedance } from "../src/impedanceFunctions.js";

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

test("Impedance L-R-Shorted-Stub", () => {
  const circuit = [
    {
      name: "blackBox",
      real: 50,
      imaginary: 0,
    },
    {
      value: 1,
      unit: "nH",
      name: "shortedInd",
    },
    {
      value: 20,
      unit: "Ω",
      name: "seriesRes",
    },
    {
      value: 50,
      unit: "mm",
      zo: 50,
      eeff: 1,
      name: "shortedStub",
      slider: 0,
    },
  ];
  const settings = {
    zo: 50,
    frequency: 2440,
    frequencyUnit: "MHz",
    fSpan: 0,
    fSpanUnit: "MHz",
    zMarkers: [],
    vswrCircles: [],
    qCircles: [],
    nfCircles: [],
    gainInCircles: [],
    gainOutCircles: [],
  };
  const [processedImpedanceResults, _spanResults, _multiZResults, _gainArray, _numericalFrequency, _RefIn] = allImpedanceCalculations(circuit, settings);

  expect(processedImpedanceResults).toEqual({
    zStr: "27.88 - 11.2j",
    zPolarStr: "30.05 ∠ -21.88°",
    refStr: "-0.258 - 0.181j",
    refPolarStr: "0.315 ∠ -145.0°",
    vswr: "1.92",
    qFactor: "0.40",
    refReal: -0.2580011952086847,
    refImag: -0.18089971346407316,
    admString: "0.0309 + 0.0124j",
  });
});

test("Impedance s1p", () => {
  const circuit = [
    {
      name: "blackBox",
      real: 8,
      imaginary: 1.5,
      tolerance: 0,
    },
    {
      data: {
        140000000: {
          S11: {
            magnitude: 0.7243827370732345,
            angle: -174.09948044605608,
          },
          zS11: {
            real: 8.012449079222487,
            imaginary: -2.510862781461325,
          },
        },
        140307234: {
          S11: {
            magnitude: 0.7090881308992324,
            angle: -176.30650977518508,
          },
          zS11: {
            real: 8.519324626702963,
            imaginary: -1.5653914993540468,
          },
        },
        140614468: {
          S11: {
            magnitude: 0.694448795742179,
            angle: -178.5803036021335,
          },
          zS11: {
            real: 9.017580940342125,
            imaginary: -0.5993440957180086,
          },
        },
      },
      noise: [],
      settings: {
        freq_unit: "Hz",
        param: "S",
        format: "RI",
        zo: 50,
      },
      error: null,
      name: "sparam",
      type: "s1p",
    },
  ];
  const settings = {
    zo: 50,
    frequency: 140307234,
    frequencyUnit: "Hz",
    fSpan: 614468,
    fSpanUnit: "Hz",
    zMarkers: [],
    vswrCircles: [],
    qCircles: [],
    nfCircles: [],
    gainInCircles: [],
    gainOutCircles: [],
  };
  const [_processedImpedanceResults, _spanResults, _multiZResults, _gainArray, _numericalFrequency, RefIn] = allImpedanceCalculations(circuit, settings);

  expect(RefIn).toEqual([
    {
      140000000: {
        magnitude: 0.24998758547548827,
        angle: -86.20988590050354,
      },
      140307234: {
        magnitude: 0.18820664965246797,
        angle: -80.15770700629807,
      },
      140614468: {
        magnitude: 0.13689974653743542,
        angle: -67.16944818269882,
      },
    },
  ]);
});

function compareMultiZResults(a, b) {
  for (const x in a) {
    for (const y in a[x].arcs) {
      for (const z in a[x].arcs[y]) {
        for (const l in a[x].arcs[y][z]) {
          // console.log("Comparing", a[x].arcs[y][z][l], b[x].arcs[y][z][l]);
          expect(a[x].arcs[y][z][l].real).toBeCloseTo(b[x].arcs[y][z][l].real, 5);
          expect(a[x].arcs[y][z][l].imaginary).toBeCloseTo(b[x].arcs[y][z][l].imaginary, 5);
        }
      }
    }
    // expect(a[x].arcs).toEqual(b[x].arcs);
    expect(a[x].ZvsF).toEqual(b[x].ZvsF);
  }
}

test("Matched s2p circuit", () => {
  const outputPath = join(process.cwd(), "tests", "impedance_s2p.json");
  const circuit = JSON.parse(readFileSync(outputPath, "utf8"));
  const settings = {
    zo: 50,
    frequency: 1.4,
    frequencyUnit: "GHz",
    fSpan: 1.2,
    fSpanUnit: "GHz",
    zMarkers: [],
    vswrCircles: [],
    qCircles: [],
    nfCircles: [],
    gainInCircles: [1],
    gainOutCircles: [1],
  };

  const [_processedImpedanceResults, spanResults, multiZResults, gainArray, numericalFrequency, _RefIn] = allImpedanceCalculations(circuit, settings);

  // const tmpPath = join(process.cwd(), "tests", "tmp.json");
  // writeFileSync(tmpPath, JSON.stringify(multiZResults, null, 1), "utf8");

  const multiZPath = join(process.cwd(), "tests", "impedance_s2p_result.json");
  const res_multiZ = JSON.parse(readFileSync(multiZPath, "utf8"));
  compareMultiZResults(multiZResults, res_multiZ);

  expect(numericalFrequency).toEqual(1400000000);
  expect(gainArray).toEqual([
    {
      800000000: 22.693531214089145,
      1400000000: 12.561553295736996,
      2000000000: 3.293622417785331,
    },
  ]);
  expect(spanResults).toEqual([
    {
      800000000: {
        z: {
          real: 39.96011933637156,
          imaginary: 5.56030566938637,
        },
        reflAtSZo: {
          real: -0.10737318722085801,
          imaginary: 0.06844514498705355,
        },
      },
      1400000000: {
        z: {
          real: 59.91263130921331,
          imaginary: 23.7710888072318,
        },
        reflAtSZo: {
          real: 0.13084038625384226,
          imaginary: 0.18797539572949273,
        },
      },
      2000000000: {
        z: {
          real: 76.393202250021,
          imaginary: -36.32712640026803,
        },
        reflAtSZo: {
          real: 0.2691880848258462,
          imaginary: -0.21004528997404232,
        },
      },
    },
  ]);
});
