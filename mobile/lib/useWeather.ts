import { useCallback, useEffect, useState } from "react";
import { REFUGES } from "./refuges";
import { baselineWeather, loadCachedWeather, refreshWeather, WeatherMap } from "./weather";

// One weather store for every tab: the Index refreshes it, the map reads the
// wind for its arrow, the logbook pre-fills sky/wind/temp from it.

type State = { map: WeatherMap; loading: boolean; error?: string; updatedAt: number | null };

let state: State = {
  map: Object.fromEntries(REFUGES.map((r) => [r.id, baselineWeather(r)])),
  loading: false,
  updatedAt: null,
};
const listeners = new Set<(s: State) => void>();
let booted = false;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

// Treat a cache younger than this as live enough to skip a launch refresh.
const STALE_MS = 20 * 60 * 1000;

export async function refreshAll() {
  if (state.loading) return;
  set({ loading: true, error: undefined });
  const { map, error } = await refreshWeather(REFUGES, state.map);
  const newest = Math.max(...Object.values(map).map((w) => (w.source === "baseline" ? 0 : w.fetchedAt)));
  set({ map, loading: false, error, updatedAt: newest > 0 ? newest : state.updatedAt });
}

async function boot() {
  if (booted) return;
  booted = true;
  const cached = await loadCachedWeather();
  if (Object.keys(cached).length) {
    const newest = Math.max(...Object.values(cached).map((w) => (w.source === "baseline" ? 0 : w.fetchedAt)));
    set({ map: { ...state.map, ...cached }, updatedAt: newest > 0 ? newest : null });
    if (newest > 0 && Date.now() - newest < STALE_MS) return;
  }
  await refreshAll();
}

export function useWeather() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    void boot();
    return () => {
      listeners.delete(setS);
    };
  }, []);
  const refresh = useCallback(() => refreshAll(), []);
  return { ...s, refresh };
}
