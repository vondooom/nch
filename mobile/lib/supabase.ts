import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, PostgrestError, Session, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { HuntLog, isSeedHunt, migrateHunt, teamKey, teamSyncable } from "./huntLog";

// Optional cloud sync for the logbook. The app is offline-first: every hunt is
// written to AsyncStorage before anything here runs, and with no Supabase env
// the sync calls are no-ops. Sync needs a signed-in account (lib/auth.tsx).
// Schema: supabase/schema.sql, then supabase/migrations/20261106_hunt_logs_auth.sql
// for per-user rows + RLS.

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

export const SIGN_IN_TO_SYNC = "Sign in to sync — your hunts are safe on this phone.";

type Row = {
  id: string;
  team_code: string | null;
  hunt_date: string;
  payload: HuntLog;
  user_id?: string;
};

/** What leaves the phone: everything but local-only fields (the photo path). */
function toPayload(h: HuntLog): HuntLog {
  const { photo: _photo, ...rest } = h;
  return { ...rest, synced: true };
}

async function requireSession(): Promise<Session> {
  const { data } = await getSupabase().auth.getSession();
  if (!data.session) throw new Error(SIGN_IN_TO_SYNC);
  return data.session;
}

// Until the auth migration is applied there's no user_id column. Fall back to
// the starter team_code model so TestFlight sync keeps working in the meantime.
let legacySchema = false;
/** True once the live DB has shown it has no hunt_logs.user_id column yet. */
export const onLegacySchema = () => legacySchema;
export const LEGACY_NEEDS_TEAM =
  "Per-account sync isn't switched on at the server yet, so hunts sync by team name for now — pick a team chip (or log a hunt with a team name) and sync again.";
const missingUserId = (e: PostgrestError) =>
  e.code === "PGRST204" || e.code === "42703" || (/user_id/.test(e.message) && /column/i.test(e.message));

/**
 * Push real hunts (never the sample seed hunts) to the signed-in account.
 * Upserts on id, so an edited hunt updates its row instead of duplicating it.
 * team_code is the normalized key; the payload keeps the name as typed.
 * Returns the ids that made it up.
 */
export async function pushHunts(hunts: HuntLog[]): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const session = await requireSession();
  const real = hunts.filter((h) => !isSeedHunt(h));
  const build = (): Row[] =>
    legacySchema
      ? real
          .filter((h) => teamSyncable(h.teamCode))
          .map((h) => ({ id: h.id, team_code: teamKey(h.teamCode), hunt_date: h.date, payload: toPayload(h) }))
      : real.map((h) => ({
          id: h.id,
          team_code: teamSyncable(h.teamCode) ? teamKey(h.teamCode) : null,
          hunt_date: h.date,
          payload: toPayload(h),
          // The migration defaults this to auth.uid(); sent anyway so it's explicit.
          user_id: session.user.id,
        }));
  let rows = build();
  if (!rows.length) return [];
  let { error } = await getSupabase().from("hunt_logs").upsert(rows, { onConflict: "id" });
  if (error && !legacySchema && missingUserId(error)) {
    legacySchema = true;
    rows = build();
    if (!rows.length) return [];
    ({ error } = await getSupabase().from("hunt_logs").upsert(rows, { onConflict: "id" }));
  }
  if (error) throw new Error(error.message);
  return rows.map((r) => r.id);
}

async function selectHunts(filter: { column: "user_id" | "team_code"; value: string }) {
  return getSupabase()
    .from("hunt_logs")
    .select("payload")
    .eq(filter.column, filter.value)
    .order("hunt_date", { ascending: false })
    .limit(500);
}

/**
 * Pull the signed-in hunter's hunts. On the pre-migration schema this falls
 * back to the team_code pull (pass the team to use for that).
 */
export async function pullMyHunts(legacyTeamCode?: string): Promise<HuntLog[]> {
  if (!isSupabaseConfigured) return [];
  const session = await requireSession();
  let res = legacySchema ? null : await selectHunts({ column: "user_id", value: session.user.id });
  if (!res || (res.error && missingUserId(res.error))) {
    legacySchema = true;
    if (!legacyTeamCode || !teamSyncable(legacyTeamCode)) throw new Error(LEGACY_NEEDS_TEAM);
    res = await selectHunts({ column: "team_code", value: teamKey(legacyTeamCode) });
  }
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []).map((r: { payload: HuntLog }) => migrateHunt({ ...toPayload(r.payload), synced: true }));
}
