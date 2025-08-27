import { createTheme } from "@mui/material/styles";

export const arcColors = [
  "#1f77b4", // muted blue
  "#ff7f0e", // safety orange
  "#2ca02c", // cooked asparagus green
  "#d62728", // brick red
  "#9467bd", // muted purple
  "#8c564b", // chestnut brown
  "#e377c2", // raspberry yogurt pink
  "#7f7f7f", // middle gray
  "#bcbd22", // curry yellow-green
  "#17becf", // blue-teal
];

export function one_over_complex(z) {
  var real = z.real / (z.real * z.real + z.imaginary * z.imaginary);
  var imaginary = -z.imaginary / (z.real * z.real + z.imaginary * z.imaginary);
  return { real, imaginary };
}

export function complex_multiply(a, b) {
  var real = a.real * b.real - a.imaginary * b.imaginary;
  var imaginary = a.real * b.imaginary + a.imaginary * b.real;
  return { real, imaginary };
}

export function complex_subtract(a, b) {
  return { real: a.real - b.real, imaginary: a.imaginary - b.imaginary };
}

export function complex_add(a, b) {
  return { real: a.real + b.real, imaginary: a.imaginary + b.imaginary };
}

export const theme = createTheme({
  palette: {
    bland: {
      main: "#fff",
      light: "#dedfe0",
      dark: "#dedfe0",
      contrastText: "#242105",
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 700,
      md: 950,
      lg: 1400,
      xl: 1700,
    },
  },
});

//Returns valid integers. Fixed so trailing zeroes are preserved
//input = 0.0, return 0.0
//input = 0.,  return 0.
//input = 0.403,  return 0.403
//input = 0.40,  return 0.40
export function parseInput(input) {
  if (typeof input === "string") {
    return input.replace(/[^0-9.\-eE]/g, "");
  } else {
    return input;
  }
}

export const inductorUnits = {
  H: 1,
  mH: 1e-3,
  uH: 1e-6,
  nH: 1e-9,
  pH: 1e-12,
  fH: 1e-15,
};
export const capacitorUnits = {
  F: 1,
  mF: 1e-3,
  uF: 1e-6,
  nF: 1e-9,
  pF: 1e-12,
  fF: 1e-15,
};
export const resistorUnits = { MΩ: 1e6, KΩ: 1e3, Ω: 1, mΩ: 1e-3 };
export const lengthUnits = { λ: 0, m: 1, mm: 1e-3, um: 1e-6, deg: 0 };
export const frequencyUnits = {
  Hz: 1,
  KHz: 1e3,
  MHz: 1e6,
  GHz: 1e9,
  THz: 1e12,
};
export const unitConverter = {
  ...inductorUnits,
  ...capacitorUnits,
  ...resistorUnits,
  ...lengthUnits,
  ...frequencyUnits,
};

//convert from any case (hz, HZ, hZ) to the same case as unitConverter
export function correctUnitCase(unit) {
  const lowerUnit = unit.toLowerCase();
  for (const key of Object.keys(unitConverter)) {
    if (key.toLowerCase() === lowerUnit) return key;
  }
  console.warn(`Unit ${unit} not found in unitConverter, returning original.`);
  return unit; //if not found, return the original
}

export const ESLUnit = 1e-9; //series inductor hard-coded unit

export const speedOfLight = 299792458; // m/s

export function checkCustomZValid(input) {
  const regexCustomZ = /[^0-9,eE\s\-+.]/; //list of acceptable characters
  const regexCustomZComma = /[,]/;

  var regexRes = input.match(regexCustomZ);
  var regexResComma = input.match(regexCustomZComma);

  var customZPrevFreq = 0;
  var customZImpedanceTable = [];
  var allLinesHave3Values = true;
  var allvaluesAreNotBlank = true;
  var frequencyIncreases = true;
  var lines = input.split(/\r?\n/);
  var splitLines;
  for (var i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
    if (lines[i] != "") {
      // else {
      if (regexResComma == null) splitLines = lines[i].split(/\s+/);
      else splitLines = lines[i].split(",");
      if (splitLines.length == 3) {
        if (splitLines[0] == "" || splitLines[1] == "" || splitLines[2] == "") allvaluesAreNotBlank = false;
        else {
          splitLines[0] = Number(splitLines[0]);
          splitLines[1] = Number(splitLines[1]);
          splitLines[2] = Number(splitLines[2]);
          if (i > 0 && splitLines[0] <= customZPrevFreq) frequencyIncreases = false;
          else {
            customZImpedanceTable.push(splitLines);
            customZPrevFreq = Number(splitLines[0]);
          }
        }
      } else allLinesHave3Values = false;
    }
  }
  if (regexRes == null && allLinesHave3Values && allvaluesAreNotBlank && frequencyIncreases) {
    return [true, customZImpedanceTable];
  } else {
    return [false, customZImpedanceTable];
  }
}

//uses linear interpolation to find the impedance at a given frequency
//interpolation can be sample and hold, or can be linear
export function CustomZAtFrequency(customZ, frequency, interpolation) {
  const freqs = Object.keys(customZ).map((x) => parseFloat(x));
  const values = Object.values(customZ);

  if (freqs.length == 0) return { real: 0, imaginary: 0 };

  if (frequency <= freqs[0]) return values[0];
  if (frequency >= freqs[freqs.length - 1]) return values[freqs.length - 1];

  for (let i = 0; i < freqs.length - 1; i++) {
    if (frequency >= freqs[i] && frequency < freqs[i + 1]) {
      // console.log("fcheck", i, frequency, freqs[i], freqs[i + 1]);
      if (interpolation == "sah") return values[i];
      const t = (frequency - freqs[i]) / (freqs[i + 1] - freqs[i]);
      const real = values[i].real + t * (values[i + 1].real - values[i].real);
      const imaginary = values[i].imaginary + t * (values[i + 1].imaginary - values[i].imaginary);
      return { real, imaginary };
    }
  }
}

export function rectangularToPolar(z) {
  var magnitude = Math.sqrt(z.real * z.real + z.imaginary * z.imaginary);
  //angle in degrees
  var angle = (Math.atan2(z.imaginary, z.real) * 180) / Math.PI; //in degrees
  return { magnitude, angle };
}

// Function to convert polar form to rectangular form
export function polarToRectangular(a) {
  const phaseRadians = a.angle * (Math.PI / 180); // Convert degrees to radians
  return {
    real: a.magnitude * Math.cos(phaseRadians),
    imaginary: a.magnitude * Math.sin(phaseRadians),
  };
}

//convert from Reflection coefficient to Z : Z = Zo(1+refl/(1-refl)
export function reflToZ(refl, zo) {
  const tmp = one_over_complex({ real: 1 - refl.real, imaginary: -refl.imaginary });
  return complex_multiply(tmp, { real: zo + zo * refl.real, imaginary: zo * refl.imaginary });
}

// reflection coefficient =  (Z-Zo) / (Z+Zo)
export function zToRefl(z, zTerm) {
  var botInv = one_over_complex(complex_add(z, zTerm));
  return complex_multiply(complex_subtract(z, zTerm), botInv);
  // var refReal = (z.real - zo) * botInv.real - z.imaginary * botInv.imaginary;
  // var refImag = z.imaginary * botInv.real + (z.real - zo) * botInv.imaginary;
  // return { real: refReal, imaginary: refImag };
}

export function processImpedance(z, zo) {
  var zStr, zPolarStr, refStr, refPolarStr, real, imaginary, admString;
  real = Number(z.real).toFixed(2);
  imaginary = Number(z.imaginary).toFixed(2);
  if (imaginary < 0) zStr = `${real} - ${-imaginary}j`;
  else zStr = `${real} + ${imaginary}j`;

  var polar = rectangularToPolar(z);
  zPolarStr = `${polar.magnitude.toFixed(2)} ∠ ${polar.angle.toFixed(2)}°`;

  // reflection coefficient =  (Z-Zo) / (Z+Zo)
  var reflection = zToRefl(z, { real: zo, imaginary: 0 });
  // var botInv = one_over_complex(z.real + zo, z.imaginary);
  // var refReal = (z.real - zo) * botInv.real - z.imaginary * botInv.imaginary;
  // var refImag = z.imaginary * botInv.real + (z.real - zo) * botInv.imaginary;
  if (reflection.imaginary < 0) refStr = `${reflection.real.toFixed(3)} - ${(-reflection.imaginary).toFixed(3)}j`;
  else refStr = `${reflection.real.toFixed(3)} + ${reflection.imaginary.toFixed(3)}j`;

  var refPolar = rectangularToPolar({ real: reflection.real, imaginary: reflection.imaginary });
  refPolarStr = `${refPolar.magnitude.toFixed(3)} ∠ ${refPolar.angle.toFixed(1)}°`;

  var vswr = ((1 + refPolar.magnitude) / (1 - refPolar.magnitude)).toPrecision(3);

  var qFactor = Math.abs(z.imaginary / z.real);
  if (qFactor < 0.01) qFactor = qFactor.toExponential(1);
  else qFactor = qFactor.toFixed(2);

  //admittance
  var admittance = one_over_complex(z);
  real = Number(admittance.real).toPrecision(3);
  imaginary = Number(admittance.imaginary).toPrecision(3);
  if (imaginary < 0) admString = `${real} - ${-imaginary}j`;
  else admString = `${real} + ${imaginary}j`;

  return {
    zStr,
    zPolarStr,
    refStr,
    refPolarStr,
    vswr,
    qFactor,
    refReal: reflection.real,
    refImag: reflection.imaginary,
    admString,
  };
}

export function moveArrayItem(array, fromIndex, toIndex) {
  const arr = [...array]; // optional: copy to avoid mutating original
  const [item] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, item);
  return arr;
}
