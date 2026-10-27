import { cardinal, norm360 } from "./geo";
import { Refuge } from "./refuges";
import { pressureTrend, PressureTrend, RefugeWeather } from "./weather";

// The NorCalHunt Index — Tad's field read, 0–100.
//
// Six sub-scores, weighted the way the old-timers at the check station talk
// about a morning: wind and a change in the weather matter most, then what
// hunters actually shot, then the barometer and the birds' calendar, and
// temperature last.
//
//   Wind 20 · Weather Change 20 · Recent Hunter Reports 20
//   Barometer 15 · Migration Conditions 15 · Temperature 10

export type SubScore = { key: string; label: string; score: number; max: number; note: string };

export type IndexResult = {
  total: number;
  rating: Rating;
  subs: SubScore[];
  trend: PressureTrend;
  call: string;          // Tad's one-sentence recommendation
  decoyTip: string;
};

export type Rating = "Excellent" | "Good" | "Fair" | "Slow" | "Tough";

export function ratingFor(total: number): Rating {
  if (total >= 85) return "Excellent";
  if (total >= 70) return "Good";
  if (total >= 55) return "Fair";
  if (total >= 40) return "Slow";
  return "Tough";
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));


function windScore(w: RefugeWeather): SubScore {
  const s = w.windMph;
  // Sweet spot 8–18 mph: birds fly low, decoy hard, and can't see you as well.
  let v: number;
  if (s < 3) v = 5;
  else if (s < 8) v = 5 + ((s - 3) / 5) * 11;
  else if (s <= 18) v = 20;
  else if (s <= 28) v = 20 - ((s - 18) / 10) * 9;
  else v = 8;
  // Big gust spread makes a spread look wrong and birds flare.
  if (w.gustMph - s > 15) v -= 2;
  const note =
    s < 3 ? "Dead calm — birds will circle and look hard" :
    s < 8 ? "Light air — add motion to the spread" :
    s <= 18 ? "Working wind — birds will commit into it" :
    "Howler — birds stay low and hug the lee";
  return { key: "wind", label: "Wind", score: Math.round(clamp(v, 0, 20)), max: 20, note };
}

function changeScore(w: RefugeWeather): SubScore {
  const dp = Math.abs(w.pressureDelta24h);
  const dt = Math.abs(w.tempDelta24h);
  let v = 5 + dp * 70 + dt * 0.55;
  if (w.precipIn > 0) v += 3;
  if (w.cloudPct > 60) v += 2;
  if (/fog/i.test(w.sky)) v -= 2;
  const note =
    dp > 0.12 || dt > 12 ? "Front moving through — birds on the move" :
    dp > 0.05 || dt > 6 ? "Some change in the air" :
    "Stale weather — local birds only";
  return { key: "change", label: "Weather Change", score: Math.round(clamp(v, 0, 20)), max: 20, note };
}

function reportsScore(r: Refuge): SubScore {
  const bph = r.harvest.birdsPerHunter;
  const v = clamp((bph / 4.5) * 20, 0, 20);
  return {
    key: "reports",
    label: "Recent Hunter Reports",
    score: Math.round(v),
    max: 20,
    note: `${bph.toFixed(1)} birds/hunter · ${r.harvest.hunters} checked`,
  };
}

function baroScore(w: RefugeWeather, trend: PressureTrend): SubScore {
  let v = trend === "Falling" ? 13 : trend === "Steady" ? 9 : 6;
  // Low and falling ahead of a storm is the best of it; a high bluebird
  // ridge the worst.
  if (w.pressureInHg < 29.9) v += 2;
  if (w.pressureInHg > 30.25) v -= 2;
  const note =
    trend === "Falling" ? "Falling — birds feed hard ahead of weather" :
    trend === "Rising" ? "Rising — post-front, birds settle" :
    "Steady — a normal morning";
  return { key: "baro", label: "Barometer", score: Math.round(clamp(v, 0, 15)), max: 15, note };
}

function migrationScore(w: RefugeWeather, date: Date): SubScore {
  // Pacific Flyway calendar: early teal/pintail push in October, the main
  // northern flights mid-November into January.
  const m = date.getMonth();
  const d = date.getDate();
  let v =
    m === 9 ? 6 + (d / 31) * 3 :
    m === 10 ? 9 + (d / 30) * 3 :
    m === 11 ? 13 :
    m === 0 ? 12 :
    m === 1 ? 8 :
    4;
  // A north wind and a cold snap up the flyway deliver new birds.
  const fromNorth = norm360(w.windDir) > 290 || norm360(w.windDir) < 40;
  if (fromNorth && w.windMph > 8) v += 2;
  if (w.tempDelta24h < -6) v += 1;
  const note = fromNorth && w.windMph > 8 ? "North wind — fresh birds riding it down" : m <= 9 ? "Early flight — teal and pintail" : "Main flight building";
  return { key: "migration", label: "Migration Conditions", score: Math.round(clamp(v, 0, 15)), max: 15, note };
}

function tempScore(w: RefugeWeather): SubScore {
  const t = w.tempF;
  const v = t < 35 ? 10 : t < 42 ? 9 : t < 50 ? 7 : t < 58 ? 5 : t < 66 ? 3 : 1;
  const note = t < 42 ? "Cold — birds burn calories and feed" : t < 58 ? "Seasonable" : "Warm — birds loaf midday";
  return { key: "temp", label: "Temperature", score: v, max: 10, note };
}

/**
 * Where to put the blind and how to shape the spread for this wind. Ducks land
 * into the wind, so they approach from downwind: put the wind at your back or
 * quartering over a shoulder and leave the landing hole upwind of you.
 */
export function decoyTip(windDir: number, windMph: number): string {
  const from = cardinal(windDir);
  const face = cardinal(windDir + 180);
  if (windMph < 4) {
    return `Near-calm out of the ${from}: run loose family pods with wide gaps, put a jerk cord or spinner out front, and keep the hole small — birds will circle and come from anywhere.`;
  }
  if (windMph <= 15) {
    return `Wind out of the ${from}: face ${face} with it at your back or quartering, set a J-hook with the hook downwind and a 25–30 yd landing hole in front of the blind.`;
  }
  return `Strong ${from} wind: tight U-spread opening ${face}, decoys bunched in the lee, landing hole 20 yds out — birds will drop in fast and low, so shoot early.`;
}

function tadsCall(total: number, subs: SubScore[], w: RefugeWeather, r: Refuge, trend: PressureTrend): string {
  const get = (k: string) => subs.find((s) => s.key === k)!;
  const wind = get("wind");
  if (total >= 85) {
    return `Set the alarm early for ${r.short} — ${trend.toLowerCase()} glass, ${Math.round(w.windMph)} mph out of the ${cardinal(w.windDir)} and fresh reports say this is a burn-the-PTO morning.`;
  }
  if (total >= 70) {
    return wind.score >= 16
      ? `Good wind at ${r.short}; hunt the downwind edge of the biggest water and keep the spread tight.`
      : `Birds are at ${r.short} but the wind is lazy — bring motion and be patient past the first flight.`;
  }
  if (total >= 55) {
    return `Fair odds at ${r.short}: hunt the first hour hard, then pick up and scout for tomorrow instead of grinding.`;
  }
  return `Tough read at ${r.short} — stale ${w.sky.toLowerCase()} weather; if you go, hunt tight cover and expect singles and pairs.`;
}

export function computeIndex(r: Refuge, w: RefugeWeather, date = new Date()): IndexResult {
  const trend = pressureTrend(w.pressureDelta3h);
  const subs = [windScore(w), changeScore(w), reportsScore(r), baroScore(w, trend), migrationScore(w, date), tempScore(w)];
  const total = clamp(Math.round(subs.reduce((a, s) => a + s.score, 0)), 0, 100);
  return {
    total,
    rating: ratingFor(total),
    subs,
    trend,
    call: tadsCall(total, subs, w, r, trend),
    decoyTip: decoyTip(w.windDir, w.windMph),
  };
}

export function ratingColor(rating: Rating): string {
  switch (rating) {
    case "Excellent": return "#7fb069";
    case "Good": return "#e09f3e";
    case "Fair": return "#d9b44a";
    case "Slow": return "#c07a3a";
    default: return "#c5523f";
  }
}


