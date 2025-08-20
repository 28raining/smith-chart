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
import Tutorials from "./Tutorials.jsx";
import { Comments } from "@hyvor/hyvor-talk-react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import { syncObjectToUrl, updateObjectFromUrl } from "./urlFunctions.js"; // Import the syncObjectToUrl function
import { theme } from "./commonFunctions.js";
import { circuitComponents } from "./circuitComponents.js";

import { allImpedanceCalculations } from "./impedanceFunctions.js";
// import { sParamFrequencyRange } from "./sparam.js"; // Import the sParamFrequencyRange function

const initialState = {
  zo: 50,
  frequency: 2440,
  frequencyUnit: "MHz",
  fSpan: 0,
  fSpanUnit: "MHz",
  fRes: 10,
  zMarkers: [],
  vswrCircles: [],
  qCircles: [],
  nfCircles: [],
  gainInCircles: [],
  gainOutCircles: [],
};

const initialCircuit = [{ name: "blackBox", ...circuitComponents.blackBox.default }];

const params = new URLSearchParams(window.location.search);
var [stateInURL, defaultCircuit, urlContainsState] = updateObjectFromUrl(initialState, initialCircuit, params);
console.log("stateInURL", stateInURL, defaultCircuit, urlContainsState);

function App() {
  const [userCircuit, setUserCircuit] = useState(defaultCircuit);
  const [settings, setSettings] = useState(stateInURL);
  const [urlSnackbar, setUrlSnackbar] = useState(false);
  const [plotType, setPlotType] = useState("impedance");

  syncObjectToUrl(settings, initialState, userCircuit, initialCircuit); // Sync the settings object to the URL

  const [processedImpedanceResults, spanResults, multiZResults, gainArray, noiseArray, numericalFrequency, RefIn, noiseFrequency] =
    allImpedanceCalculations(userCircuit, settings);

  const sParamIndex = userCircuit.findIndex((c) => c.name === "sparam");
  const sParameters = sParamIndex === -1 ? null : userCircuit[sParamIndex];
  const s1pIndex = userCircuit.findIndex((c) => c.type === "s1p");
  const chosenSparameter =
    sParamIndex === -1 ? null : { ...userCircuit[sParamIndex].data[numericalFrequency], zo: userCircuit[sParamIndex].settings.zo };
  const chosenNoiseParameter = noiseFrequency === -1 ? null : userCircuit[sParamIndex].noise[noiseFrequency];
  // console.log("chosenNoiseParameter", chosenNoiseParameter);

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
        Smith charts can help you design matching networks and obtain maximum power transfer between your source and load. Plot s-parameters.
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
                chosenNoiseParameter={chosenNoiseParameter}
              />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <Card>
              <CardContent>
                {sParamIndex !== -1 && (
                  <Box display="flex" justifyContent="center" sx={{ mb: 2 }}>
                    <ToggleButtonGroup value={plotType} exclusive onChange={(e, newP) => setPlotType(newP)}>
                      <ToggleButton value="sparam">Plot Raw S-Parameter Data</ToggleButton>
                      <ToggleButton value="impedance">
                        {s1pIndex !== -1 ? "Plot Reflection Coefficient Looking Into DP1" : "Plot System Gain & Noise"}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
                <Results
                  zProc={processedImpedanceResults}
                  spanResults={spanResults[spanResults.length - 1]}
                  freqUnit={settings.frequencyUnit}
                  plotType={plotType}
                  sParameters={sParameters}
                  gainResults={gainArray}
                  noiseArray={noiseArray}
                  RefIn={RefIn}
                  zo={settings.zo}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <Card>
              <CardContent>
                <Settings
                  settings={settings}
                  setSettings={setSettings}
                  usedF={numericalFrequency}
                  chosenSparameter={chosenSparameter}
                  chosenNoiseParameter={chosenNoiseParameter}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Tutorials />
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
