import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";

import SnackbarContent from "@mui/material/SnackbarContent";
import { ThemeProvider } from "@mui/material/styles";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import GetAppIcon from "@mui/icons-material/GetApp";

import { theme } from "./commonFunctions.js"; // import your theme

import SmithChartSvg from "./assets/smith-chart-icon.svg"; // import your SVG file
import Home from "./assets/home.svg"; // import your SVG file
import LanguageSwitcher from "./LanguageSwitcher.jsx";

function NavBar() {
  const { t } = useTranslation();
  const [urlSnackbar, setUrlSnackbar] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <Snackbar
        open={urlSnackbar}
        autoHideDuration={10000}
        onClose={() => setUrlSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        message="This Snackbar will be dismissed in 5 seconds."
      >
        <SnackbarContent
          message={t("nav.urlCopied")}
          sx={{
            backgroundColor: "#2196f3",
            color: "#fff",
            cursor: "pointer", // Indicate clickable
            maxWidth: 200,
          }}
        />
      </Snackbar>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ backgroundColor: "rgb(37, 50, 64)", py: 1 }}>
          <Toolbar
            style={{ minHeight: 0 }}
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={1} direction="row" alignItems="center">
              <img src={SmithChartSvg} alt="Smith Chart" width="50" height="50" style={{ marginRight: "10px", display: "block" }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: "bold", display: { xs: "none", sm: "none", md: "block" } }}>
                {t("nav.title")}
              </Typography>
            </Stack>
            <Stack spacing={1} direction={{ xs: "column", sm: "row" }} alignItems="center">
              <LanguageSwitcher />
              <Tooltip title={t("nav.copyUrl")} placement="bottom">
                <IconButton
                  aria-label={t("nav.copyUrlAria")}
                  color="bland"
                  //on user click then copy url to clipboard
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => {
                      setUrlSnackbar(true);
                    });
                  }}
                >
                  <GetAppIcon sx={{ fontSize: 30, color: "rgb(184, 255, 241)" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("nav.reset")} placement="bottom">
                <IconButton
                  aria-label={t("nav.resetAria")}
                  color="bland"
                  onClick={() => {
                    window.location.href = window.location.origin;
                  }}
                >
                  <RestartAltIcon sx={{ fontSize: 30, color: "rgb(184, 255, 241)" }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack spacing={1} direction={{ xs: "column", sm: "row" }}>
              <Button variant="contained" color="bland" component="a" href="https://www.will-kelsey.com" size="small">
                <img src={Home} alt="home" width="24" />
              </Button>
              <Button variant="contained" color="bland" component="a" href="https://onlinesmithchart.com" size="small">
                {t("nav.smithChart")}
              </Button>
              <Button variant="contained" color="bland" component="a" href="https://onlinecircuitsolver.com" size="small">
                {t("nav.circuitSolver")}
              </Button>
              <Button variant="contained" color="bland" component="a" href="https://trgmc.net" size="small">
                TRGMC
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>
      </Box>
    </ThemeProvider>
  );
}

export default NavBar;
