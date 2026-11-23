// Public conditions deliberately do not use store/seed rows: those records have
// no verified observation time, hunt date, location, or expiry. Keep them off
// public pages until a source-backed verification workflow exists.
export const conditionSources = [
  {
    id: "shoot-times",
    label: "California shoot times",
    value: "Unverified here",
    detail: "Choose your hunt date and area in the CDFW bird-hunting table; confirm species and refuge rules.",
    href: "https://wildlife.ca.gov/Regulations/Nor-Cal-Shoot-Times",
    source: "CDFW shooting times",
  },
  {
    id: "weather",
    label: "Weather & wind",
    value: "Live data unavailable",
    detail: "Look up the forecast and alerts for your exact hunting location before leaving.",
    href: "https://www.weather.gov/",
    source: "National Weather Service",
  },
  {
    id: "seasons",
    label: "California dove and upland",
    value: "Unverified here",
    detail: "Confirm the season year, species, area, dates, and limits with CDFW.",
    href: "https://wildlife.ca.gov/Hunting/Upland-Game-Birds",
    source: "CDFW seasons & limits",
  },
  {
    id: "moon",
    label: "Moon illumination",
    value: "Unverified here",
    detail: "Use the U.S. Naval Observatory table for your date and time zone.",
    href: "https://aa.usno.navy.mil/data/MoonFraction",
    source: "USNO moon data",
  },
] as const;
