import { useTranslation } from "react-i18next";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { supportedLanguages } from "./i18n.js";

function resolveCurrentCode(i18n) {
  const raw = i18n.resolvedLanguage || i18n.language || "en";
  const base = raw.split("-")[0];
  const match = supportedLanguages.find((l) => l.code === raw || l.code === base);
  return match ? match.code : "en";
}

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = resolveCurrentCode(i18n);
  const currentLabel = supportedLanguages.find((l) => l.code === current)?.label ?? current;

  return (
    <FormControl size="small" sx={{ minWidth: "10.5rem" }}>
      <Select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        inputProps={{ "aria-label": t("language.label") }}
        renderValue={() => currentLabel}
        sx={{
          color: "rgb(184, 255, 241)",
          fontSize: "0.8125rem",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(184, 255, 241, 0.5)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgb(184, 255, 241)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgb(184, 255, 241)",
          },
          "& .MuiSvgIcon-root": {
            color: "rgb(184, 255, 241)",
          },
        }}
      >
        {supportedLanguages.map(({ code, label }) => (
          <MenuItem key={code} value={code}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
