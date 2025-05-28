import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";

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
  return (
    <>
      <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
        Settings & Features
      </Typography>
      <Grid container spacing={3}>
        <Grid size={4} sx={{ display: "flex" }}>
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
            // onChange={(e) => setSettings(s => {console.log('s',{...s}); return s})}
          />
        </Grid>
        <Grid size={4} sx={{ display: "flex" }}>
          <TextField
            label="Frequency"
            variant="outlined"
            size="small"
            sx={{ m: 0, p: 0, flex: 1 }}
            value={settings.frequency}
            onChange={(e) => setValue(e.target.value, "frequency", setSettings)}
          />
          <Select
            size="small"
            // sx={{ marginRight: 0.5 }}
            value={settings.frequencyUnit}
            onChange={(e) => setUnit(e.target.value, "frequencyUnit", setSettings)}
          >
            {Object.keys(frequencyUnits).map((u) => (
              <MenuItem value={u}>{u}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid size={4} sx={{ display: "flex" }}>
          <TextField
            label="Frequency Span ±"
            variant="outlined"
            size="small"
            sx={{ m: 0, p: 0 }}
            value={settings.fSpan}
            onChange={(e) => setValue(e.target.value, "fSpan", setSettings)}
          />
          <Select
            size="small"
            // sx={{ marginRight: 0.5 }}
            value={settings.fSpanUnit}
            onChange={(e) => setUnit(e.target.value, "fSpanUnit", setSettings)}
          >
            {Object.keys(frequencyUnits).map((u) => (
              <MenuItem value={u}>{u}</MenuItem>
            ))}
          </Select>
        </Grid>
      </Grid>
    </>
  );
}
