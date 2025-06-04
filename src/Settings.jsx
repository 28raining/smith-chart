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

import { frequencyUnits, parseInput } from "./commonFunctions";

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

export default function Settings({ settings, setSettings }) {
  const [zMarkersInt, setZMarkersInt] = useState([25, 25]);
  const [QInt, setQInt] = useState(0);
  const [VSWRInt, setVSWRInt] = useState(0);
  const [NFInt, setNFInt] = useState({ NFmin: 1, NF: 1.5, Rn: 20 });

  return (
    <>
      <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
        Settings & Features
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex" }}>
          <TextField
            label="Characteristic Impedance (Zo)"
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
            sx={{ m: 0, p: 0, flex: 1 }}
            value={settings.frequency}
            onChange={(e) => setValue(e.target.value, "frequency", setSettings)}
          />
          <Select size="small" value={settings.frequencyUnit} onChange={(e) => setUnit(e.target.value, "frequencyUnit", setSettings)}>
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
          <Select size="small" value={settings.fSpanUnit} onChange={(e) => setUnit(e.target.value, "fSpanUnit", setSettings)}>
            {Object.keys(frequencyUnits).map((u) => (
              <MenuItem value={u}>{u}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
          <CustomMarkersTable zMarkersInt={zMarkersInt} setZMarkersInt={setZMarkersInt} settings={settings} setSettings={setSettings} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
          <CustomQTable
            QInt={QInt}
            setQInt={setQInt}
            settings={settings}
            setSettings={setSettings}
            title="Constant Q-factor circles"
            index="qCircles"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
          <CustomNFTable
            QInt={NFInt}
            setQInt={setNFInt}
            settings={settings}
            setSettings={setSettings}
            title="Constant Noise Figure circles"
            index="nfCircles"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
          <CustomQTable
            QInt={VSWRInt}
            setQInt={setVSWRInt}
            settings={settings}
            setSettings={setSettings}
            title="Constant VSWR circles"
            index="vswrCircles"
          />
        </Grid>
      </Grid>
    </>
  );
}

function CustomMarkersTable({ zMarkersInt, setZMarkersInt, settings, setSettings }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ px: 1, py: 1 }}>
      <Typography variant="h7" component="div" sx={{ pb: 0.5 }}>
        Add custom markers
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              Name
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              Real
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              Imaginary
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              Add
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow key="newData">
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
                  setSettings((z) => {
                    const newCircuit = { ...z };
                    newCircuit["zMarkers"] = [...settings.zMarkers, zMarkersInt];
                    return newCircuit;
                  });
                  setZMarkersInt([0, 0]);
                }}
              >
                <AddCircleOutlineIcon sx={{ height: "24px", width: "24px" }} />
              </IconButton>
            </TableCell>
          </TableRow>
          {settings.zMarkers.map((row, i) => (
            <TableRow key={i}>
              <TableCell sx={{ px: 1 }} component="th" scope="row" align="center">{`MK${i}`}</TableCell>
              <TableCell align="center">{row[0]}</TableCell>
              <TableCell align="center">{row[1]}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
function CustomQTable({ QInt, setQInt, settings, setSettings, title, index }) {
  return (
    <TableContainer component={Paper} variant="outlined" color="secondary" sx={{ px: 1, py: 1 }}>
      <Typography variant="h7" component="div" sx={{ pb: 0.5 }}>
        {title}
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
          <TableRow key="newData">
            <TableCell align="center">
              <TextField variant="outlined" size="small" value={QInt} onChange={(e) => setQInt(parseInput(e.target.value))} />
            </TableCell>
            <TableCell align="center" sx={{ py: 0 }}>
              <IconButton
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
            <TableRow key={i}>
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
  );
}
function CustomNFTable({ QInt, setQInt, settings, setSettings, title, index }) {
  return (
    <TableContainer component={Paper} variant="outlined" color="secondary" sx={{ px: 1, py: 1 }}>
      <Typography variant="h7" component="div" sx={{ pb: 0.5 }}>
        {title}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              NF<sub>min</sub>
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              NF
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              R<sub>N</sub>
            </TableCell>
            <TableCell align="center" sx={{ background: "rgb(37, 50, 64)", color: "white" }}>
              Add
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow key="newData">
            <TableCell align="center" sx={{ px: 0.5 }}>
              <TextField
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">dB</InputAdornment>,
                  },
                }}
                variant="outlined"
                size="small"
                value={QInt.NFmin}
                onChange={(e) => setValue(e.target.value, "NFmin", setQInt)}
              />
            </TableCell>
            <TableCell align="center" sx={{ px: 0.5 }}>
              <TextField
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">dB</InputAdornment>,
                  },
                }}
                variant="outlined"
                size="small"
                value={QInt.NF}
                onChange={(e) => setValue(e.target.value, "NF", setQInt)}
              />
            </TableCell>
            <TableCell align="center" sx={{ px: 0.5 }}>
              <TextField
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">Ω</InputAdornment>,
                  },
                }}
                variant="outlined"
                size="small"
                value={QInt.Rn}
                onChange={(e) => setValue(e.target.value, "Rn", setQInt)}
              />
            </TableCell>
            <TableCell align="center" sx={{ py: 0, px: 0.5 }}>
              <IconButton
                sx={{ p: 1 }}
                onClick={() => {
                  setSettings((z) => {
                    const newCircuit = { ...z };
                    newCircuit[index] = [...settings[index], QInt];
                    return newCircuit;
                  });
                  // setQInt(0);
                }}
              >
                <AddCircleOutlineIcon sx={{ height: "24px", width: "24px" }} />
              </IconButton>
            </TableCell>
          </TableRow>
          {settings[index].map((row, i) => (
            <TableRow key={i}>
              <TableCell component="th" scope="row" align="center">
                {`${row.NFmin}dB`}
              </TableCell>
              <TableCell component="th" scope="row" align="center">
                {`${row.NF}dB`}
              </TableCell>
              <TableCell component="th" scope="row" align="center">
                {`${row.Rn}Ω`}
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
  );
}
