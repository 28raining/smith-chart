// const { calculateImpedance } = require('../src/impedanceFunctions.js');
import { expect, test } from "vitest";
import { sparamGainCircles, sparamZout, parseTouchstoneFile } from "../src/sparam.js";
import { readFileSync /*, writeFileSync*/ } from "fs";
import { join } from "path";

test("Touchstone s2p small", () => {
  const touchstop_S2P = `
# GHZ    S   RI   R   50.0
1.0000  0.3926  -0.1211  -0.0003  -0.0021  -0.0003  -0.0021  0.3926  -0.1211
2.0000  0.3517  -0.3054  -0.0096  -0.0298  -0.0096  -0.0298  0.3517  -0.3054
10.000  0.3419   0.3336  -0.0134   0.0379  -0.0134   0.0379  0.3419   0.3336
! Noise parameters
 1.0000  2.0000  -0.1211  -0.0003  .4
 2.0000  2.5000  -0.3054  -0.0096  .45
 3.0000  3.0000  -0.6916  -0.6933  .5
 4.0000  3.5000  -0.3756   0.4617  .55
 5.0000  4.0000   0.3880   0.6848  .6
 6.0000  4.5000   0.0343   0.0383  .65
 7.0000  5.0000   0.6916   0.6933  .7
 8.0000  5.5000   0.5659   0.1000  .75
 9.0000  6.0000   0.4145   0.0307  .8
10.0000  6.5000   0.3336   0.0134  .85
`;
  const sparameters = parseTouchstoneFile(touchstop_S2P);
  const outputPath = join(process.cwd(), "tests", "s2p-1-output.json");
  const expectedData = JSON.parse(readFileSync(outputPath, "utf8"));
  // writeFileSync(outputPath, JSON.stringify(sparameters.data, null, 1), "utf8");
  expect(sparameters.data).toEqual(expectedData);
});

function compareParsedData(a, b) {
  for (const f in a) {
    for (const s in a[f]) {
      for (const v in a[f][s]) {
        expect(a[f][s][v]).toBeCloseTo(b[f][s][v], 5);
      }
    }
  }
}

test("Touchstone s1p small", () => {
  // Read from file 'valid.s1p'
  const filePath = join(process.cwd(), "tests", "valid.s1p");
  const exampleTouchstone = readFileSync(filePath, "utf8");

  const sparameters = parseTouchstoneFile(exampleTouchstone);

  // Write sparameters.data to a file
  const outputPath = join(process.cwd(), "tests", "valid_s1p-output.json");
  const expectedData = JSON.parse(readFileSync(outputPath, "utf8"));

  // writeFileSync(outputPath, JSON.stringify(sparameters.data, null, 1), "utf8");

  expect(sparameters.settings).toEqual({
    freq_unit: "Hz",
    param: "S",
    format: "RI",
    zo: 50,
  });
  compareParsedData(sparameters.data, expectedData);
  // expect(sparameters.data).toEqual(expectedData);
  expect(sparameters.noise).toEqual([]);
  expect(sparameters.type).toEqual("s1p");

  // Add your assertions here
});

test("Gain circles", () => {
  const s11 = { magnitude: 0.533, angle: 176.6 };
  const gain = sparamGainCircles(s11, 50, 1);

  const expectedResult = {
    center: { real: 16.936724300849555, imaginary: -1.3138262966109417 },
    radius: 0.23142961975593543,
  };
  expect(gain).toEqual(expectedResult);
});

test("Rout from sparam", () => {
  const res = sparamZout(
    {
      S11: { magnitude: 0.533, angle: 176.6 },
      S12: { magnitude: 2.8, angle: 64.5 },
      S21: { magnitude: 0.06, angle: 58.4 },
      S22: { magnitude: 0.604, angle: -58.3 },
    },
    { magnitude: 0.38, angle: -177.66 },
  );
  const expected = {
    polar: {
      angle: -57.91737956641843,
      magnitude: 0.6839346593988852,
    },
    rectangular: {
      imaginary: -0.5794862591862048,
      real: 0.3632661472549401,
    },
  };
  expect(res).toEqual(expected);
});
