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
import { unitConverter, theme, processImpedance, polarToRectangular, reflToZ, rectangularToPolar, zToRefl } from "./commonFunctions.js";
import { circuitComponents } from "./circuitComponents.js";

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

  //get index of sparam in userCircuit
  // const sParametersSearch = userCircuit.filter((c) => c.name === "sparam");
  const sParamIndex = userCircuit.findIndex((c) => c.name === "sparam");
  const s2pIndex = userCircuit.findIndex((c) => c.type === "s2p");
  const s1pIndex = userCircuit.findIndex((c) => c.type === "s1p");
  const RefIn = [];
  var zResultsLoad = [];
  var spanFrequencies = [];
  const numericalFrequencyTemp = settings.frequency * unitConverter[settings.frequencyUnit];
  var numericalFrequency = numericalFrequencyTemp
  //frequency must be one of the numbers in sparam
  if (sParamIndex !== -1) {
    const allF = Object.keys(userCircuit[sParamIndex].value.data);
    numericalFrequency = allF[allF.length - 1];
    for (const f in userCircuit[sParamIndex].value.data) {
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
    userCircuitNoLambda[sParamIndex].value.data = sParamFrequencyRange(
      userCircuitNoLambda[sParamIndex].value.data,
      numericalFrequency - numericalFspan,
      numericalFrequency + numericalFspan
    );
  }
  console.log("frange", numericalFrequency - numericalFspan, numericalFrequency + numericalFspan);
  const sParameters = sParamIndex===-1 ? null : userCircuitNoLambda[sParamIndex].value;

  
  //   sParameters = { ...userCircuit[sParamIndex].value };
  //   sParameters.data = sParamFrequencyRange([...sParameters.data], numericalFrequency - numericalFspan, numericalFrequency + numericalFspan);
  // }

    //   sParameters.data = sParamFrequencyRange([...sParameters.data], numericalFrequency - numericalFspan, numericalFrequency + numericalFspan);


  // console.log("userCircuit", userCircuit);


  const chosenSparameter = (sParamIndex === -1) ? null : {...userCircuitNoLambda[sParamIndex].value.data[numericalFrequency], zo:userCircuitNoLambda[sParamIndex].value.settings.zo};
  var finalZ, finalDp;
  console.log('chosenSparameter', chosenSparameter)

  if (sParamIndex !== -1) spanFrequencies = Object.keys(userCircuitNoLambda[sParamIndex].value.data);//.map((x) => x.frequency);
  else if (settings.fSpan > 0)
    for (i = -10; i <= 10; i++) spanFrequencies.push((numericalFrequency + i * spanStep) / unitConverter[settings.frequencyUnit]);
  // console.log("spanFrequencies", spanFrequencies);

  // console.log("sParametersSearch", sParametersSearch, "s2pIndex", s2pIndex);

  // if (sParametersSearch.length != 0 && Object.hasOwn(sParametersSearch[0], "value")) {
  //   sParameters = { ...sParametersSearch[0].value };
  //   sParameters.data = sParamFrequencyRange([...sParameters.data], numericalFrequency - numericalFspan, numericalFrequency + numericalFspan);
  //   for (const point of sParameters.data) {
  //     if (point.frequency >= numericalFrequency) {
  //       chosenSparameter = point;
  //       chosenSparameter.zo = sParameters.settings.zo;
  //       break;
  //     }
  //   }
  // }

  // //no span, yes to tolerance - fixme - add tolerance later?
  // if (sParametersSearch.length != 0 && Object.hasOwn(sParametersSearch[0], "value")) {
  //   sParameters = { ...sParametersSearch[0].value };
  //   sParameters.data = sParamFrequencyRange([...sParameters.data], numericalFrequency - numericalFspan, numericalFrequency + numericalFspan);
  //   const sParamZ = [...userCircuitNoLambda].reverse();
  //   sParamZ.pop(); //remove the blackbox
  //   sParameters.matched = [];
  //   var finalZ, finalDp ;
  //   //1 - convert s11 to z at frequency
  //   var z;
  //   for (const point of sParameters.data) {
  //     const s11 = polarToRectangular(point.S11);
  //     z = reflToZ(s11, sParameters.settings.zo);
  //     //2 - loop thru circuit array backwards to add impedances
  //     sParamZ[0] = z;
  //     const SystemZ = calculateImpedance(sParamZ, numericalFrequency, resolution);
  //     const lastZ = SystemZ[SystemZ.length - 1];
  //     const pointZ = lastZ[lastZ.length - 1];
  //     if (point.frequency >= numericalFrequency && zResultsSrc.length === 0) {
  //       zResultsSrc.push(SystemZ);
  //       chosenSparameter = point;
  //       chosenSparameter.zo = sParameters.settings.zo;
  //     }
  //     sParameters.matched.push({
  //       ...point,
  //       S11: rectangularToPolar(zToRefl(pointZ, userCircuitNoLambda[0])),
  //     });
  //   }
  //    finalDp = zResultsSrc[zResultsSrc.length - 1];
  //    if (finalDp && finalDp.length > 0) {
  //   finalZ = finalDp[finalDp.length - 1];
  //   } else {
  //     console.error("Error calculating S11 to Z conversion");
  //     //create a dummy object to avoid crashing
  //     finalZ = { real: 0, imaginary: 0 };
  //   }
  // } else {

  //if there's a s2p block then create 2 impedance arcs
  // console.log("userCircuitNoLambda", userCircuitNoLambda, numericalFrequency)
  const multiZCircuits =
    s2pIndex === -1 ? [userCircuitNoLambda] : [userCircuitNoLambda.slice(0, s2pIndex), [...userCircuitNoLambda.slice(s2pIndex + 1)].reverse()];
  // console.log("userCircuitNoLambda", userCircuitNoLambda);
  // console.log("multiZCircuits", multiZCircuits);
  const multiZResults = [];
  for (var c of multiZCircuits) {
    var zResultsSrc = [];
    if (s1pIndex !== -1) {
      console.log("aqui")
      if (c.length == 2) c = [c[0]];  //if just bbox and sparam, don't plot anything
      else {
      const cReversed = [...c].reverse();
      cReversed.pop(); //remove the blackbox
      //1 - convert s11 to z at frequency // FIXME - got here
      // const s11r = polarToRectangular(userCircuitNoLambda[s1pIndex].value.data[numericalFrequency].S11);
      // cReversed[0] = reflToZ(s11r, userCircuitNoLambda[s1pIndex].value.settings.zo);
      c = cReversed;
      }
      // console.log('crev', JSON.parse(JSON.stringify(c)))
  //   var z;
  //   for (const point of sParameters.data) {
  //     
  //     z = reflToZ(s11, sParameters.settings.zo);
    }

    var circuitArray = createToleranceArray([c]);
    for (const z of circuitArray) zResultsSrc.push(calculateImpedance(z, numericalFrequency, resolution));
    const noToleranceResult = zResultsSrc[zResultsSrc.length - 1];
    finalDp = noToleranceResult[noToleranceResult.length - 1];
    finalZ = finalDp[finalDp.length - 1];
    // console.log("finalZ", processImpedance(finalZ, settings.zo)); //Fixme - swap zo for bbox impedance

    //for frequency span, don't create arcs, just create the final impedances
    var spanResults = [];

    if (numericalFspan > 0) {
      //   var f;
      for (const c of circuitArray) {
        // spanResults.push([]);
        const fRes = {};
        const RefInVsF = {};
        for (const f of spanFrequencies) {
          // f = numericalFrequency + i * spanStep;
          const z = impedanceAtFrequency(c, f);
          const p = processImpedance(z, settings.zo); //FIXME - we need to process or we just need reflection?
          fRes[f] = { z, refl: { real: p.refReal, imaginary: p.refImag } };
          if (s1pIndex !== -1) RefInVsF[f] = rectangularToPolar(zToRefl(z, userCircuitNoLambda[0])); //userCircuitNoLambda[0] is the termination - FIXME - make a const for that? src termination?
          // spanResults[spanResults.length - 1].push({z, processed: processImpedance(z, settings.zo)});
        }
        spanResults.push(fRes);
        if (s1pIndex !== -1) RefIn.push(RefInVsF)
      }
    }
    multiZResults.push({ arcs: zResultsSrc, ZvsF: spanResults });
  }
  // console.log("RefIn", RefIn);
  // console.log("circuitArray", circuitArray);
  // console.log("userCircuitNoLambda", userCircuitNoLambda[0]);

  //if its s2p then create the gain results
  const gainResults = {};
  if (s2pIndex !== -1) {
    for (const f in userCircuitNoLambda[s2pIndex].value.data) {
      const p = userCircuitNoLambda[s2pIndex].value.data[f];
      if (multiZResults[0].ZvsF[0][p.frequency]) {  //fixme - this is avoiding a crash that should never happen
      const gain =
        subEq(multiZResults[0].ZvsF[0][p.frequency].refl, polarToRectangular(p.S11)) *
        subEq(multiZResults[1].ZvsF[0][p.frequency].refl, polarToRectangular(p.S22)) *
        p.S21.magnitude ** 2;
      gainResults[f] = gain;
      } else  gainResults[f] = 0;
    }
    // subEq
  } else if (s1pIndex !== -1) {
    // // console.log("s1pIndex", multiZResults, userCircuit[s1pIndex].value.data);
    // for (const p of userCircuitNoLambda[s1pIndex].value.data) {
    //   const gain = subEq(multiZResults[0].ZvsF[0][p.frequency].refl, polarToRectangular(p.S11));
    //   gainResults[p.frequency] = gain;
    // }
  }
  // console.log("gainResults", gainResults);
  // }

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
                setPlotType={setPlotType}
                sParameters={sParameters}
                chosenSparameter={chosenSparameter}
              />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 5, md: 6 }}>
            <Card>
              <CardContent>
                <ToggleButtonGroup value={plotType} exclusive onChange={(e, newP) => setPlotType(newP)}>
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
                  gainResults={gainResults}
                  RefIn={RefIn}
                /> 
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 7, md: 6 }}>
            <Card>
              <CardContent>
                <Settings settings={settings} setSettings={setSettings} usedF={numericalFrequency} />
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
