import { unitConverter, ESLUnit, one_over_complex, speedOfLight, CustomZAtFrequency } from "./commonFunctions.js";

export function calculateTlineZ(resolution, component, line_length, beta, startImaginary, startReal, impedanceResolution, startAdmittance) {
  var tan_beta, zBottom_inv, zTop;
  for (var j = 0; j <= resolution; j++) {
    if (component.name == "shortedStub") tan_beta = Math.tan((beta * j * line_length) / resolution + Math.PI / 2);
    else tan_beta = Math.tan((beta * j * line_length) / resolution);

    if (component.name == "transmissionLine") {
      zBottom_inv = one_over_complex(component.zo - startImaginary * tan_beta, startReal * tan_beta);
      zTop = {
        real: startReal * component.zo,
        imaginary: startImaginary * component.zo + tan_beta * component.zo * component.zo,
      };
      impedanceResolution.push({
        real: zTop.real * zBottom_inv.real - zTop.imaginary * zBottom_inv.imaginary,
        imaginary: zTop.real * zBottom_inv.imaginary + zTop.imaginary * zBottom_inv.real,
      });
    } else if (component.name == "stub" || component.name == "shortedStub") {
      impedanceResolution.push(one_over_complex(startAdmittance.real, startAdmittance.imaginary + tan_beta / component.zo));
    }
  }
}

export function calculateImpedance(userCircuit, frequency, resolution) {
  var startReal, startImaginary, startAdmittance, endImpedance;
  var newAdmittance = {};
  var newImpedance = {};
  var impedanceResolution = [];
  var component;
  var prevResult;
  var esr, esl;
  var impedanceResults = [[{ real: userCircuit[0].real, imaginary: userCircuit[0].imaginary }]];
  var w = 2 * Math.PI * frequency;
  var i, j;
  for (i = 1; i < userCircuit.length; i++) {
    impedanceResolution = [];
    component = userCircuit[i];
    prevResult = impedanceResults[impedanceResults.length - 1];
    startReal = prevResult[prevResult.length - 1].real;
    startImaginary = prevResult[prevResult.length - 1].imaginary;
    esr = component.esr ? component.esr : 0;
    esl = component.esl ? component.esl : 0;

    if (component.name === "shortedCap" || component.name === "shortedInd" || component.name === "shortedRes") {
      //this impedance is in parallel with the existing impedance
      //expanding the equation 1/((1/z1) + (1/z2)). To plot the arc we sweep the ADMITTANCE (1/z) from 0 -> value

      startAdmittance = one_over_complex(startReal, startImaginary);
      if (component.name === "shortedInd") newAdmittance = one_over_complex(esr, w * component.value * unitConverter[component.unit]);
      else if (component.name === "shortedCap")
        newAdmittance = one_over_complex(esr, w * esl * ESLUnit - 1 / (w * component.value * unitConverter[component.unit]));
      else if (component.name === "shortedRes") newAdmittance = one_over_complex(component.value * unitConverter[component.unit], w * esl * ESLUnit);

      for (j = 0; j <= resolution; j++) {
        impedanceResolution.push(
          one_over_complex(
            startAdmittance.real + (newAdmittance.real * j) / resolution,
            startAdmittance.imaginary + (newAdmittance.imaginary * j) / resolution,
          ),
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
          imaginary: -1 / (w * component.value * unitConverter[component.unit]),
        };
      else if (component.name === "seriesRlc") {
        var zj =
          (w * component.value_l * unitConverter[component.unit_l]) /
          (1 - w * w * component.value_l * unitConverter[component.unit_l] * component.value_c * unitConverter[component.unit_c]);
        newImpedance = one_over_complex(1 / (component.value * unitConverter[component.unit]), -1 / zj);
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
      startAdmittance = one_over_complex(startReal, startImaginary);

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
      //coupled inductor model. Do 3 separate equations
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
          imaginary: startImaginary + ((l1w-lmw) * j) / resolution,
        };
        //Lm
        newStartAdmittance = one_over_complex(i1z.real, i1z.imaginary);
        i2z = one_over_complex(newStartAdmittance.real, newStartAdmittance.imaginary - ((1 / lmw) * j) / resolution);
        //L2
        impedanceResolution.push({
          real: i2z.real,
          imaginary: i2z.imaginary + ((l2w-lmw) * j) / resolution,
        });
      }
    } else if (component.name == "custom") {
      newImpedance = CustomZAtFrequency(component.value, frequency, component.interpolation);
      for (j = 0; j <= resolution; j++) {
        impedanceResolution.push({
          real: startReal + (newImpedance.real * j) / resolution,
          imaginary: startImaginary + (newImpedance.imaginary * j) / resolution,
        });
      }
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

export function applySliders(circuit) {
  for (var i = 0; i < circuit.length; i++) {
    if (circuit[i].slider) circuit[i].value = circuit[i].value * (1 + circuit[i].slider / 100);
    if (circuit[i].slider_im) circuit[i].imaginary = circuit[i].imaginary * (1 + circuit[i].slider_im / 100);
    if (circuit[i].slider_re) circuit[i].real = circuit[i].real * (1 + circuit[i].slider_re / 100);
  }
  return circuit;
}

export function convertLengthToM(circuit, frequency) {
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
