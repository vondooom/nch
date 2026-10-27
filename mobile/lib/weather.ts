import { Refuge } from "./refuges";
import { KEYS, readJSON, writeJSON } from "./storage";

// Live refuge weather.
//
// Primary: Open-Meteo — one batched request for all ten refuges (comma-joined
// lat/lon lists), no key, CORS-open so it works on web too. It gives current
// wind/gust/temp/pressure plus hourly pressure for the trend and daily
// sunrise/sunset to cross-check the astronomical shoot times.
//
// Fallback: National Weather Service latest station observation, per refuge.
//
// Last resort: a deterministic "desk baseline" so the Index never renders
// empty in a dead-zone parking lot. It's flagged as such in the UI.

export type PressureTrend = "Rising" | "Falling" | "Steady";
export type WeatherSource = "open-meteo" | "nws" | "baseline";

export type RefugeWeather = {
  refugeId: string;
  source: WeatherSource;
  fetchedAt: number;
  tempF: number;
  windMph: number;
  gustMph: number;
  windDir: number;          // degrees the wind blows FROM
  pressureInHg: number;     // sea-level (what a field barometer reads)
  surfaceInHg: number;      // station/surface pressure
  pressureDelta3h: number;  // inHg
  pressureDelta24h: number; // inHg
  tempDelta24h: number;     // °F
  cloudPct: number;
  precipIn: number;
  sky: string;
  sunrise?: number;         // epoch ms, from the API
  sunset?: number;
};

const hPaToInHg = (h: number) => h * 0.0295299830714;

export function pressureTrend(delta3h: number): PressureTrend {
  if (delta3h > 0.02) return "Rising";
  if (delta3h < -0.02) return "Falling";
  return "Steady";
}

// WMO weather interpretation codes → a word a hunter would use.
export function skyFor(code: number, cloud: number): string {
  if (code >= 95) return "Thunderstorms";
  if (code >= 80) return "Showers";
  if (code >= 71) return "Snow";
  if (code >= 61) return "Rain";
  if (code >= 51) return "Drizzle";
  if (code === 45 || code === 48) return "Tule fog";
  if (cloud > 85) return "Overcast";
  if (cloud > 50) return "Mostly cloudy";
  if (cloud > 20) return "Partly cloudy";
  return "Bluebird";
}

type OMBlock = {
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    surface_pressure: number;
    pressure_msl: number;
    cloud_cover: number;
    precipitation: number;
    weather_code: number;
  };
  hourly: { time: string[]; pressure_msl: number[]; temperature_2m: number[] };
  daily: { time: string[]; sunrise: string[]; sunset: string[] };
};

// Open-Meteo returns local wall-clock strings plus the UTC offset.
const localToEpoch = (s: string, offsetSec: number) => Date.parse(`${s}:00Z`) - offsetSec * 1000;

function fromOpenMeteo(r: Refuge, b: OMBlock): RefugeWeather {
  const c = b.current;
  const now = localToEpoch(c.time, b.utc_offset_seconds);
  const times = b.hourly.time.map((t) => localToEpoch(t, b.utc_offset_seconds));
  const at = (ms: number) => {
    let best = 0;
    for (let i = 0; i < times.length; i++) if (Math.abs(times[i] - ms) < Math.abs(times[best] - ms)) best = i;
    return best;
  };
  const iNow = at(now);
  const i3 = at(now - 3 * 3600e3);
  const i24 = at(now - 24 * 3600e3);
  const p = b.hourly.pressure_msl;
  const t = b.hourly.temperature_2m;
  const todayIdx = Math.max(0, b.daily.time.findIndex((d) => c.time.startsWith(d)));
  return {
    refugeId: r.id,
    source: "open-meteo",
    fetchedAt: Date.now(),
    tempF: c.temperature_2m,
    windMph: c.wind_speed_10m,
    gustMph: c.wind_gusts_10m,
    windDir: c.wind_direction_10m,
    pressureInHg: hPaToInHg(c.pressure_msl),
    surfaceInHg: hPaToInHg(c.surface_pressure),
    pressureDelta3h: hPaToInHg(p[iNow] - p[i3]),
    pressureDelta24h: hPaToInHg(p[iNow] - p[i24]),
    tempDelta24h: t[iNow] - t[i24],
    cloudPct: c.cloud_cover,
    precipIn: c.precipitation,
    sky: skyFor(c.weather_code, c.cloud_cover),
    sunrise: localToEpoch(b.daily.sunrise[todayIdx], b.utc_offset_seconds),
    sunset: localToEpoch(b.daily.sunset[todayIdx], b.utc_offset_seconds),
  };
}

export async function fetchOpenMeteo(refuges: Refuge[]): Promise<RefugeWeather[]> {
  const q = new URLSearchParams({
    latitude: refuges.map((r) => r.coords.lat.toFixed(4)).join(","),
    longitude: refuges.map((r) => r.coords.lon.toFixed(4)).join(","),
    current:
      "temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,pressure_msl,cloud_cover,precipitation,weather_code",
    hourly: "pressure_msl,temperature_2m",
    daily: "sunrise,sunset",
    past_days: "1",
    forecast_days: "2",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "America/Los_Angeles",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = (await res.json()) as OMBlock | OMBlock[];
  const blocks = Array.isArray(json) ? json : [json];
  return refuges.map((r, i) => fromOpenMeteo(r, blocks[i]));
}

/** Open-Meteo daily sunrise/sunset for an arbitrary point (Field Desk cross-check). */
export async function fetchSunVerification(
  lat: number,
  lon: number,
): Promise<{ date: string; sunrise: number; sunset: number }[]> {
  const q = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    daily: "sunrise,sunset",
    forecast_days: "2",
    timezone: "America/Los_Angeles",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const b = (await res.json()) as Pick<OMBlock, "daily" | "utc_offset_seconds">;
  return b.daily.time.map((d, i) => ({
    date: d,
    sunrise: localToEpoch(b.daily.sunrise[i], b.utc_offset_seconds),
    sunset: localToEpoch(b.daily.sunset[i], b.utc_offset_seconds),
  }));
}

type NWSValue = { value: number | null };

export async function fetchNWS(r: Refuge): Promise<RefugeWeather> {
  const headers = { Accept: "application/geo+json" };
  const pt = await (await fetch(`https://api.weather.gov/points/${r.coords.lat},${r.coords.lon}`, { headers })).json();
  const stations = await (await fetch(pt.properties.observationStations, { headers })).json();
  const id = stations.features[0].properties.stationIdentifier as string;
  const obs = await (await fetch(`https://api.weather.gov/stations/${id}/observations/latest`, { headers })).json();
  const p = obs.properties as Record<string, NWSValue> & { textDescription: string };
  const kmh = (v: NWSValue) => (v.value ?? 0) * 0.621371;
  const pa = p.seaLevelPressure.value ?? p.barometricPressure.value ?? 101325;
  return {
    refugeId: r.id,
    source: "nws",
    fetchedAt: Date.now(),
    tempF: ((p.temperature.value ?? 10) * 9) / 5 + 32,
    windMph: kmh(p.windSpeed),
    gustMph: Math.max(kmh(p.windGust), kmh(p.windSpeed)),
    windDir: p.windDirection.value ?? 0,
    pressureInHg: hPaToInHg(pa / 100),
    surfaceInHg: hPaToInHg((p.barometricPressure.value ?? pa) / 100),
    pressureDelta3h: 0,
    pressureDelta24h: 0,
    tempDelta24h: 0,
    cloudPct: 50,
    precipIn: 0,
    sky: p.textDescription || "—",
  };
}

/**
 * Deterministic stand-in when there's no signal and no cache: plausible late-
 * October valley weather that changes day to day, never second to second.
 */
export function baselineWeather(r: Refuge, day = new Date()): RefugeWeather {
  const seed = (day.getFullYear() * 400 + day.getMonth() * 31 + day.getDate()) * 7 + r.coords.lat * 100;
  const s = (k: number) => (Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1;
  const f = (k: number) => Math.abs(s(k));
  const d3 = (f(4) - 0.5) * 0.08;
  return {
    refugeId: r.id,
    source: "baseline",
    fetchedAt: Date.now(),
    tempF: 41 + f(1) * 18,
    windMph: 3 + f(2) * 17,
    gustMph: 8 + f(2) * 22,
    windDir: [315, 330, 300, 180, 160, 200, 0, 290][Math.floor(f(3) * 8)],
    pressureInHg: 29.85 + f(5) * 0.4,
    surfaceInHg: 29.8 + f(5) * 0.4,
    pressureDelta3h: d3,
    pressureDelta24h: d3 * 4,
    tempDelta24h: (f(6) - 0.5) * 14,
    cloudPct: Math.round(f(7) * 100),
    precipIn: f(8) > 0.8 ? 0.04 : 0,
    sky: skyFor(f(8) > 0.8 ? 61 : f(9) > 0.85 ? 45 : 0, Math.round(f(7) * 100)),
  };
}

export type WeatherMap = Record<string, RefugeWeather>;

export async function loadCachedWeather(): Promise<WeatherMap> {
  return readJSON<WeatherMap>(KEYS.weather, {});
}

/**
 * Refresh every refuge. Open-Meteo first (one request); refuges it can't
 * cover fall back to NWS individually; anything still missing keeps its cached
 * value or the desk baseline.
 */
export async function refreshWeather(refuges: Refuge[], cached: WeatherMap): Promise<{ map: WeatherMap; error?: string }> {
  const map: WeatherMap = {};
  let error: string | undefined;
  try {
    for (const w of await fetchOpenMeteo(refuges)) map[w.refugeId] = w;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    const nws = await Promise.allSettled(refuges.map(fetchNWS));
    nws.forEach((res) => {
      if (res.status === "fulfilled") map[res.value.refugeId] = res.value;
    });
  }
  for (const r of refuges) {
    if (!map[r.id]) map[r.id] = cached[r.id] ?? baselineWeather(r);
  }
  await writeJSON(KEYS.weather, map);
  return { map, error };
}
