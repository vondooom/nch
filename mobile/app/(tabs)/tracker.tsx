import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Bar, Button, Card, Chip, Header, Screen, SectionLabel, Stat } from "@/components/ui";
import {
  bagStatus,
  cleanTeamName,
  CountKey,
  countKey,
  HuntLog,
  huntSpotKey,
  isSeedHunt,
  isSexed,
  LimitLevel,
  loadHunts,
  loadSpots,
  locationLabel,
  LocationKind,
  mergeSpots,
  migrateCounts,
  normName,
  removeBlind,
  sameTeam,
  saveHunts,
  saveSpots,
  seasonOf,
  seasonStats,
  seedLogs,
  Sex,
  sortHunts,
  SPECIES,
  speciesCount,
  Spot,
  spotKey,
  TEAM_NAME_MAX,
  teamKey,
  teamSyncable,
  total,
  uniqueTeams,
  upsertSpot,
  worstLevel,
} from "@/lib/huntLog";
import { REFUGE_BY_ID, REFUGES } from "@/lib/refuges";
import { isoDay } from "@/lib/regs";
import { cardinal, distanceMeters, LatLon } from "@/lib/geo";
import { shootWindow } from "@/lib/sun";
import { useWeather } from "@/lib/useWeather";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";
import { isSupabaseConfigured, onLegacySchema, pullMyHunts, pushHunts, SIGN_IN_TO_SYNC, SYNC_OFF_LINE } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { DrawsPanel } from "@/components/DrawsPanel";
import { GroupsPanel } from "@/components/GroupsPanel";
import { deleteHuntPhoto, explainDenied, photoUri, pickHuntPhoto, PhotoSource } from "@/lib/photos";

type Tab = "log" | "book" | "stats" | "draws" | "groups";

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const PRIVACY_LINE = "Your hunt data is yours. We don't share or sell it.";
const SYNC_LINE = "Logs stay on this phone until you sign in. After you sign in, your hunts sync to your account.";

function blankDraft(refugeId: string, teamCode: string): HuntLog {
  const now = new Date();
  const r = REFUGE_BY_ID[refugeId];
  return {
    id: "",
    date: isoDay(now),
    locationKind: "refuge",
    refugeId,
    locationName: r.name,
    blind: "",
    party: ["Me"],
    teamCode,
    sky: "",
    windDir: 0,
    windMph: 0,
    tempF: 0,
    start: hhmm(shootWindow(now, r.coords.lat, r.coords.lon).open),
    end: "",
    notes: "",
    counts: {},
    createdAt: 0,
  };
}

const LEVEL_COLOR: Record<LimitLevel, string> = {
  ok: colors.good,
  near: colors.warn,
  at: colors.accentDeep,
  over: colors.danger,
  closed: colors.inkFaint,
};

export default function TrackerScreen() {
  const [tab, setTab] = useState<Tab>("log");
  const [hunts, setHunts] = useState<HuntLog[]>([]);
  const [storedSpots, setStoredSpots] = useState<Spot[]>([]);
  const [teamCode, setTeamCode] = useState("BUTTE-7");
  const [draft, setDraft] = useState<HuntLog>(() => blankDraft("gray-lodge", "BUTTE-7"));
  // Set while the form is editing a saved hunt; the new-hunt draft waits in the stash.
  const [editingId, setEditingId] = useState<string | null>(null);
  const stash = useRef<HuntLog | null>(null);
  const [fix, setFix] = useState<LatLon | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const { map: weather } = useWeather();
  const { session, user, signOut } = useAuth();

  useEffect(() => {
    loadHunts().then(setHunts);
    loadSpots().then(setStoredSpots);
    readJSON<string>(KEYS.teamCode, "BUTTE-7").then((c) => {
      setTeamCode(c);
      setDraft((d) => ({ ...d, teamCode: c }));
    });
  }, []);

  const spots = useMemo(() => mergeSpots(storedSpots, hunts), [storedSpots, hunts]);
  const editing = editingId ? hunts.find((h) => h.id === editingId) ?? null : null;

  const commit = (list: HuntLog[]) => {
    const sorted = sortHunts(list);
    setHunts(sorted);
    void saveHunts(sorted);
  };

  const commitSpots = (fn: (prev: Spot[]) => Spot[]) =>
    setStoredSpots((prev) => {
      const next = fn(prev);
      void saveSpots(next);
      return next;
    });

  const clearSamples = () => {
    const seedCount = hunts.filter(isSeedHunt).length;
    if (!seedCount) return;
    if (editing && isSeedHunt(editing)) cancelEdit();
    commit(hunts.filter((h) => !isSeedHunt(h)));
    setNotice(`Cleared ${seedCount} sample hunts — logbook now shows only your real hunts.`);
  };

  const restoreSamples = () => {
    const seeds = seedLogs();
    const byId = new Map(hunts.map((h) => [h.id, h]));
    seeds.forEach((h) => byId.set(h.id, h));
    commit([...byId.values()]);
    setNotice(`Restored ${seeds.length} sample hunts for preview.`);
  };

  const patch = (p: Partial<HuntLog>) => setDraft((d) => ({ ...d, ...p }));
  const bump = (key: CountKey, delta: number) =>
    setDraft((d) => ({ ...d, counts: { ...d.counts, [key]: Math.max(0, (d.counts[key] ?? 0) + delta) } }));

  const svsma = draft.refugeId ? REFUGE_BY_ID[draft.refugeId]?.svsma ?? false : false;
  const zoneId = draft.refugeId ? REFUGE_BY_ID[draft.refugeId]?.zoneId : undefined;
  const limits = bagStatus(draft.counts, draft.party.length, draft.date, svsma, zoneId);
  const worst = worstLevel(limits);

  function startEdit(h: HuntLog) {
    if (!editingId) stash.current = draft;
    setDraft({ ...h, counts: { ...h.counts }, party: [...h.party] });
    setEditingId(h.id);
    setNotice(null);
    setTab("log");
  }

  function finishEdit() {
    setEditingId(null);
    setDraft(stash.current ?? blankDraft("gray-lodge", teamCode));
    stash.current = null;
  }

  function cancelEdit() {
    // A photo picked during the edit but never saved would be orphaned.
    if (draft.photo && draft.photo !== editing?.photo) void deleteHuntPhoto(draft.photo);
    finishEdit();
    setTab("book");
  }

  async function autoFill() {
    setAutoFilling(true);
    let where = draft.refugeId ? REFUGE_BY_ID[draft.refugeId].coords : REFUGES[0].coords;
    let fromGps = false;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos =
          (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        where = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        fromGps = true;
        setFix(where);
      }
    } catch {
      // No fix — fall back to the selected refuge.
    }
    const nearest = REFUGES.reduce((a, b) => (distanceMeters(where, b.coords) < distanceMeters(where, a.coords) ? b : a));
    const w = weather[nearest.id];
    const moveTo = fromGps && distanceMeters(where, nearest.coords) < 15000 && draft.locationKind === "refuge" && draft.refugeId !== nearest.id;
    patch({
      sky: w.sky,
      windDir: Math.round(w.windDir),
      windMph: Math.round(w.windMph),
      tempF: Math.round(w.tempF),
      ...(moveTo ? { refugeId: nearest.id, locationName: nearest.name, blind: "" } : null),
    });
    setNotice(
      `${fromGps ? "GPS" : "Selected refuge"} → ${nearest.short} weather (${w.source === "baseline" ? "offline baseline" : "live"}): ${w.sky}, ${Math.round(w.windMph)} mph from ${cardinal(w.windDir)} (${Math.round(w.windDir)}°), ${Math.round(w.tempF)}°F.`,
    );
    setAutoFilling(false);
  }

  async function saveDraft() {
    if (total(draft.counts) === 0 && !draft.notes.trim()) {
      setNotice("Add birds or a note before saving — skunked hunts deserve a note.");
      return;
    }
    const party = draft.party.map((p) => p.trim()).filter(Boolean);
    const locationName = draft.refugeId
      ? REFUGE_BY_ID[draft.refugeId].name
      : draft.locationName.trim() || (draft.locationKind === "club" ? "Duck club" : "Free roam");
    const log: HuntLog = {
      ...draft,
      id: editing?.id ?? newId("hunt"),
      party: party.length ? party : ["Me"],
      teamCode: cleanTeamName(draft.teamCode),
      blind: draft.blind.trim(),
      counts: migrateCounts(draft.counts),
      end: draft.end || (editing ? "" : hhmm(new Date())),
      locationName,
      createdAt: editing?.createdAt ?? Date.now(),
      updatedAt: editing ? Date.now() : undefined,
      synced: false,
    };
    // Editing replaces the row in place (same id) — never a second copy.
    const next = editing ? hunts.map((h) => (h.id === log.id ? log : h)) : [log, ...hunts];
    commit(next);
    if (editing?.photo && editing.photo !== log.photo) void deleteHuntPhoto(editing.photo);
    commitSpots((prev) =>
      upsertSpot(prev, {
        kind: log.locationKind,
        refugeId: log.refugeId,
        name: log.locationName,
        blind: log.blind,
        // Today's GPS fix only describes today's spot, not an older hunt being edited.
        coords: log.locationKind !== "refuge" && !editing ? fix ?? undefined : undefined,
      }),
    );
    if (log.teamCode) {
      setTeamCode(log.teamCode);
      void writeJSON(KEYS.teamCode, log.teamCode);
    }
    let synced = "";
    if (isSeedHunt(log)) {
      synced = " · sample hunt, kept on this phone only";
    } else if (isSupabaseConfigured && !session) {
      synced = " · on this phone — sign in to sync";
    } else if (isSupabaseConfigured) {
      try {
        const ids = await pushHunts([log]);
        if (ids.length) {
          commit(next.map((h) => (ids.includes(h.id) ? { ...h, synced: true } : h)));
          synced = " · synced to your account";
        } else if (onLegacySchema()) {
          synced = " · on this phone — until per-account sync is live, only hunts with a team name upload";
        }
      } catch (e) {
        synced = ` · saved on this phone, will sync later (${e instanceof Error ? e.message : String(e)})`;
      }
    }
    setNotice(`${editing ? "Updated" : "Logged"} ${total(log.counts)} birds at ${locationLabel(log)}${log.blind ? ` · ${log.blind}` : ""}${synced}.`);
    if (editing) finishEdit();
    else setDraft(blankDraft(log.refugeId ?? "gray-lodge", log.teamCode));
    setTab("book");
  }

  /** Photo changes from the logbook detail apply straight away (local-only, so no sync). */
  function setHuntPhoto(h: HuntLog, photo: string | undefined) {
    commit(hunts.map((x) => (x.id === h.id ? { ...x, photo } : x)));
    if (h.photo && h.photo !== photo) void deleteHuntPhoto(h.photo);
  }

  return (
    <Screen>
      <Header eyebrow={`Duck Tracker · ${seasonOf(isoDay(new Date()))} season`} title="Logbook" />
      <View style={styles.segment}>
        {(
          [
            ["log", editing ? "Edit Hunt" : "Log a Hunt", editing ? "create" : "add-circle"],
            ["book", "Logbook", "list"],
            ["stats", "Season Stats", "stats-chart"],
          ] as [Tab, string, keyof typeof Ionicons.glyphMap][]
        ).map(([k, label, icon]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[styles.segBtn, tab === k && styles.segBtnOn]}>
            <Ionicons name={icon} size={15} color={tab === k ? colors.onAccent : colors.inkMuted} />
            <Text style={[styles.segText, tab === k && { color: colors.onAccent }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.segment, { marginTop: -spacing.sm }]}>
        {(
          [
            ["draws", "Sweat-Line Draws", "ticket"],
            ["groups", "Groups", "people"],
          ] as [Tab, string, keyof typeof Ionicons.glyphMap][]
        ).map(([k, label, icon]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[styles.segBtn, tab === k && styles.segBtnOn]}>
            <Ionicons name={icon} size={15} color={tab === k ? colors.onAccent : colors.inkMuted} />
            <Text style={[styles.segText, tab === k && { color: colors.onAccent }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {notice ? (
        <Pressable onPress={() => setNotice(null)} style={styles.notice}>
          <Ionicons name="information-circle" size={18} color={colors.accent} />
          <Text style={[type.body, styles.flex, { fontSize: 14 }]}>{notice}</Text>
        </Pressable>
      ) : null}

      {tab === "log" ? (
        <LogForm
          draft={draft}
          editing={editing}
          onCancelEdit={cancelEdit}
          patch={patch}
          bump={bump}
          limits={limits}
          worst={worst}
          svsma={svsma}
          autoFill={autoFill}
          autoFilling={autoFilling}
          onSave={saveDraft}
          onNotice={setNotice}
          spots={spots}
          onAddBlind={(blind) => {
            commitSpots((prev) => upsertSpot(prev, { kind: draft.locationKind, refugeId: draft.refugeId, name: draft.locationName, blind }));
            patch({ blind });
          }}
          onRemoveBlind={async (spot, blind) => {
            const used = hunts.filter((h) => huntSpotKey(h) === spot.key && normName(h.blind) === normName(blind)).length;
            if (used) {
              setNotice(`“${blind}” is on ${used} logged hunt${used === 1 ? "" : "s"} — edit those hunts to retire it.`);
              return;
            }
            if (await confirm("Remove this blind?", `${blind} · ${spot.name}`, "Remove")) {
              commitSpots((prev) => removeBlind(prev, spot.key, blind));
              if (normName(draft.blind) === normName(blind)) patch({ blind: "" });
            }
          }}
          recentCodes={hunts.map((h) => h.teamCode)}
        />
      ) : tab === "book" ? (
        <Logbook
          hunts={hunts}
          teamCode={teamCode}
          editingId={editingId}
          onClearSamples={clearSamples}
          onRestoreSamples={restoreSamples}
          onEdit={startEdit}
          onPhoto={setHuntPhoto}
          onNotice={setNotice}
          onDelete={async (h) => {
            if (await confirm("Delete this hunt?", `${h.date} · ${locationLabel(h)}`)) {
              if (editingId === h.id) finishEdit();
              commit(hunts.filter((x) => x.id !== h.id));
              void deleteHuntPhoto(h.photo);
            }
          }}
          accountEmail={user?.email ?? (session ? "your account" : null)}
          onSignIn={() => router.push("/sign-in")}
          onSignOut={async () => {
            if (await confirm("Sign out?", "Your hunts stay on this phone. Sign back in to sync again.", "Sign out")) {
              try {
                await signOut();
                setNotice("Signed out. Logs stay on this phone until you sign in again.");
              } catch (e) {
                setNotice(`Sign out failed: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }}
          onPull={async (code) => {
            if (!isSupabaseConfigured) {
              setNotice(SYNC_OFF_LINE);
              return;
            }
            if (!session) {
              setNotice(SIGN_IN_TO_SYNC);
              router.push("/sign-in");
              return;
            }
            try {
              // Upload hunts logged or edited offline before pulling the account's logs.
              const pending = hunts.filter((h) => !isSeedHunt(h) && !h.synced);
              const pushed = pending.length ? await pushHunts(pending) : [];
              const local = hunts.map((h) => (pushed.includes(h.id) ? { ...h, synced: true } : h));
              if (pushed.length) commit(local);
              // `code` only matters on the pre-migration schema (team_code pull).
              const remote = await pullMyHunts(code);
              const byId = new Map(local.map((h) => [h.id, h]));
              // Photos never leave the phone, so keep ours when the cloud copy lands.
              remote.forEach((h) => {
                const mine = byId.get(h.id);
                byId.set(h.id, mine?.photo ? { ...h, photo: mine.photo } : h);
              });
              commit([...byId.values()]);
              setNotice(`${pushed.length ? `Pushed ${pushed.length} offline hunts · ` : ""}Pulled ${remote.length} hunts from your account.`);
            } catch (e) {
              setNotice(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
            }
          }}
        />
      ) : tab === "draws" ? (
        <DrawsPanel userId={user?.id ?? null} onNotice={setNotice} />
      ) : tab === "groups" ? (
        <GroupsPanel hunts={hunts} spots={spots} userId={user?.id ?? null} onNotice={setNotice} />
      ) : (
        <Stats hunts={hunts} onClearSamples={clearSamples} />
      )}
    </Screen>
  );
}

// ── Log a hunt ────────────────────────────────────────────────────────────

function LogForm({
  draft,
  editing,
  onCancelEdit,
  patch,
  bump,
  limits,
  worst,
  svsma,
  autoFill,
  autoFilling,
  onSave,
  onNotice,
  spots,
  onAddBlind,
  onRemoveBlind,
  recentCodes,
}: {
  draft: HuntLog;
  editing: HuntLog | null;
  onCancelEdit: () => void;
  patch: (p: Partial<HuntLog>) => void;
  bump: (key: CountKey, d: number) => void;
  limits: ReturnType<typeof bagStatus>;
  worst: LimitLevel;
  svsma: boolean;
  autoFill: () => void;
  autoFilling: boolean;
  onSave: () => void;
  onNotice: (s: string) => void;
  spots: Spot[];
  onAddBlind: (blind: string) => void;
  onRemoveBlind: (spot: Spot, blind: string) => void;
  recentCodes: string[];
}) {
  const { session } = useAuth();
  const [member, setMember] = useState("");
  const [newBlind, setNewBlind] = useState("");
  const birds = total(draft.counts);
  const codes = uniqueTeams(["BUTTE-7", "YOLO-DAWN", ...recentCodes]);
  const here = spots.find((s) => s.key === spotKey(draft.locationKind, draft.refugeId, draft.locationName)) ?? null;
  const blinds = here?.blinds ?? [];
  const typedBlind = draft.blind.trim() && !blinds.some((b) => normName(b) === normName(draft.blind)) ? draft.blind.trim() : null;
  const savedPlaces = spots.filter((s) => s.kind === draft.locationKind && s.kind !== "refuge");
  const team = draft.teamCode.trim();

  const addBlind = () => {
    const b = newBlind.trim();
    if (!b) return;
    if (draft.locationKind !== "refuge" && !draft.locationName.trim()) {
      onNotice("Name the club or spot first, then add its blinds.");
      return;
    }
    onAddBlind(b);
    setNewBlind("");
  };

  return (
    <View>
      {editing ? (
        <Card style={styles.editBanner}>
          <View style={styles.logHead}>
            <Ionicons name="create" size={18} color={colors.accent} />
            <View style={styles.flex}>
              <Text style={type.h3}>Editing a saved hunt</Text>
              <Text style={type.caption}>
                {editing.date} · {locationLabel(editing)}
                {isSeedHunt(editing) ? " · sample hunt, changes stay on this phone" : editing.synced ? " · saving updates the synced copy" : ""}
              </Text>
            </View>
          </View>
          <Button label="Cancel edit" icon="close" variant="ghost" onPress={onCancelEdit} style={{ marginTop: spacing.sm }} />
        </Card>
      ) : null}

      <SectionLabel>Where & when</SectionLabel>
      <Card>
        <Field label="Date (YYYY-MM-DD)" value={draft.date} onChange={(v) => patch({ date: v })} />
        <View style={styles.chipRow}>
          {(
            [
              ["refuge", "Refuge"],
              ["club", "Club"],
              ["free", "Free Roam"],
            ] as [LocationKind, string][]
          ).map(([k, label]) => (
            <Chip
              key={k}
              label={label}
              active={draft.locationKind === k}
              onPress={() => {
                if (k === draft.locationKind) return;
                const r = draft.refugeId ?? "gray-lodge";
                patch(
                  k === "refuge"
                    ? { locationKind: k, refugeId: r, locationName: REFUGE_BY_ID[r].name, blind: "" }
                    : { locationKind: k, refugeId: null, locationName: "", blind: "" },
                );
              }}
            />
          ))}
        </View>
        {draft.locationKind === "refuge" ? (
          <View style={styles.chipRow}>
            {REFUGES.map((r) => (
              <Chip
                key={r.id}
                label={r.short}
                active={draft.refugeId === r.id}
                onPress={() => draft.refugeId !== r.id && patch({ refugeId: r.id, locationName: r.name, blind: "" })}
              />
            ))}
          </View>
        ) : (
          <>
            {savedPlaces.length ? (
              <>
                <Text style={styles.fieldLabel}>{draft.locationKind === "club" ? "Your clubs" : "Your spots"}</Text>
                <View style={styles.chipRow}>
                  {savedPlaces.map((sp) => (
                    <Chip
                      key={sp.key}
                      label={sp.name}
                      icon="location"
                      active={here?.key === sp.key}
                      onPress={() => here?.key !== sp.key && patch({ locationName: sp.name, blind: "" })}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <Field
              label={draft.locationKind === "club" ? "Club name" : "Spot"}
              value={draft.locationName}
              onChange={(v) => patch({ locationName: v })}
              placeholder={draft.locationKind === "club" ? "e.g. Butte Sink club" : "e.g. Colusa rice, levee 3"}
              autoCapitalize="words"
            />
          </>
        )}

        <Text style={styles.fieldLabel}>Blind / Pond # {blinds.length ? `· ${blinds.length} saved here` : ""}</Text>
        <View style={styles.chipRow}>
          <Chip label="No blind" active={!draft.blind.trim()} onPress={() => patch({ blind: "" })} />
          {blinds.map((b) => (
            <Chip
              key={b}
              label={b}
              icon="home"
              active={normName(draft.blind) === normName(b)}
              onPress={() => patch({ blind: normName(draft.blind) === normName(b) ? "" : b })}
              onLongPress={() => here && onRemoveBlind(here, b)}
            />
          ))}
          {typedBlind ? <Chip label={typedBlind} icon="home" active /> : null}
        </View>
        <View style={styles.addRow}>
          <TextInput
            value={newBlind}
            onChangeText={setNewBlind}
            placeholder="Add a blind at this spot (e.g. Spaced Blind 14)"
            placeholderTextColor={colors.inkFaint}
            style={[styles.input, styles.flex]}
            onSubmitEditing={addBlind}
            returnKeyType="done"
          />
          <Button label="Add" icon="add" variant="ghost" onPress={addBlind} />
        </View>
        {blinds.length ? <Text style={[type.caption, { marginTop: -6, marginBottom: spacing.sm }]}>Long-press a blind to remove it.</Text> : null}

        <View style={styles.twoCol}>
          <Field label="Start" value={draft.start} onChange={(v) => patch({ start: v })} placeholder="06:28" />
          <Field label="End" value={draft.end} onChange={(v) => patch({ end: v })} placeholder="now" />
        </View>
      </Card>

      <SectionLabel>Hunt party & blind group</SectionLabel>
      <Card>
        <View style={styles.chipRow}>
          {draft.party.map((p, i) => (
            <Chip key={`${p}-${i}`} label={`${p}  ✕`} onPress={() => patch({ party: draft.party.filter((_, j) => j !== i) })} />
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            value={member}
            onChangeText={setMember}
            placeholder="Add hunter"
            placeholderTextColor={colors.inkFaint}
            style={[styles.input, styles.flex]}
            onSubmitEditing={() => {
              if (member.trim()) patch({ party: [...draft.party, member.trim()] });
              setMember("");
            }}
          />
          <Button
            label="Add"
            icon="person-add"
            variant="ghost"
            onPress={() => {
              if (member.trim()) patch({ party: [...draft.party, member.trim()] });
              setMember("");
            }}
          />
        </View>
        <Field
          label="Team / Blind Group Name"
          value={draft.teamCode}
          onChange={(v) => patch({ teamCode: v })}
          placeholder="e.g. Butte Sink Crew"
          autoCapitalize="words"
          maxLength={TEAM_NAME_MAX}
        />
        {team ? (
          <Text style={[type.caption, { marginTop: -4, marginBottom: spacing.sm }]}>
            {teamSyncable(team)
              ? teamKey(team) !== team
                ? `Group key ${teamKey(team)} — use “${team}” on every hunt with this crew to keep them together.`
                : "Use the same name on every hunt with this crew to keep them together."
              : "Use at least two letters or numbers for a group name."}
          </Text>
        ) : null}
        <View style={styles.chipRow}>
          {codes.map((c) => (
            <Chip key={teamKey(c)} label={c} active={sameTeam(draft.teamCode, c)} onPress={() => patch({ teamCode: c })} />
          ))}
        </View>
      </Card>

      <SectionLabel right={<Chip label={autoFilling ? "Reading…" : "Auto-fill"} icon="locate" active onPress={autoFill} />}>Conditions</SectionLabel>
      <Card>
        <View style={styles.twoCol}>
          <Field label="Sky" value={draft.sky} onChange={(v) => patch({ sky: v })} placeholder="Overcast" />
          <Field label="Temp °F" value={draft.tempF ? String(draft.tempF) : ""} onChange={(v) => patch({ tempF: Number(v) || 0 })} keyboard="numeric" />
        </View>
        <View style={styles.twoCol}>
          <Field label="Wind mph" value={draft.windMph ? String(draft.windMph) : ""} onChange={(v) => patch({ windMph: Number(v) || 0 })} keyboard="numeric" />
          <Field
            label={`Wind from ° (${cardinal(draft.windDir)})`}
            value={draft.windDir ? String(draft.windDir) : ""}
            onChange={(v) => patch({ windDir: (Number(v) || 0) % 360 })}
            keyboard="numeric"
          />
        </View>
      </Card>

      <SectionLabel right={<Text style={styles.birdTotal}>{birds} birds</Text>}>Species harvest</SectionLabel>
      <Card style={{ paddingVertical: spacing.sm }}>
        {(["duck", "white", "dark"] as const).map((g) => (
          <View key={g}>
            <Text style={styles.groupLabel}>{g === "duck" ? "Ducks · drakes & hens" : g === "white" ? "White geese" : "Dark geese"}</Text>
            {SPECIES.filter((s) => s.group === g).map((s) => {
              if (!isSexed(s.id)) {
                const n = draft.counts[s.id] ?? 0;
                return (
                  <View key={s.id} style={styles.counterRow}>
                    <Text style={[styles.counterName, n > 0 && { color: colors.inkStrong }]}>{s.name}</Text>
                    <Stepper n={n} name={s.name} onBump={(d) => bump(s.id, d)} />
                  </View>
                );
              }
              const all = speciesCount(draft.counts, s.id);
              const unsexed = draft.counts[s.id] ?? 0;
              return (
                <View key={s.id} style={styles.duckBlock}>
                  <View style={styles.duckHead}>
                    <Text style={[styles.counterName, all > 0 && { color: colors.inkStrong }]}>{s.name}</Text>
                    {all > 0 ? <Text style={styles.duckTotal}>{all}</Text> : null}
                  </View>
                  <View style={styles.sexRow}>
                    {(["drake", "hen"] as Sex[]).map((sex) => (
                      <View key={sex} style={styles.sexCell}>
                        <Text style={styles.sexLabel}>{sex === "drake" ? "Drake" : "Hen"}</Text>
                        <Stepper
                          n={draft.counts[countKey(s.id, sex)] ?? 0}
                          name={`${s.name} ${sex}`}
                          onBump={(d) => bump(countKey(s.id, sex), d)}
                          compact
                        />
                      </View>
                    ))}
                  </View>
                  {unsexed > 0 ? (
                    <View style={styles.sexRow}>
                      <View style={styles.sexCell}>
                        <Text style={[styles.sexLabel, { width: undefined, flex: 1 }]}>Unsexed (older log)</Text>
                        <Stepper n={unsexed} name={`${s.name} unsexed`} onBump={(d) => bump(s.id, d)} compact />
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </Card>

      <SectionLabel>Pacific Flyway daily limits</SectionLabel>
      <Card style={worst === "over" ? { borderColor: colors.danger } : worst === "at" || worst === "near" ? { borderColor: colors.warn } : undefined}>
        <Text style={type.caption}>
          Per-hunter limits × {Math.max(1, draft.party.length)} in the blind{svsma ? " · Sacramento Valley SMA" : ""}. Each hunter may only take their own limit.
          Duck totals count drakes and hens; hen limits count hens only.
        </Text>
        {limits.map((l) => (
          <View key={l.key} style={styles.limitRow}>
            <View style={styles.limitHead}>
              <Ionicons
                name={l.level === "over" ? "alert-circle" : l.level === "at" ? "checkmark-circle" : l.level === "near" ? "warning" : l.level === "closed" ? "lock-closed" : "ellipse-outline"}
                size={14}
                color={LEVEL_COLOR[l.level]}
              />
              <Text style={styles.limitLabel}>{l.label}</Text>
              <Text style={styles.limitCount}>
                {l.count} / {l.limit}
              </Text>
            </View>
            <Bar value={l.count} max={Math.max(l.limit, l.count, 1)} color={LEVEL_COLOR[l.level]} height={5} />
            {l.level === "over" ? (
              <Text style={[styles.limitNote, { color: colors.danger }]}>{l.note ?? "Over the daily limit — stop shooting this species."}</Text>
            ) : l.level === "at" ? (
              <Text style={[styles.limitNote, { color: colors.accentDeep }]}>Limit reached.</Text>
            ) : l.level === "near" ? (
              <Text style={[styles.limitNote, { color: colors.warn }]}>One away from the limit.</Text>
            ) : l.note ? (
              <Text style={styles.limitNote}>{l.note}</Text>
            ) : null}
          </View>
        ))}
      </Card>

      <SectionLabel>Photo</SectionLabel>
      <Card>
        <PhotoControls
          photo={draft.photo}
          onChange={(photo) => patch({ photo })}
          onNotice={onNotice}
          // The saved hunt's own photo is only deleted on Save, so Cancel can't lose it.
          onDiscard={(old) => old !== editing?.photo && void deleteHuntPhoto(old)}
        />
      </Card>

      <SectionLabel>Notes</SectionLabel>
      <TextInput
        value={draft.notes}
        onChangeText={(v) => patch({ notes: v })}
        placeholder="How the birds worked, what the spread looked like, what you'd change."
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
        multiline
      />
      <Button label={editing ? "Save changes" : "Save hunt"} icon="save" onPress={onSave} style={{ marginTop: spacing.lg }} />
      {editing ? <Button label="Cancel edit" icon="close" variant="ghost" onPress={onCancelEdit} style={{ marginTop: spacing.sm }} /> : null}
      <Text style={[type.caption, { marginTop: spacing.sm, textAlign: "center" }]}>
        Saved on this phone first — works with zero bars.
        {isSupabaseConfigured ? (session ? " Hunts sync to your account; photos stay on this phone." : ` ${SYNC_LINE}`) : ""}
      </Text>
      <PrivacyLine />
    </View>
  );
}

function Stepper({ n, name, onBump, compact }: { n: number; name: string; onBump: (d: number) => void; compact?: boolean }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onBump(-1)} style={[styles.counterBtn, compact && styles.counterBtnSm]} hitSlop={6} accessibilityLabel={`Remove ${name}`}>
        <Ionicons name="remove" size={20} color={n > 0 ? colors.ink : colors.inkFaint} />
      </Pressable>
      <Text style={[styles.counterVal, compact && { width: 34 }, n > 0 && { color: colors.accent }]}>{n}</Text>
      <Pressable onPress={() => onBump(1)} style={[styles.counterBtn, styles.counterPlus, compact && styles.counterBtnSm]} hitSlop={6} accessibilityLabel={`Add ${name}`}>
        <Ionicons name="add" size={20} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

function PrivacyLine() {
  return (
    <View style={styles.privacyLine}>
      <Ionicons name="lock-closed" size={12} color={colors.inkFaint} />
      <Text style={[type.caption, { fontSize: 12 }]}>{PRIVACY_LINE}</Text>
    </View>
  );
}

/** Add / replace / remove a hunt photo. `onDiscard` gets the file being replaced or removed. */
function PhotoControls({
  photo,
  onChange,
  onNotice,
  onDiscard,
}: {
  photo?: string;
  onChange: (photo: string | undefined) => void;
  onNotice: (s: string) => void;
  onDiscard?: (old: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const uri = photoUri(photo);

  async function pick(source: PhotoSource) {
    setBusy(true);
    const res = await pickHuntPhoto(source);
    setBusy(false);
    if (res.status === "ok") {
      if (photo) onDiscard?.(photo);
      onChange(res.photo);
    } else if (res.status === "denied") {
      explainDenied(res.source);
    } else if (res.status === "error") {
      onNotice(`Couldn't add the photo: ${res.message}`);
    }
  }

  return (
    <View>
      {uri ? <Image source={{ uri }} style={styles.photo} resizeMode="cover" accessibilityLabel="Hunt photo" /> : null}
      <View style={styles.photoBtns}>
        <Button label={uri ? "Retake" : "Camera"} icon="camera" variant="ghost" onPress={() => pick("camera")} disabled={busy} style={styles.flex} />
        <Button label={uri ? "Replace" : "Library"} icon="images" variant="ghost" onPress={() => pick("library")} disabled={busy} style={styles.flex} />
      </View>
      {uri ? (
        <Button
          label="Remove photo"
          icon="trash"
          variant="danger"
          onPress={async () => {
            if (!(await confirm("Remove this photo?", "It's only stored on this phone.", "Remove"))) return;
            if (photo) onDiscard?.(photo);
            onChange(undefined);
          }}
          style={{ marginTop: spacing.sm }}
        />
      ) : (
        <Text style={[type.caption, { marginTop: spacing.sm }]}>Optional. Stays on this phone — never uploaded with team sync.</Text>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  autoCapitalize,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: "numeric";
  autoCapitalize?: "characters" | "words";
  maxLength?: number;
}) {
  return (
    <View style={[styles.field, styles.flex]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={keyboard === "numeric" ? "numeric" : "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

// ── Logbook ───────────────────────────────────────────────────────────────

function Logbook({
  hunts,
  teamCode,
  editingId,
  onClearSamples,
  onRestoreSamples,
  onEdit,
  onPhoto,
  onNotice,
  onDelete,
  onPull,
  accountEmail,
  onSignIn,
  onSignOut,
}: {
  hunts: HuntLog[];
  teamCode: string;
  editingId: string | null;
  onClearSamples: () => void;
  onRestoreSamples: () => void;
  onEdit: (h: HuntLog) => void;
  onPhoto: (h: HuntLog, photo: string | undefined) => void;
  onNotice: (s: string) => void;
  onDelete: (h: HuntLog) => void;
  onPull: (code: string) => void;
  accountEmail: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [picked, setFilter] = useState<string>("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const codes = uniqueTeams(hunts.map((h) => h.teamCode));
  // A team chip can vanish (e.g. after clearing sample hunts) — fall back to All.
  const filter = picked === "ALL" || codes.some((c) => sameTeam(c, picked)) ? picked : "ALL";
  const list = hunts.filter((h) => filter === "ALL" || sameTeam(h.teamCode, filter));
  const seedCount = hunts.filter(isSeedHunt).length;

  return (
    <View>
      <PrivacyLine />
      <View style={styles.chipRow}>
        <Chip label={`All (${hunts.length})`} active={filter === "ALL"} onPress={() => setFilter("ALL")} />
        {codes.map((c) => (
          <Chip key={teamKey(c)} label={c} icon="people" active={filter !== "ALL" && sameTeam(filter, c)} onPress={() => setFilter(c)} />
        ))}
      </View>
      <Card>
        <Text style={type.eyebrow}>Account</Text>
        {!isSupabaseConfigured ? (
          <Text style={[type.body, { color: colors.inkMuted, marginTop: 4 }]}>{SYNC_OFF_LINE}</Text>
        ) : accountEmail ? (
          <>
            <View style={styles.accountRow}>
              <Ionicons name="person-circle" size={22} color={colors.good} />
              <Text style={[type.body, styles.flex]} numberOfLines={1}>
                {accountEmail}
              </Text>
            </View>
            <Button label="Sync my hunts" icon="cloud-download" onPress={() => onPull(filter === "ALL" ? teamCode : filter)} style={{ marginTop: spacing.sm }} />
            <Button label="Sign out" icon="log-out" variant="ghost" onPress={onSignOut} style={{ marginTop: spacing.sm }} />
          </>
        ) : (
          <>
            <Text style={[type.body, { color: colors.inkMuted, marginTop: 4 }]}>{SYNC_LINE}</Text>
            <Button label="Sign in to sync" icon="log-in" onPress={onSignIn} style={{ marginTop: spacing.sm }} />
          </>
        )}
      </Card>
      {seedCount > 0 ? (
        <Button
          label={`Clear ${seedCount} sample hunts`}
          icon="trash-bin"
          variant="ghost"
          onPress={onClearSamples}
          style={{ marginBottom: spacing.md }}
        />
      ) : null}
      {list.length === 0 ? (
        <Card>
          <Text style={type.h3}>{hunts.length === 0 ? "No hunts logged yet" : `No ${filter} hunts yet`}</Text>
          <Text style={[type.body, { marginTop: 6, color: colors.inkMuted }]}>
            {hunts.length === 0
              ? "Tap Log a Hunt after your next morning in the blind — it saves on this phone first, even with zero bars."
              : "Sync your blind group or log a hunt with this team name."}
          </Text>
        </Card>
      ) : null}
      {list.map((h) => {
        const birds = total(h.counts);
        const isOpen = open === h.id;
        const present = SPECIES.filter((s) => speciesCount(h.counts, s.id) > 0);
        const top = present.map((s) => `${speciesCount(h.counts, s.id)} ${s.chartName}`);
        const uri = photoUri(h.photo);
        return (
          <Pressable key={h.id} onPress={() => setOpen(isOpen ? null : h.id)}>
            <Card style={editingId === h.id ? { borderColor: colors.accent } : undefined}>
              <View style={styles.logHead}>
                <View style={styles.flex}>
                  <Text style={type.caption}>
                    {new Date(`${h.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · {seasonOf(h.date)}
                  </Text>
                  <Text style={type.h3}>
                    {locationLabel(h)}
                    {h.blind ? ` · ${h.blind}` : ""}
                  </Text>
                </View>
                {uri && !isOpen ? <Image source={{ uri }} style={styles.thumb} /> : null}
                <View style={styles.logBirds}>
                  <Text style={styles.logBirdsN}>{birds}</Text>
                  <Text style={type.caption}>birds</Text>
                </View>
              </View>
              <View style={styles.logMeta}>
                {isSeedHunt(h) ? (
                  <View style={styles.demoBadge}>
                    <Text style={styles.demoBadgeText}>DEMO</Text>
                  </View>
                ) : null}
                {h.teamCode ? (
                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>{h.teamCode}</Text>
                  </View>
                ) : null}
                <Text style={type.caption}>
                  {h.party.join(", ")} · {h.sky} · {h.windMph} mph {cardinal(h.windDir)} · {h.tempF}°F
                  {h.synced ? " · ☁︎" : ""}
                </Text>
              </View>
              <Text style={[type.body, { fontSize: 14, color: colors.inkMuted }]} numberOfLines={isOpen ? undefined : 1}>
                {top.join(" · ") || "No birds"}
              </Text>
              {isOpen ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={type.caption}>
                    {h.start}–{h.end}
                    {h.locationKind !== "refuge" ? ` · ${h.locationKind === "club" ? "Club" : "Free roam"}` : ""}
                  </Text>
                  {present.some((s) => isSexed(s.id)) ? (
                    <View style={{ marginTop: 6 }}>
                      {present.map((s) => {
                        const d = h.counts[countKey(s.id, "drake")] ?? 0;
                        const hen = h.counts[countKey(s.id, "hen")] ?? 0;
                        const un = h.counts[s.id] ?? 0;
                        const parts = isSexed(s.id)
                          ? [d ? `${d} drake${d === 1 ? "" : "s"}` : "", hen ? `${hen} hen${hen === 1 ? "" : "s"}` : "", un ? `${un} unsexed` : ""].filter(Boolean)
                          : [];
                        return (
                          <Text key={s.id} style={type.caption}>
                            {s.name}: {speciesCount(h.counts, s.id)}
                            {parts.length ? ` (${parts.join(", ")})` : ""}
                          </Text>
                        );
                      })}
                    </View>
                  ) : null}
                  {h.notes ? <Text style={[type.body, { marginTop: 6 }]}>{h.notes}</Text> : null}
                  <View style={{ marginTop: spacing.md }}>
                    <PhotoControls photo={h.photo} onChange={(p) => onPhoto(h, p)} onNotice={onNotice} />
                  </View>
                  <Button
                    label={editingId === h.id ? "Continue editing" : "Edit hunt"}
                    icon="create"
                    onPress={() => onEdit(h)}
                    style={{ marginTop: spacing.md }}
                  />
                  {isSeedHunt(h) ? (
                    <Text style={[type.caption, { marginTop: 4 }]}>Sample hunt — edits stay on this phone and never sync.</Text>
                  ) : null}
                  <Button label="Delete hunt" icon="trash" variant="danger" onPress={() => onDelete(h)} style={{ marginTop: spacing.sm }} />
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      })}
      {seedCount === 0 ? (
        <Button
          label={`Restore ${seedLogs().length} sample hunts`}
          icon="refresh"
          variant="ghost"
          onPress={onRestoreSamples}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}

// ── Season analytics ─────────────────────────────────────────────────────

function Stats({ hunts, onClearSamples }: { hunts: HuntLog[]; onClearSamples: () => void }) {
  const seedCount = hunts.filter(isSeedHunt).length;
  const realCount = hunts.length - seedCount;
  // null = follow the default: show samples until the first real hunt is logged.
  const [samplesChoice, setSamplesChoice] = useState<boolean | null>(null);
  const includeSamples = samplesChoice ?? realCount === 0;
  const base = useMemo(() => (includeSamples ? hunts : hunts.filter((h) => !isSeedHunt(h))), [hunts, includeSamples]);

  const seasons = [...new Set(base.map((h) => seasonOf(h.date)))].sort().reverse();
  const [pickedSeason, setSeason] = useState<string | null>(null);
  const season = pickedSeason === "ALL" || (pickedSeason && seasons.includes(pickedSeason)) ? pickedSeason : seasons[0] ?? "ALL";
  const [pickedTeam, setTeam] = useState<string>("ALL");
  const teams = uniqueTeams(base.map((h) => h.teamCode));
  const team = pickedTeam === "ALL" || teams.some((t) => sameTeam(t, pickedTeam)) ? pickedTeam : "ALL";
  const scoped = useMemo(
    () => base.filter((h) => (season === "ALL" || seasonOf(h.date) === season) && (team === "ALL" || sameTeam(h.teamCode, team))),
    [base, season, team],
  );
  const s = useMemo(() => seasonStats(scoped), [scoped]);
  const allTeams = useMemo(() => seasonStats(base.filter((h) => season === "ALL" || seasonOf(h.date) === season)).teams, [base, season]);

  return (
    <View>
      {seedCount > 0 ? (
        <View style={styles.chipRow}>
          <Chip label="Include sample hunts" active={includeSamples} onPress={() => setSamplesChoice(true)} />
          <Chip label="My real hunts only" active={!includeSamples} onPress={() => setSamplesChoice(false)} />
          <Chip label={`Clear ${seedCount} sample hunts`} icon="close-circle" onPress={onClearSamples} />
        </View>
      ) : null}
      <View style={styles.chipRow}>
        {seasons.map((x) => (
          <Chip key={x} label={x} active={season === x} onPress={() => setSeason(x)} />
        ))}
        <Chip label="All seasons" active={season === "ALL"} onPress={() => setSeason("ALL")} />
      </View>
      <View style={styles.chipRow}>
        <Chip label="Everyone" active={team === "ALL"} onPress={() => setTeam("ALL")} />
        {teams.map((t) => (
          <Chip key={teamKey(t)} label={t} icon="people" active={team !== "ALL" && sameTeam(team, t)} onPress={() => setTeam(t)} />
        ))}
      </View>

      <Card>
        <View style={styles.statsRow}>
          <Stat label="Birds" value={String(s.birds)} valueStyle={{ color: colors.accent, fontSize: 30 }} />
          <Stat label="Hunts" value={String(s.hunts)} valueStyle={{ fontSize: 30 }} />
          <Stat label="Avg / hunt" value={s.avgPerHunt.toFixed(1)} valueStyle={{ fontSize: 30 }} />
          <Stat label="Avg / hunter" value={s.avgPerHunter.toFixed(1)} valueStyle={{ fontSize: 30 }} />
        </View>
      </Card>

      {s.hunts === 0 ? (
        <Card>
          <Text style={type.body}>No hunts in this view yet.</Text>
        </Card>
      ) : (
        <>
          <SectionLabel>Top species</SectionLabel>
          <Card>
            <HBars rows={s.species.slice(0, 10).map((x) => ({ label: x.name, value: x.count, display: String(x.count) }))} />
          </Card>

          <SectionLabel>Best refuge · birds per hunter</SectionLabel>
          <Card>
            <HBars rows={s.refuges.map((x) => ({ label: x.name, value: x.perHunter, display: `${x.perHunter.toFixed(1)} · ${x.hunts}×` }))} highlightFirst />
          </Card>

          <SectionLabel>Wind direction vs. birds per hunter</SectionLabel>
          <Card>
            <HBars rows={s.winds.map((x) => ({ label: x.dir === "Calm" ? "Calm" : `From ${x.dir}`, value: x.perHunter, display: `${x.perHunter.toFixed(1)} · ${x.hunts}×` }))} highlightFirst />
            {s.winds[0] ? (
              <Text style={[type.caption, { marginTop: spacing.sm }]}>
                Your best mornings came on a {s.winds[0].dir === "Calm" ? "calm" : `${s.winds[0].dir} wind`} — {s.winds[0].perHunter.toFixed(1)} birds per hunter.
              </Text>
            ) : null}
          </Card>
        </>
      )}

      <SectionLabel>Team / blind group leaderboard</SectionLabel>
      <Card>
        {allTeams.length === 0 ? <Text style={type.body}>Log a hunt with a team code to start a leaderboard.</Text> : null}
        {allTeams.map((t, i) => (
          <View key={t.code} style={styles.leadRow}>
            <Text style={[styles.leadRank, i === 0 && { color: colors.accent }]}>{i + 1}</Text>
            <View style={styles.flex}>
              <Text style={type.h3}>{t.code}</Text>
              <Text style={type.caption}>
                {t.members} hunters · {t.hunts} hunts · {t.birds} birds
              </Text>
            </View>
            <Text style={styles.leadVal}>{t.perHunter.toFixed(1)}</Text>
            <Text style={[type.caption, { width: 44 }]}>/hunter</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

/** Single-series horizontal bars: one hue, value in ink, label on the left. */
function HBars({ rows, highlightFirst }: { rows: { label: string; value: number; display: string }[]; highlightFirst?: boolean }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r, i) => (
        <View key={r.label} style={styles.hbarRow} accessible accessibilityLabel={`${r.label}: ${r.display}`}>
          <Text style={styles.hbarLabel} numberOfLines={1}>
            {r.label}
          </Text>
          <View style={styles.hbarTrack}>
            <View
              style={[
                styles.hbarFill,
                { width: `${(r.value / max) * 100}%`, backgroundColor: highlightFirst && i > 0 ? colors.accentDeep : colors.accent },
                highlightFirst && i > 0 && { opacity: 0.55 },
              ]}
            />
          </View>
          <Text style={styles.hbarVal}>{r.display}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segment: { flexDirection: "row", backgroundColor: colors.bgSunken, borderRadius: radius.md, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  segBtn: { flex: 1, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: radius.sm },
  segBtnOn: { backgroundColor: colors.accent },
  segText: { color: colors.inkMuted, fontFamily: fonts.headingSemi, fontSize: 14, letterSpacing: 0.4 },
  notice: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDeep,
    marginBottom: spacing.md,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  twoCol: { flexDirection: "row", gap: spacing.sm },
  field: { marginBottom: spacing.sm },
  fieldLabel: { ...type.caption, textTransform: "uppercase", letterSpacing: 1, fontSize: 10, marginBottom: 4 },
  input: {
    backgroundColor: colors.bgSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  addRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  birdTotal: { ...type.numeral, color: colors.accent, fontSize: 18 },
  groupLabel: { ...type.eyebrow, color: colors.inkMuted, fontSize: 11, marginTop: spacing.sm, marginBottom: 2 },
  counterRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  counterName: { flex: 1, color: colors.inkMuted, fontSize: 15 },
  counterBtnSm: { width: 34, height: 32 },
  stepper: { flexDirection: "row", alignItems: "center" },
  duckBlock: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  duckHead: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  duckTotal: { ...type.numeral, fontSize: 16, color: colors.accent },
  sexRow: { flexDirection: "row", gap: spacing.md, marginTop: 2 },
  sexCell: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sexLabel: { ...type.caption, width: 44, textTransform: "uppercase", letterSpacing: 1, fontSize: 11 },
  editBanner: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  accountRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  privacyLine: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginVertical: spacing.sm },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.bgSunken, marginBottom: spacing.sm },
  photoBtns: { flexDirection: "row", gap: spacing.sm },
  thumb: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.bgSunken },
  counterBtn: { width: 40, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  counterPlus: { backgroundColor: colors.accent, borderColor: colors.accent },
  counterVal: { ...type.numeral, width: 40, textAlign: "center", fontSize: 22, color: colors.inkFaint },
  limitRow: { marginTop: spacing.md },
  limitHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  limitLabel: { flex: 1, color: colors.ink, fontSize: 14 },
  limitCount: { ...type.numeral, fontSize: 16 },
  limitNote: { ...type.caption, marginTop: 3 },
  logHead: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  logBirds: { alignItems: "center" },
  logBirdsN: { ...type.numeral, fontSize: 30, lineHeight: 32, color: colors.accent },
  logMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap", marginVertical: 6 },
  teamBadge: { borderWidth: 1, borderColor: colors.accentDeep, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  demoBadge: { borderWidth: 1, borderColor: colors.warn, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  demoBadgeText: { color: colors.warn, fontFamily: fonts.headingSemi, fontSize: 12, letterSpacing: 1 },
  teamBadgeText: { color: colors.accent, fontFamily: fonts.headingSemi, fontSize: 12, letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  hbarRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hbarLabel: { width: 112, color: colors.ink, fontSize: 13 },
  hbarTrack: { flex: 1, height: 12, justifyContent: "center" },
  hbarFill: { height: 12, borderTopRightRadius: 4, borderBottomRightRadius: 4, minWidth: 2 },
  hbarVal: { width: 70, color: colors.inkMuted, fontSize: 12, textAlign: "right", fontVariant: ["tabular-nums"] },
  leadRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  leadRank: { ...type.numeral, fontSize: 24, width: 22, color: colors.inkMuted },
  leadVal: { ...type.numeral, fontSize: 24, color: colors.inkStrong },
});
