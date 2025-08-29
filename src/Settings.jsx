import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

import { useState } from "react";

import { frequencyUnits, parseInput, polarToRectangular, rectangularToPolar, unitConverter } from "./commonFunctions";

function setValue(value, field, setX) {
  setX((z) => {
    const newCircuit = { ...z };
    newCircuit[field] = parseInput(value);
    return newCircuit;
  });
}

function setUnit(value, field, setX) {
  setX((z) => {
    const newCircuit = { ...z };
    newCircuit[field] = value;
    return newCircuit;
  });
}

function DisabledOverlay({ disabled, disabledText }) {
  return (
    disabled && (
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(69, 19, 19, 1)",
          padding: "4px 8px",
          borderRadius: 1,
          fontWeight: "bold",
          color: "white",
        }}
      >
        {disabledText ? disabledText : "Disabled — Add .s2p file"}
      </Typography>
    )
  );
}

export default function Settings({ settings, setSettings, usedF, chosenSparameter, chosenNoiseParameter }) {
  const [QInt, setQInt] = useState(0);
  const [VSWRInt, setVSWRInt] = useState(0);
  const [gainInInt, setGainInInt] = useState(0);
  const [gainOutInt, setGainOutInt] = useState(0);
  const [NFInt, setNFInt] = useState(0);

  const userFrequency = settings.frequency * unitConverter[settings.frequencyUnit];
  const s2p = chosenSparameter ? "S22" in chosenSparameter : false;
  const gInMax = s2p ? 10 * Math.log10(1 / (1 - chosenSparameter.S11.magnitude ** 2)) : null;
  const gOutMax = s2p ? 10 * Math.log10(1 / (1 - chosenSparameter.S22.magnitude ** 2)) : null;
  const NFMin = chosenNoiseParameter ? chosenNoiseParameter.fmin : null;

  return (
    <>
      <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
        Settings & Features
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 2 }} sx={{ display: "flex" }}>
          <TextField
            label="Zo"
            variant="outlined"
            size="small"
            sx={{ m: 0, p: 0, flex: 1 }}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">Ω</InputAdornment>,
              },
            }}
            value={settings.zo}
            onChange={(e) => setValue(e.target.value, "zo", setSettings)}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex" }}>
          <TextField
            label="Frequency"
            variant="outlined"
            size="small"
            error={usedF !== userFrequency}
            helperText={
              usedF === userFrequency ? "" : `f not in s-param. Using ${usedF / unitConverter[settings.frequencyUnit]}${settings.frequencyUnit}`
            }
            sx={{ m: 0, p: 0, flex: 1 }}
            value={settings.frequency}
            onChange={(e) => setValue(e.target.value, "frequency", setSettings)}
          />
          <Select size="small" name="fUnit" value={settings.frequencyUnit} onChange={(e) => setUnit(e.target.value, "frequencyUnit", setSettings)}>
            {Object.keys(frequencyUnits).map((u) => (
              <MenuItem value={u}>{u}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex" }}>
          <TextField
            label="Frequency Span ±"
            variant="outlined"
            size="small"
            sx={{ m: 0, p: 0, flex: 1 }}
            value={settings.fSpan}
            onChange={(e) => setValue(e.target.value, "fSpan", setSettings)}
          />
          <Select size="small" name="fSpanUnit" value={settings.fSpanUnit} onChange={(e) => setUnit(e.target.value, "fSpanUnit", setSettings)}>
            {Object.keys(frequencyUnits).map((u) => (
              <MenuItem value={u}>{u}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid size={{ xs: 12, lg: 2 }} sx={{ display: "flex" }}>
          <TextField
            label="Resolution"
            variant="outlined"
            size="small"
            sx={{ m: 0, p: 0, flex: 1 }}
            value={settings.fRes}
            onChange={(e) => setValue(Math.round(parseFloat(e.target.value)), "fRes", setSettings)}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">pts</InputAdornment>,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }} sx={{ display: "flex" }}>
          <CustomMarkersTable settings={settings} setSettings={setSettings} />
        </Grid>
        <CustomQTable
          QInt={QInt}
          setQInt={setQInt}
          settings={settings}
          setSettings={setSettings}
          title="Constant Q-factor circles"
          index="qCircles"
          disabled={false}
        />
        <CustomQTable
          QInt={VSWRInt}
          setQInt={setVSWRInt}
          settings={settings}
          setSettings={setSettings}
          title="Constant VSWR circles"
          index="vswrCircles"
          disabled={false}
        />
        <CustomQTable
          minValue={NFMin}
          QInt={NFInt}
          setQInt={setNFInt}
          settings={settings}
          setSettings={setSettings}
          title="Constant Noise Figure circles"
          index="nfCircles"
          unit="dB"
          disabled={!s2p || !chosenNoiseParameter}
          disabledText="Disabled — Add .s2p with noise"
        />
        <CustomQTable
          QInt={gainInInt}
          maxValue={gInMax}
          setQInt={setGainInInt}
          settings={settings}
          setSettings={setSettings}
          title="Input Gain Circles"
          index="gainInCircles"
          unit="dB"
          disabled={!s2p}
        />

        <CustomQTable
          QInt={gainOutInt}
          maxValue={gOutMax}
          setQInt={setGainOutInt}
          settings={settings}
          setSettings={setSettings}
          title="Output Gain Circles"
          index="gainOutCircles"
          unit="dB"
          disabled={!s2p}
        />
      </Grid>
    </>
  );
}

function CustomMarkersTable({ settings, setSettings }) {
  const [polar, setPolar] = useState(false);
  const [zMarkersInt, setZMarkersInt] = useState([25, 25]);

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ px: 1, py: 1, backgroundColor: "#effffd" }}>
      <Typography variant="h7" component="div" sx={{ pb: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Custom markers
        <span>
          <label>
            <input type="radio" name="choice" checked={polar === false} onChange={() => setPolar(false)} />
            Rectangular
          </label>
          <label>
            <input type="radio" name="choice" checked={polar === true} onChange={() => setPolar(true)} />
            Polar
          </label>
        </span>
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              Name
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              {polar ? "Magnitude" : "Real"}
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              {polar ? "Angle(°)" : "Imaginary"}
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              Add
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
            <TableCell component="th" scope="row" align="center" sx={{ px: 0.5 }}></TableCell>
            <TableCell align="center" sx={{ px: 1 }}>
              <TextField
                variant="outlined"
                size="small"
                value={zMarkersInt[0]}
                onChange={(e) => setZMarkersInt([parseInput(e.target.value), zMarkersInt[1]])}
              />
            </TableCell>
            <TableCell align="center" sx={{ px: 0.5 }}>
              <TextField
                variant="outlined"
                size="small"
                value={zMarkersInt[1]}
                onChange={(e) => setZMarkersInt([zMarkersInt[0], parseInput(e.target.value)])}
              />
            </TableCell>
            <TableCell align="center" sx={{ p: 0 }}>
              <IconButton
                sx={{ p: 1 }}
                onClick={() => {
                  var rectResult = zMarkersInt;
                  if (polar) {
                    const tmp = polarToRectangular({ magnitude: zMarkersInt[0], angle: zMarkersInt[1] });
                    rectResult = [tmp.real.toPrecision(3), tmp.imaginary.toPrecision(3)];
                  }
                  setSettings((z) => {
                    const newCircuit = { ...z };
                    newCircuit["zMarkers"] = [...settings.zMarkers, rectResult];
                    return newCircuit;
                  });
                  setZMarkersInt([0, 0]);
                }}
              >
                <AddCircleOutlineIcon sx={{ height: "24px", width: "24px" }} />
              </IconButton>
            </TableCell>
          </TableRow>
          {settings.zMarkers.map((row, i) => {
            const asPolar = rectangularToPolar({ real: row[0], imaginary: row[1] });
            return (
              <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }} key={i}>
                <TableCell sx={{ px: 1 }} component="th" scope="row" align="center">{`MK${i}`}</TableCell>
                <TableCell align="center">{polar ? asPolar.magnitude.toPrecision(3) : row[0]}</TableCell>
                <TableCell align="center">{polar ? asPolar.angle.toPrecision(3) : row[1]}</TableCell>
                <TableCell align="center">
                  <IconButton
                    aria-label="delete"
                    onClick={() => {
                      setSettings((z) => {
                        const n = { ...z };
                        n["zMarkers"] = [
                          ...n["zMarkers"].slice(0, i), // Items before the index `i`
                          ...n["zMarkers"].slice(i + 1),
                        ];
                        return n;
                      });
                    }}
                  >
                    <DeleteIcon sx={{ height: "20px", width: "20px" }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
function CustomQTable({ QInt, maxValue, minValue, setQInt, settings, setSettings, title, index, unit, disabled, disabledText }) {
  return (
    <Grid
      size={{ xs: 12, lg: 6 }}
      sx={{ display: "flex", position: "relative", opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}
    >
      <DisabledOverlay disabled={disabled} disabledText={disabledText} />
      <TableContainer component={Paper} variant="outlined" sx={{ px: 1, py: 1, backgroundColor: "#effffd" }}>
        <Typography variant="h7" component="div" sx={{ pb: 0.5 }}>
          {title} {maxValue ? ` (max = ${maxValue.toPrecision(3)}dB)` : minValue ? ` (min = ${minValue.toPrecision(3)}dB)` : ""}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
                Value
              </TableCell>
              <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
                Add
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell align="center">
                <TextField
                  variant="outlined"
                  size="small"
                  value={QInt}
                  onChange={(e) => setQInt(parseInput(e.target.value))}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
                    },
                  }}
                />
              </TableCell>
              <TableCell align="center" sx={{ py: 0 }}>
                <IconButton
                  disabled={(maxValue && QInt > maxValue) || (minValue && QInt < minValue)}
                  sx={{ p: 1 }}
                  onClick={() => {
                    setSettings((z) => {
                      const newCircuit = { ...z };
                      newCircuit[index] = [...settings[index], Math.abs(QInt)];
                      return newCircuit;
                    });
                    setQInt(0);
                  }}
                >
                  <AddCircleOutlineIcon sx={{ height: "24px", width: "24px" }} />
                </IconButton>
              </TableCell>
            </TableRow>
            {settings[index].map((row, i) => (
              <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }} key={i}>
                <TableCell component="th" scope="row" align="center">
                  {row}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    aria-label="delete"
                    onClick={() => {
                      setSettings((z) => {
                        const n = { ...z };
                        n[index] = [
                          ...n[index].slice(0, i), // Items before the index `i`
                          ...n[index].slice(i + 1),
                        ];
                        return n;
                      });
                    }}
                  >
                    <DeleteIcon sx={{ height: "20px", width: "20px" }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
}
