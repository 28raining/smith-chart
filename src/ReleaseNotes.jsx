import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

function ReleaseNotes() {
  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography component="span">Release Notes</Typography>
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
                <TableCell>Version</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Notes</TableCell>
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
                  <ul>
                    <li>Added s-parameter component</li>
                    <li>Added gain circles for turning s2p gain</li>
                    <li>Added a couple of s-parameter tutorials</li>
                  </ul>
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
                    <li>Site moved from will-kelsey.com/smith_chart/ to onlinesmithchart.com</li>
                    <li>
                      Whole site re-written. Over 6 years many features were added to the old site which left the code very messy. Some users were
                      looking at the code to verify implementations, which was tough. Now, the code is much more organised and optimized. In the
                      future I hope the community can add features and improvements to the codebase.
                    </li>
                    <li>
                      Moved from vanilla JS to React + MUI. This allows: running lint, more maintainable code, smaller file size, many micro-benefits
                      from joining the mainstream
                    </li>
                    <li>As well as a re-write, the following new features are added:</li>
                    <ul>
                      <li>Smith chart is interactive - hover over the chart. This makes it possible to see Z when there are N curves (tol, fspan)</li>
                      <li>Components have sliders - quickly see whether to increase or decrease component values</li>
                      <li>Add Noise Figure circles</li>
                      <li>Add transformer component</li>
                      <li>Save whole state in the URL</li>
                    </ul>
                  </ul>
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
