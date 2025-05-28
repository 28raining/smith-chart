import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
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
} from "./commonFunctions.js";

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

function CustomComponent({
  modalOpen,
  setModalOpen,
  value,
  index,
  setUserCircuit,
  frequency,
  interpolation,
}) {
  const [customInput, setCustomInput] = useState("");

  const textInput = Object.keys(value)
    .map(
      (x) =>
        `${toEngineeringNotation(x)}, ${value[x].real}, ${value[x].imaginary}`,
    )
    .join("\n");

  const validCheckerResults = checkCustomZValid(customInput);
  const helperText =
    "If the textbox contains a comma it's assumed your data is comma separated, otherwise assumes whitespace separated. Each line must have 3 non-blank numberical values. The only accepted characters are 0-9, '-', '+', '.', e, E and ','. Frequency must be increasing";

  var objResult = {};
  if (validCheckerResults[0]) {
    for (const l of validCheckerResults[1])
      objResult[l[0]] = { real: l[1], imaginary: l[2] };
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
      <Dialog open={modalOpen}>
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
          <FormControlLabel
            value="sah"
            control={<Radio />}
            label="Sample & Hold"
          />
          <FormControlLabel
            value="linear"
            control={<Radio />}
            label="Linear Interpolation"
          />
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
          {validCheckerResults[0] ? "Save" : "Input Error - remove component"}
        </Button>
      </Dialog>
    </>
  );
}

function ImpedanceComponent({ real, imaginary }) {
  // console.log("impedance", real, imaginary);

  real = Number(real).toFixed(2);
  imaginary = Number(imaginary).toFixed(2);
  var zStr = "";
  if (real == 0) zStr = `${imaginary}jΩ`;
  else if (imaginary == 0) zStr = `${real}Ω`;
  else if (imaginary < 0) zStr = `${real}Ω - ${-imaginary}jΩ`;
  else zStr = `${real}Ω + ${imaginary}jΩ`;
  return (
    <Typography variant="caption" align="center" sx={{ display: "block" }}>
      Z = {zStr}
    </Typography>
  );
}

function SliderAdjust({ handleChange, value }) {
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
      valueLabelFormat={(value) => `${value}%`}
      onChange={(e) => handleChange(e.target.value)}
      color={value === 0 || value == undefined ? "primary" : "warning"}
    />
  );
}

function ComplexComponent({
  real,
  imaginary,
  index,
  setUserCircuit,
  slider_re,
  slider_im,
}) {
  return (
    <>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Re"
          variant="outlined"
          size="small"
          sx={{ mx: 0.5, p: 0, width: "9ch", padding: 0 }}
          value={real}
          onChange={(e) =>
            setValue(e.target.value, "real", setUserCircuit, index)
          }
        />
        <Typography
          sx={{ display: "flex", alignItems: "center", m: 0.0, p: 0 }}
        >
          +
        </Typography>
        <TextField
          label="Im"
          variant="outlined"
          size="small"
          sx={{ mx: 0.5, p: 0, width: "9ch", padding: 0 }}
          value={imaginary}
          onChange={(e) =>
            setValue(e.target.value, "imaginary", setUserCircuit, index)
          }
        />
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 0, mb: 1, zIndex: 10 }}>
        <SliderAdjust
          handleChange={(v) => setValue(v, "slider_re", setUserCircuit, index)}
          value={slider_re}
        />
        <SliderAdjust
          handleChange={(v) => setValue(v, "slider_im", setUserCircuit, index)}
          value={slider_im}
        />
      </Box>
    </>
  );
}

function TransformerComponent({
  l1,
  unit_l1,
  l2,
  unit_l2,
  k,
  index,
  setUserCircuit,
}) {
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
          onChange={(e) =>
            setValue(e.target.value, "l1", setUserCircuit, index)
          }
        />
        <Select
          value={unit_l1}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit_l1", setUserCircuit, index)
          }
        >
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
          onChange={(e) =>
            setValue(e.target.value, "l2", setUserCircuit, index)
          }
        />
        <Select
          value={unit_l2}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit_l2", setUserCircuit, index)
          }
        >
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
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={value}
          onChange={(e) =>
            setValue(e.target.value, "value", setUserCircuit, index)
          }
        />
        <Select
          value={unit}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit", setUserCircuit, index)
          }
        >
          {Object.keys(inductorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust
          handleChange={(v) => setValue(v, "slider", setUserCircuit, index)}
          value={slider}
        />
      </Box>
    </>
  );
}

function WireComponent({
  value,
  unit,
  index,
  setUserCircuit,
  slider,
  zo,
  frequency,
  eeff,
}) {
  var length, metricLength;
  if (unit == "λ") {
    metricLength =
      (((value * speedOfLight) / frequency) * (1 + slider / 100)) /
      Math.sqrt(eeff);
    if (metricLength > 1) length = `${metricLength.toPrecision(4)}m`;
    else if (metricLength > 1e-3)
      length = `${(metricLength * 1e3).toPrecision(4)}mm`;
    else if (metricLength > 1e-6)
      length = `${(metricLength * 1e6).toPrecision(4)}um`;
    else length = `${metricLength.toExponential(4)}m`;
  } else length = `${(value * (1 + slider / 100)).toPrecision(3)}${unit}`;
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
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={value}
          onChange={(e) =>
            setValue(e.target.value, "value", setUserCircuit, index)
          }
        />
        <Select
          value={unit}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit", setUserCircuit, index)
          }
        >
          {Object.keys(lengthUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust
          handleChange={(v) => setValue(v, "slider", setUserCircuit, index)}
          value={slider}
        />
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
        onChange={(e) =>
          setValue(e.target.value, "eeff", setUserCircuit, index)
        }
        helperText={
          eeff != 1 && unit == "λ"
            ? "Note - physical line length is changed"
            : ""
        }
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
          endAdornment: (
            <InputAdornment position="end">
              {type == "esr" ? "Ω" : "nH"}
            </InputAdornment>
          ),
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
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={value}
          onChange={(e) =>
            setValue(e.target.value, "value", setUserCircuit, index)
          }
        />
        <Select
          value={unit}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit", setUserCircuit, index)
          }
        >
          {Object.keys(resistorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust
          handleChange={(v) => setValue(v, "slider", setUserCircuit, index)}
          value={slider}
        />
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
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={value}
          onChange={(e) =>
            setValue(e.target.value, "value", setUserCircuit, index)
          }
        />
        <Select
          value={unit}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit", setUserCircuit, index)
          }
        >
          {Object.keys(capacitorUnits).map((u) => (
            <MenuItem value={u}>{u}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ display: "flex", m: 0, p: 0, zIndex: 10 }}>
        <SliderAdjust
          handleChange={(v) => setValue(v, "slider", setUserCircuit, index)}
          value={slider}
        />
      </Box>
    </>
  );
}
function LCComponent({
  value_l,
  unit_l,
  value_c,
  unit_c,
  index,
  setUserCircuit,
}) {
  return (
    <>
      <Box sx={{ display: "flex", m: 0, p: 0, mt: 1 }}>
        <TextField
          label="Inductance"
          variant="outlined"
          size="small"
          sx={{ mx: 0.5, p: 0, padding: 0 }}
          value={value_l}
          onChange={(e) =>
            setValue(e.target.value, "value_l", setUserCircuit, index)
          }
        />
        <Select
          value={unit_l}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit_l", setUserCircuit, index)
          }
        >
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
          onChange={(e) =>
            setValue(e.target.value, "value_c", setUserCircuit, index)
          }
        />
        <Select
          value={unit_c}
          size="small"
          sx={{ marginRight: 0.5 }}
          onChange={(e) =>
            setUnit(e.target.value, "unit_c", setUserCircuit, index)
          }
        >
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
      onChange={(e) =>
        setValue(e.target.value, "tolerance", setUserCircuit, index)
      }
    />
  );
}

function Circuit({ userCircuit, setUserCircuit, frequency }) {
  const w = 2 * Math.PI * frequency;
  const [modalOpen, setModalOpen] = useState(false);
  // console.log(userCircuit);

  function componentMap(type, component, index) {
    var real, imaginary;
    const slider_re =
      component.slider_re === undefined ? 0 : component.slider_re;
    const slider_im =
      component.slider_im === undefined ? 0 : component.slider_im;
    const slider = component.slider === undefined ? 0 : component.slider;

    switch (type) {
      case "impedance":
        if (component.name == "shortedInd" || component.name == "seriesInd") {
          real = 0;
          imaginary =
            component.value *
            2 *
            Math.PI *
            frequency *
            unitConverter[component.unit] *
            (1 + slider / 100);
        } else if (
          component.name == "shortedCap" ||
          component.name == "seriesCap"
        ) {
          real = 0;
          imaginary =
            -1 /
            (component.value *
              2 *
              Math.PI *
              frequency *
              unitConverter[component.unit]);
        } else if (
          component.name == "shortedRes" ||
          component.name == "seriesRes"
        ) {
          real =
            component.value *
            unitConverter[component.unit] *
            (1 + slider / 100);
          imaginary = 0;
        } else if (component.name == "seriesRlc") {
          var zj =
            (w * component.value_l * unitConverter[component.unit_l]) /
            (1 -
              w *
                w *
                component.value_l *
                component.value_c *
                unitConverter[component.unit_l] *
                unitConverter[component.unit_c]);
          var z = one_over_complex(
            1 / (component.value * unitConverter[component.unit]),
            -1 / zj,
          );
          real = z.real * (1 + slider / 100);
          imaginary = z.imaginary;
        } else if (component.name == "blackBox") {
          real = component.real * (1 + slider_re / 100); //for black box this will be correct
          imaginary = component.imaginary * (1 + slider_im / 100);
        }
        return (
          <ImpedanceComponent real={real} imaginary={imaginary} key={index} />
        );
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
        return (
          <ToleranceComponent
            tol={component.tolerance}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
          />
        );
      case "inductor":
        return (
          <InductorComponent
            value={component.value}
            unit={component.unit}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
            slider={slider}
          />
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
          <ResistorComponent
            value={component.value}
            unit={component.unit}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
            slider={slider}
          />
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
        return (
          <EsComponent
            type={"esr"}
            value={component.esr}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
          />
        );
      case "esl":
        return (
          <EsComponent
            type={"esl"}
            value={component.esl}
            index={index}
            setUserCircuit={setUserCircuit}
            key={type}
          />
        );
      default:
        return "";
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Grid container spacing={0} columns={{ xs: 6, sm: 12, md: 8, lg: 12 }}>
        {Object.keys(circuitComponents).map((k, i) => {
          const c = circuitComponents[k];
          if ("unselectable" in c) return null;
          else
            return (
              <Grid size={2} key={i}>
                <Button
                  variant="contained"
                  onClick={() =>
                    setUserCircuit([...userCircuit, { ...c.default, name: k }])
                  }
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
                  <Typography
                    variant="caption"
                    align="center"
                    gutterBottom
                    sx={{ display: "block" }}
                  >
                    {c.name}
                  </Typography>
                </Button>
              </Grid>
            );
        })}
      </Grid>
      <div style={{ display: "flex", width: "100%" }}>
        <p>
          Clicking components above will add them to the circuit below.
          Impedance is looking towards the BLACK BOX
        </p>
      </div>

      <Grid
        container
        spacing={0}
        columns={{ xs: 4, sm: 8, md: 4, lg: 8, xl: 12 }}
      >
        {userCircuit.map((c, i) => {
          const comp = circuitComponents[c.name];
          const color = arcColors[i % arcColors.length];
          return (
            <Grid
              size={2}
              key={i}
              sx={{ display: "flex", flexDirection: "column", borderRadius: 1 }}
              className="circuitDrawing"
            >
              <Box position="relative">
                <img src={comp.src} width="100%" />
                {i == 0 ? null : (
                  <IconButton
                    aria-label="delete"
                    onClick={() => {
                      setUserCircuit((z) => [
                        ...z.slice(0, i), // Items before the index `i`
                        ...z.slice(i + 1),
                      ]);
                    }}
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -8,
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
                <Typography
                  sx={{
                    position: "absolute",
                    top: 2,
                    left: 6,
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
