import AsyncStorage from "@react-native-async-storage/async-storage";

// Every key the app persists. Versioned so a shape change can start clean
// instead of crashing on an old blob.
export const KEYS = {
  favorites: "nch.favorites.v1",
  weather: "nch.weather.v1",
  track: "nch.track.v1",
  trackMeta: "nch.trackMeta.v1",
  waypoints: "nch.waypoints.v1",
  hunts: "nch.hunts.v1",
  huntsSeeded: "nch.huntsSeeded.v1",
  teamCode: "nch.teamCode.v1",
} as const;

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private browsing). The in-memory copy still
    // drives the UI for this session.
  }
}
