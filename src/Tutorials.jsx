import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

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
              <a href="https://github.com/28raining/smith-chart/blob/main/tutorials/s1p.md" target="_blank">
                Using .s1p files
              </a>
            </li>
            <li>
              <a href="https://github.com/28raining/smith-chart/blob/main/tutorials/s2p.md" target="_blank">
                Using .s2p files
              </a>
            </li>
            <li>
              <a href="https://github.com/28raining/smith-chart/blob/main/tutorials/noise.md" target="_blank">
                Designing for optimimum Noise Figure & Gain
              </a>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

export default Tutorials;
