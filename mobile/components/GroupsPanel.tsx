import { useEffect, useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, SectionLabel } from "@/components/ui";
import { Input, panelStyles } from "@/components/DrawsPanel";
import {
  cleanInviteCode,
  GroupMember,
  GroupRole,
  GROUPS_LOCAL_LINE,
  HuntGroup,
  loadGroups,
  makeInviteCode,
  pruneGroups,
  saveGroups,
  toggleHunt,
  toggleSpot,
} from "@/lib/groups";
import { HuntLog, huntSpotKey, isSeedHunt, locationLabel, normName, Spot, total } from "@/lib/huntLog";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";

const ROLE_NEXT: Record<GroupRole, GroupRole> = { owner: "owner", guide: "member", member: "guide" };
const ROLE_LABEL: Record<GroupRole, string> = { owner: "Owner", guide: "Guide", member: "Hunter" };

export function GroupsPanel({
  hunts,
  spots,
  userId,
  onNotice,
}: {
  hunts: HuntLog[];
  spots: Spot[];
  userId: string | null;
  onNotice: (s: string) => void;
}) {
  const [groups, setGroups] = useState<HuntGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups().then((g) => {
      setGroups(g);
      setLoaded(true);
    });
  }, []);

  // Forget links to hunts deleted from the logbook.
  useEffect(() => {
    if (!loaded) return;
    const pruned = pruneGroups(groups, new Set(hunts.map((h) => h.id)));
    if (pruned !== groups) commit(pruned);
  }, [hunts, loaded]);

  const commit = (list: HuntGroup[]) => {
    setGroups(list);
    void saveGroups(list);
  };
  const update = (g: HuntGroup) => commit(groups.map((x) => (x.id === g.id ? g : x)));

  function create() {
    const n = name.trim();
    if (!n) return onNotice("Name the group — e.g. your guide service or blind crew.");
    const g: HuntGroup = {
      id: newId("grp"),
      name: n,
      owner: true,
      inviteCode: makeInviteCode(),
      members: [{ id: newId("mem"), name: "Me", role: "owner" }],
      spotKeys: [],
      huntIds: [],
      ownerUserId: userId,
      createdAt: Date.now(),
    };
    commit([g, ...groups]);
    setName("");
    setOpenId(g.id);
    onNotice(`Created ${g.name}. Add the spots you run and tag hunts to it — all on this phone for now.`);
  }

  function noteJoin() {
    const code = cleanInviteCode(joinCode);
    if (code.length < 7) return onNotice("Invite codes look like ABC-123.");
    if (groups.some((g) => g.inviteCode === code)) return onNotice("That code is already on this phone.");
    const g: HuntGroup = {
      id: newId("grp"),
      name: joinName.trim() || `Group ${code}`,
      owner: false,
      inviteCode: code,
      members: [{ id: newId("mem"), name: "Me", role: "member" }],
      spotKeys: [],
      huntIds: [],
      ownerUserId: null,
      createdAt: Date.now(),
    };
    commit([g, ...groups]);
    setJoinCode("");
    setJoinName("");
    setOpenId(g.id);
    onNotice(`Saved code ${code}. It links up with the guide's group once sharing turns on — until then tag your own hunts here.`);
  }

  return (
    <View>
      <Card style={styles.banner}>
        <Ionicons name="lock-closed" size={16} color={colors.accent} />
        <Text style={[type.body, styles.flex, { fontSize: 14 }]}>{GROUPS_LOCAL_LINE}</Text>
      </Card>

      <SectionLabel>New group</SectionLabel>
      <Card>
        <Text style={[type.caption, { marginBottom: spacing.sm }]}>
          Guides: one group for the operation, add every spot you run, and log each blind&apos;s hunts under it. Crews: one group per blind.
        </Text>
        <Input label="Group name" value={name} onChange={setName} placeholder="e.g. Butte Basin Guides" autoCapitalize="words" />
        <Button label="Create group" icon="people" onPress={create} />
        <View style={styles.divider} />
        <Text style={panelStyles.label}>Got an invite code?</Text>
        <View style={styles.twoCol}>
          <Input label="Code" value={joinCode} onChange={(v) => setJoinCode(cleanInviteCode(v))} placeholder="ABC-123" autoCapitalize="characters" />
          <Input label="Group name" value={joinName} onChange={setJoinName} placeholder="Optional" autoCapitalize="words" />
        </View>
        <Button label="Save code" icon="key-outline" variant="ghost" onPress={noteJoin} />
      </Card>

      <SectionLabel>Your groups</SectionLabel>
      {groups.length === 0 ? (
        <Card>
          <Text style={type.body}>No groups yet.</Text>
        </Card>
      ) : null}
      {groups.map((g) => (
        <GroupCard
          key={g.id}
          g={g}
          open={openId === g.id}
          onToggle={() => setOpenId(openId === g.id ? null : g.id)}
          hunts={hunts}
          spots={spots}
          onChange={update}
          onNotice={onNotice}
          onDelete={async () => {
            if (await confirm("Delete this group?", `${g.name} — hunts stay in your logbook.`, "Delete")) {
              commit(groups.filter((x) => x.id !== g.id));
            }
          }}
        />
      ))}
    </View>
  );
}

function GroupCard({
  g,
  open,
  onToggle,
  hunts,
  spots,
  onChange,
  onDelete,
  onNotice,
}: {
  g: HuntGroup;
  open: boolean;
  onToggle: () => void;
  hunts: HuntLog[];
  spots: Spot[];
  onChange: (g: HuntGroup) => void;
  onDelete: () => void;
  onNotice: (s: string) => void;
}) {
  const [member, setMember] = useState("");
  const tagged = hunts.filter((h) => g.huntIds.includes(h.id));
  const birds = tagged.reduce((a, h) => a + total(h.counts), 0);

  // Hunts you could tag: anything at the group's spots, plus anything already tagged.
  const candidates = useMemo(
    () => hunts.filter((h) => g.huntIds.includes(h.id) || g.spotKeys.includes(huntSpotKey(h))),
    [hunts, g.huntIds, g.spotKeys],
  );

  // Combined logbook per blind: tagged hunts rolled up by spot + blind.
  const byBlind = useMemo(() => {
    const m = new Map<string, { label: string; hunts: number; birds: number }>();
    tagged.forEach((h) => {
      const label = `${locationLabel(h)}${h.blind ? ` · ${h.blind}` : ""}`;
      const k = `${huntSpotKey(h)}|${normName(h.blind)}`;
      const row = m.get(k) ?? { label, hunts: 0, birds: 0 };
      row.hunts++;
      row.birds += total(h.counts);
      m.set(k, row);
    });
    return [...m.values()].sort((a, b) => b.birds - a.birds);
  }, [tagged]);

  function addMember() {
    const n = member.trim();
    if (!n) return;
    if (g.members.some((m) => normName(m.name) === normName(n))) return onNotice(`${n} is already in ${g.name}.`);
    const m: GroupMember = { id: newId("mem"), name: n, role: "member" };
    onChange({ ...g, members: [...g.members, m] });
    setMember("");
  }

  return (
    <Card style={open ? styles.openCard : undefined}>
      <Pressable onPress={onToggle} style={styles.head}>
        <View style={styles.flex}>
          <Text style={type.h3} numberOfLines={1}>
            {g.name}
          </Text>
          <Text style={type.caption}>
            {g.owner ? "You run it" : "Joined by code"} · {g.members.length} hunter{g.members.length === 1 ? "" : "s"} · {g.spotKeys.length} spot
            {g.spotKeys.length === 1 ? "" : "s"} · {tagged.length} hunt{tagged.length === 1 ? "" : "s"} · {birds} birds
          </Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.inkMuted} />
      </Pressable>

      {open ? (
        <View style={{ marginTop: spacing.sm }}>
          <View style={styles.codeRow}>
            <Text style={panelStyles.label}>Invite code</Text>
            <Text style={styles.code}>{g.inviteCode}</Text>
            {g.owner ? (
              <Pressable
                onPress={() =>
                  void Share.share({
                    message: `Join "${g.name}" on NorCalHunt with code ${g.inviteCode}. (Group sharing turns on after account lockdown — save the code for now.)`,
                  })
                }
                hitSlop={8}
                accessibilityLabel="Share invite code"
              >
                <Ionicons name="share-outline" size={18} color={colors.accent} />
              </Pressable>
            ) : null}
          </View>
          <Text style={type.caption}>The code doesn&apos;t connect phones yet — it&apos;s saved for when sharing turns on.</Text>

          <Text style={[panelStyles.label, { marginTop: spacing.md }]}>Hunters · tap to switch guide / hunter</Text>
          <View style={styles.wrap}>
            {g.members.map((m) => (
              <Chip
                key={m.id}
                label={`${m.name} · ${ROLE_LABEL[m.role]}`}
                active={m.role !== "member"}
                onPress={() => g.owner && m.role !== "owner" && onChange({ ...g, members: g.members.map((x) => (x.id === m.id ? { ...x, role: ROLE_NEXT[x.role] } : x)) })}
                onLongPress={async () => {
                  if (m.role === "owner") return;
                  if (await confirm("Remove hunter?", `${m.name} from ${g.name}`, "Remove")) {
                    onChange({ ...g, members: g.members.filter((x) => x.id !== m.id) });
                  }
                }}
              />
            ))}
          </View>
          <View style={styles.addRow}>
            <Input label="Add hunter" value={member} onChange={setMember} placeholder="Name" autoCapitalize="words" />
            <Button label="Add" icon="person-add" variant="ghost" onPress={addMember} style={{ alignSelf: "flex-end", marginBottom: spacing.sm }} />
          </View>
          <Text style={type.caption}>Long-press a hunter to remove them.</Text>

          <Text style={[panelStyles.label, { marginTop: spacing.md }]}>Spots this group hunts</Text>
          {spots.length === 0 ? (
            <Text style={type.caption}>Log a hunt first — every place you log shows up here.</Text>
          ) : (
            <View style={styles.wrap}>
              {spots.map((s) => (
                <Chip
                  key={s.key}
                  label={s.name}
                  icon={g.spotKeys.includes(s.key) ? "checkmark" : "add"}
                  active={g.spotKeys.includes(s.key)}
                  onPress={() => onChange(toggleSpot(g, s.key))}
                />
              ))}
            </View>
          )}

          {byBlind.length ? (
            <>
              <Text style={[panelStyles.label, { marginTop: spacing.md }]}>Combined logbook by blind</Text>
              {byBlind.map((b) => (
                <View key={b.label} style={styles.blindRow}>
                  <Text style={[styles.flex, { color: colors.ink }]} numberOfLines={1}>
                    {b.label}
                  </Text>
                  <Text style={styles.blindVal}>
                    {b.hunts} hunt{b.hunts === 1 ? "" : "s"} · {b.birds} birds
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          <Text style={[panelStyles.label, { marginTop: spacing.md }]}>Tag hunts to this group</Text>
          {candidates.length === 0 ? (
            <Text style={type.caption}>Pick a spot above — hunts you logged there show up to tag.</Text>
          ) : (
            candidates.map((h) => {
              const on = g.huntIds.includes(h.id);
              return (
                <Pressable key={h.id} onPress={() => onChange(toggleHunt(g, h.id))} style={styles.huntRow}>
                  <Ionicons name={on ? "checkbox" : "square-outline"} size={20} color={on ? colors.accent : colors.inkFaint} />
                  <View style={styles.flex}>
                    <Text style={{ color: colors.ink }} numberOfLines={1}>
                      {h.date} · {locationLabel(h)}
                      {h.blind ? ` · ${h.blind}` : ""}
                    </Text>
                    <Text style={type.caption} numberOfLines={1}>
                      {total(h.counts)} birds · {h.party.join(", ")}
                      {isSeedHunt(h) ? " · sample" : ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}

          <Button label="Delete group" icon="trash-outline" variant="danger" onPress={onDelete} style={{ marginTop: spacing.lg }} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderColor: colors.accentDeep, backgroundColor: colors.accentSoft },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginVertical: spacing.md },
  twoCol: { flexDirection: "row", gap: spacing.sm },
  openCard: { borderColor: colors.borderStrong },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  codeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  code: { flex: 1, color: colors.accent, fontFamily: fonts.mono, fontSize: 18, letterSpacing: 2 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  addRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  blindRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  blindVal: { color: colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] },
  huntRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, borderRadius: radius.sm },
});
