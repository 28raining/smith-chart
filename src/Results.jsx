import { Grid, Typography, Box } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import "uplot/dist/uPlot.min.css";
import UplotReact from "uplot-react";
import { useState, useRef, useEffect } from "react";

import { processImpedance, zToPolar } from "./commonFunctions";

function ImpedanceRes({ type, zStr, zPolarStr }) {
  return (
    <>
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: 1,
          width: { xl: "155px", sm: "default" },
          backgroundColor: "rgb(37, 50, 64)",
          color: "white",
        }}
      >
        <Typography variant="body1">{type}</Typography>
      </Box>
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: 1,
          flex: 1,
        }}
      >
        <Typography variant="body1">{zStr}</Typography>
      </Box>
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: 1,
          flex: 1,
        }}
      >
        <Typography variant="body1">{zPolarStr}</Typography>
      </Box>
    </>
  );
}

function MiniRes({ type, res }) {
  return (
    <>
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: 1,
          width: "65px",
          backgroundColor: "rgb(37, 50, 64)",
          color: "white",
        }}
      >
        <Typography variant="body1">{type}</Typography>
      </Box>
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: 1,
          mr: 0.5,
          flex: 1,
        }}
      >
        <Typography variant="body1">{res}</Typography>
      </Box>
    </>
  );
}

const optionsInit = {
  height: 300,
  series: [
    { label: "Frequency" }, // x
    {
      label: "| S11 | (dB)",
      stroke: "blue",
      width: 2,
      scale: "y",
    },
    {
      label: "∠ S11 (°)",
      stroke: "red",
      width: 2,
      scale: "y2", // assign to second y axis
    },
  ],
  axes: [
    { label: "Frequency" },
    {
      // left y-axis
      scale: "y",
      label: "|S11| (dB)",
    },
    {
      // right y-axis
      scale: "y2",
      side: 1, // right side
      label: "∠S11 (°)",
    },
  ],
  scales: {
    x: { time: false },
    y: { auto: true },
    y2: { auto: true }, // independent scale for right axis
  },
};

const options2Init = {
  height: 300,
  series: [
    { label: "Frequency" }, // x
    {
      label: "| S21 | (dB)",
      stroke: "green",
      width: 2,
      scale: "y",
    },
  ],
  axes: [
    { label: "Frequency" },
    {
      // left y-axis
      scale: "y",
      label: "|S21| (dB)",
    },
  ],
  scales: {
    x: { time: false },
    y: { auto: true },
  },
};

function renderChart(setOptions, setOptions2, containerRef, freqUnit) {
  setOptions((o) => {
    return {
      ...o,
      width: containerRef.current.offsetWidth,
      series: o.series.map((s, i) => {
        if (i === 0) return { ...s, label: `Frequency (${freqUnit})` };
        return s;
      }),
      axes: o.axes.map((a, i) => {
        if (i === 0) return { ...a, label: `Frequency (${freqUnit})` };
        return a;
      }),
    };
  });
  setOptions2((o) => {
    return {
      ...o,
      width: containerRef.current.offsetWidth,
      series: o.series.map((s, i) => {
        if (i === 0) return { ...s, label: `Frequency (${freqUnit})` };
        return s;
      }),
      axes: o.axes.map((a, i) => {
        if (i === 0) return { ...a, label: `Frequency (${freqUnit})` };
        return a;
      }),
    };
  });
}

export default function Results({ zProc, spanFrequencies, spanResults, freqUnit }) {
  const { zStr, zPolarStr, refStr, refPolarStr, vswr, qFactor } = zProc;
  const containerRef = useRef();
  const [options, setOptions] = useState(optionsInit);
  const [options2, setOptions2] = useState(options2Init);

  var s11 = [];
  var s11_ang = [];
  var s21 = [];
  if (spanResults) {
    for (const s of spanResults) {
      const { refReal, refImag } = processImpedance(s, 50);
      const { magnitude, angle } = zToPolar({
        real: refReal,
        imaginary: refImag,
      });

      s11.push(20 * Math.log10(magnitude));
      s11_ang.push(angle);
      s21.push(20 * Math.log10(Math.sqrt(1 - magnitude ** 2)));
    }
  }
  const data = [spanFrequencies, s11, s11_ang];
  const data2 = [spanFrequencies, s21];

  useEffect(() => {
    function handleResize() {
      renderChart(setOptions, setOptions2, containerRef, freqUnit);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [freqUnit]);
  return (
    <>
      <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
        Final Results
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 9 }} sx={{ display: "flex" }}>
          <ImpedanceRes type="Impedance (Ω)" zStr={zStr} zPolarStr={zPolarStr} />
        </Grid>
        <Tooltip title="Voltage Standing Wave Ratio" arrow placement="top">
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }} sx={{ display: "flex" }}>
            <MiniRes type="VSWR" res={vswr} />
          </Grid>
        </Tooltip>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 9 }} sx={{ display: "flex" }}>
          <ImpedanceRes type="Reflection Coefficient" zStr={refStr} zPolarStr={refPolarStr} />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }} sx={{ display: "flex" }}>
          <MiniRes type="Q Factor" res={qFactor} />
        </Grid>
      </Grid>

      <div ref={containerRef} style={{ width: "100%", marginTop: "30px" }}>
        {!spanResults ? null : <UplotReact options={options} data={data} />}
        {!spanResults ? null : <UplotReact options={options2} data={data2} />}
      </div>
    </>
  );
}
