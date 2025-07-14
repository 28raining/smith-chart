// const { calculateImpedance } = require('../src/impedanceFunctions.js');
import { calculateImpedance } from "../src/impedanceFunctions.js";
import { parseTouchstoneFile } from "../src/commonFunctions.js";
import { expect, test } from "vitest";

test("Touchstone importer test", () => {
const exampleTouchstone = `
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
`
  const sparameters = parseTouchstoneFile(exampleTouchstone);

  // const expected = [
  //   [{ real: 25, imaginary: -25 }],
  //   [
  //     { real: 25, imaginary: -25 },
  //     { real: 19.127360088725794, imaginary: -1.8022511881224714 },
  //     { real: 23.13903818769952, imaginary: 20.867214473980738 },
  //     { real: 46.53103192423643, imaginary: 48.109436254243874 },
  //   ],
  // ];
  // expect(impedance).toEqual(expected);
});
