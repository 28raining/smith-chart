import { Grid, Typography, Box } from "@mui/material";
import { one_over_complex } from "./commonFunctions";
import Tooltip from "@mui/material/Tooltip";

import {processImpedance} from "./commonFunctions";



function ImpedanceRes({ type, zStr, zPolarStr }) {
  return (
    <>
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: 1,
          // mr: 0.5,
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
          // mr: 0.5,
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
          // mr: 0.5,
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

export default function Results({ z, zo }) {
  const { zStr, zPolarStr, refStr, refPolarStr, vswr, qFactor } = processImpedance(z, zo);
  return (
    <>
      <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
        Final Results
      </Typography>
      <Grid container spacing={1}>
        <Grid size={9} sx={{ display: "flex" }}>
          <ImpedanceRes type="Impedance (Ω)" zStr={zStr} zPolarStr={zPolarStr} />
        </Grid>
        <Tooltip title="Voltage Standing Wave Ratio" arrow placement="top">
          <Grid size={3} sx={{ display: "flex" }}>
            <MiniRes type="VSWR" res={vswr} />
          </Grid>
        </Tooltip>
        <Grid size={9} sx={{ display: "flex" }}>
          <ImpedanceRes type="Reflection Coefficient" zStr={refStr} zPolarStr={refPolarStr} />
        </Grid>
        <Grid size={3} sx={{ display: "flex" }}>
          <MiniRes type="Q Factor" res={qFactor} />
        </Grid>
      </Grid>
    </>
  );
}
