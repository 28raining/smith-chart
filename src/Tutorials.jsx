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

function Tutorials() {
  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography component="span">Tutorials</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ul>
            <li>
              <a href="https://github.com/28raining/smith-chart/tutorials/s1p.md">Using .s1p files</a>
            </li>
            <li>
              <a href="https://github.com/28raining/smith-chart/tutorials/s2p.md">Using .s2p files</a>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

export default Tutorials;
