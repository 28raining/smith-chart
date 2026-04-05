import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useTranslation } from "react-i18next";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

function ReleaseNotes() {
  const { t } = useTranslation();
  const v21 = t("release.v21", { returnObjects: true });
  const v20features = t("release.v20features", { returnObjects: true });

  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography component="span">{t("release.title")}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table
            size="small"
            sx={{
              "& .MuiTableCell-root": {
                border: "1px solid #ccc",
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>{t("release.version")}</TableCell>
                <TableCell>{t("release.date")}</TableCell>
                <TableCell>{t("release.notes")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Typography>v2.1</Typography>
                </TableCell>
                <TableCell>
                  <Typography>August 2025</Typography>
                </TableCell>
                <TableCell>
                  <ul>{Array.isArray(v21) && v21.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography>v2.0</Typography>
                </TableCell>
                <TableCell>
                  <Typography>May 2025</Typography>
                </TableCell>
                <TableCell>
                  <ul>
                    <li>{t("release.v20a")}</li>
                    <li>{t("release.v20b")}</li>
                    <li>{t("release.v20c")}</li>
                    <li>{t("release.v20d")}</li>
                    <ul>{Array.isArray(v20features) && v20features.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography>v1.0</Typography>
                </TableCell>
                <TableCell>
                  <Typography>May 2018</Typography>
                </TableCell>
                <TableCell>
                  <i>{t("release.v10italic")}</i>
                  <p>{t("release.v10a")}</p>
                  <p>{t("release.v10b")}</p>
                  <p>{t("release.v10c")}</p>
                  <p>{t("release.v10d")}</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

export default ReleaseNotes;
