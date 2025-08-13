import blackbox from "./assets/components/blackbox.svg";
import termination_load from "./assets/components/termination_load.svg";
import cap_parallel from "./assets/components/cap_parallel.svg";
import cap_series from "./assets/components/cap_series.svg";
import custom from "./assets/components/custom.svg";
import inductor_parallel from "./assets/components/inductor_parallel.svg";
import inductor_series from "./assets/components/inductor_series.svg";
import resistor_parallel from "./assets/components/resistor_parallel.svg";
import resistor_series from "./assets/components/resistor_series.svg";
import rlc_series from "./assets/components/rlc_series.svg";
import stub_open from "./assets/components/stub_open.svg";
import stub_shorted from "./assets/components/stub_shorted.svg";
import transformer from "./assets/components/transformer.svg";
import transmissionLine from "./assets/components/transmission_line.svg";
import s2p from "./assets/components/s2p.svg";

const sparamDefaultS1P = {
  data: {
    1500000: {
      S11: {
        magnitude: 0.99,
        angle: 6.2,
      },
      zS11: {
        real: 42.7,
        imaginary: 908.7,
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
};

const sparamDefaultS2P = {
  data: {
    800000000: {
      S11: {
        magnitude: 0.44,
        angle: -157.6,
      },
      S21: {
        magnitude: 4.725,
        angle: 84.3,
      },
      S12: {
        magnitude: 0,
        angle: 0,
      },
      S22: {
        magnitude: 0.339,
        angle: -51.8,
      },
      zS11: {
        real: 20.087679236620072,
        imaginary: -8.353473646203017,
      },
    },
    1400000000: {
      S11: {
        magnitude: 0.533,
        angle: 176.6,
      },
      S21: {
        magnitude: 2.8,
        angle: 64.5,
      },
      S12: {
        magnitude: 0,
        angle: 0,
      },
      S22: {
        magnitude: 0.604,
        angle: -58.3,
      },
      zS11: {
        real: 15.243742895217943,
        imaginary: 1.3461428643436497,
      },
    },
    2000000000: {
      S11: {
        magnitude: 0.439,
        angle: 159.6,
      },
      S21: {
        magnitude: 2.057,
        angle: 49.2,
      },
      S12: {
        magnitude: 0,
        angle: 0,
      },
      S22: {
        magnitude: 0.294,
        angle: -68.1,
      },
      zS11: {
        real: 20.025231636837034,
        imaginary: 7.591733711637334,
      },
    },
  },
  noise: [],
  settings: {
    freq_unit: "GHz",
    param: "S",
    format: "MA",
    zo: 50,
  },
  error: null,
  name: "sparam",
  type: "s2p",
};

export const circuitComponents = {
  blackBox: {
    name: "Black Box",
    src: blackbox,
    unselectable: true,
    circuitInputs: ["impedance", "complex", "tolerance"],
    default: { real: 50, imaginary: 0 },
    toURL: (c) => `blackBox_${c.real}_${c.imaginary}_${c.tolerance ? c.tolerance : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        real: Number(u[1]),
        imaginary: Number(u[2]),
        tolerance: Number(u[3]),
      };
    },
  },
  loadTerm: {
    name: "Load Termination",
    src: termination_load,
    unselectable: true,
    circuitInputs: ["impedance", "complex", "tolerance"],
    default: { real: 50, imaginary: 0 },
    toURL: (c) => `loadTerm_${c.real}_${c.imaginary}_${c.tolerance ? c.tolerance : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        real: Number(u[1]),
        imaginary: Number(u[2]),
        tolerance: Number(u[3]),
      };
    },
  },
  shortedCap: {
    name: "Shorted Capacitor",
    src: cap_parallel,
    circuitInputs: ["impedance", "capacitor", "esr", "esl", "tolerance"],
    default: { value: 1, unit: "pF" },
    toURL: (c) => `shortedCap_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.esr ? c.esr : 0}_${c.esl ? c.esl : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        esr: Number(u[4]),
        esl: Number(u[5]),
      };
    },
  },
  seriesCap: {
    name: "Series Capacitor",
    src: cap_series,
    circuitInputs: ["impedance", "capacitor", "esr", "esl", "tolerance"],
    default: { value: 1, unit: "pF" },
    toURL: (c) => `seriesCap_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.esr ? c.esr : 0}_${c.esl ? c.esl : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        esr: Number(u[4]),
        esl: Number(u[5]),
      };
    },
  },
  shortedInd: {
    name: "Shorted Inductor",
    src: inductor_parallel,
    circuitInputs: ["impedance", "inductor", "esr", "tolerance"],
    default: { value: 1, unit: "nH" },
    toURL: (c) => `shortedInd_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.esr ? c.esr : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        esr: Number(u[4]),
      };
    },
  },
  seriesInd: {
    name: "Series Inductor",
    src: inductor_series,
    circuitInputs: ["impedance", "inductor", "esr", "tolerance"],
    default: { value: 1, unit: "nH" },
    toURL: (c) => `seriesInd_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.esr ? c.esr : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        esr: Number(u[4]),
      };
    },
  },
  shortedRes: {
    name: "Shorted Resistor",
    src: resistor_parallel,
    circuitInputs: ["impedance", "resistor", "esl", "tolerance"],
    default: { value: 50, unit: "Ω" },
    toURL: (c) => `shortedRes_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.esl ? c.esl : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        esl: Number(u[4]),
      };
    },
  },
  seriesRes: {
    name: "Series Resistor",
    src: resistor_series,
    circuitInputs: ["impedance", "resistor", "esl", "tolerance"],
    default: { value: 50, unit: "Ω" },
    toURL: (c) => `seriesRes_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.esl ? c.esl : 0}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        esl: Number(u[4]),
      };
    },
  },
  seriesRlc: {
    name: "Series RLC",
    src: rlc_series,
    circuitInputs: ["impedance", "resistor", "lc"],
    default: {
      value: 50,
      unit: "Ω",
      value_l: 1,
      unit_l: "nH",
      value_c: 1,
      unit_c: "pF",
    },
    toURL: (c) => `seriesRlc_${c.value}_${c.unit}_${c.value_l}_${c.unit_l}_${c.value_c}_${c.unit_c}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        value_l: Number(u[3]),
        unit_l: u[4],
        value_c: Number(u[5]),
        unit_c: u[6],
      };
    },
  },
  custom: {
    name: "Custom Z(f)",
    src: custom,
    circuitInputs: ["custom"],
    default: {
      interpolation: "linear",
      value: {
        0: { real: 1, imaginary: 1 },
        1e3: { real: 30, imaginary: 30 },
        1e6: { real: 60, imaginary: 60 },
        1e9: { real: 90, imaginary: 90 },
        1e12: { real: 120, imaginary: 120 },
      },
    },
    toURL: (c) => `custom_${c.interpolation}_${JSON.stringify(c.value)}`,
    fromURL: (u) => {
      return { name: u[0], interpolation: u[1], value: JSON.parse(u[2]) };
    },
  },
  transmissionLine: {
    name: "Transmission Line",
    src: transmissionLine,
    circuitInputs: ["wire", "tolerance"],
    default: { value: 1, unit: "mm", zo: 50, eeff: 1 },
    toURL: (c) => `transmissionLine_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.zo}_${c.eeff}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        zo: Number(u[4]),
        eeff: Number(u[5]),
      };
    },
  },

  stub: {
    name: "Stub",
    src: stub_open,
    circuitInputs: ["wire", "tolerance"],
    default: { value: 1, unit: "mm", zo: 50, eeff: 1 },
    toURL: (c) => `stub_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.zo}_${c.eeff}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        zo: Number(u[4]),
        eeff: Number(u[5]),
      };
    },
  },
  shortedStub: {
    name: "Shorted Stub",
    src: stub_shorted,
    circuitInputs: ["wire", "tolerance"],
    default: { value: 1, unit: "mm", zo: 50, eeff: 1 },
    toURL: (c) => `shortedStub_${c.value}_${c.unit}_${c.tolerance ? c.tolerance : 0}_${c.zo}_${c.eeff}`,
    fromURL: (u) => {
      return {
        name: u[0],
        value: Number(u[1]),
        unit: u[2],
        tolerance: Number(u[3]),
        zo: Number(u[4]),
        eeff: Number(u[5]),
      };
    },
  },
  transformer: {
    name: "Transformer",
    src: transformer,
    circuitInputs: ["transformer"],
    default: { l1: 1, unit_l1: "nH", l2: 1, unit_l2: "nH", k: 1 },
    toURL: (c) => `transformer_${c.l1}_${c.unit_l1}_${c.l2}_${c.unit_l2}_${c.k}`,
    fromURL: (u) => {
      return {
        name: u[0],
        l1: Number(u[1]),
        unit_l1: u[2],
        l2: Number(u[3]),
        unit_l2: u[4],
        k: Number(u[5]),
      };
    },
  },
  sparam: {
    name: "S-Parameter",
    src: s2p,
    circuitInputs: ["sparam"],
    //note this default data is immediately overwritten by the sparam modal.
    //s2p data gives more features, but will crash the tool because load must also be added
    default: { ...sparamDefaultS1P },
    //sparameters are not saved in the URL because URL has 4K limit, and sparam can be very large.
    toURL: (c) => `sparam_${c.type}`,
    fromURL: (u) => {
      return u[1] == "s1p" ? { ...sparamDefaultS1P } : { ...sparamDefaultS2P };
    },
  },
};
