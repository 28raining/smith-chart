import { useTranslation } from "react-i18next";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import GitHubIcon from "@mui/icons-material/GitHub";
import Link from "@mui/material/Link";

function Footer() {
  const { t } = useTranslation();
  return (
    <Box sx={{ flexGrow: 1, mt: 5 }}>
      <AppBar position="static" sx={{ backgroundColor: "rgb(37, 50, 64)", py: 2 }}>
        <Toolbar>
          <Stack spacing={1} sx={{ width: "100%" }} direction={{ xs: "column", sm: "row" }}>
            <Typography sx={{ flexGrow: 1 }}>{t("footer.license", { year: new Date().getFullYear() })}</Typography>
            <Typography sx={{ px: 2 }}>{t("footer.version")}</Typography>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
              }}
            >
              <GitHubIcon sx={{ height: "24px", width: "24px", mr: 1 }} />
              <Link href="https://github.com/28raining/smith-chart" target="_blank" color="inherit">
                https://github.com/28raining/smith-chart
              </Link>
            </div>
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Footer;
