import { Ionicons } from "@expo/vector-icons";
import { KEYS, readJSON, writeJSON } from "./storage";

export type WaypointKind = "blind" | "decoys" | "truck" | "check" | "bird" | "tule";

export const WAYPOINT_KINDS: Record<
  WaypointKind,
  { label: string; short: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  blind: { label: "Blind / AP", short: "BLIND", color: "#e09f3e", icon: "home" },
  decoys: { label: "Decoy Spread", short: "SPREAD", color: "#7fb069", icon: "ellipsis-horizontal-circle" },
  truck: { label: "Truck / Parking", short: "TRUCK", color: "#6fa8dc", icon: "car" },
  check: { label: "Check Station", short: "CHECK", color: "#c9c3ad", icon: "flag" },
  bird: { label: "Downed Bird Mark", short: "BIRD", color: "#e5533d", icon: "locate" },
  tule: { label: "Tule Crossing", short: "TULE", color: "#a3b86c", icon: "git-commit" },
};

export const WAYPOINT_ORDER: WaypointKind[] = ["blind", "decoys", "truck", "check", "bird", "tule"];

export type Waypoint = {
  id: string;
  kind: WaypointKind;
  label: string;
  notes: string;
  lat: number;
  lon: number;
  acc: number | null;
  createdAt: number;
  refugeId: string | null;
};

export async function loadWaypoints(): Promise<Waypoint[]> {
  return readJSON<Waypoint[]>(KEYS.waypoints, []);
}

export async function saveWaypoints(list: Waypoint[]): Promise<void> {
  await writeJSON(KEYS.waypoints, list);
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
