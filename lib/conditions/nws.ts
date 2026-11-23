export const NWS_USER_AGENT = "LocalHunts/1.0 (https://localhunts.co)";

/** How long a National Weather Service response may be reused. */
export const NWS_CACHE_SECONDS = 3600;

export type ForecastPeriod = {
  name: string;
  temperature: number | null;
  temperatureUnit: string;
  wind: string;
  shortForecast: string;
};

type PointsBody = {
  properties?: {
    forecast?: string;
    relativeLocation?: { properties?: { city?: string; state?: string } };
  };
};

type ForecastBody = {
  properties?: {
    periods?: {
      name?: string;
      temperature?: number;
      temperatureUnit?: string;
      windSpeed?: string;
      windDirection?: string;
      shortForecast?: string;
    }[];
  };
};

async function nwsJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": NWS_USER_AGENT,
      Accept: "application/geo+json",
    },
    next: { revalidate: NWS_CACHE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`National Weather Service returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function nationalWeatherServiceForecast(lat: number, lon: number) {
  const points = await nwsJson<PointsBody>(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
  const forecastUrl = points.properties?.forecast;
  if (!forecastUrl) throw new Error("National Weather Service did not return a forecast link");
  const forecast = await nwsJson<ForecastBody>(forecastUrl);
  const city = points.properties?.relativeLocation?.properties?.city;
  const region = points.properties?.relativeLocation?.properties?.state;
  const periods: ForecastPeriod[] = (forecast.properties?.periods ?? []).slice(0, 4).map((period) => ({
    name: period.name || "Forecast",
    temperature: typeof period.temperature === "number" ? period.temperature : null,
    temperatureUnit: period.temperatureUnit || "F",
    wind: [period.windDirection, period.windSpeed].filter(Boolean).join(" "),
    shortForecast: period.shortForecast || "",
  }));
  return {
    place: city && region ? `${city}, ${region}` : null,
    periods,
  };
}
