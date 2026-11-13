import { useCallback, useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts, spacing, type } from "@/constants/theme";
import { Button, Chip } from "@/components/ui";
import { Label } from "@/components/GroupSections";
import { ErrorLine, useConnectState } from "@/components/Connect";
import { GroupRole, HuntGroup, myRole, ROLE_LABEL } from "@/lib/groups";
import {
  CONNECT_OFF_LINE,
  createInvite,
  DEFAULT_INVITE_DAYS,
  GroupInvite,
  INVITE_DAYS,
  inviteShareText,
  inviteStatus,
  invitableRoles,
  listInvites,
  publishGroup,
  revokeInvite,
} from "@/lib/social";
import { confirm } from "@/lib/confirm";

// "Invite hunters" inside a group card. Only for owner / admin / manager, and
// only roles at or below your own (lib/social.ts invitableRoles — the server
// enforces the same in nch_create_invite). Real links need the server; until
// then this says so instead of handing out a code that does nothing.

const USES: { label: string; value: number | null }[] = [
  { label: "1 hunter", value: 1 },
  { label: "Up to 5", value: 5 },
  { label: "No cap", value: null },
];

const STATUS_LABEL = { open: "Open", expired: "Expired", revoked: "Cancelled", used_up: "Used up" } as const;

export function InvitePanel({ g, onChange, onNotice }: { g: HuntGroup; onChange: (g: HuntGroup) => void; onNotice: (s: string) => void }) {
  const { state } = useConnectState();
  const mine: GroupRole = g.owner ? "owner" : myRole(g);
  const roles = invitableRoles(g.type, mine);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<GroupRole>(roles[0] ?? "member");
  const [days, setDays] = useState<number>(DEFAULT_INVITE_DAYS);
  const [uses, setUses] = useState<number | null>(1);
  const [invites, setInvites] = useState<GroupInvite[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!g.serverId) return;
    const r = await listInvites(g.serverId);
    if (r.ok) setInvites(r.data);
    else setError(r.message);
  }, [g.serverId]);

  useEffect(() => {
    if (open && state === "ready") void load();
  }, [open, state, load]);

  if (!roles.length) return null;

  async function share(inv: GroupInvite) {
    try {
      await Share.share({ message: inviteShareText(g.name, inv.role, inv.code, inv.expiresAt) });
    } catch {
      // Share sheet dismissed / unavailable — the code is on screen anyway.
    }
  }

  async function publish() {
    setBusy(true);
    const r = await publishGroup(g);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setError(null);
    onChange({ ...g, serverId: r.data });
    onNotice(`${g.name} is on the server. Make an invite.`);
  }

  async function create() {
    if (!g.serverId) return;
    setBusy(true);
    const r = await createInvite(g.serverId, role, days, uses);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setError(null);
    await load();
    void share(r.data);
  }

  return (
    <View>
      <Pressable onPress={() => setOpen(!open)} style={styles.head}>
        <Ionicons name="person-add-outline" size={18} color={colors.accent} />
        <Text style={[styles.headText, styles.flex]}>Invite hunters</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.inkMuted} />
      </Pressable>
      {!open ? null : state === "off" ? (
        <Text style={type.caption}>{CONNECT_OFF_LINE} Invite links join people to the group for real, so they wait for it.</Text>
      ) : state === "signed_out" ? (
        <Button label="Sign in to invite" icon="log-in-outline" variant="ghost" onPress={() => router.push("/sign-in")} />
      ) : !g.serverId ? (
        g.owner ? (
          <>
            <Text style={[type.caption, { marginBottom: spacing.sm }]}>Invites need the group on the server first. Name and type go up; your log stays as is.</Text>
            <Button label="Put this group on the server" icon="cloud-upload-outline" variant="ghost" onPress={publish} disabled={busy} />
            <ErrorLine msg={error} />
          </>
        ) : (
          <Text style={type.caption}>The owner has to put this group on the server before anyone can invite.</Text>
        )
      ) : (
        <>
          <Label>Joins as</Label>
          <View style={styles.wrap}>
            {roles.map((r) => (
              <Chip key={r} label={ROLE_LABEL[r]} active={role === r} onPress={() => setRole(r)} />
            ))}
          </View>
          <Label>Good for</Label>
          <View style={styles.wrap}>
            {INVITE_DAYS.map((d) => (
              <Chip key={d} label={d === 1 ? "1 day" : `${d} days`} active={days === d} onPress={() => setDays(d)} />
            ))}
          </View>
          <View style={styles.wrap}>
            {USES.map((u) => (
              <Chip key={u.label} label={u.label} active={uses === u.value} onPress={() => setUses(u.value)} />
            ))}
          </View>
          <Button label={busy ? "Making…" : "Make invite link"} icon="link" onPress={create} disabled={busy} />
          <ErrorLine msg={error} />
          {invites?.length ? (
            <>
              <Label>Invites</Label>
              {invites.map((inv) => {
                const st = inviteStatus(inv);
                return (
                  <View key={inv.id} style={styles.inv}>
                    <View style={styles.flex}>
                      <Text style={styles.code}>{inv.code}</Text>
                      <Text style={type.caption}>
                        {ROLE_LABEL[inv.role]} · {STATUS_LABEL[st]} · {inv.uses}
                        {inv.maxUses ? `/${inv.maxUses}` : ""} used · till {new Date(inv.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </Text>
                    </View>
                    {st === "open" ? (
                      <>
                        <Pressable onPress={() => void share(inv)} hitSlop={8} accessibilityLabel="Share invite">
                          <Ionicons name="share-outline" size={18} color={colors.accent} />
                        </Pressable>
                        <Pressable
                          onPress={async () => {
                            if (!(await confirm("Cancel this invite?", `${inv.code} stops working.`, "Cancel invite"))) return;
                            const r = await revokeInvite(inv.id);
                            if (!r.ok) setError(r.message);
                            await load();
                          }}
                          hitSlop={8}
                          accessibilityLabel="Cancel invite"
                        >
                          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                );
              })}
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, marginTop: spacing.sm },
  headText: { color: colors.accent, fontFamily: fonts.headingSemi, fontSize: 16, letterSpacing: 0.5 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  inv: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  code: { color: colors.accent, fontFamily: fonts.mono, fontSize: 15, letterSpacing: 1.5 },
});
