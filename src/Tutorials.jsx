import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useTranslation } from "react-i18next";

function Tutorials() {
  const { t } = useTranslation();
  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography component="span">{t("tutorials.title")}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ul>
            <li>
              <a href="https://github.com/28raining/smith-chart/blob/main/tutorials/s1p.md" target="_blank" rel="noreferrer">
                {t("tutorials.s1p")}
              </a>
            </li>
            <li>
              <a href="https://github.com/28raining/smith-chart/blob/main/tutorials/s2p.md" target="_blank" rel="noreferrer">
                {t("tutorials.s2p")}
              </a>
            </li>
            <li>
              <a href="https://github.com/28raining/smith-chart/blob/main/tutorials/noise.md" target="_blank" rel="noreferrer">
                {t("tutorials.noise")}
              </a>
            </li>
            <li>
              <a href="https://github.com/28raining/smith-chart/blob/main/tutorials/stability.md" target="_blank" rel="noreferrer">
                {t("tutorials.stability")}
              </a>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

export default Tutorials;
