import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import NavBar from "./NavBar.jsx";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Circuit from "./Circuit.jsx";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Graph from "./Graph.jsx";
import Results from "./Results.jsx";
import Settings from "./Settings.jsx";

import { unitConverter, theme, ESLUnit, one_over_complex, speedOfLight, CustomZAtFrequency } from "./commonFunctions.js";

const resolution = 30;
const permittivity = 1;
// const zo = 50;

function calculateImpedance(userCircuit, frequency) {
  var startReal, startImaginary, newReal, newImaginary, endReal, endImaginary, startAdmittance, endAdmittance, endImpedance;
  var newAdmittance = {};
  var newImpedance = {};
  var a, b, c, d, ab2, ac, bd, ad, cb;
  var impedanceResolution = [];
  var component;
  var prevResult;
  var esr, esl;
  var impedanceResults = [[{ real: userCircuit[0].real, imaginary: userCircuit[0].imaginary }]];
  var w = 2 * Math.PI * frequency;
  var tan_beta;
  for (var i = 1; i < userCircuit.length; i++) {
    impedanceResolution = [];
    component = userCircuit[i];
    prevResult = impedanceResults[impedanceResults.length - 1];
    startReal = prevResult[prevResult.length - 1].real;
    startImaginary = prevResult[prevResult.length - 1].imaginary;
    esr = component.esr ? component.esr : 0;
    esl = component.esl ? component.esl : 0;

    if (component.name === "shorted_cap" || component.name === "shorted_ind" || component.name === "shorted_res") {
      //this impedance is in parallel with the existing impedance
      //expanding the equation 1/((1/z1) + (1/z2)). To plot the arc we sweep the ADMITTANCE (1/z) from 0 -> value

      startAdmittance = one_over_complex(startReal, startImaginary);
      if (component.name === "shorted_ind") newAdmittance = one_over_complex(esr, w * component.value * unitConverter[component.unit]);
      else if (component.name === "shorted_cap")
        newAdmittance = one_over_complex(esr, w * esl * ESLUnit - 1 / (w * component.value * unitConverter[component.unit]));
      else if (component.name === "shorted_res") newAdmittance = one_over_complex(component.value * unitConverter[component.unit], w * esl * ESLUnit);

      for (var j = 0; j <= resolution; j++) {
        impedanceResolution.push(
          one_over_complex(
            startAdmittance.real + (newAdmittance.real * j) / resolution,
            startAdmittance.imaginary + (newAdmittance.imaginary * j) / resolution
          )
        );
        // impedanceResolution.push(endImpedance);
      }
    } else if (
      component.name === "series_cap" ||
      component.name === "series_ind" ||
      component.name === "series_res" ||
      component.name === "series_rlc"
    ) {
      //this impedance is added with the existing impedance
      if (component.name === "series_ind") newImpedance = { real: esr, imaginary: w * component.value * unitConverter[component.unit] };
      else if (component.name === "series_cap") newImpedance = { real: esr, imaginary: -1 / (w * component.value * unitConverter[component.unit]) };
      else if (component.name === "series_rlc") {
        var zj =
          (w * component.value_l * unitConverter[component.unit_l]) /
          (1 - w * w * component.value_l * unitConverter[component.unit_l] * component.value_c * unitConverter[component.unit_c]);
        newImpedance = one_over_complex(1 / (component.value * unitConverter[component.unit]), -1 / zj);
      } else if (component.name === "series_res")
        newImpedance = { real: component.value * unitConverter[component.unit], imaginary: w * esl * ESLUnit };

      for (var j = 0; j <= resolution; j++) {
        endImpedance = {
          real: startReal + (newImpedance.real * j) / resolution,
          imaginary: startImaginary + (newImpedance.imaginary * j) / resolution,
        };
        impedanceResolution.push(endImpedance);
      }
    } else if (component.name == "transmission_line" || component.name == "stub" || component.name == "shorted_stub") {
      // the equation for impedance after adding a transmission line is
      // Z = Zo * (Zl + jZo*tan(bl)) / (Zo + jZltan(bl))
      // where b = 2 * PI / lambda
      var beta = (w * Math.sqrt(permittivity)) / speedOfLight;
      var line_length;
      var lengthLambda;

      //convert length into lambdas
      lengthLambda = component.value;
      if (component.unit != "λ") lengthLambda = (component.value * unitConverter[component.unit] * frequency) / speedOfLight;
      if (component.name == "shorted_stub") lengthLambda += 0.25; //shorted stub is like a stub with an additional quater wavelength
      if (lengthLambda > 0 && lengthLambda % 0.5 == 0) line_length = (0.5 * speedOfLight) / frequency;
      else line_length = ((lengthLambda % 0.5) * speedOfLight) / frequency;

      for (var j = 0; j <= resolution; j++) {
        tan_beta = Math.tan((beta * j * line_length) / resolution);
        if (component.name == "transmission_line") {
          //FIXME - don't redefine vars repeatedly
          var zBottom_inv = one_over_complex(component.zo - startImaginary * tan_beta, startReal * tan_beta);
          var zTop = { real: startReal * component.zo, imaginary: startImaginary * component.zo + tan_beta * component.zo * component.zo };
          impedanceResolution.push({
            real: zTop.real * zBottom_inv.real - zTop.imaginary * zBottom_inv.imaginary,
            imaginary: zTop.real * zBottom_inv.imaginary + zTop.imaginary * zBottom_inv.real,
          });
        } else if (component.name == "stub" || component.name == "shorted_stub") {
          startAdmittance = one_over_complex(startReal, startImaginary);
          impedanceResolution.push(one_over_complex(startAdmittance.real, startAdmittance.imaginary + tan_beta / component.zo));
        }

        //open-stub
        // tan_beta = Math.tan((beta * i * line_length) / resolution);
        // stub_admittance_im = tan_beta / (line_zo / zo);
        // temp_array = find_smith_coord(x1, y1 + stub_admittance_im, rotate);
      }
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

      for (var j = 0; j <= resolution; j++) {
        //L1
        // impedanceResolution.push({real: startReal, imaginary: startImaginary + (l1w * j) / resolution});
        i1z = {real: startReal, imaginary: startImaginary + (l1w * j) / resolution};
        // console.log('tf', l1w)

        //Lm
        newStartAdmittance = one_over_complex(i1z.real, i1z.imaginary);
        i2z = one_over_complex(newStartAdmittance.real, newStartAdmittance.imaginary - (1/lmw * j) / resolution);
        //L2
        impedanceResolution.push({real: i2z.real, imaginary: i2z.imaginary + (l2w * j) / resolution});
      }
      // //Lm
      // var newStartAdmittance = one_over_complex(impedanceResolution[resolution].real, impedanceResolution[resolution].imaginary)
      // for (var j = 0; j <= resolution; j++) {
      //   impedanceResolution.push(one_over_complex(newStartAdmittance.real, newStartAdmittance.imaginary - (lmw * j) / resolution));
      // }
      // for (var j = 0; j <= resolution; j++) {
      //   impedanceResolution.push({real: startReal, imaginary: startImaginary + (l2w * j) / resolution});
      // }
    } else if (component.name == "custom") {
      newImpedance = CustomZAtFrequency(component.value, frequency, component.interpolation);
      for (var j = 0; j <= resolution; j++) {
        impedanceResolution.push({
          real: startReal + (newImpedance.real * j) / resolution,
          imaginary: startImaginary + (newImpedance.imaginary * j) / resolution,
        });
        // impedanceResolution.push(endImpedance);
      }
    }
            // console.log('tf', impedanceResolution)

    impedanceResults.push(impedanceResolution);
  }
  return impedanceResults;
}

function createToleranceArray(copyCircuit) {
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
    // }
  }
  return circuit;
}

function App() {
  const [userCircuit, setUserCircuit] = useState([
    { name: "black_box", real: 25, imaginary: -25, tolerance: 10 },
    { name: "series_ind", value: 3.25, unit: "nH", tolerance: 10 },
    { name: "shorted_cap", value: 1.3, unit: "pF", tolerance: 5 },
  ]);
  // console.log(userCircuit);
  const [settings, setSettings] = useState({
    zo: 50,
    frequency: 2440,
    frequencyUnit: "MHz",
    fSpan: 0,
    fSpanUnit: "MHz",
    zMarkers: [],
    vswrCircles: [],
    qCircles: [],
    nfCircles: [],
  });

  var impedanceResults = [];

  var numericalFrequency = settings.frequency * unitConverter[settings.frequencyUnit];

  var userCircuitWithSliders = applySliders(JSON.parse(JSON.stringify(userCircuit)));
  var circuitArray = createToleranceArray([userCircuitWithSliders]);
  for (const z of circuitArray) impedanceResults.push(calculateImpedance(z, numericalFrequency));

  const noToleranceResult = impedanceResults[impedanceResults.length - 1];
  const finalDp = noToleranceResult[noToleranceResult.length - 1];

  // console.log(impedanceResults);
  // console.log("finalDp",finalDp);

  return (
    <ThemeProvider theme={theme}>
      <NavBar />
      <Box sx={{ flexGrow: 1, margin: 2 }}>
        <Grid container spacing={{ xl: 2, xs: 1 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Circuit userCircuit={userCircuit} setUserCircuit={setUserCircuit} frequency={numericalFrequency} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ minWidth: 275 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Graph impedanceResults={impedanceResults} zo={settings.zo} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={6}>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Results z={finalDp[finalDp.length - 1]} zo={settings.zo} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={6}>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Settings settings={settings} setSettings={setSettings} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default App;
