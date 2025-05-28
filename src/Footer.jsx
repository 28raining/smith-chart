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
import GitHubIcon from "@mui/icons-material/GitHub";
import Link from "@mui/material/Link";

function Footer() {
  return (
    <Box sx={{ flexGrow: 1, mt: 5 }}>
      <AppBar position="static" sx={{ backgroundColor: "rgb(37, 50, 64)", py: 2 }}>
        <Toolbar>
          <Stack spacing={1} sx={{width: '100%'}} direction={{ xs: "column", sm: "row" }}>
            <Typography sx={{ flexGrow: 1 }}>
              © {new Date().getFullYear()} Will Kelsey. This work is licensed under a Creative Commons Attribution 4.0
              International License. You may not resell this tool
            </Typography>
            <div style={{marginLeft: "auto", display: "flex", alignItems: "center" }}>
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
