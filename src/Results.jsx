import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import "uplot/dist/uPlot.min.css";
import UplotReact from "uplot-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { processImpedance, rectangularToPolar, unitConverter } from "./commonFunctions";

function ImpedanceRes({ type, zStr, zPolarStr }) {
  return (
    <>
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: 1,
          width: "155px",
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

const commonOptionsInit = {
  width: 500,
  height: 300,
  series: [
    { label: "Frequency (unit undefined)" }, // x
  ],
  axes: [
    { label: "Frequency (unit undefined)" }, // x
  ],
};

const optionsInit = {
  height: 300,
  series: [
    {
      label: "|S11| (dB)",
      stroke: "blue",
      width: 2,
      scale: "y",
    },
    {
      label: "∠S11 (°)",
      stroke: "red",
      width: 2,
      scale: "y2", // assign to second y axis
    },
  ],
  axes: [
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
  series: [
    {
      label: "|S21| (dB)",
      stroke: "green",
      width: 2,
      scale: "y",
    },
  ],
  axes: [
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

const optionsGainInit = {
  series: [],
  axes: [
    {
      // left y-axis
      scale: "y",
      label: "gain (dB)",
    },
  ],
  scales: {
    x: { time: false },
    y: { auto: true },
  },
};

// function renderChart(setOptions, setOptions2, containerRef, freqUnit) {
//   setOptions((o) => {
//     return {
//       ...o,
//       width: containerRef.current.offsetWidth,
//       series: o.series.map((s, i) => {
//         if (i === 0) return { ...s, label: `Frequency (${freqUnit})` };
//         return s;
//       }),
//       axes: o.axes.map((a, i) => {
//         if (i === 0) return { ...a, label: `Frequency (${freqUnit})` };
//         return a;
//       }),
//     };
//   });
//   setOptions2((o) => {
//     return {
//       ...o,
//       width: containerRef.current.offsetWidth,
//       series: o.series.map((s, i) => {
//         if (i === 0) return { ...s, label: `Frequency (${freqUnit})` };
//         return s;
//       }),
//       axes: o.axes.map((a, i) => {
//         if (i === 0) return { ...a, label: `Frequency (${freqUnit})` };
//         return a;
//       }),
//     };
//   });
// }

function renderChart_new(setCommon, containerRef, freqUnit, t) {
  const freqLabel = t("results.frequencyAxis", { unit: freqUnit });
  setCommon((o) => {
    return {
      ...o,
      width: containerRef.current.offsetWidth,
      series: o.series.map((s, i) => {
        if (i === 0) return { ...s, label: freqLabel };
        return s;
      }),
      axes: o.axes.map((a, i) => {
        if (i === 0) return { ...a, label: freqLabel };
        return a;
      }),
    };
  });
}

function localizedOptionsInit(t) {
  return {
    ...optionsInit,
    series: [
      { ...optionsInit.series[0], label: t("results.s11db") },
      { ...optionsInit.series[1], label: t("results.s11ang") },
    ],
    axes: [
      { ...optionsInit.axes[0], label: t("results.s11db") },
      { ...optionsInit.axes[1], label: t("results.s11ang") },
    ],
  };
}

function localizedOptions2Init(t) {
  return {
    ...options2Init,
    series: [{ ...options2Init.series[0], label: t("results.s21db") }],
    axes: [{ ...options2Init.axes[0], label: t("results.s21db") }],
  };
}

function localizedOptionsZInit(t) {
  return {
    axes: [
      { scale: "y", label: t("results.zMag") },
      { scale: "y2", side: 1, label: t("results.zAng") },
    ],
  };
}

function localizedOptionsGainInit(t) {
  return {
    ...optionsGainInit,
    axes: [{ ...optionsGainInit.axes[0], label: t("results.gainAxis") }],
  };
}

function SPlot({ sparametersData, options, freqUnit, title }) {
  const { t } = useTranslation();
  if (!sparametersData || sparametersData.length === 0) return null;
  return ["S11", "S12", "S21", "S22"].map((s) => {
    if (!(s in Object.values(sparametersData)[0])) return null;
    const sParamOpt = JSON.parse(JSON.stringify(options));
    sParamOpt.series[1].label = `| ${s} | (dB)`;
    sParamOpt.series[2].label = `∠ ${s} |(°)`;
    sParamOpt.axes[1].label = `| ${s} | (dB)`;
    sParamOpt.axes[2].label = `∠ ${s} |(°)`;
    const f = [];
    const m = [];
    const a = [];
    for (const fx in sparametersData) {
      f.push(fx / unitConverter[freqUnit]);
      m.push(20 * Math.log10(sparametersData[fx][s].magnitude));
      a.push(sparametersData[fx][s].angle);
    }
    const sData = [f, m, a];
    return (
      <div style={{ textAlign: "center" }} key={s}>
        <h5 style={{ marginTop: 15, marginBottom: 0 }}>
          {title}: {t("results.sMagPhase", { s })}
        </h5>
        <UplotReact options={sParamOpt} data={sData} />
      </div>
    );
  });
}
/** plotKind "z": |Z| (Ω) + ∠Z (°) from rectangularToPolar(z); "s11": |Γ| dB + phase via processImpedance; "s21": |S21| dB (|S11|²+|S21|²=1). */
function SpanTolerancePlot({ spanResultsByTol, options, freqUnit, zo, plotKind, legendY }) {
  const { t } = useTranslation();
  const dualY = plotKind === "s11" || plotKind === "z";
  if (!spanResultsByTol || spanResultsByTol.length === 0) return null;
  const nominal = spanResultsByTol[spanResultsByTol.length - 1];
  if (!nominal || Object.keys(nominal).length === 0) return null;
  const sParamOpt = JSON.parse(JSON.stringify(options));
  if (!dualY) {
    sParamOpt.axes[1].label = legendY;
  }
  const sortedFreq = Object.keys(nominal).sort((a, b) => a - b);
  const fAxis = sortedFreq.map((fx) => fx / unitConverter[freqUnit]);
  const seriesData = [];
  for (let i = 0; i < spanResultsByTol.length; i++) {
    const tolMap = spanResultsByTol[i];
    const magVals = [];
    const angVals = [];
    for (const fx of sortedFreq) {
      if (plotKind === "z") {
        const { magnitude, angle } = rectangularToPolar(tolMap[fx].z);
        magVals.push(magnitude);
        angVals.push(angle);
      } else if (plotKind === "s11") {
        const { refReal, refImag } = processImpedance(tolMap[fx].z, zo);
        const { magnitude, angle } = rectangularToPolar({ real: refReal, imaginary: refImag });
        magVals.push(20 * Math.log10(magnitude));
        angVals.push(angle);
      } else {
        const { refReal, refImag } = processImpedance(tolMap[fx].z, zo);
        const { magnitude } = rectangularToPolar({ real: refReal, imaginary: refImag });
        magVals.push(20 * Math.log10(Math.sqrt(1 - magnitude ** 2)));
      }
    }
    const last = i === spanResultsByTol.length - 1;
    if (dualY) {
      seriesData.push(magVals, angVals);
      if (plotKind === "s11") {
        sParamOpt.series.push(
          {
            label: last ? t("results.s11db") : t("results.tolPipe", { i }),
            stroke: last ? "blue" : "#4b4c80",
            width: 2,
            scale: "y",
          },
          {
            label: last ? t("results.s11ang") : t("results.tolAng", { i }),
            stroke: last ? "red" : "#9c5656",
            width: 2,
            scale: "y2",
          },
        );
      } else {
        sParamOpt.series.push(
          {
            label: last ? t("results.zMag") : t("results.zTolMag", { i }),
            stroke: last ? "blue" : "#4b4c80",
            width: 2,
            scale: "y",
          },
          {
            label: last ? t("results.zAng") : t("results.zTolAng", { i }),
            stroke: last ? "red" : "#9c5656",
            width: 2,
            scale: "y2",
          },
        );
      }
    } else {
      seriesData.push(magVals);
      sParamOpt.series.push({
        label: last ? legendY : t("results.tol", { i }),
        stroke: last ? "green" : "gray",
        width: 2,
        scale: "y",
      });
    }
  }
  const gData = [fAxis, ...seriesData];
  return <UplotReact options={sParamOpt} data={gData} />;
}
function GainPlot({ gain, options, freqUnit, title, legend }) {
  const { t } = useTranslation();
  if (!gain || Object.keys(gain).length === 0) return null;
  const sParamOpt = JSON.parse(JSON.stringify(options));
  sParamOpt.axes[1].label = legend;
  const sData = [];
  for (const i in gain) {
    const m = [];
    for (const v in gain[i]) {
      m.push(10 * Math.log10(gain[i][v]));
    }
    sData.push(m);
    sParamOpt.series.push({
      label: i == gain.length - 1 ? legend : t("results.tol", { i }),
      stroke: i == gain.length - 1 ? "blue" : "gray",
      width: 2,
      scale: "y",
    });
  }
  const f = Object.keys(gain[0]).map((x) => x / unitConverter[freqUnit]);
  const gData = [f, ...sData];
  return (
    <div style={{ textAlign: "center" }}>
      <h5 style={{ marginTop: 15, marginBottom: 0 }}>{title}</h5>
      <UplotReact options={sParamOpt} data={gData} />
    </div>
  );
}
function RPlot({ RefIn, options, freqUnit, title }) {
  const { t } = useTranslation();
  if (!RefIn || Object.keys(RefIn).length === 0) return null;
  const sParamOpt = JSON.parse(JSON.stringify(options));
  // const f = [];
  const plotData = [Object.keys(RefIn[0]).map((x) => x / unitConverter[freqUnit])];
  for (const i in RefIn) {
    const m = [];
    const a = [];
    for (const v in RefIn[i]) {
      m.push(20 * Math.log10(RefIn[i][v].magnitude));
      a.push(RefIn[i][v].angle);
    }
    plotData.push(m, a);
    sParamOpt.series.push(
      {
        label: i == RefIn.length - 1 ? t("results.s11db") : t("results.tolPipe", { i }),
        stroke: i == RefIn.length - 1 ? "blue" : "#4b4c80",
        width: 2,
        scale: "y",
      },
      {
        label: i == RefIn.length - 1 ? t("results.s11ang") : t("results.tolAng", { i }),
        stroke: i == RefIn.length - 1 ? "red" : "#9c5656",
        width: 2,
        scale: "y2",
      },
    );
  }
  return (
    <div style={{ textAlign: "center" }}>
      <h5 style={{ marginTop: 15, marginBottom: 0 }}>{title}</h5>
      <UplotReact options={sParamOpt} data={plotData} />
    </div>
  );
}

export default function Results({ zProc, spanResults, freqUnit, plotType, sParameters, gainResults, noiseArray, RefIn, zo }) {
  const { t, i18n } = useTranslation();
  const { zStr, zPolarStr, refStr, refPolarStr, vswr, qFactor } = zProc;
  const containerRef = useRef();
  // const [options, setOptions] = useState(optionsInit);
  // const [options2, setOptions2] = useState(options2Init);
  const [commonOptions, setCommonOptions] = useState(commonOptionsInit);

  const loc1 = localizedOptionsInit(t);
  const loc2 = localizedOptions2Init(t);
  const locZ = localizedOptionsZInit(t);
  const locG = localizedOptionsGainInit(t);

  const optionsS21 = {
    width: commonOptions.width,
    height: commonOptions.height,
    series: [...commonOptions.series],
    axes: [...commonOptions.axes, ...loc2.axes],
    scales: options2Init.scales,
  };

  const optionsS11Tol = {
    width: commonOptions.width,
    height: commonOptions.height,
    series: [...commonOptions.series],
    axes: [...commonOptions.axes, ...loc1.axes],
    scales: optionsInit.scales,
  };

  const optionsZTol = {
    width: commonOptions.width,
    height: commonOptions.height,
    series: [...commonOptions.series],
    axes: [...commonOptions.axes, ...locZ.axes],
    scales: optionsInit.scales,
  };

  const options4 = {
    width: commonOptions.width,
    height: commonOptions.height,
    series: [...commonOptions.series, ...loc1.series],
    axes: [...commonOptions.axes, ...loc1.axes],
    scales: optionsInit.scales,
  };

  const optionsGain = {
    width: commonOptions.width,
    height: commonOptions.height,
    series: [...commonOptions.series, ...optionsGainInit.series],
    axes: [...commonOptions.axes, ...locG.axes],
    scales: optionsGainInit.scales,
  };

  const optionsS11 = {
    width: commonOptions.width,
    height: commonOptions.height,
    series: commonOptions.series,
    axes: [...commonOptions.axes, ...loc1.axes],
    scales: optionsInit.scales,
  };

  var s21 = [];
  //FIXME - move this to a separate function so we can do unit testing
  const nominalSpan = spanResults[spanResults.length - 1];
  const sortedSpanFrequencies = Object.keys(nominalSpan).sort((a, b) => a - b);
  for (const f of sortedSpanFrequencies) {
    const { refReal, refImag } = processImpedance(nominalSpan[f].z, zo);
    const { magnitude } = rectangularToPolar({
      real: refReal,
      imaginary: refImag,
    });
    s21.push(20 * Math.log10(Math.sqrt(1 - magnitude ** 2)));
  }
  const absSpanFrequencies = sortedSpanFrequencies.map((f) => f / unitConverter[freqUnit]);

  var maxS21 = s21[0];
  var maxF = 0;
  var db3_l = -1;
  var db3_m = -1;
  var i, maxIndex;
  for (i = 0; i < absSpanFrequencies.length; i++) {
    if (s21[i] > maxS21) {
      maxIndex = i;
      maxS21 = s21[i];
      maxF = absSpanFrequencies[i];
    }
  }
  for (i = maxIndex; i >= 0; i--) {
    if (s21[i] < maxS21 - 3) {
      db3_l = absSpanFrequencies[i];
      break;
    }
  }
  for (i = maxIndex; i < absSpanFrequencies.length; i++) {
    if (s21[i] < maxS21 - 3) {
      db3_m = absSpanFrequencies[i];
      break;
    }
  }

  useEffect(() => {
    function handleResize() {
      renderChart_new(setCommonOptions, containerRef, freqUnit, t);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [freqUnit, t, i18n.language]);

  // plot s-parameters straight from the file
  if (plotType === "sparam" && sParameters !== null) {
    const sparametersData = sParameters.data;
    return (
      <div ref={containerRef} style={{ width: "100%", marginTop: "30px" }}>
        <SPlot sparametersData={sparametersData} options={options4} freqUnit={freqUnit} title={t("results.rawData")} />
      </div>
    );

    // plot s-parameters when terminated with custom impedance
  } else if (plotType !== "sparam" && sParameters !== null) {
    return (
      <div ref={containerRef} style={{ width: "100%", marginTop: "30px" }}>
        <RPlot RefIn={RefIn} options={optionsS11} freqUnit={freqUnit} title={t("results.zDp1")} />
        <GainPlot gain={gainResults} options={optionsGain} freqUnit={freqUnit} title={t("results.systemGain")} legend={t("results.gainLegend")} />
        <GainPlot gain={noiseArray} options={optionsGain} freqUnit={freqUnit} title={t("results.noiseFigure")} legend={t("results.nfLegend")} />
      </div>
    );
  } else
    return (
      <>
        <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
          {t("results.finalResults")}
        </Typography>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 9 }} sx={{ display: "flex" }}>
            <ImpedanceRes type={t("results.impedanceOhm")} zStr={zStr} zPolarStr={zPolarStr} />
          </Grid>
          <Tooltip title={t("results.vswrTooltip")} arrow placement="top">
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }} sx={{ display: "flex" }}>
              <MiniRes type="VSWR" res={vswr} />
            </Grid>
          </Tooltip>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 9 }} sx={{ display: "flex" }}>
            <ImpedanceRes type={t("results.reflectionCoeff")} zStr={refStr} zPolarStr={refPolarStr} />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }} sx={{ display: "flex" }}>
            <MiniRes type={t("results.qFactor")} res={qFactor} />
          </Grid>
        </Grid>

        <div ref={containerRef} style={{ width: "100%", marginTop: "30px" }}>
          <SpanTolerancePlot spanResultsByTol={spanResults} options={optionsZTol} freqUnit={freqUnit} zo={zo} plotKind="z" />
          <SpanTolerancePlot spanResultsByTol={spanResults} options={optionsS11Tol} freqUnit={freqUnit} zo={zo} plotKind="s11" />
          <Typography sx={{ textAlign: "center", mt: 2 }}>
            {t("results.assuming")}{" "}
            <i>
              S<sub>11</sub>
              <sup>2</sup> + S<sub>21</sub>
              <sup>2</sup> = 1
            </i>
            )
          </Typography>
          <SpanTolerancePlot
            spanResultsByTol={spanResults}
            options={optionsS21}
            freqUnit={freqUnit}
            zo={zo}
            plotKind="s21"
            legendY={t("results.s21db")}
          />
        </div>
        <ul>
          <li>{t("results.maxS21", { v: maxS21.toPrecision(6), f: maxF, unit: freqUnit })}</li>
          <li>
            {t("results.bw3db", {
              v: db3_l == -1 || db3_m == -1 ? t("results.na") : (db3_m - db3_l).toPrecision(6),
              unit: freqUnit,
            })}
          </li>
        </ul>
      </>
    );
}
