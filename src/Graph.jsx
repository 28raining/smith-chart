import { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
// import { Tooltip, Typography } from "@mui/material";
import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import { arcColors, processImpedance } from "./commonFunctions.js";

const resistanceCircles = [0, 0.2, 0.5, 1, 2, 4, 10, Infinity];
const reactanceCircles = [0.2, 0.5, 1, 2, 4, 10, -0.2, -0.5, -1, -2, -4, -10];

const LightTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} slotProps={{
    popper: {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 0],
          },
        },
      ],
    },
  }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
    color: 'white',
    boxShadow: theme.shadows[1],
    fontSize: '0.8rem',
  },
}));

function formatNumber(num, maxDecimals) {
  // console.log('converting', num, " too ", Number(num.toFixed(maxDecimals)))
  // return num;
  // return num.toFixed(maxDecimals);
  return Number(num.toFixed(maxDecimals));
}

function Graph({ impedanceResults, zo }) {
  const width = 650;
  // const height = 650;
  var svg, svgGroup, svgLabels;
  const initializedRef = useRef(false);
  const svgRef = useRef(null);
  const topGroupRef = useRef(null);
  const tracingArcsRef = useRef(null);
  const labelsRef = useRef(null);
  const impedanceArcsRef = useRef(null);
  const dpCirclesRef = useRef(null);
  const [hoverImpedance, setHoverImpedance] = useState([0, 0]);
  // const [snapDetails, setSnapDetails] = useState({ real: 0, imaginary: 0 });
  var hoverSnaps = [];
  const markerRadius = 6;

  function HoverTooltip({z}) {
    var res = processImpedance(z, zo);
    return <>
      <p style={{margin:0, padding:0}}>Impedance = {res.zStr} ({res.zPolarStr})</p>
      <p style={{margin:0, padding:0}}>Refl-Coeff = {res.refStr} ({res.refPolarStr})</p>
      <p style={{margin:0, padding:0}}>VSWR = {res.vswr}</p>
      <p style={{margin:0, padding:0}}>Q-Factor = {res.qFactor}</p>
    </>
  }

  // console.log("rendering")

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    var re, im;
    console.log("initializing");

    [svg, svgGroup] = initializeSmithChart(svgRef, topGroupRef, tracingArcsRef, width); //draw the circles and add the labels
    // svgLabels = svgGroup.append("g").attr("id", "labels");
    var impedanceArc = d3.select(impedanceArcsRef.current);

    svg.on("mousemove", (event, d) => {
      var dpCircles = d3.select(dpCirclesRef.current);
      dpCircles.selectAll(".hoverDp").classed("hoverDp", false);
      const [mouseX, mouseY] = d3.pointer(event, svgGroup.node());
      var x = mouseX / (0.5 * width);
      var y = mouseY / (0.5 * width);
      var snapped = false;
      for (const [index, s] of hoverSnaps.entries()) {
        if (mouseX > s.x && mouseX < s.x + 2 * markerRadius && mouseY > s.y && mouseY < s.y + 2 * markerRadius) {
          re = s.real / zo;
          im = s.imaginary / zo;
          dpCircles.select(`#hover_dp_${index}`).classed("hoverDp", true);
          snapped = true;
          break;
        }
      }
      if (!snapped) {
        [re, im] = smithCoordinatesToImpedance(x, y);
      }
      setHoverImpedance([re, im]);

      var hoverReal = svgGroup.select("#hover_real");
      var hoverImaginary = svgGroup.select("#hover_imaginary");
      if (hoverReal.empty()) {
        svgGroup.append("circle").attr("id", "hover_real").attr("stroke-dasharray", "5,5");
      }
      if (hoverImaginary.empty()) {
        svgGroup.append("path").attr("id", "hover_imaginary").attr("stroke-dasharray", "5,5");
      }
      if (re > 0) {
        var [cx, cy, r] = resistanceToXYR(re);
        hoverReal
          .attr("cx", cx * width * 0.5) // X coordinate of the center
          .attr("cy", 0) // Y coordinate of the center
          .attr("r", r * width * 0.5); // Radius of the circle
      } else {
        hoverReal.remove();
        hoverImaginary.remove();
      }
      var [cy, xStart, yStart, xEnd, yEnd] = reactanceToXYR(im);
      if (im == 0) {
        hoverImaginary.attr("d", `M 0 0 L ${-2 * width * 0.5} 0`);
      } else {
        var clockwise = 0;
        if (cy < 0) clockwise = 1;
        hoverImaginary.attr("d", `M 0 0 A ${cy * width * 0.5} ${cy * width * 0.5} 0 0 ${clockwise} ${xEnd * width * 0.5} ${yEnd * width * 0.5}`);
      }
      // hoverImaginary.attr("cx", 0) // X coordinate of the center
      // .attr("cy", cy*width*0.5) // Y coordinate of the center
      // .attr("r", Math.abs(cy*width*0.5)); // Radius of the circle //FIXME - don't use math.abs?
    });
    svg.on("mouseout", (event, d) => {
      const [mouseX, mouseY] = d3.pointer(event, svg.node());
      var x = mouseX / (0.5 * width) - 2;
      var y = mouseY / (0.5 * width) - 1;
      var [re, im] = smithCoordinatesToImpedance(x, y);
      if (re < 0) {
        svgGroup.select("#hover_real").remove();
        svgGroup.select("#hover_imaginary").remove();
        // console.log("leaving");
      }
    });
  }, []);

  function addDpMarker(dpCircles, x, y, tol, point, color) {
    dpCircles
      .append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", markerRadius)
      .attr("fill", color)
      .attr("id", `tol_marker_${tol}`)
      .attr("stroke", "none");
    dpCircles
      .append("rect")
      .attr("x", x - markerRadius)
      .attr("y", y - markerRadius)
      .attr("width", 2 * markerRadius)
      .attr("height", 2 * markerRadius)
      .attr("fill", "none")
      .attr("stroke-width", "2")
      .attr("stroke", "none")
      .attr("id", `hover_dp_${hoverSnaps.length}`);
    hoverSnaps.push({
      x: x - markerRadius,
      y: y - markerRadius,
      real: point.real,
      imaginary: point.imaginary,
    });
  }

  useEffect(() => {
    // console.log("running a");
    var impedanceArc = d3.select("#impedanceArc");
    impedanceArc.selectAll("*").remove();
    var dpCircles = d3.select(dpCirclesRef.current);
    dpCircles.selectAll("*").remove();
    hoverSnaps = [];

    var coord = [];
    // for (var x = 1; x<impedanceResults.length; x++) {
    var tol, dp, point, startX, startY;
    var path = "";
    var newPath = "";
    for (tol = 0; tol < impedanceResults.length; tol++) {
      // for (dp=1; dp<impedanceResults[tol].length; dp++) {
      // [startX, startY] = impedanceToSmithChart(
      //   impedanceResults[tol][0][0].real / 50,
      //   impedanceResults[tol][0][0].imaginary / 50,
      //   width
      // );
      // console.log("77", impedanceResults[tol][0][0], startX, startY);
      for (dp = 0; dp < impedanceResults[tol].length; dp++) {
        coord = [];
        for (point of impedanceResults[tol][dp]) {
          // console.log(point)
          coord.push(impedanceToSmithChart(point.real / zo, point.imaginary / zo, width));
        }
        newPath = `M ${coord[0][0]} ${coord[0][1]} ${coord.map((c) => `L ${c[0]} ${c[1]}`).join(" ")}`;
        if (tol != impedanceResults.length - 1) {
          path = `${path} ${newPath}`;
          //add a circle at the last dp of the tol curves
          if (dp == impedanceResults[tol].length - 1) {
            addDpMarker(dpCircles, coord[coord.length - 1][0], coord[coord.length - 1][1], tol, point, "#8a8a8a");
            // dpCircles
            //   .append("circle")
            //   .attr("cx", coord[coord.length - 1][0])
            //   .attr("cy", coord[coord.length - 1][1])
            //   .attr("r", markerRadius)
            //   .attr("fill", "#8a8a8a")
            //   .attr("id", `tol_marker_${tol}`)
            //   .attr("stroke", "none");
            // dpCircles
            //   .append("rect")
            //   .attr("x", coord[coord.length - 1][0] - markerRadius)
            //   .attr("y", coord[coord.length - 1][1] - markerRadius)
            //   .attr("width", 2 * markerRadius)
            //   .attr("height", 2 * markerRadius)
            //   .attr("fill", "none")
            //   .attr("stroke-width", "2")
            //   .attr("stroke", "none")
            //   .attr("id", `hover_dp_${hoverSnaps.length}`);
            // hoverSnaps.push({
            //   x: coord[coord.length - 1][0] - markerRadius,
            //   y: coord[coord.length - 1][1] - markerRadius,
            //   real: point.real,
            //   imaginary: point.imaginary,
            // });
          }
        } else {
          //the last entry in impedanceResults array is the circuit without any tolerance applied

          impedanceArc
            .append("path")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("fill", "none")
            .attr("stroke", arcColors[dp % 10])
            .attr("stroke-width", 5)
            .attr("id", `dp_${dp}`)
            .attr("d", newPath);

          addDpMarker(dpCircles, coord[coord.length - 1][0], coord[coord.length - 1][1], tol, point, arcColors[dp % 10]);
          // dpCircles
          //   .append("circle")
          //   .attr("cx", coord[coord.length - 1][0])
          //   .attr("cy", coord[coord.length - 1][1])
          //   .attr("r", 6)
          //   .attr("fill", arcColors[dp % 10])
          //   .attr("stroke", "none");
        }
      }
    }
    // console.log(path);
    // the tolerance curves are all in one path
    if (path != "") {
      impedanceArc
        .append("path")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("fill", "none")
        .attr("stroke", "#8a8a8a")
        .attr("stroke-width", 3)
        .attr("d", path);
    }
  }, [impedanceResults, zo]);

  //draw the labels
  useEffect(() => {
    svgLabels = d3.select(labelsRef.current);
    svgLabels.selectAll("*").remove();
    resistanceCircles.map((z) => {
      // var dispRes = zo * z;
      if (z === Infinity) return;
      const [x, y] = impedanceToSmithCoordinates(z, 0);

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
      var [cy, xStart, yStart, xEnd, yEnd] = reactanceToXYR(z);
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
  }, [zo]);

  return (
    <LightTooltip title={<HoverTooltip z={{'real':hoverImpedance[0]*zo, 'imaginary':hoverImpedance[1]*zo}} />} followCursor sx={{maxWidth: 300}}>
      <svg ref={svgRef} style={{ padding: "5px" }}>
        <g id="topGroup" ref={topGroupRef}>
          <g id="tracingArcs" ref={tracingArcsRef} />
          <g id="labels" ref={labelsRef} />
          <g id="impedanceArc" ref={impedanceArcsRef} />
          <g id="dpCircles" ref={dpCirclesRef} />
        </g>
      </svg>
    </LightTooltip>
  );
}

function initializeSmithChart(svgRef, topGroupRef, tracingArcsRef, width) {
  // const reactanceCircles = [0.2, 0.5, 1, 2, 4, 10];

  // Select the SVG container
  var svgTop = d3.select(svgRef.current).attr("width", width).attr("height", width);
  var svg = d3
    .select(topGroupRef.current)
    .attr("transform", `translate(${width}, ${0.5 * width})`)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  var tracingArcs = d3.select(tracingArcsRef.current).attr("id", "tracingArcs").attr("stroke", "rgba(0, 0, 0, 0.75)");

  resistanceCircles.map((r) => {
    var [cx, cy, r] = resistanceToXYR(r);
    tracingArcs
      .append("circle")
      .attr("cx", cx * width * 0.5) // X coordinate of the center
      .attr("cy", 0) // Y coordinate of the center
      .attr("r", r * width * 0.5); // Radius of the circle
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
        `M ${xStart * width * 0.5} ${yStart * width * 0.5} A ${cy * width * 0.5} ${cy * width * 0.5} 0 0 ${clockwise} ${xEnd * width * 0.5} ${
          yEnd * width * 0.5
        }`
      );
  });

  //add constance admittance and susceptance curves
  resistanceCircles.map((r) => {
    var [cx, cy, r] = resistanceToXYR(r);
    tracingArcs
      .append("circle")
      .attr("cx", (-2 - cx) * width * 0.5) // X coordinate of the center
      .attr("cy", 0) // Y coordinate of the center
      .attr("r", r * width * 0.5) // Radius of the circle
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
        `M ${(-2 - xStart) * width * 0.5} ${yStart * width * 0.5} A ${cy * width * 0.5} ${cy * width * 0.5} 0 0 ${clockwise} ${
          (-2 - xEnd) * width * 0.5
        } ${yEnd * width * 0.5}`
      )
      .attr("stroke", "rgba(0, 0, 0, 0.25)");
  });

  //add a line down the middle
  tracingArcs.append("line").attr("x1", 0).attr("y1", 0).attr("x2", -width).attr("y2", 0);

  return [svgTop, svg];
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

//adjusts the coordinates based on the real size (in pixels) of the smith chart
function impedanceToSmithChart(re, im, width) {
  var [x, y] = impedanceToSmithCoordinates(re, im);
  var newX = x * width * 0.5;
  var newY = y * width * 0.5;
  return [newX.toFixed(1), newY.toFixed(1)];
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
  const [x, y] = impedanceToSmithCoordinates(z, 0);
  var cx = x / 2;
  var radius = -x / 2;
  return [cx, 0, radius];
}

// Find center point and radius of constant reactance circles
// draw the reactance arcs from R = 10 to R = 1
function reactanceToXYR(z) {
  var z = -1 * z;
  var cy = 1 / z;
  // var radius = Math.abs(1/z); //FIXME - use if else, math.abs too heavy

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
  // console.log("reactance z", z, xStart, yStart, xEnd, yEnd);

  return [cy, xStart, yStart, xEnd, yEnd];
}

export default Graph;
