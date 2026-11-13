import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Chip, Stat } from "@/components/ui";
import { Input, panelStyles } from "@/components/DrawsPanel";
import { Assignment } from "@/lib/assignments";
import { Blind, blindPerformance, HEAT_LABEL, HotBlind, hotBlinds } from "@/lib/blinds";
import { ClubDraw, DrawMode, latestDraw, runClubDraw } from "@/lib/clubDraws";
import { GroupMember, HuntGroup, memberName, myRole } from "@/lib/groups";
import { DEFAULT_GUEST_LIMIT, GuestDay, guestDaysUsed, guestLevel } from "@/lib/guestDays";
import { FIELD_CONDITIONS, HuntLog, locationLabel, normName, seasonOf, total, WATER_CONDITIONS } from "@/lib/huntLog";
import { isoDay } from "@/lib/regs";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";

// Building blocks for a group card, picked by group type in GroupsPanel.
// Every section takes already-permission-checked props: GroupsPanel decides
// whether results are visible before it renders a results section.

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export function Label({ children, first }: { children: string; first?: boolean }) {
  return <Text style={[panelStyles.label, { marginTop: first ? 0 : spacing.md }]}>{children}</Text>;
}

// ── Season totals ─────────────────────────────────────────────────────────

export function SeasonTotals({ hunts, title = "Season totals" }: { hunts: HuntLog[]; title?: string }) {
  const season = seasonOf(isoDay(new Date()));
  const rows = useMemo(() => {
    const by = new Map<string, HuntLog[]>();
    hunts.forEach((h) => by.set(seasonOf(h.date), [...(by.get(seasonOf(h.date)) ?? []), h]));
    return [...by.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([s, hs]) => {
        const birds = hs.reduce((a, h) => a + total(h.counts), 0);
        const hd = hs.reduce((a, h) => a + Math.max(1, h.party.length), 0);
        return { season: s, hunts: hs.length, birds, hd, per: hd ? birds / hd : 0 };
      });
  }, [hunts]);
  const cur = rows.find((r) => r.season === season) ?? { season, hunts: 0, birds: 0, hd: 0, per: 0 };
  const older = rows.filter((r) => r.season !== season);
  return (
    <View>
      <Label>{`${title} · ${season}`}</Label>
      <View style={s.statsRow}>
        <Stat label="Birds" value={String(cur.birds)} valueStyle={{ color: colors.accent }} />
        <Stat label="Hunts" value={String(cur.hunts)} />
        <Stat label="Hunter-days" value={String(cur.hd)} />
        <Stat label="Birds/hunter" value={cur.per.toFixed(1)} />
      </View>
      {older.map((r) => (
        <Text key={r.season} style={type.caption}>
          {r.season}: {r.birds} birds · {plural(r.hunts, "hunt")} · {r.per.toFixed(1)}/hunter
        </Text>
      ))}
    </View>
  );
}

// ── Blind performance ─────────────────────────────────────────────────────

export function BlindPerfList({ blinds, hunts, empty }: { blinds: Blind[]; hunts: HuntLog[]; empty?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const season = seasonOf(isoDay(new Date()));
  const perf = useMemo(
    () =>
      blinds
        .map((b) => blindPerformance(b, hunts))
        .sort((a, b) => (b.seasons.find((x) => x.season === season)?.perHunter ?? -1) - (a.seasons.find((x) => x.season === season)?.perHunter ?? -1)),
    [blinds, hunts, season],
  );
  if (!blinds.length) return <Text style={type.caption}>{empty ?? "No blinds yet — add them on the Blinds tab and pick this group."}</Text>;
  return (
    <View>
      {perf.map((p) => {
        const cur = p.seasons.find((x) => x.season === season);
        const isOpen = open === p.blind.id;
        return (
          <Pressable key={p.blind.id} onPress={() => setOpen(isOpen ? null : p.blind.id)} style={s.row}>
            <View style={s.rowHead}>
              <Text style={[s.flex, { color: colors.ink }]} numberOfLines={1}>
                {p.blind.name}
                {p.blind.waterLevel ? <Text style={type.caption}>{`  · water ${p.blind.waterLevel}`}</Text> : null}
              </Text>
              <Text style={s.val}>
                {cur ? `${cur.perHunter.toFixed(1)}/hunter · ${cur.birds} birds` : "not hunted this season"}
              </Text>
              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.inkFaint} />
            </View>
            {isOpen ? (
              <View style={{ marginTop: 4 }}>
                {p.seasons.length === 0 ? <Text style={type.caption}>No hunts logged in this blind yet.</Text> : null}
                {p.seasons.map((r) => (
                  <Text key={r.season} style={type.caption}>
                    {r.season}: {r.birds} birds · {plural(r.hunts, "hunt")} · {r.hunterDays} hunter-days · {r.perHunter.toFixed(2)}/hunter
                  </Text>
                ))}
                {p.seasons.length > 1 ? (
                  <Text style={[type.caption, { color: colors.ink }]}>
                    All years: {p.allTime.birds} birds · {p.allTime.perHunter.toFixed(2)}/hunter
                  </Text>
                ) : null}
                {p.last ? <Text style={type.caption}>Last hunted {p.last}</Text> : null}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Daily slate (guides) / hunt schedule (leases, crews) ─────────────────

export function SlateSection({
  g,
  blinds,
  assignments,
  setAssignments,
  canEdit,
  mode,
  onNotice,
}: {
  g: HuntGroup;
  blinds: Blind[];
  assignments: Assignment[];
  setAssignments: (fn: (prev: Assignment[]) => Assignment[]) => void;
  canEdit: boolean;
  mode: "guide" | "schedule";
  onNotice: (s: string) => void;
}) {
  const today = isoDay(new Date());
  const [date, setDate] = useState(today);
  const [blindId, setBlindId] = useState<string | undefined>(blinds[0]?.id);
  const [guideId, setGuideId] = useState<string | undefined>(undefined);
  const [hunters, setHunters] = useState("");
  const [notes, setNotes] = useState("");
  const role = myRole(g);
  const me = g.members.find((m) => m.id === g.meId);
  const guides = g.members.filter((m) => ["guide", "owner", "admin", "manager"].includes(m.role));
  const people = g.members.filter((m) => (mode === "guide" ? m.role === "client" : m.role !== "client"));

  let mine = assignments.filter((a) => a.groupId === g.id && a.date >= isoDay(new Date(Date.now() - 7 * 864e5)));
  // A client only sees the lines they're on (where to be, who's guiding) — never anyone's results.
  if (role === "client" || role === "guest") mine = mine.filter((a) => !!me && a.hunters.some((h) => normName(h) === normName(me.name)));

  const byDate = new Map<string, Assignment[]>();
  mine.forEach((a) => byDate.set(a.date, [...(byDate.get(a.date) ?? []), a]));

  function add() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return onNotice("Date as YYYY-MM-DD.");
    const list = hunters.split(",").map((x) => x.trim()).filter(Boolean);
    if (!blindId && !list.length) return onNotice(mode === "guide" ? "Pick a blind or add a client." : "Pick a blind or add who's hunting.");
    const a: Assignment = { id: newId("asg"), groupId: g.id, date: date.trim(), blindId, guideMemberId: guideId, hunters: list, notes: notes.trim() || undefined, createdAt: Date.now() };
    setAssignments((prev) => [...prev, a]);
    setHunters("");
    setNotes("");
    onNotice(`${mode === "guide" ? "Slate" : "Schedule"} updated for ${a.date}. On this phone.`);
  }

  const addName = (m: GroupMember) => {
    const cur = hunters.split(",").map((x) => x.trim()).filter(Boolean);
    if (!cur.some((x) => normName(x) === normName(m.name))) setHunters([...cur, m.name].join(", "));
  };

  return (
    <View>
      <Label>{mode === "guide" ? "Daily slate · guide / blind / clients" : "Hunt schedule"}</Label>
      {byDate.size === 0 ? (
        <Text style={type.caption}>{role === "client" ? "You're not on a slate yet." : mode === "guide" ? "Nothing on the slate. Build tomorrow's below." : "Nobody's scheduled. Add a morning below."}</Text>
      ) : null}
      {[...byDate.entries()].map(([d, list]) => (
        <View key={d} style={s.row}>
          <Text style={[type.caption, { color: d === today ? colors.accent : colors.inkMuted, fontFamily: fonts.headingSemi, letterSpacing: 1 }]}>
            {d === today ? "TODAY" : d < today ? `${d} · past` : d}
          </Text>
          {list.map((a) => (
            <View key={a.id} style={s.rowHead}>
              <Ionicons name="home" size={13} color={colors.accent} />
              <Text style={[s.flex, { color: colors.ink }]}>
                {blinds.find((b) => b.id === a.blindId)?.name ?? "Any blind"}
                {a.guideMemberId ? ` · guide ${memberName(g, a.guideMemberId)}` : ""}
                {a.hunters.length ? ` · ${a.hunters.join(", ")}` : ""}
                {a.notes ? <Text style={type.caption}>{`  ${a.notes}`}</Text> : null}
              </Text>
              {canEdit ? (
                <Pressable onPress={() => setAssignments((prev) => prev.filter((x) => x.id !== a.id))} hitSlop={8} accessibilityLabel="Remove line">
                  <Ionicons name="close" size={16} color={colors.inkFaint} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ))}

      {canEdit ? (
        <View style={s.formBox}>
          <Input label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
          {blinds.length ? (
            <View style={s.wrap}>
              {blinds.map((b) => (
                <Chip key={b.id} label={b.name} icon="home" active={blindId === b.id} onPress={() => setBlindId(blindId === b.id ? undefined : b.id)} />
              ))}
            </View>
          ) : (
            <Text style={type.caption}>Add blinds to this group on the Blinds tab to slot them here.</Text>
          )}
          {mode === "guide" && guides.length ? (
            <>
              <Label>Guide</Label>
              <View style={s.wrap}>
                {guides.map((m) => (
                  <Chip key={m.id} label={m.name} icon="person" active={guideId === m.id} onPress={() => setGuideId(guideId === m.id ? undefined : m.id)} />
                ))}
              </View>
            </>
          ) : null}
          <Input
            label={mode === "guide" ? "Clients (comma-separated)" : "Who's hunting (comma-separated)"}
            value={hunters}
            onChange={setHunters}
            placeholder={mode === "guide" ? "Dave S., Rick P." : "Me, Jake, Luis"}
            autoCapitalize="words"
          />
          {people.length ? (
            <View style={s.wrap}>
              {people.map((m) => (
                <Chip key={m.id} label={`+ ${m.name}`} onPress={() => addName(m)} />
              ))}
            </View>
          ) : null}
          <Input label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Meet at the shop 4:45" />
          <Button label={mode === "guide" ? "Add to slate" : "Add to schedule"} icon="calendar" variant="ghost" onPress={add} />
        </View>
      ) : null}
    </View>
  );
}

// ── Club blind draw ───────────────────────────────────────────────────────

const HEAT_COLOR: Record<HotBlind["heat"], string> = { hot: colors.danger, warm: colors.warn, cold: "#6fa8dc", none: colors.inkFaint };

export function HeatBadge({ heat }: { heat: HotBlind["heat"] }) {
  return (
    <View style={[s.badge, { borderColor: HEAT_COLOR[heat] }]}>
      <Text style={[s.badgeText, { color: HEAT_COLOR[heat] }]}>{HEAT_LABEL[heat].toUpperCase()}</Text>
    </View>
  );
}

export function ClubDrawSection({
  g,
  blinds,
  hunts,
  clubDraws,
  setClubDraws,
  canRun,
  showHeat,
  onNotice,
}: {
  g: HuntGroup;
  blinds: Blind[];
  hunts: HuntLog[];
  clubDraws: ClubDraw[];
  setClubDraws: (fn: (prev: ClubDraw[]) => ClubDraw[]) => void;
  canRun: boolean;
  showHeat: boolean;
  onNotice: (s: string) => void;
}) {
  const [date, setDate] = useState(isoDay(new Date(Date.now() + 864e5)));
  const [mode, setMode] = useState<DrawMode>("rotation");
  const hot = useMemo(() => hotBlinds(blinds, hunts, date), [blinds, hunts, date]);
  const heatOf = (id: string | null) => hot.find((h) => h.blind.id === id);
  const last = latestDraw(clubDraws, g.id);
  const drawers = g.members.filter((m) => m.role !== "guest" && m.role !== "client");

  async function run() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return onNotice("Draw date as YYYY-MM-DD.");
    if (!drawers.length) return onNotice("Add members to the roster first.");
    if (!blinds.length) return onNotice("Add the club's blinds on the Blinds tab and pick this club.");
    const existing = clubDraws.find((d) => d.groupId === g.id && d.date === date.trim());
    if (existing && !(await confirm("Redraw?", `There's already a draw for ${date}. Replace it?`, "Redraw"))) return;
    const d = runClubDraw(
      g.id,
      date.trim(),
      mode,
      drawers.map((m) => m.id),
      hot.map((h) => h.blind.id),
      clubDraws.filter((x) => x.id !== existing?.id),
      newId("cdraw"),
    );
    setClubDraws((prev) => [...prev.filter((x) => x.id !== existing?.id), d]);
    onNotice(`Draw for ${d.date}: ${memberName(g, d.picks[0]?.memberId)} has first pick. On this phone — read it out at the clubhouse.`);
  }

  return (
    <View>
      <Label>Blind draw</Label>
      {showHeat ? (
        <>
          <Text style={type.caption}>Last 14 days before {date}, birds per hunter by blind:</Text>
          {hot.map((h) => (
            <View key={h.blind.id} style={s.rowHead}>
              <Text style={[s.flex, { color: colors.ink }]} numberOfLines={1}>
                {h.blind.name}
                {h.blind.waterLevel ? <Text style={type.caption}>{`  · water ${h.blind.waterLevel}`}</Text> : null}
              </Text>
              <Text style={s.val}>{h.recentHunts ? `${h.perHunter.toFixed(1)}/hunter · ${plural(h.recentHunts, "hunt")}` : "—"}</Text>
              <HeatBadge heat={h.heat} />
            </View>
          ))}
        </>
      ) : null}

      {last ? (
        <View style={[s.formBox, { borderColor: colors.accentDeep }]}>
          <Text style={[type.h3, { fontSize: 15 }]}>
            Draw · {last.date} · {last.mode === "random" ? "random" : "rotation"}
          </Text>
          {last.picks.map((p) => {
            const b = blinds.find((x) => x.id === p.blindId);
            const heat = heatOf(p.blindId);
            return (
              <View key={p.memberId} style={s.rowHead}>
                <Text style={s.pick}>{p.pick}</Text>
                <Text style={[s.flex, { color: p.memberId === g.meId ? colors.accent : colors.ink }]} numberOfLines={1}>
                  {memberName(g, p.memberId) || "Former member"} → {b?.name ?? "waitlist"}
                </Text>
                {showHeat && heat ? <HeatBadge heat={heat.heat} /> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={type.caption}>No draw yet.</Text>
      )}

      {canRun ? (
        <View style={s.formBox}>
          <Input label="Draw for date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
          <View style={s.wrap}>
            <Chip label="Rotation" icon="repeat" active={mode === "rotation"} onPress={() => setMode("rotation")} />
            <Chip label="Random" icon="shuffle" active={mode === "random"} onPress={() => setMode("random")} />
          </View>
          <Text style={type.caption}>
            {mode === "rotation" ? "First pick moves one name down the roster each draw." : "Shuffles the roster."} Blinds go out hottest first, one member per blind; extras wait.
          </Text>
          <Button label="Run the draw" icon="dice" onPress={run} style={{ marginTop: spacing.sm }} />
        </View>
      ) : (
        <Text style={[type.caption, { marginTop: 4 }]}>The club manager runs the draw; results show here.</Text>
      )}
    </View>
  );
}

// ── Guest days ────────────────────────────────────────────────────────────

const GUEST_COLOR = { ok: colors.good, near: colors.warn, at: colors.accentDeep, over: colors.danger } as const;

export function GuestDaysSection({
  g,
  guestDays,
  setGuestDays,
  onChangeGroup,
  canManage,
  canLog,
  onNotice,
}: {
  g: HuntGroup;
  guestDays: GuestDay[];
  setGuestDays: (fn: (prev: GuestDay[]) => GuestDay[]) => void;
  onChangeGroup: (g: HuntGroup) => void;
  canManage: boolean;
  canLog: boolean;
  onNotice: (s: string) => void;
}) {
  const today = isoDay(new Date());
  const limit = g.guestDayLimit ?? DEFAULT_GUEST_LIMIT;
  const [host, setHost] = useState<string | undefined>(canManage ? undefined : g.meId);
  const [guest, setGuest] = useState("");
  const [date, setDate] = useState(today);
  const hosts = g.members.filter((m) => m.role !== "guest" && m.role !== "client");
  const visibleHosts = canManage ? hosts : hosts.filter((m) => m.id === g.meId);
  const season = seasonOf(today);
  const recent = guestDays.filter((x) => x.groupId === g.id && seasonOf(x.date) === season).sort((a, b) => (a.date < b.date ? 1 : -1));

  function add() {
    const hostId = canManage ? host : g.meId;
    if (!hostId) return onNotice("Pick the member bringing the guest.");
    if (!guest.trim()) return onNotice("Name the guest.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return onNotice("Date as YYYY-MM-DD.");
    const used = guestDaysUsed(guestDays, g.id, hostId, date.trim());
    setGuestDays((prev) => [...prev, { id: newId("guest"), groupId: g.id, memberId: hostId, guestName: guest.trim(), date: date.trim(), createdAt: Date.now() }]);
    setGuest("");
    const after = used + 1;
    onNotice(
      after > limit
        ? `${memberName(g, hostId)} is OVER the guest limit — ${after} of ${limit} this season.`
        : after === limit
          ? `${memberName(g, hostId)} just used the last guest day (${after} of ${limit}).`
          : `Guest day logged — ${memberName(g, hostId)} has used ${after} of ${limit}.`,
    );
  }

  return (
    <View>
      <Label>{`Guest days · ${season} · limit ${limit} per member`}</Label>
      {canManage ? (
        <View style={s.wrap}>
          {[2, 4, 6, 8, 10, 12].map((n) => (
            <Chip key={n} label={String(n)} active={limit === n} onPress={() => onChangeGroup({ ...g, guestDayLimit: n })} />
          ))}
        </View>
      ) : null}
      {visibleHosts.map((m) => {
        const used = guestDaysUsed(guestDays, g.id, m.id, today);
        const lvl = guestLevel(used, limit);
        return (
          <View key={m.id} style={s.rowHead}>
            <Text style={[s.flex, { color: colors.ink }]}>{m.name}</Text>
            <Text style={[s.val, { color: GUEST_COLOR[lvl] }]}>
              {used} / {limit}
              {lvl === "over" ? " · OVER" : lvl === "at" ? " · at limit" : ""}
            </Text>
          </View>
        );
      })}
      {canLog ? (
        <View style={s.formBox}>
          {canManage ? (
            <View style={s.wrap}>
              {hosts.map((m) => (
                <Chip key={m.id} label={m.name} icon="person" active={host === m.id} onPress={() => setHost(m.id)} />
              ))}
            </View>
          ) : null}
          <View style={s.twoCol}>
            <Input label="Guest" value={guest} onChange={setGuest} placeholder="Name" autoCapitalize="words" />
            <Input label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
          </View>
          <Button label="Log guest day" icon="person-add" variant="ghost" onPress={add} />
          <Text style={[type.caption, { marginTop: 4 }]}>Naming guests on a club hunt in the logbook counts them here too.</Text>
        </View>
      ) : null}
      {recent.slice(0, 8).map((x) => (
        <View key={x.id} style={s.rowHead}>
          <Text style={[s.flex, type.caption]}>
            {x.date} · {x.guestName} (guest of {memberName(g, x.memberId) || "former member"}){x.huntId ? " · from a hunt" : ""}
          </Text>
          {canManage || x.memberId === g.meId ? (
            <Pressable
              onPress={() => (x.huntId ? onNotice("This guest day came from a logged hunt — edit the hunt to change it.") : setGuestDays((prev) => prev.filter((y) => y.id !== x.id)))}
              hitSlop={8}
              accessibilityLabel="Remove guest day"
            >
              <Ionicons name="close" size={16} color={colors.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ── Bands & trophies per client ──────────────────────────────────────────

export function ClientBandsSection({ hunts }: { hunts: HuntLog[] }) {
  const rows = useMemo(() => {
    const by = new Map<string, { hunts: number; birds: number; bands: string[]; trophies: string[] }>();
    hunts.forEach((h) => {
      const name = h.clientName?.trim();
      if (!name && !h.bands?.length && !h.trophies) return;
      const k = name || "No client named";
      const r = by.get(k) ?? { hunts: 0, birds: 0, bands: [], trophies: [] };
      r.hunts++;
      r.birds += total(h.counts);
      (h.bands ?? []).forEach((b) => r.bands.push(`${b.number}${b.species ? ` (${b.species})` : ""}${b.clientName && b.clientName !== name ? ` · ${b.clientName}` : ""}`));
      if (h.trophies?.trim()) r.trophies.push(`${h.date}: ${h.trophies.trim()}`);
      by.set(k, r);
    });
    return [...by.entries()].sort((a, b) => b[1].bands.length - a[1].bands.length || b[1].hunts - a[1].hunts);
  }, [hunts]);
  return (
    <View>
      <Label>Clients · bands & trophies</Label>
      {rows.length === 0 ? <Text style={type.caption}>Name the client and add bands or trophies on a hunt (Log a Hunt → Blind, water & client).</Text> : null}
      {rows.map(([name, r]) => (
        <View key={name} style={s.row}>
          <View style={s.rowHead}>
            <Text style={[s.flex, { color: colors.ink }]}>{name}</Text>
            <Text style={s.val}>
              {plural(r.hunts, "hunt")} · {r.birds} birds{r.bands.length ? ` · ${plural(r.bands.length, "band")}` : ""}
            </Text>
          </View>
          {r.bands.length ? <Text style={type.caption}>🏷 {r.bands.join(" · ")}</Text> : null}
          {r.trophies.map((t) => (
            <Text key={t} style={type.caption}>
              🏆 {t}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Shared log ────────────────────────────────────────────────────────────

const WATER = Object.fromEntries(WATER_CONDITIONS.map((w) => [w.id, w.label]));
const FIELD = Object.fromEntries(FIELD_CONDITIONS.map((w) => [w.id, w.label]));

export function SharedLog({ hunts, blinds, limit = 8 }: { hunts: HuntLog[]; blinds: Blind[]; limit?: number }) {
  const list = hunts.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
  return (
    <View>
      <Label>Shared log</Label>
      {list.length === 0 ? <Text style={type.caption}>No hunts in this group yet. Pick the group when you log a hunt, or tag hunts below.</Text> : null}
      {list.map((h) => {
        const cond = [h.waterCondition ? `water ${WATER[h.waterCondition]}` : "", h.waterLevel ?? "", h.fieldCondition ? `field ${FIELD[h.fieldCondition]}` : ""].filter(Boolean).join(" · ");
        return (
          <View key={h.id} style={s.row}>
            <View style={s.rowHead}>
              <Text style={[s.flex, { color: colors.ink }]} numberOfLines={1}>
                {h.date} · {blinds.find((b) => b.id === h.blindId)?.name ?? (h.blind || locationLabel(h))}
              </Text>
              <Text style={s.val}>{total(h.counts)} birds</Text>
            </View>
            <Text style={type.caption} numberOfLines={2}>
              {h.party.join(", ")}
              {h.windMph ? ` · ${h.sky} ${h.windMph} mph` : h.sky ? ` · ${h.sky}` : ""}
              {cond ? ` · ${cond}` : ""}
              {h.sightings ? ` · saw: ${h.sightings}` : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: 4 },
  row: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  rowHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 2 },
  val: { color: colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  twoCol: { flexDirection: "row", gap: spacing.sm },
  formBox: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSunken },
  badge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontFamily: fonts.headingSemi, fontSize: 10, letterSpacing: 1 },
  pick: { ...type.numeral, fontSize: 18, width: 22, color: colors.accent },
});
