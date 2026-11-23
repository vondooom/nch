import { getTimes } from "suncalc";

export type SunRead = {
  sunrise: string | null;
  sunset: string | null;
  /** One-half hour before sunrise, for the federal duck rule only. */
  halfHourBeforeSunrise: string | null;
};

function offsetMinutes(timeZone: string, instant: Date) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = name?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] || 0));
}

function formatClock(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(instant);
}

export function sunForPoint(ymd: string, timeZone: string, lat: number, lon: number): SunRead {
  const [year, month, day] = ymd.split("-").map(Number);
  const noonGuess = new Date(Date.UTC(year, month - 1, day, 18, 0, 0));
  const times = getTimes(noonGuess, lat, lon, 0, offsetMinutes(timeZone, noonGuess));
  const sunrise = times.sunrise instanceof Date ? times.sunrise : null;
  const sunset = times.sunset instanceof Date ? times.sunset : null;
  const halfHour =
    sunrise && !Number.isNaN(sunrise.getTime()) ? new Date(sunrise.getTime() - 30 * 60 * 1000) : null;
  return {
    sunrise: sunrise && !Number.isNaN(sunrise.getTime()) ? formatClock(sunrise, timeZone) : null,
    sunset: sunset && !Number.isNaN(sunset.getTime()) ? formatClock(sunset, timeZone) : null,
    halfHourBeforeSunrise: halfHour && !Number.isNaN(halfHour.getTime()) ? formatClock(halfHour, timeZone) : null,
  };
}
