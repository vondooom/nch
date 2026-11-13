import { useEffect, useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, SectionLabel } from "@/components/ui";
import { Input, panelStyles } from "@/components/DrawsPanel";
import {
  BlindPerfList,
  ClientBandsSection,
  ClubDrawSection,
  GuestDaysSection,
  Label,
  SeasonTotals,
  SharedLog,
  SlateSection,
} from "@/components/GroupSections";
import {
  cleanInviteCode,
  defaultRole,
  GroupMember,
  GroupRole,
  GROUP_TYPE_LABEL,
  GROUP_TYPES,
  GroupType,
  groupHunts,
  GROUPS_LOCAL_LINE,
  HuntGroup,
  makeInviteCode,
  myRole,
  pruneGroups,
  ROLE_LABEL,
  ROLES_FOR,
  toggleHunt,
  toggleSpot,
} from "@/lib/groups";
import { groupCan, RESULTS_HIDDEN_LINE } from "@/lib/permissions";
import { useGroupStore } from "@/lib/groupStore";
import { HuntLog, huntSpotKey, isSeedHunt, locationLabel, normName, Spot, total } from "@/lib/huntLog";
import { UserTypeId } from "@/lib/userTypes";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";

/** Next role when the owner taps a roster chip. Owner is fixed. */
function nextRole(t: GroupType, r: GroupRole): GroupRole {
  if (r === "owner") return "owner";
  const list = ROLES_FOR[t];
  const i = list.indexOf(r);
  return list[(i + 1) % list.length];
}

/** Default group type for a new group, from the hunter's "How I hunt" picks. */
function typeFromUser(types: UserTypeId[]): GroupType {
  if (types.includes("duck_club")) return "duck_club";
  if (types.includes("guide_service")) return "guide_service";
  if (types.includes("blind_lease")) return "blind_lease";
  return "crew";
}

export function GroupsPanel({
  hunts,
  spots,
  userId,
  userTypes = [],
  onNotice,
}: {
  hunts: HuntLog[];
  spots: Spot[];
  userId: string | null;
  userTypes?: UserTypeId[];
  onNotice: (s: string) => void;
}) {
  const store = useGroupStore();
  const { groups, loaded } = store;
  const [name, setName] = useState("");
  const [newType, setNewType] = useState<GroupType>(() => typeFromUser(userTypes));
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinType, setJoinType] = useState<GroupType>(() => typeFromUser(userTypes));
  const [joinRole, setJoinRole] = useState<GroupRole>(() => defaultRole(typeFromUser(userTypes)));
  const [openId, setOpenId] = useState<string | null>(null);

  // Forget links to hunts deleted from the logbook.
  useEffect(() => {
    if (!loaded || !hunts.length) return;
    const pruned = pruneGroups(groups, new Set(hunts.map((h) => h.id)));
    if (pruned !== groups) store.setGroups(pruned);
  }, [hunts, loaded]);

  const update = (g: HuntGroup) => store.setGroups((prev) => prev.map((x) => (x.id === g.id ? g : x)));

  function create() {
    const n = name.trim();
    if (!n) return onNotice("Name the group — your lease, guide service, club or crew.");
    const me: GroupMember = { id: newId("mem"), name: "Me", role: "owner" };
    const g: HuntGroup = {
      id: newId("grp"),
      name: n,
      type: newType,
      owner: true,
      inviteCode: makeInviteCode(),
      members: [me],
      meId: me.id,
      spotKeys: [],
      huntIds: [],
      guestDayLimit: newType === "duck_club" ? 6 : undefined,
      ownerUserId: userId,
      createdAt: Date.now(),
    };
    store.setGroups((prev) => [g, ...prev]);
    setName("");
    setOpenId(g.id);
    onNotice(`Created ${g.name} (${GROUP_TYPE_LABEL[g.type]}). Add your people and blinds — all on this phone for now.`);
  }

  function noteJoin() {
    const code = cleanInviteCode(joinCode);
    if (code.length < 7) return onNotice("Invite codes look like ABC-123.");
    if (groups.some((g) => g.inviteCode === code)) return onNotice("That code is already on this phone.");
    const me: GroupMember = { id: newId("mem"), name: "Me", role: joinRole };
    const g: HuntGroup = {
      id: newId("grp"),
      name: joinName.trim() || `Group ${code}`,
      type: joinType,
      owner: false,
      inviteCode: code,
      members: [me],
      meId: me.id,
      spotKeys: [],
      huntIds: [],
      ownerUserId: null,
      createdAt: Date.now(),
    };
    store.setGroups((prev) => [g, ...prev]);
    setJoinCode("");
    setJoinName("");
    setOpenId(g.id);
    onNotice(`Saved code ${code} as ${ROLE_LABEL[joinRole].toLowerCase()}. It links up with the group once the NorCalHunt database is set up — until then tag your own hunts here.`);
  }

  return (
    <View>
      <Card style={styles.banner}>
        <Ionicons name="lock-closed" size={16} color={colors.accent} />
        <Text style={[type.body, styles.flex, { fontSize: 14 }]}>{GROUPS_LOCAL_LINE}</Text>
      </Card>

      <SectionLabel>Your groups</SectionLabel>
      {groups.length === 0 ? (
        <Card>
          <Text style={type.body}>No groups yet. Start one below — a blind lease, guide service, duck club or crew.</Text>
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
              store.setGroups((prev) => prev.filter((x) => x.id !== g.id));
              store.setAssignments((prev) => prev.filter((a) => a.groupId !== g.id));
              store.setClubDraws((prev) => prev.filter((d) => d.groupId !== g.id));
              store.setGuestDays((prev) => prev.filter((d) => d.groupId !== g.id));
              store.setBlinds((prev) => prev.map((b) => (b.groupId === g.id ? { ...b, groupId: undefined } : b)));
            }
          }}
        />
      ))}

      <SectionLabel>New group</SectionLabel>
      <Card>
        <View style={styles.wrap}>
          {GROUP_TYPES.map((t) => (
            <Chip key={t.id} label={t.label} active={newType === t.id} onPress={() => setNewType(t.id)} />
          ))}
        </View>
        <Text style={[type.caption, { marginBottom: spacing.sm }]}>{GROUP_TYPES.find((t) => t.id === newType)?.blurb}</Text>
        <Input
          label="Group name"
          value={name}
          onChange={setName}
          placeholder={newType === "duck_club" ? "e.g. Butte Sink Gun Club" : newType === "guide_service" ? "e.g. Butte Basin Guides" : "e.g. Colusa rice lease"}
          autoCapitalize="words"
        />
        <Button label="Create group" icon="people" onPress={create} />
        <View style={styles.divider} />
        <Text style={panelStyles.label}>Got an invite code?</Text>
        <View style={styles.twoCol}>
          <Input label="Code" value={joinCode} onChange={(v) => setJoinCode(cleanInviteCode(v))} placeholder="ABC-123" autoCapitalize="characters" />
          <Input label="Group name" value={joinName} onChange={setJoinName} placeholder="Optional" autoCapitalize="words" />
        </View>
        <View style={styles.wrap}>
          {GROUP_TYPES.map((t) => (
            <Chip
              key={t.id}
              label={t.label}
              active={joinType === t.id}
              onPress={() => {
                setJoinType(t.id);
                setJoinRole(defaultRole(t.id));
              }}
            />
          ))}
        </View>
        <Text style={panelStyles.label}>I&apos;m a</Text>
        <View style={styles.wrap}>
          {ROLES_FOR[joinType].map((r) => (
            <Chip key={r} label={ROLE_LABEL[r]} active={joinRole === r} onPress={() => setJoinRole(r)} />
          ))}
        </View>
        <Button label="Save code" icon="key-outline" variant="ghost" onPress={noteJoin} />
      </Card>
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
  const store = useGroupStore();
  const [member, setMember] = useState("");
  const role = myRole(g);
  const can = {
    results: groupCan.viewResults(g),
    manage: groupCan.manage(g) || g.owner,
    assign: groupCan.assign(g),
    draw: groupCan.runDraw(g),
    log: groupCan.log(g),
    guest: groupCan.logGuestDay(g),
  };
  const tagged = useMemo(() => groupHunts(g, hunts), [g, hunts]);
  const birds = tagged.reduce((a, h) => a + total(h.counts), 0);
  const blinds = store.blinds.filter((b) => b.groupId === g.id);

  // Hunts you could tag: anything at the group's spots, plus anything already tagged.
  const candidates = useMemo(
    () => hunts.filter((h) => g.huntIds.includes(h.id) || g.spotKeys.includes(huntSpotKey(h))),
    [hunts, g.huntIds, g.spotKeys],
  );

  // Hunts logged into the group but not tied to a Blind entity: roll up by spot + blind name.
  const byBlind = useMemo(() => {
    const m = new Map<string, { label: string; hunts: number; birds: number }>();
    tagged
      .filter((h) => !h.blindId)
      .forEach((h) => {
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
    const m: GroupMember = { id: newId("mem"), name: n, role: defaultRole(g.type) };
    onChange({ ...g, members: [...g.members, m] });
    setMember("");
  }

  const roleHint =
    g.type === "guide_service"
      ? "Tap to switch guide / admin / client. Clients never see results."
      : g.type === "duck_club"
        ? "Tap to switch member / manager / admin / guest. Managers run the draw."
        : g.type === "blind_lease"
          ? "Tap to switch blindmate / admin / guest."
          : "Tap to switch roles.";

  return (
    <Card style={open ? styles.openCard : undefined}>
      <Pressable onPress={onToggle} style={styles.head}>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text style={[type.h3, styles.flex]} numberOfLines={1}>
              {g.name}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{GROUP_TYPE_LABEL[g.type].toUpperCase()}</Text>
            </View>
          </View>
          <Text style={type.caption}>
            {g.owner ? "You run it" : `You: ${ROLE_LABEL[role]}`} · {g.members.length} on roster · {blinds.length} blind{blinds.length === 1 ? "" : "s"} ·{" "}
            {can.results ? `${tagged.length} hunt${tagged.length === 1 ? "" : "s"} · ${birds} birds` : "results hidden"}
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
                    message: `Join "${g.name}" on NorCalHunt with code ${g.inviteCode}. (Group sharing turns on once the NorCalHunt database is set up — save the code for now.)`,
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

          {!g.owner ? (
            <>
              <Label>My role in this group</Label>
              <View style={styles.wrap}>
                {ROLES_FOR[g.type].map((r) => (
                  <Chip
                    key={r}
                    label={ROLE_LABEL[r]}
                    active={role === r}
                    onPress={() => onChange({ ...g, members: g.members.map((m) => (m.id === g.meId ? { ...m, role: r } : m)) })}
                  />
                ))}
              </View>
            </>
          ) : null}

          {!can.results ? (
            <View style={styles.hiddenNote}>
              <Ionicons name="eye-off-outline" size={15} color={colors.inkMuted} />
              <Text style={[type.caption, styles.flex]}>{RESULTS_HIDDEN_LINE}</Text>
            </View>
          ) : null}

          {/* ── per-type features ── */}
          {can.results ? <SeasonTotals hunts={tagged} title={g.type === "duck_club" ? "Club season totals" : "Group season"} /> : null}

          {g.type === "guide_service" ? (
            <SlateSection g={g} blinds={blinds} assignments={store.assignments} setAssignments={store.setAssignments} canEdit={can.assign} mode="guide" onNotice={onNotice} />
          ) : g.type === "blind_lease" || g.type === "crew" ? (
            <SlateSection g={g} blinds={blinds} assignments={store.assignments} setAssignments={store.setAssignments} canEdit={can.assign} mode="schedule" onNotice={onNotice} />
          ) : null}

          {g.type === "duck_club" ? (
            <>
              <ClubDrawSection
                g={g}
                blinds={blinds}
                hunts={tagged}
                clubDraws={store.clubDraws}
                setClubDraws={store.setClubDraws}
                canRun={can.draw}
                showHeat={can.results}
                onNotice={onNotice}
              />
              <GuestDaysSection
                g={g}
                guestDays={store.guestDays}
                setGuestDays={store.setGuestDays}
                onChangeGroup={onChange}
                canManage={can.manage}
                canLog={can.guest}
                onNotice={onNotice}
              />
            </>
          ) : null}

          {can.results ? (
            <>
              <Label>{g.type === "duck_club" ? "Blind-by-blind results" : "Performance by blind"}</Label>
              <BlindPerfList blinds={blinds} hunts={tagged} />
              {byBlind.length ? (
                <>
                  <Label>Logged by blind name</Label>
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
              {g.type === "guide_service" ? <ClientBandsSection hunts={tagged} /> : null}
              <SharedLog hunts={tagged} blinds={blinds} />
            </>
          ) : null}

          {/* ── roster ── */}
          <Label>{`Roster · ${roleHint}`}</Label>
          <View style={styles.wrap}>
            {g.members.map((m) => (
              <Chip
                key={m.id}
                label={`${m.name}${m.id === g.meId ? " (me)" : ""} · ${ROLE_LABEL[m.role]}`}
                active={m.role !== "member" && m.role !== "blindmate" && m.role !== "client" && m.role !== "guest"}
                onPress={() => can.manage && m.role !== "owner" && onChange({ ...g, members: g.members.map((x) => (x.id === m.id ? { ...x, role: nextRole(g.type, x.role) } : x)) })}
                onLongPress={async () => {
                  if (!can.manage || m.role === "owner" || m.id === g.meId) return;
                  if (await confirm("Remove from roster?", `${m.name} from ${g.name}`, "Remove")) {
                    onChange({ ...g, members: g.members.filter((x) => x.id !== m.id) });
                  }
                }}
              />
            ))}
          </View>
          {can.manage ? (
            <>
              <View style={styles.addRow}>
                <Input label="Add to roster" value={member} onChange={setMember} placeholder="Name" autoCapitalize="words" />
                <Button label="Add" icon="person-add" variant="ghost" onPress={addMember} style={{ alignSelf: "flex-end", marginBottom: spacing.sm }} />
              </View>
              <Text style={type.caption}>Long-press someone to remove them.</Text>
            </>
          ) : null}

          {can.log ? (
            <>
              <Label>Spots this group hunts</Label>
              {spots.length === 0 ? (
                <Text style={type.caption}>Log a hunt first — every place you log shows up here.</Text>
              ) : (
                <View style={styles.wrap}>
                  {spots.map((sp) => (
                    <Chip
                      key={sp.key}
                      label={sp.name}
                      icon={g.spotKeys.includes(sp.key) ? "checkmark" : "add"}
                      active={g.spotKeys.includes(sp.key)}
                      onPress={() => onChange(toggleSpot(g, sp.key))}
                    />
                  ))}
                </View>
              )}

              <Label>Tag hunts to this group</Label>
              {candidates.length === 0 ? (
                <Text style={type.caption}>Pick a spot above — hunts you logged there show up to tag. Or pick this group when you log a hunt.</Text>
              ) : (
                candidates.map((h) => {
                  const on = g.huntIds.includes(h.id) || h.groupId === g.id;
                  return (
                    <Pressable
                      key={h.id}
                      onPress={() =>
                        h.groupId === g.id ? onNotice("This hunt was logged into the group — edit the hunt to move it.") : onChange(toggleHunt(g, h.id))
                      }
                      style={styles.huntRow}
                    >
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
            </>
          ) : null}

          <Button label={g.owner ? "Delete group" : "Remove from this phone"} icon="trash-outline" variant="danger" onPress={onDelete} style={{ marginTop: spacing.lg }} />
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  typeBadge: { borderWidth: 1, borderColor: colors.accentDeep, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  typeBadgeText: { color: colors.accent, fontFamily: fonts.headingSemi, fontSize: 11, letterSpacing: 1 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  code: { flex: 1, color: colors.accent, fontFamily: fonts.mono, fontSize: 18, letterSpacing: 2 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  addRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  hiddenNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.bgSunken },
  blindRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  blindVal: { color: colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] },
  huntRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, borderRadius: radius.sm },
});
