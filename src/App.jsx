import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";

import CardContent from "@mui/material/CardContent";
import { ThemeProvider } from "@mui/material/styles";
import NavBar from "./NavBar.jsx";
import Footer from "./Footer.jsx";
import Circuit from "./Circuit.jsx";
import Graph from "./Graph.jsx";
import Results from "./Results.jsx";
import Settings from "./Settings.jsx";
import { Comments } from "@hyvor/hyvor-talk-react";

import { syncObjectToUrl, updateObjectFromUrl } from "./urlFunctions.js"; // Import the syncObjectToUrl function
import {
  unitConverter,
  theme,
  ESLUnit,
  one_over_complex,
  speedOfLight,
  CustomZAtFrequency,
  processImpedance,
} from "./commonFunctions.js";

const resolution = 50;

var initialState = {
  zo: 50,
  frequency: 2440,
  frequencyUnit: "MHz",
  fSpan: 0,
  fSpanUnit: "MHz",
  zMarkers: [],
  vswrCircles: [],
  qCircles: [],
  nfCircles: [],
};

// const initialCircuit
//   { name: "blackBox", real: 25, imaginary: -25, tolerance: 10 },
//   { name: "seriesInd", value: 3.25, unit: "nH", tolerance: 10 },
//   { name: "shortedCap", value: 1.3, unit: "pF", tolerance: 5 },
// ];
// const initialCircuit
//   { name: "blackBox", real: 19.74, imaginary: 20, tolerance: 0 },
//   { name: "transmissionLine", value: 1, unit: "mm", zo: 50, eeff: 1 },
// ];
const initialCircuit = [{ name: "blackBox", real: 25, imaginary: -25 }];

var [stateInURL, defaultCircuit, urlContainsState] = updateObjectFromUrl(
  initialState,
  initialCircuit,
);

function calculateTlineZ(
  resolution,
  component,
  line_length,
  beta,
  startImaginary,
  startReal,
  impedanceResolution,
  startAdmittance,
) {
  var tan_beta, zBottom_inv, zTop;
  for (var j = 0; j <= resolution; j++) {
    tan_beta = Math.tan((beta * j * line_length) / resolution);
    if (component.name == "transmissionLine") {
      zBottom_inv = one_over_complex(
        component.zo - startImaginary * tan_beta,
        startReal * tan_beta,
      );
      zTop = {
        real: startReal * component.zo,
        imaginary:
          startImaginary * component.zo +
          tan_beta * component.zo * component.zo,
      };
      impedanceResolution.push({
        real:
          zTop.real * zBottom_inv.real - zTop.imaginary * zBottom_inv.imaginary,
        imaginary:
          zTop.real * zBottom_inv.imaginary + zTop.imaginary * zBottom_inv.real,
      });
    } else if (component.name == "stub" || component.name == "shortedStub") {
      startAdmittance = one_over_complex(startReal, startImaginary);
      impedanceResolution.push(
        one_over_complex(
          startAdmittance.real,
          startAdmittance.imaginary + tan_beta / component.zo,
        ),
      );
    }
  }
}

function calculateImpedance(userCircuit, frequency, resolution) {
  var startReal, startImaginary, startAdmittance, endImpedance;
  var newAdmittance = {};
  var newImpedance = {};
  var impedanceResolution = [];
  var component;
  var prevResult;
  var esr, esl;
  var impedanceResults = [
    [{ real: userCircuit[0].real, imaginary: userCircuit[0].imaginary }],
  ];
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

    if (
      component.name === "shortedCap" ||
      component.name === "shortedInd" ||
      component.name === "shortedRes"
    ) {
      //this impedance is in parallel with the existing impedance
      //expanding the equation 1/((1/z1) + (1/z2)). To plot the arc we sweep the ADMITTANCE (1/z) from 0 -> value

      startAdmittance = one_over_complex(startReal, startImaginary);
      if (component.name === "shortedInd")
        newAdmittance = one_over_complex(
          esr,
          w * component.value * unitConverter[component.unit],
        );
      else if (component.name === "shortedCap")
        newAdmittance = one_over_complex(
          esr,
          w * esl * ESLUnit -
            1 / (w * component.value * unitConverter[component.unit]),
        );
      else if (component.name === "shortedRes")
        newAdmittance = one_over_complex(
          component.value * unitConverter[component.unit],
          w * esl * ESLUnit,
        );

      for (j = 0; j <= resolution; j++) {
        impedanceResolution.push(
          one_over_complex(
            startAdmittance.real + (newAdmittance.real * j) / resolution,
            startAdmittance.imaginary +
              (newAdmittance.imaginary * j) / resolution,
          ),
        );
      }
    } else if (
      component.name === "seriesCap" ||
      component.name === "seriesInd" ||
      component.name === "seriesRes" ||
      component.name === "seriesRlc"
    ) {
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
          (1 -
            w *
              w *
              component.value_l *
              unitConverter[component.unit_l] *
              component.value_c *
              unitConverter[component.unit_c]);
        newImpedance = one_over_complex(
          1 / (component.value * unitConverter[component.unit]),
          -1 / zj,
        );
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
    } else if (
      component.name == "transmissionLine" ||
      component.name == "stub" ||
      component.name == "shortedStub"
    ) {
      // the equation for impedance after adding a transmission line is
      // Z = Zo * (Zl + jZo*tan(bl)) / (Zo + jZltan(bl))
      // where b = 2 * PI / lambda
      // var beta = (w * Math.sqrt(component.eeff)) / speedOfLight; //move eeff multiplaction outside of beta
      var beta = w / speedOfLight;
      var line_length;
      var lengthLambda;

      //convert length into lambdas
      lengthLambda = component.value;
      if (component.unit != "λ")
        lengthLambda =
          (component.value * unitConverter[component.unit] * frequency) /
          speedOfLight;
      if (component.name == "shortedStub") lengthLambda += 0.25; //shorted stub is like a stub with an additional quater wavelength
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
      calculateTlineZ(
        resolution,
        component,
        line_length,
        beta,
        startImaginary,
        startReal,
        impedanceResolution,
        startAdmittance,
      );
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
          imaginary: startImaginary + (l1w * j) / resolution,
        };
        //Lm
        newStartAdmittance = one_over_complex(i1z.real, i1z.imaginary);
        i2z = one_over_complex(
          newStartAdmittance.real,
          newStartAdmittance.imaginary - ((1 / lmw) * j) / resolution,
        );
        //L2
        impedanceResolution.push({
          real: i2z.real,
          imaginary: i2z.imaginary + (l2w * j) / resolution,
        });
      }
    } else if (component.name == "custom") {
      newImpedance = CustomZAtFrequency(
        component.value,
        frequency,
        component.interpolation,
      );
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
            copyCircuit[j][i][value] =
              copyCircuit[j][i][value] *
              (1 + copyCircuit[j][i].tolerance / 100);
            newCircuit[j][i][value] =
              newCircuit[j][i][value] * (1 - copyCircuit[j][i].tolerance / 100);
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
    if (circuit[i].slider)
      circuit[i].value = circuit[i].value * (1 + circuit[i].slider / 100);
    if (circuit[i].slider_im)
      circuit[i].imaginary =
        circuit[i].imaginary * (1 + circuit[i].slider_im / 100);
    if (circuit[i].slider_re)
      circuit[i].real = circuit[i].real * (1 + circuit[i].slider_re / 100);
  }
  return circuit;
}

//convert length to meters now so when we calculate impedance across the span frequencies we use the same length
function convertLengthToM(circuit, frequency) {
  for (var i = 0; i < circuit.length; i++) {
    if (circuit[i].unit == "λ") {
      const metricLength =
        (circuit[i].value * speedOfLight) /
        frequency /
        Math.sqrt(circuit[i].eeff);
      circuit[i].value = metricLength;
      circuit[i].unit = "m";
    }
  }
  return circuit;
}

function App() {
  const [userCircuit, setUserCircuit] = useState(defaultCircuit);

  const [settings, setSettings] = useState(stateInURL);
  const [urlSnackbar, setUrlSnackbar] = useState(false);

  syncObjectToUrl(settings, initialState, userCircuit, initialCircuit); // Sync the settings object to the URL

  var impedanceResults = [];
  var spanResults = [];
  var spanFrequencies = [];
  const numericalFrequency =
    settings.frequency * unitConverter[settings.frequencyUnit];
  const numericalFspan = settings.fSpan * unitConverter[settings.fSpanUnit];
  const spanStep = numericalFspan / 10;
  var i;

  for (i = -10; i <= 10; i++)
    spanFrequencies.push(
      (numericalFrequency + i * spanStep) /
        unitConverter[settings.frequencyUnit],
    );

  var userCircuitWithSliders = applySliders(
    JSON.parse(JSON.stringify(userCircuit)),
  );
  var userCircuitNoLambda = convertLengthToM(
    userCircuitWithSliders,
    numericalFrequency,
  );
  var circuitArray = createToleranceArray([userCircuitNoLambda]);
  for (const z of circuitArray)
    impedanceResults.push(
      calculateImpedance(z, numericalFrequency, resolution),
    );
  const noToleranceResult = impedanceResults[impedanceResults.length - 1];
  const finalDp = noToleranceResult[noToleranceResult.length - 1];

  //for frequency span, don't create arcs, just create the final impedances
  if (numericalFspan > 0) {
    var f, span_tol, span_tol_final;
    for (const z of circuitArray) {
      spanResults.push([]);
      for (i = -10; i <= 10; i++) {
        f = numericalFrequency + i * spanStep;
        span_tol = calculateImpedance(z, f, 2);
        span_tol_final = span_tol[span_tol.length - 1];
        spanResults[spanResults.length - 1].push(
          span_tol_final[span_tol_final.length - 1],
        );
      }
    }
  }

  const processedImpedanceResults = processImpedance(
    finalDp[finalDp.length - 1],
    settings.zo,
  );

  const handleSnackbarClick = () => {
    setSettings({ ...initialState });
    setUserCircuit([{ ...initialCircuit[0] }]);
    setUrlSnackbar(false);
  };

  function LetUserKnowAboutURL() {
    return (
      <Snackbar
        open={urlSnackbar}
        autoHideDuration={10000}
        onClose={() => setUrlSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        message="This Snackbar will be dismissed in 5 seconds."
      >
        <SnackbarContent
          message="Some settings were loaded from the URL. Please click here to reset to the default state."
          sx={{
            backgroundColor: "#2196f3",
            color: "#fff",
            cursor: "pointer", // Indicate clickable
            maxWidth: 200,
          }}
          onClick={handleSnackbarClick}
        />
      </Snackbar>
    );
  }

  //open the snackbar after 1 seconds if there is state in the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlContainsState) {
        setUrlSnackbar(true);
      }
    }, 1000); // 1 seconds
    // Optional: Clean up the timer if the component unmounts early
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LetUserKnowAboutURL />
      <NavBar />
      <Typography sx={{ color: "rgb(37, 50, 64)", mx: 3, mt: 1 }}>
        Smith charts can help you design matching networks and obtain maximum
        power transfer between your source and load
      </Typography>
      <Box sx={{ flexGrow: 1, mx: { xs: 0, sm: 1, lg: 2 }, mt: 1 }}>
        <Grid container spacing={{ lg: 2, xs: 1 }}>
          <Grid size={{ sm: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Circuit
                  userCircuit={userCircuit}
                  setUserCircuit={setUserCircuit}
                  frequency={numericalFrequency}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
            <Card sx={{ padding: 0 }}>
              <CardContent sx={{ textAlign: "center", padding: 0 }}>
                <Graph
                  impedanceResults={impedanceResults}
                  zo={settings.zo}
                  spanResults={spanResults}
                  qCircles={settings.qCircles}
                  vswrCircles={settings.vswrCircles}
                  nfCircles={settings.nfCircles}
                  zMarkers={settings.zMarkers}
                  reflection_real={processedImpedanceResults.refReal}
                  reflection_imag={processedImpedanceResults.refImag}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 5, md: 6 }}>
            <Card>
              <CardContent>
                <Results
                  zProc={processedImpedanceResults}
                  spanFrequencies={spanFrequencies}
                  spanResults={spanResults[spanResults.length - 1]}
                  freqUnit={settings.frequencyUnit}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 7, md: 6 }}>
            <Card>
              <CardContent>
                <Settings settings={settings} setSettings={setSettings} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography>Let me know of any issues or requests!</Typography>
                {!import.meta.env.DEV && (
                  <Comments website-id="12282" page-id="/smith_chart/" />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
