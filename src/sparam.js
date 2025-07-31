//Calculate gain and noise circles from s-parameter data
import {
  arcColors,
  one_over_complex,
  processImpedance,
  complex_add,
  complex_subtract,
  complex_multiply,
  parseInput,
  polarToRectangular,
  zToPolar,
  unitConverter,
  reflToZ,
  zToRefl,
  correctUnitCase
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
export function sparamNoiseCircles(fMin, F, Rn, reflection_real, reflection_imag) {
  // Fmin = n.NFmin;
  // F = n.NF;
  // Rn = n.Rn / zo;
  const Go_real = reflection_real;
  const Go_imag = reflection_imag;
  const GoMag = Go_real * Go_real + Go_imag * Go_imag;
  const GoMagP1 = (Go_real + 1) * (Go_real + 1) + Go_imag * Go_imag;

  const FminLinear = Math.pow(10, fMin / 10);
  const FLinear = Math.pow(10, F / 10);
  const Ni = ((FLinear - FminLinear) * GoMagP1) / (4 * Rn);
  const center_real = Go_real / (Ni + 1);
  const center_imag = Go_imag / (Ni + 1);
  const radius = Math.sqrt(Ni * (Ni + 1 - GoMag)) / (Ni + 1);

  //must conver from center Reflection coefficient to Z : Z = Zo(1+refl/(1-refl)
  var tempZ = one_over_complex({real: 1 - center_real, imaginary: -center_imag});
  var centerImpedance = complex_multiply(tempZ, { real: 1 + center_real, imaginary: center_imag });
  return [centerImpedance, radius];
}

// 1.4
// 0.533 ∠ 176.6 degrees
// 2.800 ∠ 64.5 degrees
// 0.06 ∠ 58.4 degrees
// 0.604 ∠ –58.3 degrees
export function sparamGainCircles(s11, s21, s12, s22, gain) {
  // Convert polar form to rectangular form
  const S11 = polarToRectangular(s11);
  const S22 = polarToRectangular(s22);
  const S12 = polarToRectangular(s12);
  const S21 = polarToRectangular(s21);

  // Calculate Delta = S11 * S22 - S12 * S21
  const product1 = complex_multiply(S11, S22);
  const product2 = complex_multiply(S12, S21);
  const delta = {
    real: product1.real - product2.real,
    imaginary: product1.imaginary - product2.imaginary,
  };
  const deltaPolar = zToPolar(delta);

  // Calculate K factor
  const k = (1 - s11.magnitude ** 2 - s22.magnitude ** 2 + deltaPolar.magnitude ** 2) / (2 * s21.magnitude * s12.magnitude);
  console.log("S11", S11, S22);
  console.log("product1", product1);
  console.log("K factor:", k);
  console.log("Delta:", delta);

  //this is the max gain. What to do with it?
  // var ga = (s21.magnitude / s12.magnitude) * (k - Math.sqrt(k ** 2 - 1));
  // console.log("Gain:", ga);

  const ga = 10 ** (gain / 10) / s21.magnitude ** 2;

  const deltaS22 = complex_multiply(S22, delta);
  const c1 = complex_subtract(S11, deltaS22);
  const centerGain = ga / (1 + ga * (s11.magnitude ** 2 - deltaPolar.magnitude ** 2));
  const centerReflection = { real: centerGain * c1.real, imaginary: centerGain * -c1.imaginary };
  const radius =
    Math.sqrt(1 - 2 * k * s12.magnitude * s21.magnitude * ga + (s12.magnitude * s21.magnitude * ga) ** 2) /
    Math.abs(1 + ga * (s11.magnitude ** 2 - deltaPolar.magnitude ** 2));

  console.log("Gain:", ga, centerGain, c1);

  //must conver from center Reflection coefficient to Z : Z = Zo(1+refl/(1-refl) //FIXME replace qith cmn function
  var tempZ = one_over_complex({real: 1 - centerReflection.real, imaginary: -centerReflection.imaginary});
  var center = complex_multiply(tempZ, { real: 1 + centerReflection.real, imaginary: centerReflection.imaginary });

  console.log("center, radius", zToPolar(centerReflection), radius);
  console.log("centerImpedance", center);
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
  console.log("sparamZout", sparam);

  const s11rs = complex_multiply(sparam.S11, reflSource);
  const numerator = complex_multiply(s12s21, reflSource);
  const denomenator = complex_subtract({ real: 1, imaginary: 0 }, s11rs);
  const inv_denomenator = one_over_complex(denomenator);
  const rout = complex_add(sparam.S22, complex_multiply(numerator, inv_denomenator));
  // console.log('sparamZout', rout)
  const polar = zToPolar(rout);
  // console.log('sparamZout polar', {polar: polar, rectangular: rout})
  return { polar: polar, rectangular: rout };
}

function sParamDataToPolar(splLine, format, fUnit) {
  const frequency = parseFloat(splLine[0]) * unitConverter[fUnit];
  if (format == "RI") {
    if (splLine.length == 3) {
      return {
        frequency: frequency,
        S11: zToPolar({ real: parseFloat(splLine[1]), imaginary: parseFloat(splLine[2]) }),
      };
    } else if (splLine.length == 9) {
      return {
        frequency: frequency,
        S11: zToPolar({ real: parseFloat(splLine[1]), imaginary: parseFloat(splLine[2]) }),
        S12: zToPolar({ real: parseFloat(splLine[3]), imaginary: parseFloat(splLine[4]) }),
        S21: zToPolar({ real: parseFloat(splLine[5]), imaginary: parseFloat(splLine[6]) }),
        S22: zToPolar({ real: parseFloat(splLine[7]), imaginary: parseFloat(splLine[8]) }),
      };
    }
  } else if (format == "MA") {
    //the data format is magnitude-angle
    if (splLine.length == 3) {
      return {
        frequency: frequency,
        S11: { magnitude: parseFloat(splLine[1]), angle: parseFloat(splLine[2]) },
      };
    } else if (splLine.length == 9) {
      return {
        frequency: frequency,
        S11: { magnitude: parseFloat(splLine[1]), angle: parseFloat(splLine[2]) },
        S12: { magnitude: parseFloat(splLine[3]), angle: parseFloat(splLine[4]) },
        S21: { magnitude: parseFloat(splLine[5]), angle: parseFloat(splLine[6]) },
        S22: { magnitude: parseFloat(splLine[7]), angle: parseFloat(splLine[8]) },
      };
    }
  } else if (format == "DB") {
    //the data format is magnitude-angle
    if (splLine.length == 3) {
      return {
        frequency: frequency,
        S11: { magnitude: 10 ** (parseFloat(splLine[1]) / 20), angle: parseFloat(splLine[2]) },
      };
    } else if (splLine.length == 9) {
      return {
        frequency: frequency,
        S11: { magnitude: 10 ** (parseFloat(splLine[1]) / 20), angle: parseFloat(splLine[2]) },
        S12: { magnitude: 10 ** (parseFloat(splLine[3]) / 20), angle: parseFloat(splLine[4]) },
        S21: { magnitude: 10 ** (parseFloat(splLine[5]) / 20), angle: parseFloat(splLine[6]) },
        S22: { magnitude: 10 ** (parseFloat(splLine[7]) / 20), angle: parseFloat(splLine[8]) },
      };
    }
  }
}

export function parseTouchstoneFile(content) {
  const optionsRegex = /^\s*#\s+(?<freq_unit>\S+)\s+(?<param>\S+)\s+(?<format>\S+)\s+R\s+(?<zo>\S+)\s*$/;
  // const dataLineRegex = /^(?<freq>\S+)((\s+[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?){2,})$/;
  const noiseRegex = /^\s*(?<freq>\S+)\s+(?<fmin>\S+)\s+(?<gamma_mag>\S+)\s+(?<gamma_ang>\S+)\s+(?<rn>\S+)\s*$/;

  const results = { data: [], noise: [], settings: {}, error: null };
  var noiseExists = false;
  var line;

  //if content is not a string, return an error
  if (typeof content !== "string") {
    results.error = "Invalid content format. Expected a string.";
    return results;
  }

  var lines = content.trim().split(/\r?\n/); // split by line
  lines = lines.filter((line) => !line.trim().startsWith("!")); //remove comments
  const match = lines[0].match(optionsRegex);
  if (match?.groups) {
    // console.log("parsedSettings", match.groups);
    results["settings"] = match.groups;
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
    results["data"].push(sParamDataToPolar(splLine, results["settings"].format, results["settings"].freq_unit));
  }
  results["type"] = results["data"].length == 0 ? null : results["data"][0].length == 9 ? "s2p" : "s1p";
  if (results["type"] === null) {
    results.error = "Data is not .s1p or .s2p format?";
    return results;
  }

  if (noiseExists) {
    for (line++; line < lines.length; line++) {
      const match = lines[line].match(noiseRegex);
      if (match?.groups) {
        // console.log("noiseData", match.groups);
        results["noise"].push(match.groups);
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
export function sParamFrequencyRange (data, fmin, fmax) {
  return data.filter(point => point.frequency >= fmin && point.frequency <= fmax);
}

//convert from 50ohm termination to users termination
export function S11NotMatched (point, zo, rTermination) {
  // return data.map(point => {
      const s11 = polarToRectangular(point.S11);
      const z = reflToZ(s11, zo);
      const newZ = zToRefl(z, rTermination);
      return {...point, S11: zToPolar(newZ)};
  // });
}