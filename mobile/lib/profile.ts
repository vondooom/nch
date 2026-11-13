import { useEffect, useState } from "react";
import { KEYS, readJSON, writeJSON } from "./storage";

// The signed-in hunter's own profile: handle, display name, home area, and the
// default for who sees their logbook. "How I hunt" stays in lib/userTypes.ts
// (its own store, already wired across the app); the server row merges both.
//
// Saved on this phone (nch.profile.v1) so the form works with no server and no
// bars. Server mirror: public.nch_profiles in 20261112 + 20261113_social.sql.
// Only YOUR profile lives here — other hunters come from the server only.

/** Who can see a logbook entry. Ordered narrowest → widest. */
export type Visibility = "only_me" | "groups" | "friends" | "public";

export const VISIBILITIES: { id: Visibility; label: string; blurb: string; icon: "lock-closed" | "people" | "person-add" | "globe-outline" }[] = [
  { id: "only_me", label: "Only me", blurb: "Nobody else. Group logs still follow the group's rules.", icon: "lock-closed" },
  { id: "groups", label: "My groups", blurb: "Hunters in your groups (not clients or guests).", icon: "people" },
  { id: "friends", label: "Friends", blurb: "Your groups plus friends — you follow each other.", icon: "person-add" },
  { id: "public", label: "Public", blurb: "Any signed-in hunter.", icon: "globe-outline" },
];

export const VISIBILITY_LABEL = Object.fromEntries(VISIBILITIES.map((v) => [v.id, v.label])) as Record<Visibility, string>;

const VIS = new Set<string>(VISIBILITIES.map((v) => v.id));
export const isVisibility = (v: unknown): v is Visibility => typeof v === "string" && VIS.has(v);

/**
 * Default for new hunters: friends. Bird counts go to people you've both
 * approved; GPS, blind names and notes stay inside your groups regardless
 * (lib/privacy.ts). Nothing leaves the phone until the server exists.
 */
export const DEFAULT_VISIBILITY: Visibility = "friends";

export type MyProfile = {
  handle: string;
  displayName: string;
  homeArea: string;
  logbookPrivacy: Visibility;
  updatedAt: number;
};

const EMPTY: MyProfile = { handle: "", displayName: "", homeArea: "", logbookPrivacy: DEFAULT_VISIBILITY, updatedAt: 0 };

// ── handle rules (mirrored by the CHECK in 20261113_social.sql) ───────────
// 3–20 chars, lowercase a–z / 0–9 / underscore, starts with a letter. Stored
// lowercase so uniqueness is case-insensitive and it drops into a URL as-is.
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
export const HANDLE_RE = /^[a-z][a-z0-9_]{2,19}$/;
export const DISPLAY_NAME_MAX = 40;
export const HOME_AREA_MAX = 60;

/** What the hunter typed → the stored form ("@Duck_Chris " → "duck_chris"). */
export const cleanHandle = (s: string) =>
  s.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, HANDLE_MAX);

/** null when fine, otherwise a short reason. Empty is allowed (no handle yet). */
export function handleProblem(h: string): string | null {
  if (!h) return null;
  if (h.length < HANDLE_MIN) return `At least ${HANDLE_MIN} characters.`;
  if (!/^[a-z]/.test(h)) return "Start with a letter.";
  if (!HANDLE_RE.test(h)) return "Letters, numbers and _ only.";
  return null;
}

function clean(raw: Partial<MyProfile> | null | undefined): MyProfile {
  const r = raw ?? {};
  const handle = cleanHandle(String(r.handle ?? ""));
  return {
    handle: HANDLE_RE.test(handle) ? handle : "",
    displayName: String(r.displayName ?? "").trim().slice(0, DISPLAY_NAME_MAX),
    homeArea: String(r.homeArea ?? "").trim().slice(0, HOME_AREA_MAX),
    logbookPrivacy: isVisibility(r.logbookPrivacy) ? r.logbookPrivacy : DEFAULT_VISIBILITY,
    updatedAt: Number(r.updatedAt) || 0,
  };
}

// One shared store (same pattern as userTypes) so the Logbook form, the
// profile screen and Connect agree without a provider.
type State = { profile: MyProfile; loaded: boolean };
let state: State = { profile: EMPTY, loaded: false };
const listeners = new Set<(s: State) => void>();
let booting: Promise<void> | null = null;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function bootProfile(): Promise<void> {
  if (!booting) booting = readJSON<Partial<MyProfile> | null>(KEYS.profile, null).then((p) => set({ profile: clean(p), loaded: true }));
  return booting;
}

export const getMyProfile = () => state.profile;

/** Save locally. Returns the cleaned profile that was stored. */
export async function saveMyProfile(patch: Partial<MyProfile>): Promise<MyProfile> {
  await bootProfile();
  const profile = clean({ ...state.profile, ...patch, updatedAt: Date.now() });
  set({ profile });
  await writeJSON(KEYS.profile, profile);
  return profile;
}

/** The visibility a hunt actually has: its override, else the hunter's default. */
export const effectiveVisibility = (entry: { visibility?: Visibility }, fallback: Visibility = state.profile.logbookPrivacy): Visibility =>
  isVisibility(entry.visibility) ? entry.visibility : fallback;

export function useMyProfile() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    void bootProfile();
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return { ...s, save: saveMyProfile };
}
