import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { KEYS, readJSON, writeJSON } from "./storage";

// "How I hunt" — Tad & Weston's four hunter types (Nov 12, 2026). A hunter
// picks one or more; features union. Nothing is locked: the Index, logbook
// and map work for everyone, and an empty pick just shows the onboarding card.
// Stored on this phone (nch.userTypes.v1); the server mirror for later is
// nch_profiles.user_types in supabase/migrations/20261112_user_types_blinds_assignments.sql.

export type UserTypeId = "blind_lease" | "guide_service" | "refuge_rat" | "duck_club";

export const USER_TYPES: {
  id: UserTypeId;
  label: string;
  short: string;
  icon: keyof typeof Ionicons.glyphMap;
  blurb: string;
  gets: string[];
}[] = [
  {
    id: "blind_lease",
    label: "Blind Leasee",
    short: "Leasee",
    icon: "home",
    blurb: "1–2 rice blinds, same crew for years.",
    gets: ["Shared blind log", "Birds / hunter by blind, year over year", "Water, field & sightings", "Blind schedule", "Blind GPS pin"],
  },
  {
    id: "guide_service",
    label: "Pro / Guide Service",
    short: "Guide",
    icon: "briefcase",
    blurb: "Many blinds across counties. Owner + guides log; clients don't see results.",
    gets: ["Harvest across every property", "Map of blinds & access routes", "Daily guide / blind / client slate", "Performance by blind", "Bands & trophies per client"],
  },
  {
    id: "refuge_rat",
    label: "Refuge Rat / Nomadic",
    short: "Refuge Rat",
    icon: "compass",
    blurb: "State + federal refuges, free roam, public water.",
    gets: ["Sweat lines & reservation draws", "CDFW weekly harvest", "Regs & shoot days", "Scouting pins & launches", "On-phone leaderboard & share card"],
  },
  {
    id: "duck_club",
    label: "Duck Club Member",
    short: "Club",
    icon: "flag",
    blurb: "Club ground, many blinds, members draw or rotate.",
    gets: ["Club-wide log & season totals", "Blind-by-blind results", "Water levels", "Guest days vs. limit", "Blind draw with hot blinds"],
  },
];

export const USER_TYPE_BY_ID = Object.fromEntries(USER_TYPES.map((t) => [t.id, t])) as Record<UserTypeId, (typeof USER_TYPES)[number]>;

const VALID = new Set<string>(USER_TYPES.map((t) => t.id));

export function cleanTypes(raw: unknown): UserTypeId[] {
  if (!Array.isArray(raw)) return [];
  return USER_TYPES.map((t) => t.id).filter((id) => raw.includes(id) && VALID.has(id));
}

// One shared store so the Index strip, the Tracker header and the picker stay
// in step without a context provider.
type State = { types: UserTypeId[]; promptDismissed: boolean; loaded: boolean };
let state: State = { types: [], promptDismissed: false, loaded: false };
const listeners = new Set<(s: State) => void>();
let booted = false;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

async function boot() {
  if (booted) return;
  booted = true;
  const [types, dismissed] = await Promise.all([readJSON<unknown>(KEYS.userTypes, []), readJSON<boolean>(KEYS.userTypesPrompt, false)]);
  set({ types: cleanTypes(types), promptDismissed: dismissed, loaded: true });
}

export async function setUserTypes(types: UserTypeId[]) {
  const clean = cleanTypes(types);
  set({ types: clean });
  await writeJSON(KEYS.userTypes, clean);
}

export async function dismissTypesPrompt() {
  set({ promptDismissed: true });
  await writeJSON(KEYS.userTypesPrompt, true);
}

export function useUserTypes() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    void boot();
    return () => {
      listeners.delete(setS);
    };
  }, []);
  const has = (id: UserTypeId) => s.types.includes(id);
  return { ...s, has, setTypes: setUserTypes, dismissPrompt: dismissTypesPrompt };
}

export const typesLabel = (types: UserTypeId[]) => (types.length ? types.map((t) => USER_TYPE_BY_ID[t].short).join(" · ") : "Not set");
