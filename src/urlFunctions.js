import { circuitComponents } from "./circuitComponents.js";

export function syncObjectToUrl(settings, defaultSettings, circuit, defaultCircuit) {
  const params = new URLSearchParams(window.location.search);

  //handle the settings
  Object.keys(settings).forEach((key) => {
    let value = settings[key];
    let defaultValue = defaultSettings[key];

    if (key == "vswrCircles" || key == "qCircles") {
      if (value.length > 0) {
        const arrString = value.join("_");
        params.set(key, arrString);
      } else {
        params.delete(key);
      }
    } else if (key == "zMarkers") {
      if (value.length > 0) {
        const arrString = value.map((v) => v.join("_")).join("__");
        params.set(key, arrString);
      } else {
        params.delete(key);
      }
    } else if (key == "nfCircles") {
      if (value.length > 0) {
        const arrString = value.map((v) => `${v.NFmin}_${v.NF}_${v.Rn}`).join("__");
        params.set(key, arrString);
      } else {
        params.delete(key);
      }
    } else if (value !== defaultValue) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  if (
    circuit.length == 1 &&
    circuit[0].name == defaultCircuit[0].name &&
    circuit[0].real == defaultCircuit[0].real &&
    circuit[0].imaginary == defaultCircuit[0].imaginary
  ) {
    params.delete("circuit");
  } else {
    var circuitParams = [];
    for (const c of circuit) {
      circuitParams.push(circuitComponents[c.name].toURL(c));
    }
    params.set("circuit", circuitParams.join("__"));
  }
  const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
}

export function updateObjectFromUrl(settings, initialCircuit) {
  const params = new URLSearchParams(window.location.search);
  const settingsFromURL = {};
  var urlContainsState = false;

  Object.keys(settings).forEach((key) => {
    if (key == "circuit") return;
    if (params.has(key)) {
      urlContainsState = true;
      let value = params.get(key);
      if (key == "vswrCircles" || key == "qCircles") {
        settingsFromURL[key] = value ? value.split("_").map(Number) : [];
      } else if (key == "zMarkers") {
        const markers = value ? value.split("__") : [];
        settingsFromURL[key] = markers.map((m) => m.split("_").map(Number));
      } else if (key == "nfCircles") {
        const c = value ? value.split("__") : [];
        settingsFromURL[key] = c.map((m) => {
          const v = m.split("_");
          return { NFmin: Number(v[0]), NF: Number(v[1]), Rn: Number(v[2]) };
        });
      } else if (typeof settings[key] === "number") {
        settingsFromURL[key] = Number(value);
      } else {
        settingsFromURL[key] = value;
      }
    } else settingsFromURL[key] = settings[key];
  });

  var defaultCircuit = [{ ...initialCircuit[0] }];
  if (params.has("circuit")) {
    urlContainsState = true;
    const circuitStr = params.get("circuit");
    var defaultCircuit = circuitStr.split("__").map((c) => {
      const parts = c.split("_");
      return circuitComponents[parts[0]].fromURL(parts);
    });
  }

  return [settingsFromURL, defaultCircuit, urlContainsState];
}
