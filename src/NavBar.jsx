import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { createTheme, ThemeProvider } from "@mui/material/styles";
const theme = createTheme({
  palette: {
    bland: {
      main: "#fff",
      light: "#dedfe0",
      dark: "#dedfe0",
      contrastText: "#242105",
    },
  },
});

import SmithChartSvg from "./assets/smith-chart-icon.svg"; // import your SVG file
import Download from "./assets/download.svg"; // import your SVG file
import Home from "./assets/home.svg"; // import your SVG file
function NavBar() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ backgroundColor: "rgb(37, 50, 64)" }}>
          <Container maxWidth="xl">
            <Toolbar>
              <img src={SmithChartSvg} alt="Smith Chart" width="50" height="50" style={{ marginRight: "10px" }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
                ONLINE SMITH CHART TOOL
              </Typography>
              <img src={Download} alt="download" width="30" style={{ marginRight: "100px", cursor: "pointer" }} />

              <Stack spacing={1} direction="row">
                <Button variant="contained" color="bland">
                  <img src={Home} alt="home" width="30" />
                </Button>
                <Button variant="contained" color="bland">
                  Smith Chart
                </Button>
                <Button variant="contained" color="bland">
                  Circuit Solver
                </Button>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
    </ThemeProvider>
  );
}

export default NavBar;
