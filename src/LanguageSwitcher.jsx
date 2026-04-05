import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { supportedLanguages } from "./i18n.js";

function LanguageOption({ flag, label }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: flag ? 0.75 : 0 }}>
      {flag ? (
        <Box component="span" aria-hidden sx={{ fontSize: "1.1em", lineHeight: 1 }}>
          {flag}
        </Box>
      ) : null}
      <span>{label}</span>
    </Box>
  );
}

function resolveCurrentCode(i18n) {
  const raw = i18n.resolvedLanguage || i18n.language || "en";
  const base = raw.split("-")[0];
  const match = supportedLanguages.find((l) => l.code === raw || l.code === base);
  return match ? match.code : "en";
}

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = resolveCurrentCode(i18n);
  const currentEntry = supportedLanguages.find((l) => l.code === current);
  const currentLabel = currentEntry?.label ?? current;
  const currentFlag = currentEntry?.flag;

  return (
    <FormControl size="small" sx={{ minWidth: "11.5rem" }}>
      <Select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        inputProps={{ "aria-label": t("language.label") }}
        renderValue={() => <LanguageOption flag={currentFlag} label={currentLabel} />}
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
        {supportedLanguages.map(({ code, label, flag }) => (
          <MenuItem key={code} value={code}>
            <LanguageOption flag={flag} label={label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
