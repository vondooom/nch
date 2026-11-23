import { NWS_CACHE_SECONDS, nationalWeatherServiceForecast } from "@/lib/conditions/nws";
import { federalDuckShootingHours } from "@/lib/conditions/shooting-hours";
import { sunForPoint } from "@/lib/conditions/sun";
import { findZone } from "@/lib/guides";
import { findState } from "@/lib/geo/states";
import { calendarDateInTimeZone } from "@/lib/seasons/open";

export const revalidate = 3600;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const stateSlug = params.get("state");
  const zoneSlug = params.get("zone");
  const zone = zoneSlug ? findZone(zoneSlug) : undefined;
  const state = (stateSlug ? findState(stateSlug) : undefined) ?? (zone ? findState(zone.state) : undefined);
  const point = zoneSlug ? zone?.point : state?.forecast;
  if (!state || !point) {
    return Response.json({ ok: false, message: "No forecast point for that page." }, { status: 404 });
  }
  const timeZone = state.timeZone;

  const today = calendarDateInTimeZone(timeZone);
  const sun = sunForPoint(today, timeZone, point.lat, point.lon);
  try {
    const forecast = await nationalWeatherServiceForecast(point.lat, point.lon);
    return Response.json(
      {
        ok: true,
        label: point.label,
        place: forecast.place,
        periods: forecast.periods,
        sun,
        shootingHours: {
          ...federalDuckShootingHours,
          start: sun.halfHourBeforeSunrise,
          end: sun.sunset,
        },
      },
      { headers: { "Cache-Control": `public, s-maxage=${NWS_CACHE_SECONDS}, stale-while-revalidate=86400` } },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        label: point.label,
        sun,
        shootingHours: {
          ...federalDuckShootingHours,
          start: sun.halfHourBeforeSunrise,
          end: sun.sunset,
        },
        message: "The National Weather Service forecast is unavailable right now.",
      },
      { status: 200, headers: { "Cache-Control": "public, max-age=60" } },
    );
  }
}
