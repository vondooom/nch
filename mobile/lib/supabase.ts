import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { HuntLog, isSeedHunt, migrateHunt, teamKey, teamSyncable } from "./huntLog";

// Optional cloud sync for the logbook. The app is offline-first: every hunt is
// written to AsyncStorage before anything here runs, and with no Supabase env
// the sync calls are no-ops. Schema + RLS: supabase/schema.sql.

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || "";

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart the dev server.",
    );
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

type Row = {
  id: string;
  team_code: string;
  hunt_date: string;
  payload: HuntLog;
};

/** What leaves the phone: everything but local-only fields (the photo path). */
function toPayload(h: HuntLog): HuntLog {
  const { photo: _photo, ...rest } = h;
  return { ...rest, synced: true };
}

/**
 * Push real hunts that carry a team name (never the sample seed hunts).
 * Upserts on id, so an edited hunt updates its row instead of duplicating it.
 * team_code is the normalized key; the payload keeps the name as typed.
 * Returns the ids that made it up.
 */
export async function pushHunts(hunts: HuntLog[]): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const rows: Row[] = hunts
    .filter((h) => teamSyncable(h.teamCode) && !isSeedHunt(h))
    .map((h) => ({ id: h.id, team_code: teamKey(h.teamCode), hunt_date: h.date, payload: toPayload(h) }));
  if (!rows.length) return [];
  const { error } = await getSupabase().from("hunt_logs").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return rows.map((r) => r.id);
}

/** Pull every hunt your blind group has shared. */
export async function pullTeamHunts(teamCode: string): Promise<HuntLog[]> {
  if (!isSupabaseConfigured || !teamSyncable(teamCode)) return [];
  const { data, error } = await getSupabase()
    .from("hunt_logs")
    .select("payload")
    .eq("team_code", teamKey(teamCode))
    .order("hunt_date", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { payload: HuntLog }) => migrateHunt({ ...toPayload(r.payload), synced: true }));
}
