//Calculate gain and noise circles from s-parameter data
import {
  one_over_complex,
  complex_add,
  complex_subtract,
  complex_multiply,
  polarToRectangular,
  rectangularToPolar,
  unitConverter,
  reflToZ,
  zToRefl,
  correctUnitCase,
} from "./commonFunctions.js";

// Noise circles

// equations here https://www.allaboutcircuits.com/technical-articles/learn-about-designing-unilateral-low-noise-amplifiers/
// https://homepages.uc.edu/~ferendam/Courses/EE_611/Amplifier/NFC.html
// Fmin = 1.3;//units db
// F = 1.8;
// Rn = 20/zo;

//Ni = (F - Fmin) * |1 + Go|^2 / 4 * Rn
//Circle Center = Go / (Ni + 1)
//Circle Radius = sqrt(Ni(Ni + 1 - |Go|^2)) / (Ni + 1)
export function sparamNoiseCircles(fMin, F, Rn, gamma) {
  // Fmin = n.NFmin;
  // F = n.NF;
  // Rn = n.Rn / zo;
  const Go = polarToRectangular(gamma);
  // const Go_real = gamma.real;
  // const Go_imag = gamma.imaginary;
  // const GoMag = Go_real * Go_real + Go_imag * Go_imag;
  const GoMagP1 = (Go.real + 1) * (Go.real + 1) + Go.imaginary * Go.imaginary;

  const FminLinear = Math.pow(10, fMin / 10);
  const FLinear = Math.pow(10, F / 10);
  const Ni = ((FLinear - FminLinear) * GoMagP1) / (4 * Rn);
  const center = { real: Go.real / (Ni + 1), imaginary: Go.imaginary / (Ni + 1) };
  const radius = Math.sqrt(Ni * (Ni + 1 - gamma.magnitude ** 2)) / (Ni + 1);

  //must conver from center Reflection coefficient to Z : Z = Zo(1+refl/(1-refl)
  return [reflToZ(center, 50), radius];
}

export function sparamGainCircles(S11, zo, gain) {
  // console.log("sparamGainCircles", S11, gain, zo);
  const gs_max = 1 / (1 - S11.magnitude ** 2);
  const gs = 10 ** (gain / 10) / gs_max; // convert gain from dB to linear scale
  // console.log("gs", gs, gs_max);
  const cs_numerator = complex_multiply({ real: gs, imaginary: 0 }, polarToRectangular({ magnitude: S11.magnitude, angle: -S11.angle }));
  const cs = complex_multiply(cs_numerator, { real: 1 / (1 - S11.magnitude ** 2 * (1 - gs)), imaginary: 0 });
  const rs = (Math.sqrt(1 - gs) * (1 - S11.magnitude ** 2)) / (1 - S11.magnitude ** 2 * (1 - gs));
  // console.log("csa", rectangularToPolar(cs), rs, gs);
  // console.log("cs", Math.sqrt(1 - gs));
  // console.log({ center: reflToZ(cs, zo), radius: rs });
  return { center: reflToZ(cs, zo), radius: rs };
}

// 1.4
// 0.533 ∠ 176.6 degrees
// 2.800 ∠ 64.5 degrees
// 0.06 ∠ 58.4 degrees
// 0.604 ∠ –58.3 degrees
export function sparamGainCircles_bilateral(sparam, gain) {
  // Convert polar form to rectangular form
  const S11r = polarToRectangular(sparam.S11);
  const S22r = polarToRectangular(sparam.S22);
  const S12r = polarToRectangular(sparam.S12);
  const S21r = polarToRectangular(sparam.S21);

  // Calculate Delta = S11 * S22 - S12 * S21
  const product1 = complex_multiply(S11r, S22r);
  const product2 = complex_multiply(S12r, S21r);
  const delta = {
    real: product1.real - product2.real,
    imaginary: product1.imaginary - product2.imaginary,
  };
  const deltaPolar = rectangularToPolar(delta);

  // Calculate K factor
  const k =
    (1 - sparam.S11.magnitude ** 2 - sparam.S22.magnitude ** 2 + deltaPolar.magnitude ** 2) / (2 * sparam.S21.magnitude * sparam.S12.magnitude);
  // console.log("S11", S11r, S22r);
  // console.log("product1", product1);
  // console.log("K factor:", k);
  // console.log("Delta:", delta);

  //this is the max gain. What to do with it?
  // var ga = (s21.magnitude / s12.magnitude) * (k - Math.sqrt(k ** 2 - 1));
  // console.log("Gain:", ga);

  const ga = 10 ** (gain / 10) / sparam.S21.magnitude ** 2;

  const deltaS22 = complex_multiply(S22r, delta);
  const c1 = complex_subtract(S11r, deltaS22);
  const centerGain = ga / (1 + ga * (sparam.S11.magnitude ** 2 - deltaPolar.magnitude ** 2));
  const centerReflection = { real: centerGain * c1.real, imaginary: centerGain * -c1.imaginary };
  const radius =
    Math.sqrt(1 - 2 * k * sparam.S12.magnitude * sparam.S21.magnitude * ga + (sparam.S12.magnitude * sparam.S21.magnitude * ga) ** 2) /
    Math.abs(1 + ga * (sparam.S11.magnitude ** 2 - deltaPolar.magnitude ** 2));

  console.log("Gain:", ga, centerGain, c1);

  //must conver from center Reflection coefficient to Z :
  const center = reflToZ(centerReflection, { real: 1, imaginary: 0 });

  // console.log("center, radius", rectangularToPolar(centerReflection), radius);
  // console.log("centerImpedance", center);
  return { center, radius };
}

export function sparamZout(sparamPolar, reflSourcePolar) {
  const sparam = {
    S11: polarToRectangular(sparamPolar.S11),
    S12: polarToRectangular(sparamPolar.S12),
    S21: polarToRectangular(sparamPolar.S21),
    S22: polarToRectangular(sparamPolar.S22),
  };
  const reflSource = polarToRectangular(reflSourcePolar);
  const s12s21 = complex_multiply(sparam.S12, sparam.S21);
  // console.log("sparamZout", sparam, sparamPolar.S11, polarToRectangular(sparamPolar.S11));

  const s11rs = complex_multiply(sparam.S11, reflSource);
  const numerator = complex_multiply(s12s21, reflSource);
  const denomenator = complex_subtract({ real: 1, imaginary: 0 }, s11rs);
  const inv_denomenator = one_over_complex(denomenator);
  const rout = complex_add(sparam.S22, complex_multiply(numerator, inv_denomenator));
  // console.log('sparamZout', rout)
  const polar = rectangularToPolar(rout);
  // console.log('sparamZout polar', {polar: polar, rectangular: rout})
  return { polar: polar, rectangular: rout };
}

function sParamDataToPolar(splLine, format, fUnit, zo) {
  const frequency = parseFloat(splLine[0]) * unitConverter[fUnit];
  var sparam = {};
  if (format == "RI") {
    if (splLine.length == 3) {
      sparam = {
        S11: rectangularToPolar({ real: parseFloat(splLine[1]), imaginary: parseFloat(splLine[2]) }),
      };
    } else if (splLine.length == 9) {
      sparam = {
        S11: rectangularToPolar({ real: parseFloat(splLine[1]), imaginary: parseFloat(splLine[2]) }),
        S21: rectangularToPolar({ real: parseFloat(splLine[3]), imaginary: parseFloat(splLine[4]) }),
        S12: rectangularToPolar({ real: parseFloat(splLine[5]), imaginary: parseFloat(splLine[6]) }),
        S22: rectangularToPolar({ real: parseFloat(splLine[7]), imaginary: parseFloat(splLine[8]) }),
      };
    }
  } else if (format == "MA") {
    //the data format is magnitude-angle
    if (splLine.length == 3) {
      sparam = {
        S11: { magnitude: parseFloat(splLine[1]), angle: parseFloat(splLine[2]) },
      };
    } else if (splLine.length == 9) {
      sparam = {
        S11: { magnitude: parseFloat(splLine[1]), angle: parseFloat(splLine[2]) },
        S21: { magnitude: parseFloat(splLine[3]), angle: parseFloat(splLine[4]) },
        S12: { magnitude: parseFloat(splLine[5]), angle: parseFloat(splLine[6]) },
        S22: { magnitude: parseFloat(splLine[7]), angle: parseFloat(splLine[8]) },
      };
    }
  } else if (format == "DB") {
    //the data format is magnitude-angle
    if (splLine.length == 3) {
      sparam = {
        S11: { magnitude: 10 ** (parseFloat(splLine[1]) / 20), angle: parseFloat(splLine[2]) },
      };
    } else if (splLine.length == 9) {
      sparam = {
        S11: { magnitude: 10 ** (parseFloat(splLine[1]) / 20), angle: parseFloat(splLine[2]) },
        S21: { magnitude: 10 ** (parseFloat(splLine[3]) / 20), angle: parseFloat(splLine[4]) },
        S12: { magnitude: 10 ** (parseFloat(splLine[5]) / 20), angle: parseFloat(splLine[6]) },
        S22: { magnitude: 10 ** (parseFloat(splLine[7]) / 20), angle: parseFloat(splLine[8]) },
      };
    }
  }
  //convert S11 to a Z for s1p matching
  const rS11 = polarToRectangular(sparam.S11);
  sparam.zS11 = reflToZ(rS11, zo);

  return [frequency, sparam];
}

export function parseTouchstoneFile(content) {
  const optionsRegex = /^\s*#\s+(?<freq_unit>\S+)\s+(?<param>\S+)\s+(?<format>\S+)\s+R\s+(?<zo>\S+)\s*$/;
  // const dataLineRegex = /^(?<freq>\S+)((\s+[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?){2,})$/;
  const noiseRegex = /^\s*(?<freq>\S+)\s+(?<fmin>\S+)\s+(?<gamma_mag>\S+)\s+(?<gamma_ang>\S+)\s+(?<rn>\S+)\s*$/;

  const results = { data: {}, noise: {}, settings: {}, error: null, name: "sparam" };
  var noiseExists = false;
  var line;

  //if content is not a string, return an error
  if (typeof content !== "string") {
    results.error = "Invalid content format. Expected a string.";
    return results;
  }

  var lines = content.trim().replace(/–/g, "-").split(/\r?\n/); // split by line, remove empty lines and replace long dash with short dash
  lines = lines.filter((line) => !(line.trim().startsWith("!") && !line.includes("Noise parameters"))); //remove comments
  const match = lines[0].match(optionsRegex);
  if (match?.groups) {
    // console.log("parsedSettings", match.groups);
    results["settings"] = { ...match.groups };
    if (results["settings"].param !== "S") {
      results.error = `Only type=S is supported for now (you have type=${results["settings"].param})`;
      return results;
    }
  } else {
    results.error = "Invalid Touchstone file format";
    return results;
  }
  results["settings"].freq_unit = correctUnitCase(results["settings"].freq_unit);
  results["settings"].zo = parseFloat(results["settings"].zo);
  // console.log("unit", results["settings"].freq_unit, unitConverter[results["settings"].freq_unit]);
  for (line = 1; line < lines.length; line++) {
    if (lines[line].includes("! Noise parameters")) {
      noiseExists = true;
      break;
    }
    const splLine = lines[line].trim().split(/\s+/);
    if (splLine.length != 3 && splLine.length != 9) {
      results.error = "This line contains the wrong number of data points: " + lines[line];
      return results;
    }
    const [f, d] = sParamDataToPolar(splLine, results["settings"].format, results["settings"].freq_unit, results["settings"].zo);
    results["data"][f] = d;
    results["type"] = splLine.length == 0 ? null : splLine.length == 9 ? "s2p" : "s1p";
  }
  if (results["type"] === null) {
    results.error = "Data is not .s1p or .s2p format?";
    return results;
  }

  if (noiseExists) {
    for (line++; line < lines.length; line++) {
      const match = lines[line].match(noiseRegex);
      if (match?.groups) {
        // console.log("noiseData", match.groups);
        const { freq, ...rest } = match.groups;
        // rest.rn = rest.rn
        const f = freq * unitConverter[results["settings"].freq_unit];
        if (!(f in results["data"])) continue; // skip if noise frequency not in data
        results.noise[f] = {};
        results.noise[f].rn = rest.rn * results["settings"].zo; //convert rn to Ohms
        results.noise[f].fmin = parseFloat(rest.fmin);
        results.noise[f].gamma = { magnitude: parseFloat(rest.gamma_mag), angle: parseFloat(rest.gamma_ang) };
        results.noise[f].yGamma = one_over_complex(reflToZ(polarToRectangular(results.noise[f].gamma), results["settings"].zo));

        // results["noise"].push(match.groups);
      } else {
        results.error = "Invalid Touchstone noise data format";
        return results;
      }
    }
  }
  return results;

  // console.log("Touchstone results", results);
}

// takes the whole s-parameter data and returns only the data within the frequency range
export function sParamFrequencyRange(data, fmin, fmax) {
  // console.log('filta', data, fmin, fmax)
  return Object.fromEntries(Object.entries(data).filter(([key]) => Number(key) >= fmin && Number(key) <= fmax));

  // return data.filter((point) => point.frequency >= fmin && point.frequency <= fmax);
}

//convert from 50ohm termination to users termination
export function S11NotMatched(point, zo, rTermination) {
  // return data.map(point => {
  const s11 = polarToRectangular(point.S11);
  const z = reflToZ(s11, zo);
  const newZ = zToRefl(z, rTermination);
  return { ...point, S11: rectangularToPolar(newZ) };
  // });
}
