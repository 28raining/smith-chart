import {
  unitConverter,
  ESLUnit,
  one_over_complex,
  speedOfLight,
  CustomZAtFrequency,
  processImpedance,
  polarToRectangular,
  rectangularToPolar,
  zToRefl,
  complex_subtract,
} from "./commonFunctions.js";
import { sParamFrequencyRange } from "./sparam.js"; // Import the sParamFrequencyRange function

const detailedResolution = 50;

export function calculateTlineZ(resolution, component, line_length, beta, startImaginary, startReal, impedanceResolution, startAdmittance) {
  var tan_beta, zBottom_inv, zTop;
  for (var j = 0; j <= resolution; j++) {
    if (component.name == "shortedStub") tan_beta = Math.tan((beta * j * line_length) / resolution + Math.PI / 2);
    else tan_beta = Math.tan((beta * j * line_length) / resolution);

    if (component.name == "transmissionLine") {
      zBottom_inv = one_over_complex({ real: component.zo - startImaginary * tan_beta, imaginary: startReal * tan_beta });
      zTop = {
        real: startReal * component.zo,
        imaginary: startImaginary * component.zo + tan_beta * component.zo * component.zo,
      };
      impedanceResolution.push({
        real: zTop.real * zBottom_inv.real - zTop.imaginary * zBottom_inv.imaginary,
        imaginary: zTop.real * zBottom_inv.imaginary + zTop.imaginary * zBottom_inv.real,
      });
    } else if (component.name == "stub" || component.name == "shortedStub") {
      impedanceResolution.push(one_over_complex({ real: startAdmittance.real, imaginary: startAdmittance.imaginary + tan_beta / component.zo }));
    }
  }
}

//mini part of gain equation which is duplicated
// (1 - |Rs|^2) / (|1 - S11Rs|^2)
function subEq(Rs, S11) {
  const numerator = 1 - Rs.real ** 2 - Rs.imaginary ** 2;
  const denominator = (1 - S11.real * Rs.real + S11.imaginary * Rs.imaginary) ** 2 + (S11.imaginary * Rs.real + S11.real * Rs.imaginary) ** 2;
  return numerator / denominator;
}

export function calculateImpedance(userCircuit, frequency, resolution, showIdeal = false) {
  var startReal, startImaginary, startAdmittance, endImpedance;
  var newAdmittance = {};
  var newImpedance = {};
  var impedanceResolution = [];
  var component;
  var prevResult;
  var esr, esl;
  var impedanceResults =
    userCircuit[0].type === "s1p"
      ? [[{ real: userCircuit[0].data[frequency].zS11.real, imaginary: userCircuit[0].data[frequency].zS11.imaginary }]]
      : [[{ real: userCircuit[0].real, imaginary: userCircuit[0].imaginary }]];
  // console.log('impedanceResults', impedanceResults)
  var w = 2 * Math.PI * frequency;
  var i, j;
  for (i = 1; i < userCircuit.length; i++) {
    impedanceResolution = [];
    component = userCircuit[i];
    prevResult = impedanceResults[impedanceResults.length - 1];
    startReal = prevResult[prevResult.length - 1].real;
    startImaginary = prevResult[prevResult.length - 1].imaginary;
    esr = showIdeal ? 0 : component.esr ? component.esr : 0;
    esl = showIdeal ? 0 : component.esl ? component.esl : 0;

    if (component.name === "shortedCap" || component.name === "shortedInd" || component.name === "shortedRes") {
      //this impedance is in parallel with the existing impedance
      //expanding the equation 1/((1/z1) + (1/z2)). To plot the arc we sweep the ADMITTANCE (1/z) from 0 -> value

      startAdmittance = one_over_complex({ real: startReal, imaginary: startImaginary });
      if (component.name === "shortedInd")
        newAdmittance = one_over_complex({ real: esr, imaginary: w * component.value * unitConverter[component.unit] });
      else if (component.name === "shortedCap")
        newAdmittance = one_over_complex({ real: esr, imaginary: w * esl * ESLUnit - 1 / (w * component.value * unitConverter[component.unit]) });
      else if (component.name === "shortedRes")
        newAdmittance = one_over_complex({ real: component.value * unitConverter[component.unit], imaginary: w * esl * ESLUnit });

      for (j = 0; j <= resolution; j++) {
        impedanceResolution.push(
          one_over_complex({
            real: startAdmittance.real + (newAdmittance.real * j) / resolution,
            imaginary: startAdmittance.imaginary + (newAdmittance.imaginary * j) / resolution,
          }),
        );
      }
    } else if (component.name === "seriesCap" || component.name === "seriesInd" || component.name === "seriesRes" || component.name === "seriesRlc") {
      //this impedance is added with the existing impedance
      if (component.name === "seriesInd")
        newImpedance = {
          real: esr,
          imaginary: w * component.value * unitConverter[component.unit],
        };
      else if (component.name === "seriesCap")
        newImpedance = {
          real: esr,
          imaginary: w * esl * ESLUnit - 1 / (w * component.value * unitConverter[component.unit]),
        };
      else if (component.name === "seriesRlc") {
        var zj =
          (w * component.value_l * unitConverter[component.unit_l]) /
          (1 - w * w * component.value_l * unitConverter[component.unit_l] * component.value_c * unitConverter[component.unit_c]);
        newImpedance = one_over_complex({ real: 1 / (component.value * unitConverter[component.unit]), imaginary: -1 / zj });
      } else if (component.name === "seriesRes")
        newImpedance = {
          real: component.value * unitConverter[component.unit],
          imaginary: w * esl * ESLUnit,
        };

      for (j = 0; j <= resolution; j++) {
        endImpedance = {
          real: startReal + (newImpedance.real * j) / resolution,
          imaginary: startImaginary + (newImpedance.imaginary * j) / resolution,
        };
        impedanceResolution.push(endImpedance);
      }
    } else if (component.name == "transmissionLine" || component.name == "stub" || component.name == "shortedStub") {
      // the equation for impedance after adding a transmission line is
      // Z = Zo * (Zl + jZo*tan(bl)) / (Zo + jZltan(bl))
      // where b = 2 * PI / lambda
      // var beta = (w * Math.sqrt(component.eeff)) / speedOfLight; //move eeff multiplaction outside of beta
      var beta = w / speedOfLight;
      var line_length;
      var lengthLambda;
      startAdmittance = one_over_complex({ real: startReal, imaginary: startImaginary });

      //convert length into lambdas (it was already converted to meters at f0, now converted to lambda at f0 + fspan)
      lengthLambda = (component.value * unitConverter[component.unit] * frequency) / speedOfLight;
      //apply eeff to the length before we do modulus 0.5, because a line of 0.5λ will be <> 0.5λ after eeff
      lengthLambda = lengthLambda * Math.sqrt(component.eeff);
      // if (lengthLambda > 0 && lengthLambda % 0.5 == 0) line_length = (0.5 * speedOfLight) / frequency;
      // else line_length = ((lengthLambda % 0.5) * speedOfLight) / frequency;

      //if line length is greater than half wavelength then first plot a whole circle (there might be N whole circles and if all of them are drawn we need too many data points), then the the next line plots the remainder (%)
      if (lengthLambda >= 0.5)
        calculateTlineZ(
          resolution,
          component,
          (0.5 * speedOfLight) / frequency,
          beta,
          startImaginary,
          startReal,
          impedanceResolution,
          startAdmittance,
        );

      line_length = ((lengthLambda % 0.5) * speedOfLight) / frequency;
      calculateTlineZ(resolution, component, line_length, beta, startImaginary, startReal, impedanceResolution, startAdmittance);
    } else if (component.name == "transformer") {
      if (component.model === "ideal") {
        // Ideal transformer: Z_out = n² * Z_in (turns ratio n from primary to secondary)
        var n = Number(component.k);
        if (isNaN(n) || n <= 0) n = 1;
        var n2 = n * n;
        for (j = 0; j <= resolution; j++) {
          const transformerScaler = 1 + ((n2 - 1) * j) / resolution;
          impedanceResolution.push({
            real: transformerScaler * startReal,
            imaginary: transformerScaler * startImaginary,
          });
        }
      } else {
        // Coupled inductor model. Do 3 separate equations
        //     --- L1 --- --- L2 ---  <- look this way
        //    |          |
        //    Zo         Lm
        //    |          |
        var l1w = w * component.l1 * unitConverter[component.unit_l1];
        var l2w = w * component.l2 * unitConverter[component.unit_l2];
        var lmw = component.k * Math.sqrt(l1w * l2w);
        var i1z, i2z, newStartAdmittance;

        for (j = 0; j <= resolution; j++) {
          //L1
          i1z = {
            real: startReal,
            imaginary: startImaginary + ((l1w - lmw) * j) / resolution,
          };
          //Lm
          newStartAdmittance = one_over_complex(i1z);
          i2z = one_over_complex({ real: newStartAdmittance.real, imaginary: newStartAdmittance.imaginary - ((1 / lmw) * j) / resolution });
          //L2
          impedanceResolution.push({
            real: i2z.real,
            imaginary: i2z.imaginary + ((l2w - lmw) * j) / resolution,
          });
        }
      }
    } else if (component.name == "custom") {
      newImpedance = CustomZAtFrequency(component.value, frequency, component.interpolation);
      for (j = 0; j <= resolution; j++) {
        impedanceResolution.push({
          real: startReal + (newImpedance.real * j) / resolution,
          imaginary: startImaginary + (newImpedance.imaginary * j) / resolution,
        });
      }
    } else if (component.name == "sparam" || component.name == "loadTerm") {
      //FIXME - this is a hack to prevent crashing
      console.warn("sparam, loadTerm, s1p and s2p components are not supported in impedance calculations");
      // for (j = 0; j <= resolution; j++) {
      impedanceResolution.push({
        real: startReal,
        imaginary: startImaginary,
      });
      // }
    }

    impedanceResults.push(impedanceResolution);
  }
  return impedanceResults;
}

export function createToleranceArray(copyCircuit) {
  var originalCircuit = JSON.parse(JSON.stringify(copyCircuit[0]));
  var newCircuit, i, j;
  var valueHolders = ["value", "real", "imaginary"];
  for (i = 0; i < originalCircuit.length; i++) {
    if (originalCircuit[i].tolerance) {
      newCircuit = JSON.parse(JSON.stringify(copyCircuit));
      for (j = 0; j < copyCircuit.length; j++) {
        for (const value of valueHolders) {
          if (value in copyCircuit[j][i]) {
            copyCircuit[j][i][value] = copyCircuit[j][i][value] * (1 + copyCircuit[j][i].tolerance / 100);
            newCircuit[j][i][value] = newCircuit[j][i][value] * (1 - copyCircuit[j][i].tolerance / 100);
          }
        }
      }
      copyCircuit.push(...newCircuit);
    }
  }
  if (copyCircuit.length > 1) copyCircuit.push(originalCircuit); //add a 0-tolerance circuit if all the others have tolerance
  return copyCircuit;
}

function applySliders(circuit) {
  for (var i = 0; i < circuit.length; i++) {
    if (circuit[i].slider) circuit[i].value = circuit[i].value * (1 + circuit[i].slider / 100);
    if (circuit[i].slider_im) circuit[i].imaginary = circuit[i].imaginary * (1 + circuit[i].slider_im / 100);
    if (circuit[i].slider_re) circuit[i].real = circuit[i].real * (1 + circuit[i].slider_re / 100);
  }
  return circuit;
}

function convertStrToFloat(circuit) {
  const fields = [
    "tolerance",
    "real",
    "imaginary",
    "esl",
    "esr",
    "value",
    "slider_re",
    "slider_im",
    "l1",
    "l2",
    "k",
    "slider",
    "zo",
    "value_c",
    "value_l",
    "eeff",
  ];
  for (var i = 0; i < circuit.length; i++) {
    for (const field of fields) {
      if (field in circuit[i] && typeof circuit[i][field] === "string") {
        const r = parseFloat(circuit[i][field]);
        if (!isNaN(r)) circuit[i][field] = r;
        else circuit[i][field] = 0;
      }
    }
  }
  return circuit;
}

function convertLengthToM(circuit, frequency) {
  for (var i = 0; i < circuit.length; i++) {
    if (circuit[i].unit == "λ" || circuit[i].unit == "deg") {
      var lambdaLen = circuit[i].value;
      if (circuit[i].unit == "deg") lambdaLen = circuit[i].value / 360;
      const metricLength = (lambdaLen * speedOfLight) / frequency / Math.sqrt(circuit[i].eeff);
      circuit[i].value = metricLength;
      circuit[i].unit = "m";
    }
  }
  return circuit;
}

//calculate impedance at a specific frequency
function impedanceAtFrequency(circuit, frequency, showIdeal = false) {
  const span_tol = calculateImpedance(circuit, frequency, 2, showIdeal);
  const span_tol_final = span_tol[span_tol.length - 1];
  return span_tol_final[span_tol_final.length - 1];
}

export function allImpedanceCalculations(userCircuit, settings, showIdeal = false) {
  //get index of sparam in userCircuit
  // const sParametersSearch = userCircuit.filter((c) => c.name === "sparam");
  const sParamIndex = userCircuit.findIndex((c) => c.name === "sparam");
  const s2pIndex = userCircuit.findIndex((c) => c.type === "s2p");
  const s1pIndex = userCircuit.findIndex((c) => c.type === "s1p");
  const RefIn = [];
  var spanFrequencies = [];
  const numericalFrequencyTemp = settings.frequency * unitConverter[settings.frequencyUnit];
  var numericalFrequency = numericalFrequencyTemp;
  var noiseFrequency = -1;
  //frequency must be one of the numbers in sparam
  if (sParamIndex !== -1) {
    const allF = Object.keys(userCircuit[sParamIndex].data);
    numericalFrequency = allF[allF.length - 1];
    for (const f in userCircuit[sParamIndex].data) {
      if (Number(f) >= numericalFrequencyTemp) {
        numericalFrequency = Number(f);
        break;
      }
    }
    const allFn = Object.keys(userCircuit[sParamIndex].noise);
    if (allFn.length > 0) {
      noiseFrequency = allFn[allFn.length - 1];
      for (const f in userCircuit[sParamIndex].noise) {
        if (Number(f) >= numericalFrequencyTemp) {
          noiseFrequency = Number(f);
          break;
        }
      }
    }
  }

  const numericalFspan = settings.fSpan * unitConverter[settings.fSpanUnit];
  const spanStep = numericalFspan / settings.fRes;
  var i;

  var userCircuitStrToFloat = convertStrToFloat(JSON.parse(JSON.stringify(userCircuit)));
  var userCircuitWithSliders = applySliders(userCircuitStrToFloat);
  var userCircuitNoLambda = convertLengthToM(userCircuitWithSliders, numericalFrequency);

  //reduce s-param data to the frequency range of interest
  if (sParamIndex !== -1) {
    userCircuitNoLambda[sParamIndex].data = sParamFrequencyRange(
      userCircuitNoLambda[sParamIndex].data,
      numericalFrequency - numericalFspan,
      numericalFrequency + numericalFspan,
    );
    userCircuitNoLambda[sParamIndex].noise = sParamFrequencyRange(
      userCircuitNoLambda[sParamIndex].noise,
      numericalFrequency - numericalFspan,
      numericalFrequency + numericalFspan,
    );
  }

  var finalZ, finalDp;

  if (sParamIndex !== -1)
    spanFrequencies = Object.keys(userCircuitNoLambda[sParamIndex].data); //.map((x) => x.frequency);
  else if (settings.fSpan > 0) for (i = -settings.fRes; i <= settings.fRes; i++) spanFrequencies.push(numericalFrequency + i * spanStep);
  else spanFrequencies.push(numericalFrequency);

  //if there's a s2p block then create 2 impedance arcs
  const multiZCircuits =
    s2pIndex === -1 ? [userCircuitNoLambda] : [userCircuitNoLambda.slice(0, s2pIndex), [...userCircuitNoLambda.slice(s2pIndex + 1)].reverse()];
  const multiZResults = [];
  for (var c of multiZCircuits) {
    var zResultsSrc = [];
    if (s1pIndex !== -1) {
      const cReversed = [...c].reverse();
      cReversed.pop(); //remove the blackbox
      c = cReversed;
    }
    var circuitArray = createToleranceArray([c]);
    for (const z of circuitArray) zResultsSrc.push(calculateImpedance(z, numericalFrequency, detailedResolution, showIdeal));
    const noToleranceResult = zResultsSrc[zResultsSrc.length - 1];
    finalDp = noToleranceResult[noToleranceResult.length - 1];
    finalZ = finalDp[finalDp.length - 1];

    //for frequency span, don't create arcs, just create the final impedances
    var spanResults = [];

    for (const c of circuitArray) {
      const fRes = {};
      const RefInVsF = {};
      for (const f of spanFrequencies) {
        const z = impedanceAtFrequency(c, f, showIdeal);
        fRes[f] = { z };
        if (sParamIndex !== -1) fRes[f].reflAtSZo = zToRefl(z, { real: userCircuitNoLambda[sParamIndex].settings.zo, imaginary: 0 });
        if (s1pIndex !== -1) RefInVsF[f] = rectangularToPolar(zToRefl(z, userCircuitNoLambda[0])); //userCircuitNoLambda[0] is the termination
      }
      spanResults.push(fRes);
      if (s1pIndex !== -1) RefIn.push(RefInVsF);
    }
    multiZResults.push({ arcs: zResultsSrc, ZvsF: spanResults });
  }

  //if its s2p then create the gain results. Must do this after the multiZResults are created
  const gainArray = [];
  const noiseArray = [];

  if (s2pIndex !== -1) {
    for (const x in multiZResults[0].ZvsF) {
      for (const y in multiZResults[1].ZvsF) {
        // console.log("x", x, multiZResults[0].ZvsF);
        const gainResults = {};
        for (const f in userCircuitNoLambda[s2pIndex].data) {
          const p = userCircuitNoLambda[s2pIndex].data[f];
          const gain =
            subEq(multiZResults[0].ZvsF[x][f].reflAtSZo, polarToRectangular(p.S11)) *
            subEq(multiZResults[1].ZvsF[y][f].reflAtSZo, polarToRectangular(p.S22)) *
            p.S21.magnitude ** 2;
          gainResults[f] = gain;
        }
        gainArray.push(gainResults);
      }
    }
    if (Object.keys(userCircuitNoLambda[s2pIndex].noise).length > 0) {
      for (const x in multiZResults[0].ZvsF) {
        const noiseResults = {};
        for (const f in userCircuitNoLambda[s2pIndex].noise) {
          const p = userCircuitNoLambda[s2pIndex].noise[f];
          const y = one_over_complex(multiZResults[0].ZvsF[x][f].z);
          const YSmYOPT = complex_subtract(y, p.yGamma);
          noiseResults[f] = 10 ** (p.fmin / 10) + (p.rn / y.real) * (YSmYOPT.real ** 2 + YSmYOPT.imaginary ** 2);
        }
        noiseArray.push(noiseResults);
      }
    }
  }

  // converts real and imaginary into Q, VSWR, reflection coeff, etc
  const processedImpedanceResults = processImpedance(finalZ, settings.zo);

  return [processedImpedanceResults, spanResults, multiZResults, gainArray, noiseArray, numericalFrequency, RefIn, noiseFrequency];
}
