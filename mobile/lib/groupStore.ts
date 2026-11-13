import { useEffect, useState } from "react";
import { Assignment, loadAssignments, saveAssignments, sortAssignments } from "./assignments";
import { Blind, loadBlinds, saveBlinds } from "./blinds";
import { ClubDraw, loadClubDraws, saveClubDraws } from "./clubDraws";
import { GuestDay, loadGuestDays, saveGuestDays } from "./guestDays";
import { HuntGroup, loadGroups, saveGroups } from "./groups";

// One in-memory copy of the group-side stores (groups, blinds, slates, club
// draws, guest days) shared by every screen, persisted to AsyncStorage on each
// write. Same pattern as useWeather: the Index strip, the Tracker panels and
// the Map pins all read the same state, so a blind added in the Tracker shows
// on the Map without a reload. Everything here is on-device only.

type State = {
  groups: HuntGroup[];
  blinds: Blind[];
  assignments: Assignment[];
  clubDraws: ClubDraw[];
  guestDays: GuestDay[];
  loaded: boolean;
};

let state: State = { groups: [], blinds: [], assignments: [], clubDraws: [], guestDays: [], loaded: false };
const listeners = new Set<(s: State) => void>();
let booting: Promise<void> | null = null;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function bootGroupStore(): Promise<void> {
  if (!booting) {
    booting = Promise.all([loadGroups(), loadBlinds(), loadAssignments(), loadClubDraws(), loadGuestDays()]).then(
      ([groups, blinds, assignments, clubDraws, guestDays]) => set({ groups, blinds, assignments, clubDraws, guestDays, loaded: true }),
    );
  }
  return booting;
}

type Updater<T> = T[] | ((prev: T[]) => T[]);
const apply = <T,>(u: Updater<T>, prev: T[]) => (typeof u === "function" ? (u as (p: T[]) => T[])(prev) : u);

export const groupStore = {
  get: () => state,
  setGroups(u: Updater<HuntGroup>) {
    const groups = apply(u, state.groups);
    set({ groups });
    void saveGroups(groups);
  },
  setBlinds(u: Updater<Blind>) {
    const blinds = apply(u, state.blinds);
    set({ blinds });
    void saveBlinds(blinds);
  },
  setAssignments(u: Updater<Assignment>) {
    const assignments = sortAssignments(apply(u, state.assignments));
    set({ assignments });
    void saveAssignments(assignments);
  },
  setClubDraws(u: Updater<ClubDraw>) {
    const clubDraws = apply(u, state.clubDraws);
    set({ clubDraws });
    void saveClubDraws(clubDraws);
  },
  setGuestDays(u: Updater<GuestDay>) {
    const guestDays = apply(u, state.guestDays);
    set({ guestDays });
    void saveGuestDays(guestDays);
  },
};

export function useGroupStore() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    void bootGroupStore();
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return { ...s, ...groupStore };
}
