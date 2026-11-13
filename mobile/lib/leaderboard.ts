import { HuntLog, isSeedHunt, locationLabel, seasonOf, SPECIES, speciesCount, total } from "./huntLog";

// Refuge-rat leaderboard, built only from hunts logged on THIS phone. There's
// no public board until the NorCalHunt database exists — the copy says so.
// Birds are credited to a hunter as the hunt's birds split evenly across the
// party (California limits are per hunter; the logbook doesn't record who
// shot what), so a 3-man limit credits each hunter a third.

export const BOARD_LOCAL_LINE = "On-phone board — only hunts logged on this phone. A shared board turns on once the NorCalHunt database is set up.";

export type BoardRow = { name: string; hunts: number; birds: number; perHunt: number };

export type Board = {
  season: string;
  hunters: BoardRow[];
  locations: BoardRow[];
  species: { name: string; count: number }[];
  hunts: number;
  birds: number;
};

const finish = (m: Map<string, { hunts: number; birds: number }>): BoardRow[] =>
  [...m.entries()]
    .map(([name, v]) => ({ name, hunts: v.hunts, birds: Math.round(v.birds * 10) / 10, perHunt: v.hunts ? v.birds / v.hunts : 0 }))
    .sort((a, b) => b.birds - a.birds || b.perHunt - a.perHunt);

export function buildBoard(all: HuntLog[], season: string, includeSamples: boolean): Board {
  const hunts = all.filter((h) => seasonOf(h.date) === season && (includeSamples || !isSeedHunt(h)));
  const hunters = new Map<string, { hunts: number; birds: number }>();
  const locs = new Map<string, { hunts: number; birds: number }>();
  const sp = new Map<string, number>();
  for (const h of hunts) {
    const birds = total(h.counts);
    const party = h.party.length ? h.party : ["Me"];
    for (const p of party) {
      const r = hunters.get(p) ?? { hunts: 0, birds: 0 };
      r.hunts++;
      r.birds += birds / party.length;
      hunters.set(p, r);
    }
    const l = locationLabel(h);
    const lr = locs.get(l) ?? { hunts: 0, birds: 0 };
    lr.hunts++;
    lr.birds += birds;
    locs.set(l, lr);
    for (const s of SPECIES) {
      const n = speciesCount(h.counts, s.id);
      if (n) sp.set(s.chartName, (sp.get(s.chartName) ?? 0) + n);
    }
  }
  return {
    season,
    hunters: finish(hunters),
    locations: finish(locs),
    species: [...sp].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    hunts: hunts.length,
    birds: hunts.reduce((a, h) => a + total(h.counts), 0),
  };
}

/** Plain-text share card for one hunt — for the RN Share sheet (texts, group chats). */
export function huntShareText(h: HuntLog): string {
  const species = SPECIES.filter((s) => speciesCount(h.counts, s.id) > 0).map((s) => `${speciesCount(h.counts, s.id)} ${s.chartName}`);
  const date = new Date(`${h.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return [
    `🦆 ${locationLabel(h)}${h.blind ? ` · ${h.blind}` : ""}`,
    `${date} · ${total(h.counts)} birds · ${Math.max(1, h.party.length)} hunter${h.party.length === 1 ? "" : "s"}`,
    species.length ? species.join(" · ") : "Skunked — still a good morning.",
    h.sky || h.windMph ? `${h.sky}${h.windMph ? ` · ${h.windMph} mph wind` : ""}${h.tempF ? ` · ${h.tempF}°F` : ""}` : "",
    h.bands?.length ? `🏷 ${h.bands.length} band${h.bands.length === 1 ? "" : "s"}` : "",
    "— logged with NorCalHunt",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Season card: top lines of the on-phone board. */
export function boardShareText(b: Board): string {
  const top = b.hunters.slice(0, 5).map((r, i) => `${i + 1}. ${r.name} — ${r.birds} birds (${r.hunts} hunts)`);
  const spots = b.locations.slice(0, 3).map((r) => `${r.name} ${r.perHunt.toFixed(1)}/hunt`);
  return [
    `🦆 NorCalHunt · ${b.season} season`,
    `${b.hunts} hunts · ${b.birds} birds`,
    top.length ? `\nLeaderboard\n${top.join("\n")}` : "",
    spots.length ? `\nBest spots: ${spots.join(" · ")}` : "",
    b.species[0] ? `Top bird: ${b.species[0].name} (${b.species[0].count})` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
