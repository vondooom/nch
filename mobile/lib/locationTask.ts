import { AppState, Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { appendPoints, TrackPoint } from "./track";

// Background GPS for the walk-in trail.
//
// TaskManager.defineTask must run at module scope on every JS launch —
// including a headless relaunch by iOS to deliver queued locations — so this
// module is imported from index.ts before the router. On web there is no task
// manager; the map falls back to the foreground watcher / simulator.

export const BG_LOCATION_TASK = "NORCALHUNT_BG_LOCATION_TASK";

export const TRACKING_OPTIONS = {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 2,
  timeInterval: 2000,
} as const;

export function toTrackPoint(l: Location.LocationObject): TrackPoint {
  return {
    lat: l.coords.latitude,
    lon: l.coords.longitude,
    acc: l.coords.accuracy,
    speed: l.coords.speed,
    heading: l.coords.heading,
    t: l.timestamp,
  };
}

export const backgroundSupported = Platform.OS === "ios" || Platform.OS === "android";

if (backgroundSupported) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(BG_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    // With the map open the foreground watcher already records every fix.
    if (AppState.currentState === "active") return;
    await appendPoints(data.locations.map(toTrackPoint), "gps");
  });
}

/** Ask for Always permission and start the background task. Returns why not, if not. */
export async function startBackgroundTracking(): Promise<string | null> {
  if (!backgroundSupported) return "Background tracking needs the iOS or Android app.";
  if (!(await TaskManager.isAvailableAsync())) return "Background tasks aren't available on this device.";
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return "Location permission is off. Enable it in Settings → NorCalHunt.";
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") return "Choose “Always” for NorCalHunt location to keep the trail running in your pocket.";
  if (await Location.hasStartedLocationUpdatesAsync(BG_LOCATION_TASK)) return null;
  await Location.startLocationUpdatesAsync(BG_LOCATION_TASK, {
    ...TRACKING_OPTIONS,
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "NorCalHunt is recording your walk-in",
      notificationBody: "Breadcrumb trail to the blind is live.",
      notificationColor: "#e09f3e",
    },
  });
  return null;
}

export async function stopBackgroundTracking() {
  if (!backgroundSupported) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(BG_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(BG_LOCATION_TASK);
    }
  } catch {
    // Task was never registered this install — nothing to stop.
  }
}
