import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Bar, Button, Card, Chip, Header, Screen, SectionLabel, Stat } from "@/components/ui";
import {
  bagStatus,
  Counts,
  HuntLog,
  LimitLevel,
  loadHunts,
  locationLabel,
  LocationKind,
  normalizeTeamCode,
  saveHunts,
  seasonOf,
  seasonStats,
  sortHunts,
  SPECIES,
  SpeciesId,
  total,
  worstLevel,
} from "@/lib/huntLog";
import { REFUGE_BY_ID, REFUGES } from "@/lib/refuges";
import { isoDay } from "@/lib/regs";
import { cardinal, distanceMeters } from "@/lib/geo";
import { formatClock, shootWindow } from "@/lib/sun";
import { useWeather } from "@/lib/useWeather";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";
import { isSupabaseConfigured, pullTeamHunts, pushHunts } from "@/lib/supabase";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";

type Tab = "log" | "book" | "stats";

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

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
  const [teamCode, setTeamCode] = useState("BUTTE-7");
  const [draft, setDraft] = useState<HuntLog>(() => blankDraft("gray-lodge", "BUTTE-7"));
  const [notice, setNotice] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const { map: weather } = useWeather();

  useEffect(() => {
    loadHunts().then(setHunts);
    readJSON<string>(KEYS.teamCode, "BUTTE-7").then((c) => {
      setTeamCode(c);
      setDraft((d) => ({ ...d, teamCode: c }));
    });
  }, []);

  const commit = (list: HuntLog[]) => {
    const sorted = sortHunts(list);
    setHunts(sorted);
    void saveHunts(sorted);
  };

  const patch = (p: Partial<HuntLog>) => setDraft((d) => ({ ...d, ...p }));
  const bump = (id: SpeciesId, delta: number) =>
    setDraft((d) => ({ ...d, counts: { ...d.counts, [id]: Math.max(0, (d.counts[id] ?? 0) + delta) } }));

  const svsma = draft.refugeId ? REFUGE_BY_ID[draft.refugeId]?.svsma ?? false : false;
  const limits = bagStatus(draft.counts, draft.party.length, draft.date, svsma);
  const worst = worstLevel(limits);

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
      }
    } catch {
      // No fix — fall back to the selected refuge.
    }
    const nearest = REFUGES.reduce((a, b) => (distanceMeters(where, b.coords) < distanceMeters(where, a.coords) ? b : a));
    const w = weather[nearest.id];
    patch({
      sky: w.sky,
      windDir: Math.round(w.windDir),
      windMph: Math.round(w.windMph),
      tempF: Math.round(w.tempF),
      ...(fromGps && distanceMeters(where, nearest.coords) < 15000 && draft.locationKind === "refuge"
        ? { refugeId: nearest.id, locationName: nearest.name }
        : null),
    });
    setNotice(
      `${fromGps ? "GPS" : "Selected refuge"} → ${nearest.short} weather (${w.source === "baseline" ? "offline baseline" : "live"}): ${w.sky}, ${Math.round(w.windMph)} mph ${cardinal(w.windDir)}, ${Math.round(w.tempF)}°F.`,
    );
    setAutoFilling(false);
  }

  async function saveDraft() {
    if (total(draft.counts) === 0 && !draft.notes.trim()) {
      setNotice("Add birds or a note before saving — skunked hunts deserve a note.");
      return;
    }
    const party = draft.party.map((p) => p.trim()).filter(Boolean);
    const log: HuntLog = {
      ...draft,
      id: newId("hunt"),
      party: party.length ? party : ["Me"],
      teamCode: normalizeTeamCode(draft.teamCode),
      end: draft.end || hhmm(new Date()),
      locationName: draft.refugeId ? REFUGE_BY_ID[draft.refugeId].name : draft.locationName || (draft.locationKind === "club" ? "Duck club" : "Free roam"),
      createdAt: Date.now(),
    };
    const next = [log, ...hunts];
    commit(next);
    if (log.teamCode) {
      setTeamCode(log.teamCode);
      void writeJSON(KEYS.teamCode, log.teamCode);
    }
    let synced = "";
    if (isSupabaseConfigured && log.teamCode) {
      try {
        const ids = await pushHunts([log]);
        if (ids.length) {
          commit(next.map((h) => (ids.includes(h.id) ? { ...h, synced: true } : h)));
          synced = " · synced to the blind group";
        }
      } catch {
        synced = " · saved offline, will sync later";
      }
    }
    setNotice(`Logged ${total(log.counts)} birds at ${locationLabel(log)}${synced}.`);
    setDraft(blankDraft(log.refugeId ?? "gray-lodge", log.teamCode));
    setTab("book");
  }

  return (
    <Screen>
      <Header eyebrow={`Duck Tracker · ${seasonOf(isoDay(new Date()))} season`} title="Logbook" />
      <View style={styles.segment}>
        {(
          [
            ["log", "Log a Hunt", "add-circle"],
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

      {notice ? (
        <Pressable onPress={() => setNotice(null)} style={styles.notice}>
          <Ionicons name="information-circle" size={18} color={colors.accent} />
          <Text style={[type.body, styles.flex, { fontSize: 14 }]}>{notice}</Text>
        </Pressable>
      ) : null}

      {tab === "log" ? (
        <LogForm
          draft={draft}
          patch={patch}
          bump={bump}
          limits={limits}
          worst={worst}
          svsma={svsma}
          autoFill={autoFill}
          autoFilling={autoFilling}
          onSave={saveDraft}
          recentCodes={[...new Set(hunts.map((h) => h.teamCode).filter(Boolean))]}
        />
      ) : tab === "book" ? (
        <Logbook
          hunts={hunts}
          teamCode={teamCode}
          onDelete={async (h) => {
            if (await confirm("Delete this hunt?", `${h.date} · ${locationLabel(h)}`)) commit(hunts.filter((x) => x.id !== h.id));
          }}
          onPull={async (code) => {
            if (!isSupabaseConfigured) {
              setNotice("Team sync is off — set EXPO_PUBLIC_SUPABASE_URL / ANON_KEY to share logs with your blind group. Everything is saved on this phone.");
              return;
            }
            try {
              const remote = await pullTeamHunts(code);
              const byId = new Map(hunts.map((h) => [h.id, h]));
              remote.forEach((h) => byId.set(h.id, h));
              commit([...byId.values()]);
              setNotice(`Pulled ${remote.length} ${code} hunts.`);
            } catch (e) {
              setNotice(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
            }
          }}
        />
      ) : (
        <Stats hunts={hunts} />
      )}
    </Screen>
  );
}

// ── Log a hunt ────────────────────────────────────────────────────────────

function LogForm({
  draft,
  patch,
  bump,
  limits,
  worst,
  svsma,
  autoFill,
  autoFilling,
  onSave,
  recentCodes,
}: {
  draft: HuntLog;
  patch: (p: Partial<HuntLog>) => void;
  bump: (id: SpeciesId, d: number) => void;
  limits: ReturnType<typeof bagStatus>;
  worst: LimitLevel;
  svsma: boolean;
  autoFill: () => void;
  autoFilling: boolean;
  onSave: () => void;
  recentCodes: string[];
}) {
  const [member, setMember] = useState("");
  const birds = total(draft.counts);
  const codes = [...new Set(["BUTTE-7", "YOLO-DAWN", ...recentCodes])];

  return (
    <View>
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
              onPress={() =>
                patch(k === "refuge" ? { locationKind: k, refugeId: draft.refugeId ?? "gray-lodge" } : { locationKind: k, refugeId: null })
              }
            />
          ))}
        </View>
        {draft.locationKind === "refuge" ? (
          <View style={styles.chipRow}>
            {REFUGES.map((r) => (
              <Chip key={r.id} label={r.short} active={draft.refugeId === r.id} onPress={() => patch({ refugeId: r.id, locationName: r.name })} />
            ))}
          </View>
        ) : (
          <Field
            label={draft.locationKind === "club" ? "Club name" : "Spot"}
            value={draft.locationName}
            onChange={(v) => patch({ locationName: v })}
            placeholder={draft.locationKind === "club" ? "e.g. Butte Sink club" : "e.g. Colusa rice, levee 3"}
          />
        )}
        <View style={styles.twoCol}>
          <Field label="Blind / Pond #" value={draft.blind} onChange={(v) => patch({ blind: v })} placeholder="Spaced Blind 14" />
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
          label="Team / Blind Group Code"
          value={draft.teamCode}
          onChange={(v) => patch({ teamCode: normalizeTeamCode(v) })}
          placeholder="BUTTE-7"
          autoCapitalize="characters"
        />
        <View style={styles.chipRow}>
          {codes.map((c) => (
            <Chip key={c} label={c} active={draft.teamCode === c} onPress={() => patch({ teamCode: c })} />
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
            <Text style={styles.groupLabel}>{g === "duck" ? "Ducks" : g === "white" ? "White geese" : "Dark geese"}</Text>
            {SPECIES.filter((s) => s.group === g).map((s) => {
              const n = draft.counts[s.id] ?? 0;
              return (
                <View key={s.id} style={styles.counterRow}>
                  <Text style={[styles.counterName, n > 0 && { color: colors.inkStrong }]}>{s.name}</Text>
                  <Pressable onPress={() => bump(s.id, -1)} style={styles.counterBtn} hitSlop={6} accessibilityLabel={`Remove ${s.name}`}>
                    <Ionicons name="remove" size={20} color={n > 0 ? colors.ink : colors.inkFaint} />
                  </Pressable>
                  <Text style={[styles.counterVal, n > 0 && { color: colors.accent }]}>{n}</Text>
                  <Pressable onPress={() => bump(s.id, 1)} style={[styles.counterBtn, styles.counterPlus]} hitSlop={6} accessibilityLabel={`Add ${s.name}`}>
                    <Ionicons name="add" size={20} color={colors.onAccent} />
                  </Pressable>
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

      <SectionLabel>Notes</SectionLabel>
      <TextInput
        value={draft.notes}
        onChangeText={(v) => patch({ notes: v })}
        placeholder="How the birds worked, what the spread looked like, what you'd change."
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
        multiline
      />
      <Button label="Save hunt" icon="save" onPress={onSave} style={{ marginTop: spacing.lg }} />
      <Text style={[type.caption, { marginTop: spacing.sm, textAlign: "center" }]}>
        Saved on this phone first — works with zero bars.{isSupabaseConfigured ? " Team code hunts sync to your blind group." : ""}
      </Text>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: "numeric";
  autoCapitalize?: "characters";
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
        style={styles.input}
      />
    </View>
  );
}

// ── Logbook ───────────────────────────────────────────────────────────────

function Logbook({
  hunts,
  teamCode,
  onDelete,
  onPull,
}: {
  hunts: HuntLog[];
  teamCode: string;
  onDelete: (h: HuntLog) => void;
  onPull: (code: string) => void;
}) {
  const [filter, setFilter] = useState<string>("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const codes = [...new Set(hunts.map((h) => h.teamCode).filter(Boolean))];
  const list = hunts.filter((h) => filter === "ALL" || h.teamCode === filter);

  return (
    <View>
      <View style={styles.chipRow}>
        <Chip label={`All (${hunts.length})`} active={filter === "ALL"} onPress={() => setFilter("ALL")} />
        {codes.map((c) => (
          <Chip key={c} label={c} icon="people" active={filter === c} onPress={() => setFilter(c)} />
        ))}
      </View>
      <Button
        label={`Sync ${filter === "ALL" ? teamCode || "team" : filter} logs`}
        icon="cloud-download"
        variant="ghost"
        onPress={() => onPull(filter === "ALL" ? teamCode : filter)}
        style={{ marginBottom: spacing.md }}
      />
      {list.map((h) => {
        const birds = total(h.counts);
        const isOpen = open === h.id;
        const top = SPECIES.filter((s) => (h.counts[s.id] ?? 0) > 0).map((s) => `${h.counts[s.id]} ${s.chartName}`);
        return (
          <Pressable key={h.id} onPress={() => setOpen(isOpen ? null : h.id)}>
            <Card>
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
                <View style={styles.logBirds}>
                  <Text style={styles.logBirdsN}>{birds}</Text>
                  <Text style={type.caption}>birds</Text>
                </View>
              </View>
              <View style={styles.logMeta}>
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
                  </Text>
                  {h.notes ? <Text style={[type.body, { marginTop: 6 }]}>{h.notes}</Text> : null}
                  <Button label="Delete hunt" icon="trash" variant="danger" onPress={() => onDelete(h)} style={{ marginTop: spacing.md }} />
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Season analytics ─────────────────────────────────────────────────────

function Stats({ hunts }: { hunts: HuntLog[] }) {
  const seasons = [...new Set(hunts.map((h) => seasonOf(h.date)))].sort().reverse();
  const [season, setSeason] = useState<string>(seasons[0] ?? "ALL");
  const [team, setTeam] = useState<string>("ALL");
  const teams = [...new Set(hunts.map((h) => h.teamCode).filter(Boolean))];
  const scoped = hunts.filter((h) => (season === "ALL" || seasonOf(h.date) === season) && (team === "ALL" || h.teamCode === team));
  const s = useMemo(() => seasonStats(scoped), [scoped]);
  const allTeams = useMemo(() => seasonStats(hunts.filter((h) => season === "ALL" || seasonOf(h.date) === season)).teams, [hunts, season]);

  return (
    <View>
      <View style={styles.chipRow}>
        {seasons.map((x) => (
          <Chip key={x} label={x} active={season === x} onPress={() => setSeason(x)} />
        ))}
        <Chip label="All seasons" active={season === "ALL"} onPress={() => setSeason("ALL")} />
      </View>
      <View style={styles.chipRow}>
        <Chip label="Everyone" active={team === "ALL"} onPress={() => setTeam("ALL")} />
        {teams.map((t) => (
          <Chip key={t} label={t} icon="people" active={team === t} onPress={() => setTeam(t)} />
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
