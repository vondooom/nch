// Astronomical sunrise/sunset — the NOAA Solar Calculator algorithm (Meeus),
// iterated once at each event. Agrees with the US Naval Observatory to within
// a minute across our refuges; the cheaper suncalc approximation ran ~1 min
// late at sunset, which is the wrong direction for a legal close.

const rad = Math.PI / 180;
const deg = 180 / Math.PI;

/** Sun declination (rad) and equation of time (min) at Julian day `jd`. */
function solar(jd: number) {
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * rad) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * rad);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * rad);
  const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad));
  const y = Math.tan((eps * rad) / 2) ** 2;
  const eot =
    4 *
    deg *
    (y * Math.sin(2 * L0 * rad) -
      2 * e * Math.sin(M * rad) +
      4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) -
      0.5 * y * y * Math.sin(4 * L0 * rad) -
      1.25 * e * e * Math.sin(2 * M * rad));
  return { decl, eot };
}

/** Hour angle (deg) of the sun at the standard -0.833° rise/set altitude. */
function hourAngle(lat: number, decl: number) {
  const cosH = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl);
  return Math.acos(Math.max(-1, Math.min(1, cosH))) * deg;
}

export type SunTimes = { sunrise: Date; sunset: Date; solarNoon: Date };

/** Sun times for the calendar day containing `date` (device-local). */
export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const jdMidnight = utcMidnight / 86400000 + 2440587.5;
  // minutes after UTC midnight of the event, refined by re-evaluating the sun there
  const event = (sign: -1 | 0 | 1) => {
    let mins = 720 - 4 * lon;
    for (let i = 0; i < 2; i++) {
      const { decl, eot } = solar(jdMidnight + mins / 1440);
      mins = 720 - 4 * lon - eot + sign * 4 * hourAngle(lat, decl);
    }
    return new Date(utcMidnight + mins * 60000);
  };
  return { sunrise: event(-1), sunset: event(1), solarNoon: event(0) };
}

export const SHOOT_LEAD_MIN = 30;

export type ShootWindow = SunTimes & { open: Date; close: Date };

const MIN = 60000;

/**
 * California waterfowl: legal from 30 min before sunrise to sunset. Open is
 * rounded up and close rounded down to the whole minute, so the clock a hunter
 * reads is never a few seconds on the wrong side of legal.
 */
export function shootWindow(date: Date, lat: number, lon: number): ShootWindow {
  const t = sunTimes(date, lat, lon);
  return {
    ...t,
    open: new Date(Math.ceil((t.sunrise.getTime() - SHOOT_LEAD_MIN * MIN) / MIN) * MIN),
    close: new Date(Math.floor(t.sunset.getTime() / MIN) * MIN),
  };
}

export function formatClock(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return "--:--";
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => v.toString().padStart(2, "0")).join(":");
}

export function formatElapsed(ms: number): string {
  return formatCountdown(ms);
}
