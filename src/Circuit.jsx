import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { ThemeProvider } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import DeleteIcon from "@mui/icons-material/Delete";
import Slider from "@mui/material/Slider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

import ArrowLeftRoundedIcon from "@mui/icons-material/ArrowLeftRounded";
import ArrowRightRoundedIcon from "@mui/icons-material/ArrowRightRounded";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";

const s2pExample = `# GHz S MA R 50
0.8 0.44 -157.6 4.725 84.3 0 0 0.339 -51.8
1.4 0.533 176.6 2.800 64.5 0 0 0.604 -58.3
2.0 0.439 159.6 2.057 49.2 0 0 0.294 -68.1
! Noise parameters
1.4 1.6 0.5 130 0.4`;

import {
  arcColors,
  inductorUnits,
  capacitorUnits,
  unitConverter,
  theme,
  resistorUnits,
  one_over_complex,
  lengthUnits,
  speedOfLight,
  parseInput,
  checkCustomZValid,
  CustomZAtFrequency,
  moveArrayItem,
} from "./commonFunctions.js";

import { parseTouchstoneFile } from "./sparam.js";

import { circuitComponents } from "./circuitComponents.js";

function setValue(value, field, setUserCircuit, index) {
  setUserCircuit((z) => {
    const newCircuit = [...z];
    newCircuit[index][field] = parseInput(value);
    return newCircuit;
  });
}

function setUnit(value, field, setUserCircuit, index) {
  setUserCircuit((z) => {
    const newCircuit = [...z];
    newCircuit[index][field] = value;
    return newCircuit;
  });
}

function toEngineeringNotation(num) {
  if (num == 0) return "0";
  const exponent = Math.floor(Math.log10(num) / 3) * 3;
  const mantissa = num / Math.pow(10, exponent);
  return `${mantissa}${exponent === 0 ? "" : "e" + exponent}`;
}

function CustomComponent({ modalOpen, setModalOpen, value, index, setUserCircuit, frequency, interpolation }) {
  const textInput = Object.keys(value)
    .map((x) => `${toEngineeringNotation(x)}, ${value[x].real}, ${value[x].imaginary}`)
    .join("\n");

  const [customInput, setCustomInput] = useState(textInput);

  const validCheckerResults = checkCustomZValid(customInput);
  const helperText =
    "If the textbox contains a comma it's assumed your data is comma separated, otherwise assumes whitespace separated. Each line must have 3 non-blank numberical values. The only accepted characters are 0-9, '-', '+', '.', e, E and ','. Frequency must be increasing";

  var objResult = {};
  if (validCheckerResults[0]) {
    for (const l of validCheckerResults[1]) objResult[l[0]] = { real: l[1], imaginary: l[2] };
  }
  var z = CustomZAtFrequency(value, frequency, interpolation);
  // console.log(validCheckerResults[1], objResult);
  return (
    <>
      <ImpedanceComponent real={z.real} imaginary={z.imaginary} />
      <Button
        sx={{ m: 2 }}
        variant="contained"
        color="primary"
        onClick={() => {
          setCustomInput(textInput);
          setModalOpen((o) => !o);
        }}
      >
        Set Impedance vs Frequency
      </Button>
      <Dialog open={modalOpen} fullScreen>
        <Box sx={{ p: 2 }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Custom Impedance input box
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Enter rows of impedance vs increasing frequency
            <br />
            Don't enter units or characters; use 2440e6 notation for 2440MHz
            <br />
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            comma separated: FREQUENCY, REAL, IMAGINARY
            <br />
            whitespace separated: FREQUENCY REAL IMAGINARY
            <br />
          </Typography>
          <TextField
            sx={{ width: "100%", p: 0 }}
            error={!validCheckerResults[0]}
            size="small"
            multiline
            minRows="3"
            maxRows="20"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            helperText={helperText}
          />
        </Box>
        <RadioGroup
          sx={{ m: 2 }}
          row
          value={interpolation}
          onChange={(e) => {
            setUserCircuit((c) => {
              const newCircuit = [...c];
              newCircuit[index].interpolation = e.target.value;
              return newCircuit;
            });
          }}
        >
          <FormControlLabel value="sah" control={<Radio />} label="Sample & Hold" />
          <FormControlLabel value="linear" control={<Radio />} label="Linear Interpolation" />
        </RadioGroup>
        <Button
          sx={{ m: 2 }}
          variant="contained"
          color={validCheckerResults[0] ? "primary" : "error"}
          onClick={() => {
            // setCustomInput(textInput);
            if (validCheckerResults[0]) {
              setUserCircuit((c) => {
                const newCircuit = [...c];
                newCircuit[index].value = objResult;
                return newCircuit;
              });
            } else {
              setUserCircuit((z) => [
                ...z.slice(0, index), // Items before the index `i`
                ...z.slice(index + 1),
              ]);
            }
            setModalOpen(false);
          }}
        >
          {validCheckerResults[0] ? "Save" : "Input error - remove component"}
        </Button>
      </Dialog>
    </>
  );
}

function SparamComponent({ modalOpen, setModalOpen, value, index, setUserCircuit, setPlotType, setSettings, frequency }) {
  const [customInput, setCustomInput] = useState(value.raw ? value.raw : "");
  const [showAllData, setShowAllData] = useState(false);
  const allcols = ["S11", "S21", "S12", "S22"];

  const gs0 = value.data[frequency] ? (value.data[frequency].S21 ? 10 * Math.log10(value.data[frequency].S21.magnitude ** 2) : 0) : 0;
  const parsed = parseTouchstoneFile(customInput);
  const validCheckerResults = parsed.error === null;
  const numRows = Object.keys(parsed.data).length;
  const defaultMaxRows = 300;
  const helperText = customInput == "" ? "Copy in a file" : validCheckerResults ? `${numRows} data points parsed succesfully` : parsed.error;
  return (
    <>
      <Typography variant="caption" align="center" sx={{ display: "block" }}>
        .{value.type} ~ GS0 = {gs0.toPrecision(3)}dB
      </Typography>
      <Button
        sx={{ m: 2 }}
        variant="contained"
        color="primary"
        onClick={() => {
          // setCustomInput();
          setModalOpen((o) => !o);
        }}
      >
        Enter S-param file
      </Button>
      <Dialog open={modalOpen} fullScreen>
        <Box sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Paste .s1p or .s2p file contents below
            </Typography>
            <Link onClick={() => setCustomInput(s2pExample)} sx={{ cursor: "pointer" }}>
              s2p example
            </Link>
            <small>
              {customInput.length} characters{customInput.length > 1000 ? ": 1K max for URL saving" : ""}
            </small>
            <Button
              sx={{ m: 0, ml: 1 }}
              variant="contained"
              color={customInput == "" ? "secondary" : validCheckerResults ? "primary" : "error"}
              onClick={() => {
                if (validCheckerResults) {
                  const allF = Object.keys(parsed.data);
                  const midF = allF[Math.floor(allF.length / 2)];
                  const fMin = allF[0]; //[0].frequency;
                  const fMax = allF[allF.length - 1]; //[parsed.data.length - 1].frequency;
                  setUserCircuit((c) => {
                    const newCircuit = [...c];
                    newCircuit[index] = parsed;
                    //if it's .s2p and the last item is not termination load, add it
                    if (parsed.type === "s2p" && newCircuit[newCircuit.length - 1].name !== "loadTerm") {
                      newCircuit.push({ ...circuitComponents.loadTerm.default, name: "loadTerm" });
                    } else if (parsed.type === "s1p" && newCircuit[newCircuit.length - 1].name === "loadTerm") {
                      newCircuit.splice(index + 1); //remove anything after s1p
                    }
                    return newCircuit;
                  });
                  setPlotType("sparam");
                  setSettings((s) => {
                    s.frequencyUnit = parsed.settings.freq_unit;
                    s.fSpanUnit = parsed.settings.freq_unit;
                    s.frequency = midF / unitConverter[parsed.settings.freq_unit];
                    s.fSpan = (2 * Math.max(fMax - midF, midF - fMin)) / unitConverter[parsed.settings.freq_unit];
                    return s;
                  });
                } else {
                  //user has asked to remove it
                  setUserCircuit((z) => [
                    ...z.slice(0, index), // Items before the index `i`
                    ...z.slice(index + 1),
                  ]);
                }
                setModalOpen(false);
              }}
            >
              {validCheckerResults ? "Save" : customInput == "" ? "No input - remove component?" : "Input error - remove component?"}
            </Button>
          </Box>
          <TextField
            sx={{ width: "100%", p: 1 }}
            error={!validCheckerResults}
            size="small"
            multiline
            minRows="3"
            maxRows="10"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            helperText={helperText}
          />
          {validCheckerResults && (
            <>
              <ul style={{ marginTop: 0 }}>
                <li>File type: .{parsed.type}</li>
                <li>Frequency Unit: {parsed.settings.freq_unit}</li>
                <li>Data Type: {parsed.settings.param}</li>
                <li>
                  Format: {parsed.settings.format} ({parsed.settings.format == "RI" ? "Rectangular" : "Polar"})
                </li>
                <li>Zo: {parsed.settings.zo}</li>
              </ul>
              ABOVE TEXT FORMATTED INTO A TABLE{" "}
              {numRows > defaultMaxRows && (showAllData ? "- All rows of data: " : `- First ${Math.min(defaultMaxRows, numRows)} rows of data: `)}
              {numRows > defaultMaxRows && <button onClick={() => setShowAllData((o) => !o)}>{showAllData ? "Show less" : "Show all"}</button>}
              <TableContainer sx={{ maxHeight: defaultMaxRows, border: "1px solid black" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell key="frequency">Frequency ({parsed.settings.freq_unit})</TableCell>
                      {allcols.map((column) => {
                        if (!(column in Object.values(parsed.data)[0])) return null;
                        return [
                          <TableCell key="mag">
                            |{column}|<small>dB</small>
                          </TableCell>,
                          <TableCell key="ang">∠{column}°</TableCell>,
                        ];
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(parsed.data).map((f, i) => {
                      if (!showAllData) if (i > defaultMaxRows) return null; // limit to defaultMaxRows rows for performance
                      return (
                        <TableRow hover tabIndex={-1} key={f}>
                          <TableCell key="freq">{(f / unitConverter[parsed.settings.freq_unit]).toLocaleString()}</TableCell>
                          {allcols.map((column) => {
                            if (!(column in parsed.data[f])) return null;
                            return [
                              <TableCell key="mag">{parsed.data[f][column].magnitude.toFixed(4)}</TableCell>,
                              <TableCell key="ang">{parsed.data[f][column].angle.toFixed(4)}</TableCell>,
                            ];
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography sx={{ display: "block", mt: 3 }}>Noise Data - note that noise frequencies not in s-param are discarded</Typography>
              <TableContainer sx={{ maxHeight: defaultMaxRows, border: "1px solid black" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Frequency ({parsed.settings.freq_unit})</TableCell>
                      <TableCell>NFmin</TableCell>
                      <TableCell>|GAMMAopt|</TableCell>
                      <TableCell>∠GAMMAopt</TableCell>
                      <TableCell>Rn</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(parsed.noise).map((f, i) => {
                      if (!showAllData) if (i > defaultMaxRows) return null; // limit to defaultMaxRows rows for performance
                      return (
                        <TableRow hover tabIndex={-1} key={f}>
                          <TableCell key="freq">{(f / unitConverter[parsed.settings.freq_unit]).toLocaleString()}</TableCell>
                          <TableCell key="nfmin">{parsed.noise[f].fmin}</TableCell>
                          <TableCell key="gamma_mag">{parsed.noise[f].gamma.magnitude}</TableCell>
                          <TableCell key="gamma_ang">{parsed.noise[f].gamma.angle}</TableCell>
                          <TableCell key="rn">{parsed.noise[f].rn}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Dialog>
    </>
  );
}

function ImpedanceComponent({ real, imaginary, zToVal }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState();

  real = Number(real).toFixed(2);
  imaginary = Number(imaginary).toFixed(2);
  var zStr = "";
  if (real == 0) zStr = `${imaginary}jΩ`;
  else if (imaginary == 0) zStr = `${real}Ω`;
  else if (imaginary < 0) zStr = `${real}Ω - ${-imaginary}jΩ`;
  else zStr = `${real}Ω + ${imaginary}jΩ`;

  const hasZToVal = typeof zToVal === "function";

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Typography variant="caption" component="span" sx={{ mr: 0.5 }}>
          Z =
        </Typography>
        <Typography variant="caption" component="span" sx={{ mr: 0.5 }}>
          {zStr}
        </Typography>
        {hasZToVal && (
          <Tooltip title="Set impedance (auto-calculate component value)" arrow>
            <IconButton
              size="small"
              sx={{ p: 0.2 }}
              onClick={() => {
                setEditValue(imaginary);
                setEditOpen(true);
              }}
            >
              <EditIcon sx={{ transform: "scale(0.6)" }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Enter impedance</Typography>
          <TextField
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            helperText="Enter numeric impedance (will be passed to the component calculator)"
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={() => setEditOpen(false)} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const v = Number(editValue);
                if (!Number.isNaN(v)) zToVal(v);
                setEditOpen(false);
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

function SliderAdjust({ handleChange, value, baseValue, unit }) {
  const formatAdjustedValue = (sliderValue) => {
    if (baseValue !== undefined && unit !== undefined) {
      const numValue = parseFloat(baseValue);
      if (!isNaN(numValue)) {
        const adjusted = numValue * (1 + (sliderValue || 0) / 100);
        // Format with appropriate precision
        const formatted = adjusted.toPrecision(4);
        return `${sliderValue}% (${formatted}${unit})`;
      }
    }
    return `${sliderValue}%`;
  };

  return (
    <Slider
      size="small"
      defaultValue={0}
      aria-label="Small"
      valueLabelDisplay="auto"
      sx={{ mx: 1 }}
      min={-20}
      max={20}
      step={1}
      value={value === undefined ? 0 : value}
      valueLabelFormat={(val) => formatAdjustedValue(val)}
      onChange={(e) => handleChange(e.target.value)}
      color={value === 0 || value == undefined ? "primary" : "warning"}
    />
  );
}

function ComplexComponent({ real, imaginary, index, setUserCircuit, slider_re, slider_im }) {
  return (
    <>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Re"
          variant="outlined"
          size="small"
          sx={{
            mx: 0.5,
            p: 0,
            minWidth: "6ch",
            padding: 0,
            "& .MuiInputBase-input": {
              textDecoration: slider_re === 0 || slider_re == undefined ? "none" : "line-through",
            },
          }}
          value={real}
          onChange={(e) => setValue(e.target.value, "real", setUserCircuit, index)}
        />
        <Typography sx={{ display: "flex", alignItems: "center", m: 0.0, p: 0 }}>+</Typography>
        <TextField
          label="Im"
          variant="outlined"
          size="small"
          sx={{
            mx: 0.5,
            p: 0,
            minWidth: "6ch",
            padding: 0,
            "& .MuiInputBase-input": {
              textDecoration: slider_im === 0 || slider_im == undefined ? "none" : "line-through",
            },
          }}
          value={imaginary}
          onChange={(e) => setValue(e.target.value, "imaginary", setUserCircuit, index)}
        />
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 0, mb: 1, zIndex: 10 }}>
        <SliderAdjust handleChange={(v) => setValue(v, "slider_re", setUserCircuit, index)} value={slider_re} baseValue={real} unit="" />
        <SliderAdjust handleChange={(v) => setValue(v, "slider_im", setUserCircuit, index)} value={slider_im} baseValue={imaginary} unit="j" />
      </Box>
    </>
  );
}

function TransformerComponent({ l1, unit_l1, l2, unit_l2, k, index, setUserCircuit }) {
  return (
    <>
      <Typography variant="caption" align="center" sx={{ display: "block" }}>
        ~
      </Typography>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="L1"
          variant="outlined"
          size="small"
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={l1}
          onChange={(e) => setValue(e.target.value, "l1", setUserCircuit, index)}
        />
        <Select value={unit_l1} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit_l1", setUserCircuit, index)}>
          {Object.keys(inductorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="L2"
          variant="outlined"
          size="small"
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={l2}
          onChange={(e) => setValue(e.target.value, "l2", setUserCircuit, index)}
        />
        <Select value={unit_l2} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit_l2", setUserCircuit, index)}>
          {Object.keys(inductorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <TextField
        label="Coupling Factor"
        variant="outlined"
        size="small"
        sx={{ mx: 0.5, p: 0, padding: 0, mt: 1 }}
        value={k}
        onChange={(e) => setValue(e.target.value, "k", setUserCircuit, index)}
      />
    </>
  );
}

function InductorComponent({ value, unit, index, setUserCircuit, slider }) {
  return (
    <>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Inductance"
          variant="outlined"
          size="small"
          sx={{
            mx: 0.5,
            p: 0,
            padding: 0,
            "& .MuiInputBase-input": {
              textDecoration: slider === 0 || slider == undefined ? "none" : "line-through",
            },
          }}
          value={value}
          onChange={(e) => setValue(e.target.value, "value", setUserCircuit, index)}
        />
        <Select value={unit} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit", setUserCircuit, index)}>
          {Object.keys(inductorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust handleChange={(v) => setValue(v, "slider", setUserCircuit, index)} value={slider} baseValue={value} unit={unit} />
      </Box>
    </>
  );
}

function WireComponent({ value, unit, index, setUserCircuit, slider, zo, frequency, eeff }) {
  var length, metricLength;
  var convertedUnit = unit;
  var convertedValue = value;
  if (unit == "deg") {
    convertedUnit = "λ";
    convertedValue = value / 360; // convert degrees to fraction of wavelength
  }
  if (convertedUnit == "λ") {
    metricLength = (((convertedValue * speedOfLight) / frequency) * (1 + slider / 100)) / Math.sqrt(eeff);
    if (metricLength > 1) length = `${metricLength.toPrecision(4)}m`;
    else if (metricLength > 1e-3) length = `${(metricLength * 1e3).toPrecision(4)}mm`;
    else if (metricLength > 1e-6) length = `${(metricLength * 1e6).toPrecision(4)}um`;
    else length = `${metricLength.toExponential(4)}m`;
  } else length = `${(convertedValue * (1 + slider / 100)).toPrecision(3)}${unit}`;
  // console.log("TL", length, slider)
  // const lengthWSlider = length * (1 + slider / 100);
  return (
    <>
      <Typography variant="caption" align="center" sx={{ display: "block" }}>
        length = {length}
      </Typography>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Length"
          variant="outlined"
          size="small"
          sx={{
            mx: 0.5,
            p: 0,
            padding: 0,
            "& .MuiInputBase-input": {
              textDecoration: slider === 0 || slider == undefined ? "none" : "line-through",
            },
          }}
          value={value}
          onChange={(e) => setValue(e.target.value, "value", setUserCircuit, index)}
        />
        <Select value={unit} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit", setUserCircuit, index)}>
          {Object.keys(lengthUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust handleChange={(v) => setValue(v, "slider", setUserCircuit, index)} value={slider} baseValue={value} unit={unit} />
      </Box>
      <TextField
        label="Zo"
        variant="outlined"
        size="small"
        sx={{ mx: 0.5, mb: 1.2, p: 0, padding: 0 }}
        value={zo}
        onChange={(e) => setValue(e.target.value, "zo", setUserCircuit, index)}
      />
      <TextField
        label="Eeff"
        variant="outlined"
        size="small"
        sx={{ mx: 0.5, mb: 1.2, p: 0, padding: 0 }}
        value={eeff}
        onChange={(e) => setValue(e.target.value, "eeff", setUserCircuit, index)}
        helperText={eeff != 1 && (unit == "λ" || unit == "deg") ? "Note - physical line length is changed" : ""}
      />
    </>
  );
}

function EsComponent({ type, value, setUserCircuit, index }) {
  return (
    <TextField
      label={type.toUpperCase()}
      variant="outlined"
      size="small"
      sx={{ mx: 0.5, mb: 1.2, p: 0, padding: 0 }}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">{type == "esr" ? "Ω" : "nH"}</InputAdornment>,
        },
      }}
      value={value === undefined ? "" : value}
      onChange={(e) => setValue(e.target.value, type, setUserCircuit, index)}
    />
  );
}

function ResistorComponent({ value, unit, index, setUserCircuit, slider }) {
  return (
    <>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Resistance"
          variant="outlined"
          size="small"
          sx={{
            mx: 0.5,
            p: 0,
            padding: 0,
            "& .MuiInputBase-input": {
              textDecoration: slider === 0 || slider == undefined ? "none" : "line-through",
            },
          }}
          value={value}
          onChange={(e) => setValue(e.target.value, "value", setUserCircuit, index)}
        />
        <Select value={unit} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit", setUserCircuit, index)}>
          {Object.keys(resistorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust handleChange={(v) => setValue(v, "slider", setUserCircuit, index)} value={slider} baseValue={value} unit={unit} />
      </Box>
    </>
  );
}
function CapacitorComponent({ value, unit, index, setUserCircuit, slider }) {
  return (
    <>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Capacitance"
          variant="outlined"
          size="small"
          sx={{
            mx: 0.5,
            p: 0,
            padding: 0,
            "& .MuiInputBase-input": {
              textDecoration: slider === 0 || slider == undefined ? "none" : "line-through",
            },
          }}
          value={value}
          onChange={(e) => setValue(e.target.value, "value", setUserCircuit, index)}
        />
        <Select value={unit} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit", setUserCircuit, index)}>
          {Object.keys(capacitorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust handleChange={(v) => setValue(v, "slider", setUserCircuit, index)} value={slider} baseValue={value} unit={unit} />
      </Box>
    </>
  );
}
function LCComponent({ value_l, unit_l, value_c, unit_c, index, setUserCircuit }) {
  return (
    <>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Inductance"
          variant="outlined"
          size="small"
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={value_l}
          onChange={(e) => setValue(e.target.value, "value_l", setUserCircuit, index)}
        />
        <Select value={unit_l} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit_l", setUserCircuit, index)}>
          {Object.keys(inductorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Capacitance"
          variant="outlined"
          size="small"
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={value_c}
          onChange={(e) => setValue(e.target.value, "value_c", setUserCircuit, index)}
        />
        <Select value={unit_c} size="small" sx={{ marginRight: 0.5 }} onChange={(e) => setUnit(e.target.value, "unit_c", setUserCircuit, index)}>
          {Object.keys(capacitorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
    </>
  );
}

function ToleranceComponent({ tol, index, setUserCircuit }) {
  if (tol === undefined) tol = "";
  return (
    <TextField
      size="small"
      label="Tolerance"
      sx={{ m: 0.6 }}
      style={{ marginTop: "auto" }}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
        },
      }}
      value={tol}
      onChange={(e) => setValue(e.target.value, "tolerance", setUserCircuit, index)}
    />
  );
}

function Circuit({ userCircuit, setUserCircuit, frequency, setPlotType, setSettings }) {
  const w = 2 * Math.PI * frequency;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSparam, setModalSparam] = useState(false);

  const sParamIndex = userCircuit.findIndex((c) => c.name === "sparam");
  const s1pIndex = userCircuit.findIndex((c) => c.type === "s1p");

  // console.log(userCircuit);

  function componentMap(type, component, index) {
    var real, imaginary;
    const slider_re = component.slider_re === undefined ? 0 : component.slider_re;
    const slider_im = component.slider_im === undefined ? 0 : component.slider_im;
    const slider = component.slider === undefined ? 0 : component.slider;
    let zToVal; // explicitly declared
    switch (type) {
      case "impedance":
        if (component.name == "shortedInd" || component.name == "seriesInd") {
          real = 0;
          imaginary = component.value * 2 * Math.PI * frequency * unitConverter[component.unit] * (1 + slider / 100);
          zToVal = (v) => {
            setValue(v / (2 * Math.PI * frequency * unitConverter[component.unit]), "value", setUserCircuit, index);
          };
        } else if (component.name == "shortedCap" || component.name == "seriesCap") {
          real = 0;
          imaginary = -1 / (component.value * 2 * Math.PI * frequency * unitConverter[component.unit] * (1 + slider / 100));
          zToVal = (v) => {
            setValue(-1 / (v * 2 * Math.PI * frequency * unitConverter[component.unit]), "value", setUserCircuit, index);
          };
        } else if (component.name == "shortedRes" || component.name == "seriesRes") {
          real = component.value * unitConverter[component.unit] * (1 + slider / 100);
          imaginary = 0;
        } else if (component.name == "seriesRlc") {
          var zj =
            (w * component.value_l * unitConverter[component.unit_l]) /
            (1 - w * w * component.value_l * component.value_c * unitConverter[component.unit_l] * unitConverter[component.unit_c]);
          var z = one_over_complex({ real: 1 / (component.value * unitConverter[component.unit]), imaginary: -1 / zj });
          real = z.real * (1 + slider / 100);
          imaginary = z.imaginary;
        } else if (component.name == "blackBox" || component.name == "loadTerm") {
          real = component.real * (1 + slider_re / 100); //for black box this will be correct
          imaginary = component.imaginary * (1 + slider_im / 100);
        }
        return <ImpedanceComponent real={real} imaginary={imaginary} key={index} zToVal={zToVal} />;
      case "complex":
        return (
          <ComplexComponent
            real={component.real}
            imaginary={component.imaginary}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
            slider_re={slider_re}
            slider_im={slider_im}
          />
        );
      case "custom":
        return (
          <CustomComponent
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            value={component.value}
            interpolation={component.interpolation}
            index={index}
            setUserCircuit={setUserCircuit}
            frequency={frequency}
            key={type}
          />
        );
      case "sparam":
        return (
          <SparamComponent
            modalOpen={modalSparam}
            setModalOpen={setModalSparam}
            value={component}
            index={index}
            setUserCircuit={setUserCircuit}
            frequency={frequency}
            setPlotType={setPlotType}
            key={type}
            setSettings={setSettings}
          />
        );
      case "transformer":
        return (
          <TransformerComponent
            l1={component.l1}
            unit_l1={component.unit_l1}
            l2={component.l2}
            unit_l2={component.unit_l2}
            k={component.k}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
          />
        );
      case "tolerance":
        return <ToleranceComponent tol={component.tolerance} index={index} setUserCircuit={setUserCircuit} key={type} />;
      case "inductor":
        return (
          <InductorComponent value={component.value} unit={component.unit} index={index} setUserCircuit={setUserCircuit} key={type} slider={slider} />
        );
      case "capacitor":
        return (
          <CapacitorComponent
            value={component.value}
            unit={component.unit}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
            slider={slider}
          />
        );
      case "resistor":
        return (
          <ResistorComponent value={component.value} unit={component.unit} index={index} setUserCircuit={setUserCircuit} key={type} slider={slider} />
        );
      case "lc":
        return (
          <LCComponent
            value_l={component.value_l}
            unit_l={component.unit_l}
            value_c={component.value_c}
            unit_c={component.unit_c}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
          />
        );
      case "wire":
        return (
          <WireComponent
            value={component.value}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
            zo={component.zo}
            unit={component.unit}
            eeff={component.eeff}
            slider={slider}
            frequency={frequency}
          />
        );
      case "esr":
        return <EsComponent type={"esr"} value={component.esr} index={index} setUserCircuit={setUserCircuit} key={type} />;
      case "esl":
        return <EsComponent type={"esl"} value={component.esl} index={index} setUserCircuit={setUserCircuit} key={type} />;
      default:
        return "";
    }
  }

  const lastElIsFixed = userCircuit[userCircuit.length - 1].name == "loadTerm" || userCircuit[userCircuit.length - 1].type == "s1p";
  const lastElement = lastElIsFixed ? userCircuit.length - 2 : userCircuit.length - 1;

  return (
    <ThemeProvider theme={theme}>
      <Grid container spacing={0} columns={{ xs: 6, sm: 12, md: 8, lg: 12 }}>
        {Object.keys(circuitComponents).map((k, i) => {
          const c = circuitComponents[k];
          if ("unselectable" in c) return null;
          else if (c.name == "S-Parameter" && sParamIndex !== -1)
            return null; //only one s-parameter component allowed
          else
            return (
              <Grid size={2} key={i}>
                <Button
                  variant="contained"
                  onClick={() => {
                    //if last element is load term or s1p insert before it
                    if (lastElIsFixed) {
                      setUserCircuit((z) => [...z.slice(0, -1), { ...c.default, name: k }, z[z.length - 1]]);
                    } else setUserCircuit([...userCircuit, { ...c.default, name: k }]);
                    if (k == "custom") {
                      setModalOpen(true);
                    } else if (k == "sparam") {
                      setModalSparam(true);
                    }
                  }}
                  color="bland"
                  style={{
                    flex: 1,
                    border: "1px #b0b2b8 dashed",
                    boxShadow: "inherit",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "start",
                    textTransform: "none",
                  }}
                >
                  <img src={c.src} width="100%" />
                  <Typography variant="caption" align="center" gutterBottom sx={{ display: "block" }}>
                    {c.name}
                  </Typography>
                </Button>
              </Grid>
            );
        })}
      </Grid>
      <div style={{ display: "flex", width: "100%" }}>
        <p>Click components above to add them to the circuit below. Impedance is looking {s1pIndex === -1 ? "towards the BLACK BOX" : "into DP1"}</p>
      </div>

      <Grid container spacing={0} columns={{ xs: 4, sm: 8, md: 4, lg: 8, xl: 12 }}>
        {userCircuit.map((c, i) => {
          const comp = circuitComponents[c.name];
          const color = arcColors[i % arcColors.length];
          return (
            <Grid size={2} key={i} sx={{ display: "flex", flexDirection: "column", borderRadius: 1 }} className="circuitDrawing">
              <Box position="relative">
                <img src={comp.src} width="100%" />
                {i == 0 || userCircuit[i].name == "loadTerm" ? null : (
                  <IconButton
                    onClick={() => {
                      setUserCircuit((z) => {
                        var newZ = [
                          ...z.slice(0, i), // Items before the index `i`
                          ...z.slice(i + 1),
                        ];
                        //if sparam and last element is loadTerm, remove it
                        if (c.name == "sparam" && newZ[newZ.length - 1].name == "loadTerm") {
                          newZ = [...newZ.slice(0, -1)];
                        }
                        return newZ;
                      });
                    }}
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: 0,
                    }}
                  >
                    <DeleteIcon
                      sx={{
                        height: "16px",
                        width: "16px",
                        color: "rgba(0, 0, 0, 0.34)",
                      }}
                    />
                  </IconButton>
                )}
                {i < 2 || (lastElIsFixed && i == userCircuit.length - 1) ? null : (
                  <IconButton
                    onClick={() => {
                      setUserCircuit((z) => moveArrayItem(z, i, i - 1));
                    }}
                    sx={{
                      position: "absolute",
                      bottom: -6,
                      left: 8,
                    }}
                  >
                    <ArrowLeftRoundedIcon
                      sx={{
                        height: 32,
                        width: 32,
                        color: "rgba(0, 0, 0, 0.34)",
                      }}
                    />
                  </IconButton>
                )}
                {i == 0 || i >= lastElement ? null : (
                  <IconButton
                    onClick={() => {
                      setUserCircuit((z) => moveArrayItem(z, i, i + 1));
                    }}
                    sx={{
                      position: "absolute",
                      bottom: -6,
                      right: 8,
                    }}
                  >
                    <ArrowRightRoundedIcon
                      sx={{
                        height: 32,
                        width: 32,
                        color: "rgba(0, 0, 0, 0.34)",
                      }}
                    />
                  </IconButton>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 3,
                    color: { color },
                  }}
                >
                  DP{i}
                </Typography>
              </Box>
              {comp.circuitInputs.map((input) => componentMap(input, c, i))}
            </Grid>
          );
        })}
      </Grid>
    </ThemeProvider>
  );
}

export default Circuit;
