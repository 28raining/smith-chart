// const { calculateImpedance } = require('../src/impedanceFunctions.js');
import { expect, test } from "vitest";
import { circuitComponents } from "../src/circuitComponents.js";
import { updateObjectFromUrl } from "../src/urlFunctions.js"; // Import the syncObjectToUrl function

const initialState = {
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

const initialCircuit = [{ name: "blackBox", ...circuitComponents.blackBox.default }];

test("URL clicked them all", () => {
  const params = new URLSearchParams(
    "circuit=blackBox_50_0_0__shortedCap_1_pF_0_0_0__seriesCap_1_pF_0_0_0__shortedInd_1_nH_0_0__seriesInd_1_nH_0_0__shortedRes_50_%CE%A9_0_0__seriesRes_50_%CE%A9_0_0__seriesRlc_50_%CE%A9_1_nH_1_pF__custom_sah_%7B%220%22%3A%7B%22real%22%3A11%2C%22imaginary%22%3A12%7D%2C%221000%22%3A%7B%22real%22%3A30%2C%22imaginary%22%3A30%7D%2C%221000000%22%3A%7B%22real%22%3A63%2C%22imaginary%22%3A60%7D%2C%221000000000%22%3A%7B%22real%22%3A90%2C%22imaginary%22%3A90%7D%2C%221500000000000%22%3A%7B%22real%22%3A120%2C%22imaginary%22%3A123%7D%7D__transmissionLine_1_mm_0_50_1__stub_1_mm_0_50_1__shortedStub_30_mm_0_50_1__transformer_4_nH_3_nH_2"
  );
  var [stateInURL, defaultCircuit, urlContainsState] = updateObjectFromUrl(initialState, initialCircuit, params);

  expect(stateInURL).toEqual({
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
  });

  expect(urlContainsState).toEqual(true);
  expect(defaultCircuit).toEqual([
    {
      name: "blackBox",
      real: 50,
      imaginary: 0,
      tolerance: 0,
    },
    {
      name: "shortedCap",
      value: 1,
      unit: "pF",
      tolerance: 0,
      esr: 0,
      esl: 0,
    },
    {
      name: "seriesCap",
      value: 1,
      unit: "pF",
      tolerance: 0,
      esr: 0,
      esl: 0,
    },
    {
      name: "shortedInd",
      value: 1,
      unit: "nH",
      tolerance: 0,
      esr: 0,
    },
    {
      name: "seriesInd",
      value: 1,
      unit: "nH",
      tolerance: 0,
      esr: 0,
    },
    {
      name: "shortedRes",
      value: 50,
      unit: "Ω",
      tolerance: 0,
      esl: 0,
    },
    {
      name: "seriesRes",
      value: 50,
      unit: "Ω",
      tolerance: 0,
      esl: 0,
    },
    {
      name: "seriesRlc",
      value: 50,
      unit: "Ω",
      value_l: 1,
      unit_l: "nH",
      value_c: 1,
      unit_c: "pF",
    },
    {
      name: "custom",
      interpolation: "sah",
      value: {
        0: {
          real: 11,
          imaginary: 12,
        },
        1000: {
          real: 30,
          imaginary: 30,
        },
        1000000: {
          real: 63,
          imaginary: 60,
        },
        1000000000: {
          real: 90,
          imaginary: 90,
        },
        1500000000000: {
          real: 120,
          imaginary: 123,
        },
      },
    },
    {
      name: "transmissionLine",
      value: 1,
      unit: "mm",
      tolerance: 0,
      zo: 50,
      eeff: 1,
    },
    {
      name: "stub",
      value: 1,
      unit: "mm",
      tolerance: 0,
      zo: 50,
      eeff: 1,
    },
    {
      name: "shortedStub",
      value: 30,
      unit: "mm",
      tolerance: 0,
      zo: 50,
      eeff: 1,
    },
    {
      name: "transformer",
      l1: 4,
      unit_l1: "nH",
      l2: 3,
      unit_l2: "nH",
      k: 2,
    },
  ]);
});
