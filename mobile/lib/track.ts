import { distanceMeters, pathLength } from "./geo";
import { KEYS, readJSON, writeJSON } from "./storage";

// The walk-in breadcrumb trail. One store, fed by three producers:
//   · the foreground GPS watcher (map tab open)
//   · the background task (phone in the wader pocket)
//   · the "Simulate Walk-In Trek" mode (web / simulator / indoors)
// Points are persisted to AsyncStorage so the trail survives an app kill and
// the trip back to the truck can follow it.

export type TrackPoint = {
  lat: number;
  lon: number;
  acc: number | null;   // horizontal accuracy, m
  speed: number | null; // m/s
  heading: number | null;
  t: number;            // epoch ms
};

export type TrackSource = "gps" | "sim";

export type TrackState = {
  points: TrackPoint[];
  recording: boolean;
  source: TrackSource | null;
  startedAt: number | null;
  stoppedAt: number | null;
  background: boolean;
};

type Meta = Omit<TrackState, "points">;

const EMPTY: TrackState = { points: [], recording: false, source: null, startedAt: null, stoppedAt: null, background: false };

let state: TrackState = EMPTY;
let loaded: Promise<void> | null = null;
const listeners = new Set<(s: TrackState) => void>();

// Above this a fix is noise — a phone under a tule canopy can report ±80 m
// and draw a zigzag through the decoys.
const MAX_ACCURACY_M = 35;
const MIN_STEP_M = 1.5;

function emit() {
  for (const l of listeners) l(state);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist(immediate = false) {
  const write = () => {
    const { points, ...meta } = state;
    void writeJSON(KEYS.track, points);
    void writeJSON(KEYS.trackMeta, meta);
  };
  if (saveTimer) clearTimeout(saveTimer);
  if (immediate) write();
  else saveTimer = setTimeout(write, 1500);
}

export function loadTrack(): Promise<void> {
  if (!loaded) {
    loaded = (async () => {
      const [points, meta] = await Promise.all([
        readJSON<TrackPoint[]>(KEYS.track, []),
        readJSON<Partial<Meta>>(KEYS.trackMeta, {}),
      ]);
      state = { ...EMPTY, ...meta, points };
      emit();
    })();
  }
  return loaded;
}

export function getTrack(): TrackState {
  return state;
}

export function subscribeTrack(fn: (s: TrackState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set(patch: Partial<TrackState>, immediate = false) {
  state = { ...state, ...patch };
  emit();
  persist(immediate);
}

export async function startTrack(source: TrackSource, background = false, resume = false) {
  await loadTrack();
  set(
    {
      recording: true,
      source,
      background,
      startedAt: resume && state.startedAt ? state.startedAt : Date.now(),
      stoppedAt: null,
      points: resume ? state.points : [],
    },
    true,
  );
}

export function setBackground(background: boolean) {
  set({ background }, true);
}

export function stopTrack() {
  set({ recording: false, background: false, stoppedAt: Date.now() }, true);
}

export function clearTrack() {
  set({ ...EMPTY }, true);
}

/**
 * Append fixes from `source`, dropping inaccurate and stationary jitter. Fixes
 * from a producer that isn't the one recording are ignored, so a running
 * simulation never gets real GPS mixed into its trail (and vice versa).
 */
export async function appendPoints(pts: TrackPoint[], source: TrackSource) {
  await loadTrack();
  if (!state.recording || state.source !== source || pts.length === 0) return;
  const next = state.points.slice();
  for (const p of pts) {
    if (p.acc != null && p.acc > MAX_ACCURACY_M) continue;
    const last = next[next.length - 1];
    if (last && distanceMeters(last, p) < MIN_STEP_M) continue;
    next.push(p);
  }
  if (next.length !== state.points.length) set({ points: next });
}

export function trackDistance(s: TrackState): number {
  return pathLength(s.points);
}

export function trackElapsed(s: TrackState, now = Date.now()): number {
  if (!s.startedAt) return 0;
  // Simulated treks run on compressed time — their clock is the last fix.
  if (s.source === "sim") return (s.points[s.points.length - 1]?.t ?? s.startedAt) - s.startedAt;
  return (s.recording ? now : s.stoppedAt ?? now) - s.startedAt;
}
