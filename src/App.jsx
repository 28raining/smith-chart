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
import { unitConverter, theme, processImpedance, polarToRectangular, reflToZ, zToPolar, zToRefl } from "./commonFunctions.js";

import { calculateImpedance, createToleranceArray, applySliders, convertLengthToM } from "./impedanceFunctions.js";
import { sParamFrequencyRange, S11NotMatched } from "./sparam.js"; // Import the sParamFrequencyRange function

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
  gainCircles: [],
};

const initialCircuit = [{ name: "blackBox", real: 25, imaginary: -25 }];

var [stateInURL, defaultCircuit, urlContainsState] = updateObjectFromUrl(initialState, initialCircuit);

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

  // syncObjectToUrl(settings, initialState, userCircuit, initialCircuit); // Sync the settings object to the URL

  var impedanceResults = [];
  var spanResults = [];
  var spanFrequencies = [];
  const numericalFrequency = settings.frequency * unitConverter[settings.frequencyUnit];
  const numericalFspan = settings.fSpan * unitConverter[settings.fSpanUnit];
  const spanStep = numericalFspan / 10;
  var i;

  for (i = -10; i <= 10; i++) spanFrequencies.push((numericalFrequency + i * spanStep) / unitConverter[settings.frequencyUnit]);

  var userCircuitWithSliders = applySliders(JSON.parse(JSON.stringify(userCircuit)));
  var userCircuitNoLambda = convertLengthToM(userCircuitWithSliders, numericalFrequency);

  const sParametersSearch = userCircuit.filter((c) => c.name === "sparam");
  var sParameters = null;

  //no span, yes to tolerance - fixme - add tolerance later?
  if (sParametersSearch.length != 0 && Object.hasOwn(sParametersSearch[0], "value")) {
    sParameters = { ...sParametersSearch[0].value };
    sParameters.data = sParamFrequencyRange([...sParameters.data], numericalFrequency - numericalFspan, numericalFrequency + numericalFspan);
    const sParamZ = [...userCircuitNoLambda].reverse();
    sParamZ.pop(); //remove the blackbox
    sParameters.matched = [];
    var finalZ, finalDp ;

    //1 - convert s11 to z at frequency
    var z;
    for (const point of sParameters.data) {
      // if (point.frequency > numericalFrequency) {
      const s11 = polarToRectangular(point.S11);
      z = reflToZ(s11, sParameters.settings.zo);
      //   break;
      // }
      // }
      // if (!z) {
      //   console.error("Error calculating S11 to Z conversion");
      //   //create a dummy object to avoid crashing
      //   z = { real: 0, imaginary: 0 };
      // }
      //2 - loop thru circuit array backwards to add impedances
      sParamZ[0] = z;
      //remove last element (the blackbox)
      // console.log("sParamZ", sParamZ);
      // for (var i = sParamZ.length - 1; i >= 0; i--) {
      const SystemZ = calculateImpedance(sParamZ, numericalFrequency, resolution);
      const lastZ = SystemZ[SystemZ.length - 1];
      const pointZ = lastZ[lastZ.length - 1];
      // console.log("pointZ", pointZ);
      if (point.frequency > numericalFrequency && impedanceResults.length === 0) {
        impedanceResults.push(SystemZ);
      }
      // console.log("zzz", pointZ, userCircuitNoLambda[0], zToRefl(SystemZ, userCircuitNoLambda[0]))
      sParameters.matched.push({
        ...point,
        S11: zToPolar(zToRefl(pointZ, userCircuitNoLambda[0])),
      });
    }
     finalDp = impedanceResults[impedanceResults.length - 1];
     if (finalDp && finalDp.length > 0) {
    finalZ = finalDp[finalDp.length - 1];
    } else {
      console.error("Error calculating S11 to Z conversion");
      //create a dummy object to avoid crashing
      finalZ = { real: 0, imaginary: 0 };
    }
    // console.log("sParameters", sParameters);
    // sParameters.matched = sParameters.data.map((d) => {
    //   return S11NotMatched(d, sParameters.settings.zo, impedanceAtFrequency(circuitArray[circuitArray.length - 1], d.frequency));
    // });
  } else {
    var circuitArray = createToleranceArray([userCircuitNoLambda]);
    for (const z of circuitArray) impedanceResults.push(calculateImpedance(z, numericalFrequency, resolution));
    const noToleranceResult = impedanceResults[impedanceResults.length - 1];
     finalDp = noToleranceResult[noToleranceResult.length - 1];
    finalZ = finalDp[finalDp.length - 1];

    //for frequency span, don't create arcs, just create the final impedances
    if (numericalFspan > 0) {
      var f, span_tol, span_tol_final;
      for (const z of circuitArray) {
        spanResults.push([]);
        for (i = -10; i <= 10; i++) {
          f = numericalFrequency + i * spanStep;
          // span_tol = calculateImpedance(z, f, 2);
          // span_tol_final = span_tol[span_tol.length - 1];
          spanResults[spanResults.length - 1].push(impedanceAtFrequency(z, f));
        }
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
                impedanceResults={impedanceResults}
                zo={settings.zo}
                spanResults={spanResults}
                qCircles={settings.qCircles}
                vswrCircles={settings.vswrCircles}
                nfCircles={settings.nfCircles}
                gainCircles={settings.gainCircles}
                zMarkers={settings.zMarkers}
                reflection_real={processedImpedanceResults.refReal}
                reflection_imag={processedImpedanceResults.refImag}
                plotType={plotType}
                setPlotType={setPlotType}
                sParameters={sParameters}
              />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 5, md: 6 }}>
            <Card>
              <CardContent>
                        <ToggleButtonGroup
          value={plotType}
          exclusive
          onChange={(e, newP) => setPlotType(newP)}
        >
          <ToggleButton value="sparam">S-Param</ToggleButton>
          <ToggleButton value="impedance">Impedance</ToggleButton>
        </ToggleButtonGroup>
                <Results
                  zProc={processedImpedanceResults}
                  spanFrequencies={spanFrequencies}
                  spanResults={spanResults[spanResults.length - 1]}
                  freqUnit={settings.frequencyUnit}
                  plotType={plotType}
                  sParameters={sParameters}
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
