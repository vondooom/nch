"use client";

import { useEffect, useState } from "react";

type Period = {
  name: string;
  temperature: number | null;
  temperatureUnit: string;
  wind: string;
  shortForecast: string;
};

type Payload = {
  ok: boolean;
  label?: string;
  place?: string | null;
  periods?: Period[];
  message?: string;
  sun?: { sunrise: string | null; sunset: string | null };
  shootingHours?: {
    citation: string;
    sourceTitle: string;
    sourceUrl: string;
    quote: string;
    note: string;
    start: string | null;
    end: string | null;
  };
};

export function ConditionsPanel({
  state,
  zone,
}: {
  state?: string;
  zone?: string;
}) {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    const query = zone ? `zone=${encodeURIComponent(zone)}` : `state=${encodeURIComponent(state || "")}`;
    let cancel = false;
    fetch(`/api/conditions?${query}`)
      .then((response) => response.json())
      .then((payload: Payload) => {
        if (!cancel) setData(payload);
      })
      .catch(() => {
        if (!cancel) setData({ ok: false, message: "The National Weather Service forecast is unavailable right now." });
      });
    return () => {
      cancel = true;
    };
  }, [state, zone]);

  return (
    <section className="border-2 border-[#211D14] bg-[#FBF8F0] p-6">
      <div className="mb-2 font-heading text-[13px] font-semibold uppercase tracking-[0.16em] text-[#C75B12]">
        Conditions
      </div>
      <h2 className="mb-2 font-heading text-[28px] font-bold uppercase">Forecast, sunrise, sunset</h2>
      <p className="mb-4 font-serif text-[15px] leading-relaxed text-[#5C543F]">
        One National Weather Service point{data?.label ? ` (${data.place || data.label})` : ""}. This is not a forecast for the whole state or zone.
      </p>
      {!data ? <p className="font-serif text-[16px] text-[#3B3526]">Loading the forecast.</p> : null}
      {data && !data.ok ? <p className="font-serif text-[16px] text-[#3B3526]">{data.message}</p> : null}
      {data?.ok && data.periods ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.periods.map((period) => (
            <div key={period.name} className="border border-[#D8CDB4] p-4">
              <div className="font-heading text-[13px] font-bold uppercase tracking-[0.12em] text-[#8A8163]">{period.name}</div>
              <div className="mt-1 font-heading text-[26px] font-bold text-[#1C2B1A]">
                {period.temperature === null ? "n/a" : `${period.temperature}°${period.temperatureUnit}`}
              </div>
              <div className="font-serif text-[15px] text-[#3B3526]">{period.shortForecast}</div>
              {period.wind ? <div className="mt-1 font-serif text-[14px] text-[#5C543F]">Wind {period.wind}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
      {data?.sun ? (
        <p className="mt-4 font-serif text-[16px] text-[#3B3526]">
          Sunrise {data.sun.sunrise ?? "unavailable"}. Sunset {data.sun.sunset ?? "unavailable"}.
        </p>
      ) : null}
      {data?.shootingHours ? (
        <div className="mt-4 border-t border-[#D8CDB4] pt-4 font-serif text-[15px] leading-relaxed text-[#3B3526]">
          <p>
            Federal duck hours, {data.shootingHours.citation}
            {data.shootingHours.start && data.shootingHours.end
              ? `: ${data.shootingHours.start} to ${data.shootingHours.end} at this point.`
              : "."}{" "}
            <a className="text-[#C75B12] underline" href={data.shootingHours.sourceUrl}>
              {data.shootingHours.sourceTitle}
            </a>
          </p>
          <p className="mt-2">&ldquo;{data.shootingHours.quote}&rdquo;</p>
          <p className="mt-2">{data.shootingHours.note}</p>
        </div>
      ) : null}
      <p className="mt-4 text-[13px] font-medium text-[#8A8163]">
        Forecast from the National Weather Service (api.weather.gov). Sun times from suncalc.
      </p>
    </section>
  );
}
