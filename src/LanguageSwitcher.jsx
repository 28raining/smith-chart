import { useTranslation } from "react-i18next";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { supportedLanguages } from "./i18n.js";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = supportedLanguages.some((l) => l.code === i18n.language) ? i18n.language : "en";

  return (
    <Tooltip title={t("language.label")}>
      <ToggleButtonGroup
        value={current}
        exclusive
        size="small"
        onChange={(_, v) => v && i18n.changeLanguage(v)}
        sx={{
          "& .MuiToggleButton-root": {
            color: "rgb(184, 255, 241)",
            borderColor: "rgba(184, 255, 241, 0.5)",
            py: 0.25,
            px: 1,
            fontSize: "0.75rem",
          },
          "& .Mui-selected": {
            backgroundColor: "rgba(184, 255, 241, 0.2) !important",
            color: "rgb(184, 255, 241)",
          },
        }}
      >
        {supportedLanguages.map(({ code }) => (
          <ToggleButton key={code} value={code}>
            {code.toUpperCase()}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Tooltip>
  );
}
