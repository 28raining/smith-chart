/* global gtag */
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

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
import Equations from "./Equations.jsx";
import ReleaseNotes from "./ReleaseNotes.jsx";
import { Comments } from "@hyvor/hyvor-talk-react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import { syncObjectToUrl, updateObjectFromUrl } from "./urlFunctions.js"; // Import the syncObjectToUrl function
import { unitConverter, theme, processImpedance, polarToRectangular, rectangularToPolar, zToRefl } from "./commonFunctions.js";
import { circuitComponents } from "./circuitComponents.js";

import { calculateImpedance, createToleranceArray, applySliders, convertLengthToM } from "./impedanceFunctions.js";
import { sParamFrequencyRange } from "./sparam.js"; // Import the sParamFrequencyRange function

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
  gainInCircles: [],
  gainOutCircles: [],
};

//mini part of gain equation which is duplicated
// (1 - |Rs|^2) / (|1 - S11Rs|^2)
function subEq(Rs, S11) {
  const numerator = 1 - Rs.real ** 2 - Rs.imaginary ** 2;
  const denominator = (1 - S11.real * Rs.real + S11.imaginary * Rs.imaginary) ** 2 + (S11.imaginary * Rs.real + S11.real * Rs.imaginary) ** 2;
  return numerator / denominator;
}

const initialCircuit = [{ name: "blackBox", ...circuitComponents.blackBox.default }];

var [stateInURL, defaultCircuit, urlContainsState] = updateObjectFromUrl(initialState, initialCircuit);
for (const c of defaultCircuit)
  if (c.name === "sparam")
    alert(
      "You're loading a circuit containing s-parameters. Because URL's have a 4k character limit and sparameter files are very big, the sparameter data was not saved (dummy data is used instead). Please manually re-enter s-param data.",
    );

//calculate impedance at a specific frequency
function impedanceAtFrequency(circuit, frequency) {
  const span_tol = calculateImpedance(circuit, frequency, 2);
  const span_tol_final = span_tol[span_tol.length - 1];
  return span_tol_final[span_tol_final.length - 1];
}

function App() {
  const [userCircuit, setUserCircuit] = useState(defaultCircuit);

  const [settings, setSettings] = useState(stateInURL);
  const [urlSnackbar, setUrlSnackbar] = useState(false);
  const [plotType, setPlotType] = useState("impedance");

  syncObjectToUrl(settings, initialState, userCircuit, initialCircuit); // Sync the settings object to the URL

  //get index of sparam in userCircuit
  // const sParametersSearch = userCircuit.filter((c) => c.name === "sparam");
  const sParamIndex = userCircuit.findIndex((c) => c.name === "sparam");
  const s2pIndex = userCircuit.findIndex((c) => c.type === "s2p");
  const s1pIndex = userCircuit.findIndex((c) => c.type === "s1p");
  const RefIn = [];
  var spanFrequencies = [];
  const numericalFrequencyTemp = settings.frequency * unitConverter[settings.frequencyUnit];
  var numericalFrequency = numericalFrequencyTemp;
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
  }

  const numericalFspan = settings.fSpan * unitConverter[settings.fSpanUnit];
  const spanStep = numericalFspan / 10;
  var i;

  var userCircuitWithSliders = applySliders(JSON.parse(JSON.stringify(userCircuit)));
  var userCircuitNoLambda = convertLengthToM(userCircuitWithSliders, numericalFrequency);

  //reduce s-param data to the frequency range of interest
  if (sParamIndex !== -1) {
    userCircuitNoLambda[sParamIndex].data = sParamFrequencyRange(
      userCircuitNoLambda[sParamIndex].data,
      numericalFrequency - numericalFspan,
      numericalFrequency + numericalFspan,
    );
  }
  const sParameters = sParamIndex === -1 ? null : userCircuitNoLambda[sParamIndex];

  const chosenSparameter =
    sParamIndex === -1 ? null : { ...userCircuitNoLambda[sParamIndex].data[numericalFrequency], zo: userCircuitNoLambda[sParamIndex].settings.zo };
  var finalZ, finalDp;

  if (sParamIndex !== -1)
    spanFrequencies = Object.keys(userCircuitNoLambda[sParamIndex].data); //.map((x) => x.frequency);
  else if (settings.fSpan > 0) for (i = -10; i <= 10; i++) spanFrequencies.push(numericalFrequency + i * spanStep);

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
    for (const z of circuitArray) zResultsSrc.push(calculateImpedance(z, numericalFrequency, resolution));
    const noToleranceResult = zResultsSrc[zResultsSrc.length - 1];
    finalDp = noToleranceResult[noToleranceResult.length - 1];
    finalZ = finalDp[finalDp.length - 1];

    //for frequency span, don't create arcs, just create the final impedances
    var spanResults = [];

    if (numericalFspan > 0) {
      for (const c of circuitArray) {
        const fRes = {};
        const RefInVsF = {};
        for (const f of spanFrequencies) {
          const z = impedanceAtFrequency(c, f);
          fRes[f] = { z };
          if (sParamIndex !== -1) fRes[f].reflAtSZo = zToRefl(z, { real: userCircuitNoLambda[sParamIndex].settings.zo, imaginary: 0 });
          if (s1pIndex !== -1) RefInVsF[f] = rectangularToPolar(zToRefl(z, userCircuitNoLambda[0])); //userCircuitNoLambda[0] is the termination
        }
        spanResults.push(fRes);
        if (s1pIndex !== -1) RefIn.push(RefInVsF);
      }
    }
    multiZResults.push({ arcs: zResultsSrc, ZvsF: spanResults });
  }

  //if its s2p then create the gain results. Must do this after the multiZResults are created
  const gainArray = [];
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
  }

  // converts real and imaginary into Q, VSWR, reflection coeff, etc
  const processedImpedanceResults = processImpedance(finalZ, settings.zo);

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
        Smith charts can help you design matching networks and obtain maximum power transfer between your source and load
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
                  setPlotType={setPlotType}
                  setSettings={setSettings}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
            <Card sx={{ padding: 0 }}>
              <Graph
                zResultsSrc={multiZResults}
                zo={settings.zo}
                spanResults={spanResults}
                qCircles={settings.qCircles}
                vswrCircles={settings.vswrCircles}
                nfCircles={settings.nfCircles}
                gainInCircles={settings.gainInCircles}
                gainOutCircles={settings.gainOutCircles}
                zMarkers={settings.zMarkers}
                reflection_real={processedImpedanceResults.refReal}
                reflection_imag={processedImpedanceResults.refImag}
                plotType={plotType}
                sParameters={sParameters}
                chosenSparameter={chosenSparameter}
                freqUnit={settings.frequencyUnit}
                frequency={numericalFrequency}
              />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 5, md: 6 }}>
            <Card>
              <CardContent>
                {sParamIndex !== -1 && (
                  <Box display="flex" justifyContent="center" sx={{ mb: 2 }}>
                    <ToggleButtonGroup value={plotType} exclusive onChange={(e, newP) => setPlotType(newP)}>
                      <ToggleButton value="sparam">Plot Raw S-Parameter Data</ToggleButton>
                      <ToggleButton value="impedance">
                        {s1pIndex !== -1 ? "Plot Reflection Coefficient Looking Into DP1" : "Plot System Gain"}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
                <Results
                  zProc={processedImpedanceResults}
                  spanFrequencies={spanFrequencies}
                  spanResults={spanResults[spanResults.length - 1]}
                  freqUnit={settings.frequencyUnit}
                  plotType={plotType}
                  sParameters={sParameters}
                  gainResults={gainArray}
                  RefIn={RefIn}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 7, md: 6 }}>
            <Card>
              <CardContent>
                <Settings settings={settings} setSettings={setSettings} usedF={numericalFrequency} chosenSparameter={chosenSparameter} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Equations />
          </Grid>
          <Grid size={12}>
            <ReleaseNotes />
          </Grid>
          <Grid size={12}>
            <Card>
              <CardContent>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Comment section below</Typography>
                  <Link
                    href="https://www.microwave-master.com/contact-us/"
                    onClick={() => gtag("event", "click_microwave_maser")}
                    target="_blank"
                    color="inherit"
                  >
                    Get professional support from Microwave Master here
                  </Link>
                </div>
                {!import.meta.env.DEV && <Comments website-id="12282" page-id="/smith_chart/" />}
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
