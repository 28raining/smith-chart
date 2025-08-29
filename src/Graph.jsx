import { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import SaveIcon from "@mui/icons-material/Save";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";

import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import Box from "@mui/material/Box";

import { arcColors, processImpedance, parseInput, reflToZ, polarToRectangular, unitConverter } from "./commonFunctions.js";
import { sparamNoiseCircles, sparamGainCircles, stabilityCircles } from "./sparam.js";

const sParamColorLut = {
  S11: arcColors[0],
  S21: arcColors[2],
  S12: arcColors[1],
  S22: arcColors[3],
};

const dashTypes = [
  "5,5", // short dash
  "10,5", // medium dash
  "2,2,10,2", // dot-dash pattern
  "4,6", // dotted
  "10,2,2,2", // long dash, short gap, short dash, short gap
];
// Usage: <path stroke-dasharray={dashTypes[0]} ... />
const markerRadius = 6;
const markerRadiusSP = 6 * 0.7;

//find if a specific point (px, py) is inside a circle with center (cx, cy) and radius r
function isPointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

//function to find the point on the  circle circumferance that is nearers to point (j,q)
function lineEndPoint(x, y, j, q, l) {
  const dx = j - x;
  const dy = q - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) {
    throw new Error("Start and target point are the same");
  }
  const nx = dx / dist;
  const ny = dy / dist;
  return {
    x: x + nx * l,
    y: y + ny * l,
  };
}

function Graph({
  zResultsSrc,
  zo,
  spanResults,
  qCircles,
  vswrCircles,
  nfCircles,
  gainInCircles,
  gainOutCircles,
  zMarkers,
  reflection_real,
  reflection_imag,
  sParameters,
  plotType,
  chosenSparameter,
  freqUnit,
  frequency,
  chosenNoiseParameter,
}) {
  const svgRef = useRef(null);
  const svgWrapper = useRef(null);
  const topGroupRef = useRef(null);
  const tracingArcsRef = useRef(null);
  const labelsRef = useRef(null);
  const hoverRectsRef = useRef(null);
  const qCirclesRef = useRef(null);
  const zMarkersRef = useRef(null);
  const vswrCirclesRef = useRef(null);
  const sParamsRef = useRef(null);
  const nfCirclesRef = useRef(null);
  const stabilityCirclesRef = useRef(null);
  const impedanceArcsRef = useRef(null);
  const dpCirclesRef = useRef(null);
  const [hoverImpedance, setHoverImpedance] = useState([0, 0, 0]);
  const [hSnaps, setHSnaps] = useState([]);
  const [sSnaps, setSSnaps] = useState([]);
  const [width, setWidth] = useState(650);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resistanceCircles, setResistanceCircles] = useState([0, 0.2, 0.5, 1, 2, 4, 10]);
  const [reactanceCircles, setReactanceCircles] = useState([0.2, 0.5, 1, 2, 4, 10, -0.2, -0.5, -1, -2, -4, -10]);
  const [showSPlots, setShowSPlots] = useState({ S11: true, S21: true, S12: true, S22: true });
  const [showZPlots, setShowZPlots] = useState(true);
  const [showStabilityPlot, setShowStabilityPlot] = useState(false);

  // console.log('resistanceCircles', resistanceCircles);
  // const [snapDetails, setSnapDetails] = useState({ real: 0, imaginary: 0 });

  // console.log("chosenSparameter", chosenSparameter);
  function updateWidth() {
    var newWidth = svgWrapper.current.offsetWidth;
    // console.log('neww', newWidth);
    if (newWidth > 700) setWidth(650);
    else if (newWidth > 600) setWidth(550);
    else if (newWidth > 460) setWidth(450);
    else setWidth(350);
  }

  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  //draw the constant-Q circles
  useEffect(() => {
    var userSVG = d3.select(qCirclesRef.current);
    userSVG.selectAll("*").remove();
    var path, coord, imag;
    for (const q of qCircles) {
      for (const scaler of [-1, 1]) {
        path = "M 0 0";
        imag = 500;
        for (var i = 0; i < 100; i++) {
          coord = impedanceToSmithChart(imag / q, imag * scaler, width);
          path += ` L ${coord[0]} ${coord[1]}`;
          imag = imag * 0.9;
        }
        path += ` L ${-width} 0`;
        userSVG
          .append("path")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("fill", "none")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", dashTypes[1])
          .attr("d", path);

        //place the label location in the center of the graph (where reflection coefficient is 0, or im^2 + re^2 = zo^2). zo cancels out as impedanceToSmithChart is in units of zo
        //we also know im = re * Q
        var labelRe = Math.sqrt(1 / (1 + q * q));
        var labelCoord = impedanceToSmithChart(labelRe, scaler * (labelRe * q), width);
        // var y = Number(labelCoord[1]) + 4;
        // var x = Number(labelCoord[0]);// + 4;

        createLabel(userSVG, labelCoord[0], labelCoord[1], `Q=${q}`);
      }
    }
  }, [qCircles, width]);

  //draw the constant VSWR circles
  useEffect(() => {
    var userSVG = d3.select(vswrCirclesRef.current);
    userSVG.selectAll("*").remove();
    for (const v of vswrCircles) {
      // When imaginary = 0, r/zo = VSWR. This is the radius of the circle
      // impedanceToSmithCoordinates is already agnostic to zo
      const [x /* y */] = impedanceToSmithCoordinates(v, 0);
      const radius = (1 + x) * width * 0.5;
      userSVG
        .append("circle")
        .attr("cx", -width * 0.5)
        .attr("cy", 0)
        .attr("r", radius)
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", dashTypes[2]);
      createLabel(userSVG, -width * 0.5, -radius, `VSWR=${v}`);
    }
  }, [vswrCircles, zo, width]);

  //Plot S11
  useEffect(() => {
    const sParamSnap = [];
    var userSVG = d3.select(sParamsRef.current);
    userSVG.selectAll("*").remove();
    setSSnaps([]);
    if (sParameters === null) return;
    const sparametersData = sParameters.data;
    // if (sparametersData.length === 0) return;

    for (const s in sParamColorLut) {
      const coord = [];
      if (!(s in Object.values(sparametersData)[0])) continue;
      if (showSPlots[s] === false) continue; // skip if the plot is not shown
      for (const v in sparametersData) {
        const rect = polarToRectangular(sparametersData[v][s]);
        const z = reflToZ(rect, sParameters.settings.zo);
        const [x, y] = impedanceToSmithChart(z.real / zo, z.imaginary / zo, width);

        addDpMarker(userSVG, x, y, `${s}_${v}`, z, sParamColorLut[s], v, sParamSnap, markerRadiusSP, `sparam_dp_${sParamSnap.length}`);

        coord.push([x, y]);
        // sParamSnap.push({
        //   x: x - 0.5 * markerRadius,
        //   y: y - 0.5 * markerRadius,
        //   real: z.real,
        //   imaginary: z.imaginary,
        //   frequency: v.toLocaleString(),
        // });
      }

      const newPath = `M ${coord[0][0]} ${coord[0][1]} ${coord.map((c) => `L ${c[0]} ${c[1]}`).join(" ")}`;
      userSVG
        .append("path")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("fill", "none")
        .attr("stroke", sParamColorLut[s])
        .attr("stroke-width", 1)
        .attr("id", `arc_${s}`)
        .attr("d", newPath);

      // userSVG
      //   .append("text")
      //   .attr("x", -width) // x position
      //   .attr("y", s.labelY) // y position
      //   .text(s.name) // label content
      //   .attr("font-size", "22px")
      //   .attr("font-weight", "bold")
      //   .attr("fill", s.color)
      //   .attr("stroke", "none")
      //   .attr("text-anchor", "start")
      //   .attr("dominant-baseline", "hanging");
    }

    setSSnaps(sParamSnap);
  }, [zo, width, plotType, sParameters, showSPlots]);

  //draw the custom markers
  useEffect(() => {
    var userSVG = d3.select(zMarkersRef.current);
    userSVG.selectAll("*").remove();
    zMarkers.forEach((m, i) => {
      // When imaginary = 0, r/zo = VSWR. This is the radius of the circle
      // impedanceToSmithCoordinates is already agnostic to zo
      const [x, y] = impedanceToSmithChart(m[0] / zo, m[1] / zo, width);
      userSVG.append("circle").attr("cx", x).attr("cy", y).attr("r", 6).attr("stroke-width", 3).attr("stroke", "red");
      createLabel(userSVG, Number(x) + 25, y, `MK${i}`);
    });
  }, [zMarkers, zo, width]);

  //draw the stability circles
  useEffect(() => {
    var userSVG = d3.select(stabilityCirclesRef.current);
    userSVG.selectAll("*").remove();
    if (!showStabilityPlot) return;
    if (!chosenSparameter) return;
    if (!chosenSparameter.S22) return;
    // const b = stabilityCircles({...chosenSparameter, S11: chosenSparameter.S22, S22: chosenSparameter.S11 }); // output stability circle

    function drawStabilityCircle(modifiedSparam, inOrOut) {
      const a = stabilityCircles(modifiedSparam, modifiedSparam.zo);
      //check if center point is inside circle, and if the center point is stable
      const [x, y] = impedanceToSmithChart(a.center.real / zo, a.center.imaginary / zo, width);
      const stableInsideCircle = isPointInCircle(-width / 2, 0, x, y, a.radius * width * 0.5) ^ (modifiedSparam.S11.magnitude > 1);
      userSVG
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("fill", "rgba(184, 184, 184,0.4)")
        .attr("r", a.radius * width * 0.5)
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", dashTypes[0]);
      const zz = lineEndPoint(x, y, -width / 2, 0, a.radius * width * 0.5 - 15);
      createLabelStability(
        userSVG,
        zz.x,
        zz.y,
        stableInsideCircle ? `${inOrOut} stable region` : `${inOrOut} unstable region`,
        0.5 * Math.PI + Math.atan(y / (x - -width / 2)),
        "10px",
      );
    }
    drawStabilityCircle(chosenSparameter, "Output");
    drawStabilityCircle({ ...chosenSparameter, S11: chosenSparameter.S22, S22: chosenSparameter.S11 }, "Input"); // input stability circle
  }, [zo, width, chosenSparameter, showStabilityPlot]);

  //draw the noise Figure circles
  useEffect(() => {
    var userSVG = d3.select(nfCirclesRef.current);
    userSVG.selectAll("*").remove();
    if (!chosenSparameter) return;

    const circlesToPlot = [];
    //the noise circles
    if (chosenNoiseParameter) {
      for (const n of nfCircles) {
        const [center, radius] = sparamNoiseCircles(chosenNoiseParameter.fmin, n, chosenNoiseParameter.rn / zo, chosenNoiseParameter.gamma);
        circlesToPlot.push({ center, radius, dash: dashTypes[3], label: `${n}dB` });
      }
    }
    //the gain circles
    for (const g of gainInCircles) {
      const result = sparamGainCircles(chosenSparameter.S11, chosenSparameter.zo, g);
      circlesToPlot.push({ ...result, dash: dashTypes[4], label: `${g}dB (in)` });
    }
    for (const g of gainOutCircles) {
      const result = sparamGainCircles(chosenSparameter.S22, chosenSparameter.zo, g);
      circlesToPlot.push({ ...result, dash: dashTypes[4], label: `${g}dB (out)` });
    }

    //Ni = (F - Fmin) * |1 + Go|^2 / 4 * Rn
    //Circle Center = Go / (Ni + 1)
    //Circle Radius = sqrt(Ni(Ni + 1 - |Go|^2)) / (Ni + 1)
    // var Fmin, F, Rn, FminLinear, FLinear, Ni, center_real, center_imag, radius, x, y;
    // const Go_real = reflection_real;
    // const Go_imag = reflection_imag;
    // const GoMag = Go_real * Go_real + Go_imag * Go_imag;
    // const GoMagP1 = (Go_real + 1) * (Go_real + 1) + Go_imag * Go_imag;
    for (const c of circlesToPlot) {
      // equations here https://www.allaboutcircuits.com/technical-articles/learn-about-designing-unilateral-low-noise-amplifiers/
      // https://homepages.uc.edu/~ferendam/Courses/EE_611/Amplifier/NFC.html
      // Fmin = 1.3;//units db
      // F = 1.8;
      // Rn = 20/zo;
      // Fmin = n.NFmin;
      // F = n.NF;
      // Rn = n.Rn / zo;
      // const [tempz2, radius] = sparamNoiseCircles(n.NFmin, n.NF, n.Rn / zo, reflection_real, reflection_imag)

      // FminLinear = Math.pow(10, Fmin / 10);
      // FLinear = Math.pow(10, F / 10);
      // Ni = ((FLinear - FminLinear) * GoMagP1) / (4 * Rn);
      // center_real = Go_real / (Ni + 1);
      // center_imag = Go_imag / (Ni + 1);
      // radius = Math.sqrt(Ni * (Ni + 1 - GoMag)) / (Ni + 1);

      // //must conver from center Reflection coefficient to Z : Z = 2*Zo/(1+refl)
      // var tempZ = one_over_complex(1 - center_real, -center_imag);
      // var tempz2 = complex_multiply(tempZ.real, tempZ.imaginary, 1 + center_real, center_imag);
      // // var tempZ = one_over_complex(1-Go_real , -Go_imag);
      // // var tempz2 = complex_multiply(tempZ.real, tempZ.imaginary, 1+Go_real, Go_imag);

      const [x, y] = impedanceToSmithChart(c.center.real / zo, c.center.imaginary / zo, width);
      // // [x, y] = impedanceToSmithCoordinates(tempZ.real, tempZ.imaginary);

      // console.log('center, radius', center_real, center_imag, radius, Ni);

      userSVG
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", c.radius * width * 0.5)
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", c.dash);

      createLabel(userSVG, x, Number(y) - c.radius * width * 0.5, c.label);
    }
  }, [nfCircles, gainInCircles, gainOutCircles, zo, reflection_real, reflection_imag, width, chosenSparameter, chosenNoiseParameter]);

  //initializing the smith chart diagrams
  useEffect(() => {
    // Set width, the x,y plane and some global default colors
    d3.select(svgRef.current).attr("width", width).attr("height", width);
    d3.select(topGroupRef.current)
      .attr("transform", `translate(${width}, ${0.5 * width})`)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1);
    initializeSmithChart(tracingArcsRef, width, resistanceCircles, reactanceCircles); //draw the circles and add the labels
  }, [width, resistanceCircles, reactanceCircles]);

  //mouse handlers (move to the component?)
  useEffect(() => {
    if (zo <= 0) return;

    var re, im, cx, cy, r, xEnd, yEnd;
    var svg = d3.select(svgRef.current);
    var svgGroup = d3.select(topGroupRef.current);

    svg.on("mousemove", null);
    svg.on("mouseleave", null);

    svg.on("mousemove", (event) => {
      var dpCircles = d3.select(dpCirclesRef.current);
      dpCircles.selectAll(".hoverDp").classed("hoverDp", false);
      // var sparamSVG = d3.select(sParamsRef.current);
      // sparamSVG.selectAll(".hoverDp").classed("hoverDp", false);
      var sparamSVG = d3.select(hoverRectsRef.current);
      sparamSVG.selectAll("*").remove();

      const [mouseX, mouseY] = d3.pointer(event, svgGroup.node());
      var x = mouseX / (0.5 * width);
      var y = mouseY / (0.5 * width);
      var snapped = false;
      var frequency = null;
      for (const s of hSnaps) {
        if (mouseX > s.x && mouseX < s.x + 2 * markerRadius && mouseY > s.y && mouseY < s.y + 2 * markerRadius) {
          re = s.real / zo;
          im = s.imaginary / zo;
          frequency = s.frequency;
          // dpCircles.select(`#${s.id}`).classed("hoverDp", true);
          //add a outline red rectanble to sparamSVG
          sparamSVG
            .append("rect")
            .attr("x", s.x)
            .attr("y", s.y)
            .attr("width", 2 * markerRadius)
            .attr("height", 2 * markerRadius)
            .attr("stroke", "red")
            .attr("stroke-width", "3")
            .attr("fill", "none");
          snapped = true;
          break;
        }
      }
      for (const s of sSnaps) {
        if (mouseX > s.x && mouseX < s.x + 2 * markerRadiusSP && mouseY > s.y && mouseY < s.y + 2 * markerRadiusSP) {
          re = s.real / zo;
          im = s.imaginary / zo;
          frequency = s.frequency;
          // sparamSVG.select(`#${s.id}`).classed("hoverDp", true);
          sparamSVG
            .append("rect")
            .attr("x", s.x)
            .attr("y", s.y)
            .attr("width", 2 * markerRadiusSP)
            .attr("height", 2 * markerRadiusSP)
            .attr("stroke", "red")
            .attr("stroke-width", "3")
            .attr("fill", "none");
          snapped = true;
          break;
        }
      }

      if (!snapped) {
        [re, im] = smithCoordinatesToImpedance(x, y);
      }
      setHoverImpedance([re, im, frequency]);

      var hoverReal = svgGroup.select("#hover_real");
      var hoverImaginary = svgGroup.select("#hover_imaginary");
      if (hoverReal.empty()) {
        svgGroup.append("circle").attr("id", "hover_real").attr("stroke-dasharray", "5,5");
      }
      if (hoverImaginary.empty()) {
        svgGroup.append("path").attr("id", "hover_imaginary").attr("stroke-dasharray", "5,5");
      }
      if (re > 0) {
        [cx, cy, r] = resistanceToXYR(re);
        hoverReal
          .attr("cx", cx * width * 0.5) // X coordinate of the center
          .attr("cy", 0) // Y coordinate of the center
          .attr("r", r * width * 0.5); // Radius of the circle
      } else {
        hoverReal.remove();
        hoverImaginary.remove();
      }
      [cy /*xStart*/ /*yStart*/, , , xEnd, yEnd] = reactanceToXYR(im);
      if (im == 0) {
        hoverImaginary.attr("d", `M 0 0 L ${-2 * width * 0.5} 0`);
      } else {
        var clockwise = 0;
        if (cy < 0) clockwise = 1;
        hoverImaginary.attr("d", `M 0 0 A ${cy * width * 0.5} ${cy * width * 0.5} 0 0 ${clockwise} ${xEnd * width * 0.5} ${yEnd * width * 0.5}`);
      }
    });
    svg.on("mouseleave", (event) => {
      const [mouseX, mouseY] = d3.pointer(event, svg.node());
      var x = mouseX / (0.5 * width) - 2;
      var y = mouseY / (0.5 * width) - 1;
      var [re /*im*/] = smithCoordinatesToImpedance(x, y);
      if (re < 0) {
        svgGroup.select("#hover_real").remove();
        svgGroup.select("#hover_imaginary").remove();
        // console.log("leaving");
      }
    });
    // Optional: cleanup function
    return () => {
      svg.on("mousemove", null);
      svg.on("mouseleave", null);
    };
  }, [hSnaps, sSnaps, width, zo]);

  function addDpMarker(dpCircles, x, y, tol, point, color, frequency, hoverSnaps, radius = markerRadius, id) {
    dpCircles
      .append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", radius)
      .attr("fill", color)
      .attr("id", `tol_marker_${tol}`)
      .attr("stroke", "none");
    // dpCircles
    //   .append("rect")
    //   .attr("x", x - radius)
    //   .attr("y", y - radius)
    //   .attr("width", 2 * radius)
    //   .attr("height", 2 * radius)
    //   .attr("fill", "none")
    //   .attr("stroke-width", "2")
    //   .attr("stroke", "none")
    //   .attr("id", id);
    hoverSnaps.push({
      x: x - radius,
      y: y - radius,
      real: point.real,
      imaginary: point.imaginary,
      frequency: frequency,
      id: id,
    });
  }

  //draw impedance arcs
  useEffect(() => {
    if (zo <= 0) return;
    // console.log("running a");
    var impedanceArc = d3.select(impedanceArcsRef.current);
    impedanceArc.selectAll("*").remove();
    var dpCircles = d3.select(dpCirclesRef.current);
    dpCircles.selectAll("*").remove();
    if (!showZPlots) return;
    var hoverSnaps = [];
    setHSnaps([]);
    // if (plotType !== "impedance") {
    //   setHSnaps(hoverSnaps);
    //   return;
    // }
    var cumulatedDP = 0;
    // console.log("zResultsSrc", zResultsSrc);
    for (const zz of zResultsSrc) {
      const z = zz.arcs;
      var coord = [];
      var tol, dp, point;
      var path = "";
      var newPath = "";
      var spanArc = "";
      var mainSpanArc = "";
      var lastDpColor = "";
      for (tol = 0; tol < z.length; tol++) {
        for (dp = 0; dp < z[tol].length; dp++) {
          coord = [];
          for (point of z[tol][dp]) {
            coord.push(impedanceToSmithChart(point.real / zo, point.imaginary / zo, width));
          }
          newPath = `M ${coord[0][0]} ${coord[0][1]} ${coord.map((c) => `L ${c[0]} ${c[1]}`).join(" ")}`;
          if (tol != z.length - 1) {
            path = `${path} ${newPath}`;
            //add a circle at the last dp of the tol curves
            if (dp == z[tol].length - 1) {
              addDpMarker(
                dpCircles,
                coord[coord.length - 1][0],
                coord[coord.length - 1][1],
                tol,
                point,
                "#8a8a8a",
                frequency,
                hoverSnaps,
                markerRadius,
                `hover_dp_${hoverSnaps.length}`,
              );
            }
          } else {
            //the last entry in z array is the circuit without any tolerance applied
            lastDpColor = cumulatedDP == 0 ? arcColors[dp % 10] : arcColors[(cumulatedDP - dp) % 10];
            impedanceArc
              .append("path")
              .attr("stroke-linecap", "round")
              .attr("stroke-linejoin", "round")
              .attr("fill", "none")
              .attr("stroke", lastDpColor)
              .attr("stroke-width", 5)
              .attr("id", `dp_${cumulatedDP + dp}`)
              .attr("d", newPath);

            addDpMarker(
              dpCircles,
              coord[coord.length - 1][0],
              coord[coord.length - 1][1],
              tol,
              point,
              lastDpColor,
              frequency,
              hoverSnaps,
              markerRadius,
              `hover_dp_${hoverSnaps.length}`,
            );
          }
        }
      }
      // the tolerance curves are all in one path
      if (path != "") {
        impedanceArc
          .append("path")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 2)
          .attr("d", path);
      }
      // }

      // add the span arcs
      const spanResults = zz.ZvsF;
      spanResults.forEach((s, i) => {
        coord = [];
        for (const f in s) {
          const co = impedanceToSmithChart(s[f].z.real / zo, s[f].z.imaginary / zo, width);
          coord.push(co);
          addDpMarker(
            dpCircles,
            co[0],
            co[1],
            `${i}_${f}`,
            s[f].z,
            i == spanResults.length - 1 ? lastDpColor : "#911313",
            f,
            hoverSnaps,
            markerRadius,
            `hover_dp_${hoverSnaps.length}`,
          );
        }
        newPath = `M ${coord[0][0]} ${coord[0][1]} ${coord.map((c) => `L ${c[0]} ${c[1]}`).join(" ")}`;

        if (i != spanResults.length - 1) {
          spanArc = `${spanArc} ${newPath}`;
        } else {
          mainSpanArc = newPath;
        }
      });
      if (spanArc != "") {
        impedanceArc
          .append("path")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("fill", "none")
          .attr("stroke", "#8a8a8a")
          .attr("stroke-width", 1)
          .attr("d", spanArc);
      }
      if (mainSpanArc != "") {
        impedanceArc
          .append("path")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("fill", "none")
          .attr("stroke", "red")
          // .attr("stroke", arcColors[zResultsSrc[0].length - (1 % 10)])
          .attr("stroke-width", 1)
          .attr("d", mainSpanArc);
      }
      cumulatedDP = zResultsSrc[0].arcs[0].length + zResultsSrc[zResultsSrc.length - 1].arcs[0].length;
    }
    setHSnaps(hoverSnaps);
  }, [zResultsSrc, zo, spanResults, width, plotType, frequency, showZPlots]);

  //draw the labels
  useEffect(() => {
    var svgLabels = d3.select(labelsRef.current);
    svgLabels.selectAll("*").remove();
    resistanceCircles.map((z) => {
      // var dispRes = zo * z;
      if (z === Infinity) return;
      const [x /*y*/] = impedanceToSmithCoordinates(z, 0);

      svgLabels
        .append("rect")
        .attr("x", x * width * 0.5 + 2)
        .attr("y", -12)
        .attr("width", 20)
        .attr("height", 12)
        .attr("fill", "white")
        .attr("stroke", "none") // removes the outline
        .attr("opacity", 0.6); // 50% opacity

      svgLabels
        .append("text")
        .attr("x", x * width * 0.5 + 2) // x position
        .attr("y", -2) // y position
        .text(formatNumber(zo * z, 1)) // label content
        .attr("font-size", "12px")
        .attr("stroke", "none")
        .attr("fill", "black");
    });
    reactanceCircles.map((z) => {
      // var dispRes = zo * z;
      var [, , , /*cy*/ /*xStart*/ /*yStart*/ xEnd, yEnd] = reactanceToXYR(z);
      var angle = Math.atan2(yEnd, 1 + xEnd); // * (180 / Math.PI);
      var yOffset = 4;
      var xOffset = 16;
      var xDelta = xOffset * Math.cos(angle) - yOffset * Math.sin(angle);
      var yDelta = xOffset * Math.sin(angle) + yOffset * Math.cos(angle);
      var x = xEnd * width * 0.5 - xDelta; // - xDelta;
      var y = yEnd * width * 0.5 - yDelta; // - yDelta;
      // console.log('bp55',z,yDelta, yEnd, 1+xEnd)

      svgLabels
        .append("rect")
        .attr("x", x - 10)
        .attr("y", y - 10)
        .attr("width", 20)
        .attr("height", 12)
        .attr("transform", `rotate(${angle * (180 / Math.PI)}, ${x}, ${y})`)
        .attr("fill", "white")
        .attr("stroke", "none") // removes the outline
        .attr("opacity", 0.6); // 50% opacity

      svgLabels
        .append("text")
        .attr("x", x) // x position
        .attr("y", y) // y position
        .attr("text-anchor", "middle")
        .text(`${formatNumber(zo * z, 1)}j`) // label content
        .attr("font-size", "12px")
        .attr("stroke", "none")
        .attr("transform", `rotate(${angle * (180 / Math.PI)}, ${x}, ${y})`)
        .attr("fill", "black");
    });
  }, [zo, width, resistanceCircles, reactanceCircles]);

  return (
    <Box position="relative">
      <DialogGraphSettings
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        resistanceCircles={resistanceCircles}
        setResistanceCircles={setResistanceCircles}
        reactanceCircles={reactanceCircles}
        setReactanceCircles={setReactanceCircles}
      />
      <Tooltip title="Download SVG file">
        <IconButton
          aria-label="save"
          onClick={() => {
            const svg = svgRef.current;
            // Serialize the SVG to a string
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);
            // Create a blob and a download link
            const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
            const a = document.createElement("a");
            a.href = url;
            a.download = "smith_chart.svg";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          sx={{
            position: "absolute",
            top: -6,
            right: -8,
          }}
        >
          <SaveIcon sx={{ height: "24px", width: "24px", color: "rgba(0, 0, 0, 0.34)" }} />
        </IconButton>
      </Tooltip>
      <Stack
        spacing={0}
        sx={{
          position: "absolute",
          top: 4,
          left: 4,
        }}
      >
        {sParameters && sParameters.type === "s2p" && (
          <div style={{ fontWeight: "bold" }}>
            <input type="checkbox" checked={showStabilityPlot} onChange={() => setShowStabilityPlot(!showStabilityPlot)} />
            <label>Stability circles</label>
          </div>
        )}
        {Object.keys(showSPlots).map((s) => {
          if (sParameters === null) return null;
          if (sParameters.data.length === 0) return null;
          if (s in Object.values(sParameters.data)[0])
            return (
              <div key={s} style={{ fontWeight: "bold", color: sParamColorLut[s] }}>
                <input type="checkbox" checked={showSPlots[s]} onChange={() => setShowSPlots({ ...showSPlots, [s]: !showSPlots[s] })} />
                <label>{s}</label>
              </div>
            );
          else return null;
        })}
        <div style={{ fontWeight: "bold" }}>
          <input type="checkbox" name="scales" checked={showZPlots} onChange={() => setShowZPlots(!showZPlots)} />
          <label>{sParameters ? (sParameters.type == "s1p" ? "Z looking into DP1" : "Z") : "Z"}</label>
        </div>
      </Stack>
      <Link
        onClick={() => setDialogOpen(true)}
        sx={{
          position: "absolute",
          bottom: 0,
          right: 4,
        }}
      >
        Graph Settings
      </Link>
      <LightTooltip
        title={
          <HoverTooltip
            z={{
              real: hoverImpedance[0] * zo,
              imaginary: hoverImpedance[1] * zo,
            }}
            frequency={hoverImpedance[2]}
            freqUnit={freqUnit}
            zo={zo}
          />
        }
        followCursor
        sx={{ maxWidth: 300 }}
        enterTouchDelay={0} // show immediately on touch
        leaveTouchDelay={10000} // stay for 3 seconds
      >
        <div ref={svgWrapper} style={{ textAlign: "center" }}>
          <svg ref={svgRef} style={{ margin: "8px" }}>
            <g id="topGroup" ref={topGroupRef}>
              <g id="tracingArcs" ref={tracingArcsRef} />
              <g id="labels" ref={labelsRef} />
              <g id="userExtras">
                <g id="zMarkers" ref={zMarkersRef} />
                <g id="qCircles" ref={qCirclesRef} />
                <g id="vswrCircles" ref={vswrCirclesRef} />
                <g id="sParams" ref={sParamsRef} />
                <g id="nfCircles" ref={nfCirclesRef} />
                <g id="stabilityCircles" ref={stabilityCirclesRef} />
              </g>
              <g id="impedanceArc" ref={impedanceArcsRef} />
              <g id="dpCircles" ref={dpCirclesRef} />
              <g id="hoverRects" ref={hoverRectsRef} />
            </g>
          </svg>
        </div>
      </LightTooltip>
    </Box>
  );
}

function DialogGraphSettings({ dialogOpen, setDialogOpen, resistanceCircles, setResistanceCircles, reactanceCircles, setReactanceCircles }) {
  const [tempRCircles, setTempRCircles] = useState(resistanceCircles.join(", "));
  const [tempReacCircles, setTempReacCircles] = useState(reactanceCircles.join(", "));

  function handleClose() {
    setDialogOpen(false);
    setResistanceCircles(tempRCircles.split(",").map((x) => parseFloat(parseInput(x))));
    setReactanceCircles(tempReacCircles.split(",").map((x) => parseFloat(parseInput(x))));
  }
  return (
    <Dialog onClose={handleClose} open={dialogOpen} maxWidth="xl" fullWidth>
      <DialogTitle>Graph Settings</DialogTitle>
      <DialogContent>
        <FormControl sx={{ minWidth: 250 }} fullWidth>
          <TextField
            sx={{ mt: 2, minWidth: 250 }}
            label="Resistance Circles (Units of Zo)"
            variant="outlined"
            size="small"
            value={tempRCircles}
            onChange={(e) => setTempRCircles(e.target.value)}
          />
          <TextField
            sx={{ mt: 2 }}
            label="Reactance Circles (Units of Zo)"
            variant="outlined"
            size="small"
            value={tempReacCircles}
            onChange={(e) => setTempReacCircles(e.target.value)}
          />
        </FormControl>
      </DialogContent>
    </Dialog>
  );
}

function HoverTooltip({ z, frequency, zo, freqUnit }) {
  if (z.real < 0) return <p>Move cursor back inside the circle</p>;
  var res = processImpedance(z, zo);
  return (
    <>
      {frequency && (
        <p style={{ margin: 0, padding: 0 }}>
          Frequency = {frequency / unitConverter[freqUnit]} {freqUnit}
        </p>
      )}
      <p style={{ margin: 0, padding: 0 }}>
        Impedance = {res.zStr} ({res.zPolarStr})
      </p>
      <p style={{ margin: 0, padding: 0 }}>Admittance = {res.admString}</p>
      <p style={{ margin: 0, padding: 0 }}>
        Refl-Coeff = {res.refStr} ({res.refPolarStr})
      </p>
      <p style={{ margin: 0, padding: 0 }}>VSWR = {res.vswr}</p>
      <p style={{ margin: 0, padding: 0 }}>Q-Factor = {res.qFactor}</p>
    </>
  );
}

const LightTooltip = styled(({ className, ...props }) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
    slotProps={{
      popper: {
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, 0],
            },
          },
        ],
      },
    }}
  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
    color: "white",
    boxShadow: theme.shadows[1],
    fontSize: "0.8rem",
  },
}));

function formatNumber(num, maxDecimals) {
  // console.log('converting', num, " too ", Number(num.toFixed(maxDecimals)))
  // return num;
  // return num.toFixed(maxDecimals);
  return Number(num.toFixed(maxDecimals));
}

function createLabel(svg, x, y, text) {
  y = Number(y) + 4;
  x = Number(x); // + 4;
  var strLen = (text.length + 1) * 8;

  svg
    .append("rect")
    .attr("x", x - 0.5 * strLen)
    .attr("y", y - 10)
    .attr("width", strLen)
    .attr("height", 12)
    .attr("fill", "white")
    .attr("stroke", "none") // removes the outline
    .attr("opacity", 1.0); // 50% opacity
  svg
    .append("text")
    .attr("x", x) // x position
    .attr("y", y) // y position
    .text(text) // label content
    .attr("font-size", "14px")
    .attr("stroke", "none")
    .attr("text-anchor", "middle")
    .attr("fill", "black");
}

function createLabelStability(svg, x, y, text, angle, size) {
  y = Number(y);
  x = Number(x); // + 4;
  var strLen = text.length * 5;
  angle = angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? angle - Math.PI : angle; // normalize angle to [0, 2PI]

  svg
    .append("rect")
    .attr("x", x - 0.5 * strLen)
    .attr("y", y - 7)
    .attr("width", strLen)
    .attr("height", 10)
    .attr("fill", "white")
    .attr("stroke", "none") // removes the outline
    .attr("transform", `rotate(${angle * (180 / Math.PI)}, ${x}, ${y})`)
    .attr("opacity", 1.0); // 50% opacity
  svg
    .append("text")
    .attr("x", x) // x position
    .attr("y", y) // y position
    .text(text) // label content
    .attr("font-size", size)
    .attr("stroke", "none")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(${angle * (180 / Math.PI)}, ${x}, ${y})`)
    .attr("fill", "black");
}

function initializeSmithChart(tracingArcsRef, width, resistanceCircles, reactanceCircles) {
  var tracingArcs = d3.select(tracingArcsRef.current).attr("stroke", "rgba(0, 0, 0, 0.75)");
  tracingArcs.selectAll("*").remove();

  resistanceCircles.map((r) => {
    var [cx /*cy*/, , radius] = resistanceToXYR(r);
    tracingArcs
      .append("circle")
      .attr("cx", cx * width * 0.5) // X coordinate of the center
      .attr("cy", 0) // Y coordinate of the center
      .attr("r", radius * width * 0.5); // Radius of the circle
  });
  reactanceCircles.map((r, i) => {
    var [cy, xStart, yStart, xEnd, yEnd] = reactanceToXYR(r);
    //half the arcs can start at point 0,0
    if (i % 2 == 1) {
      xStart = 0;
      yStart = 0;
    }
    var clockwise = 0;
    if (cy < 0) clockwise = 1;
    tracingArcs
      .append("path")
      .attr(
        "d",
        `M ${xStart * width * 0.5} ${yStart * width * 0.5} A ${cy * width * 0.5} ${cy * width * 0.5} 0 0 ${clockwise} ${
          xEnd * width * 0.5
        } ${yEnd * width * 0.5}`,
      );
  });

  //add constance admittance and susceptance curves
  resistanceCircles.map((r) => {
    var [cx /*cy*/, , radius] = resistanceToXYR(r);
    tracingArcs
      .append("circle")
      .attr("cx", (-2 - cx) * width * 0.5) // X coordinate of the center
      .attr("cy", 0) // Y coordinate of the center
      .attr("r", radius * width * 0.5) // Radius of the circle
      .attr("stroke", "rgba(0, 0, 0, 0.25)");
  });
  reactanceCircles.map((r, i) => {
    var [cy, xStart, yStart, xEnd, yEnd] = reactanceToXYR(r);
    //half the arcs can start at point 0,0
    if (i % 2 == 1) {
      xStart = 0;
      yStart = 0;
    }
    var clockwise = 1;
    if (cy < 0) clockwise = 0;
    tracingArcs
      .append("path")
      .attr(
        "d",
        `M ${(-2 - xStart) * width * 0.5} ${yStart * width * 0.5} A ${cy * width * 0.5} ${
          cy * width * 0.5
        } 0 0 ${clockwise} ${(-2 - xEnd) * width * 0.5} ${yEnd * width * 0.5}`,
      )
      .attr("stroke", "rgba(0, 0, 0, 0.25)");
  });

  //add a line down the middle
  tracingArcs.append("line").attr("x1", 0).attr("y1", 0).attr("x2", -width).attr("y2", 0);
}

//This smith chart has coordinate space x=[-2,0] and y=[-1,1]
//For Real, the distance from the point (0,0) is d = -2/(1+re))
//For Imaginary, the distance from the point (1,0) is 1/im

//Equation of a circle is  (x - h)² + (y - k)² = r², where h,k is the center
//For the real circles, the equation is (x + 1/(1+re))² + y² = (1/(1+re))²
//For the imaginary circles, the equation is x² + (y - 1/im)² = (1/im)²
// allow a = 1/(1+re), b = 1/im
// y² = a² - (x + a)²
// x² = b² - (y - b)²
// solving...
// y = (2a²b)/(a² + b²)
// x = (-2ab²)/(a² + b²)
function impedanceToSmithCoordinates(re, im) {
  var a = 1 / (1 + re);
  var b = 1 / im;
  if (im == 0) {
    return [-2 * a, 0];
  }
  var x = (-2 * a * b * b) / (a * a + b * b);
  var y = (2 * a * a * b) / (a * a + b * b);
  return [x, -y];
}

// inverting these equations
// y² = a² - (x + a)²
// x² = b² - (y - b)²
// a = -(y² + x²) / (2x)
// b = (y² + x²) / (2y)
function smithCoordinatesToImpedance(x, y) {
  var a = -(y * y + x * x) / (2 * x);
  var b = (y * y + x * x) / (2 * y);
  var re = 1 / a - 1;
  var im = -1 / b;
  return [re, im];
}

// Find center point and radius of constant resistance circle
function resistanceToXYR(z) {
  const [x /*y*/] = impedanceToSmithCoordinates(z, 0);
  var cx = x / 2;
  var radius = -x / 2;
  return [cx, 0, radius];
}

// Find center point and radius of constant reactance circles
// draw the reactance arcs from R = 10 to R = 1
function reactanceToXYR(z) {
  z = -1 * z;
  var cy = 1 / z;

  //The arc must finish when it intersects the R=1 circle:
  //(x + 1)² + y² = 1
  //the arc is part of this circle:
  //x² + (y - 1/z)² = 1/z²
  //the intersection points are:
  // x = -2 / (z² + 1)
  // y = 2z / (z² + 1)
  var xEnd = -2 / (z * z + 1);
  var yEnd = (2 * z) / (z * z + 1);

  //The arc must start when it intersects the R=0.2 circle:
  //a = 2/(1+10)
  //(x - a)² + y² = a²
  //the intersection points are:
  // x = 2a / (z²a² + 1)
  // y = zax
  var a = -1 / (1 + 10);
  var xStart = (2 * a) / (z * z * a * a + 1);
  var yStart = z * a * xStart;

  return [cy, xStart, yStart, xEnd, yEnd];
}

//adjusts the coordinates based on the real size (in pixels) of the smith chart
function impedanceToSmithChart(re, im, width) {
  var [x, y] = impedanceToSmithCoordinates(re, im);
  var newX = x * width * 0.5;
  var newY = y * width * 0.5;
  return [Number(newX.toFixed(1)), Number(newY.toFixed(1))];
}

export default Graph;
