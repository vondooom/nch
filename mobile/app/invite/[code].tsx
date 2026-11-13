import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, fonts, spacing, type } from "@/constants/theme";
import { Button, Card, Screen } from "@/components/ui";
import { BackHeader, ConnectGate, ErrorLine, Loading, useConnectState } from "@/components/Connect";
import { bootGroupStore, groupStore } from "@/lib/groupStore";
import { GROUP_TYPE_LABEL, HuntGroup, ROLE_LABEL } from "@/lib/groups";
import { canViewResults } from "@/lib/permissions";
import { cleanInviteInput, InvitePeek, peekInvite, redeemInvite } from "@/lib/social";
import { newId } from "@/lib/waypoints";

// norcalhunt://invite/<code> lands here (expo-router maps the path). Shows
// the group and the role on offer; joining goes through the server's
// nch_redeem_invite. No server or not signed in → the coming-soon / sign-in
// state, never a pretend join.

const STATUS_LINE: Record<Exclude<InvitePeek["status"], "open">, string> = {
  expired: "This invite has expired. Ask for a fresh one.",
  revoked: "This invite was cancelled.",
  used_up: "This invite has been used up.",
};

export default function AcceptInviteScreen() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = cleanInviteInput(String(params.code ?? ""));
  const { state } = useConnectState();
  const [peek, setPeek] = useState<InvitePeek | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "ready" || !code) return;
    let live = true;
    void peekInvite(code).then((r) => {
      if (!live) return;
      if (r.ok) setPeek(r.data);
      else setError(r.message);
    });
    return () => {
      live = false;
    };
  }, [state, code]);

  async function accept() {
    setBusy(true);
    const r = await redeemInvite(code);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    const { groupId, role } = r.data;
    // Show it under Groups on this phone, linked to the server group. Boot
    // first: a cold-start deep link lands here before anything loaded groups,
    // and writing an empty list would wipe them.
    if (peek) {
      await bootGroupStore();
      groupStore.setGroups((prev) => {
        if (prev.some((g) => g.serverId === groupId)) return prev;
        const meId = newId("mem");
        const g: HuntGroup = {
          id: newId("grp"),
          name: peek.groupName,
          type: peek.groupType,
          owner: false,
          inviteCode: "",
          members: [{ id: meId, name: "Me", role }],
          meId,
          spotKeys: [],
          huntIds: [],
          ownerUserId: null,
          serverId: groupId,
          createdAt: Date.now(),
        };
        return [g, ...prev];
      });
    }
    setJoined(ROLE_LABEL[role] ?? role);
  }

  const done = () => router.replace("/intel");

  return (
    <Screen>
      <BackHeader eyebrow="Group invite" title={peek?.groupName ?? "Join a group"} />
      <Card>
        <Text style={styles.label}>Code</Text>
        <Text style={styles.code}>{code || "—"}</Text>
      </Card>

      {state !== "ready" ? (
        <ConnectGate state={state} />
      ) : peek === undefined ? (
        <>
          <ErrorLine msg={error} />
          {!error ? <Loading /> : null}
        </>
      ) : peek === null ? (
        <Card>
          <Text style={type.body}>No invite with that code. Check it with whoever sent it.</Text>
        </Card>
      ) : joined ? (
        <Card style={styles.ok}>
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={20} color={colors.good} />
            <Text style={[type.h3, styles.flex]}>You&apos;re in {peek.groupName}</Text>
          </View>
          <Text style={[type.body, { color: colors.inkMuted, marginVertical: spacing.sm }]}>As {joined.toLowerCase()}.</Text>
          <Button label="Done" icon="checkmark" onPress={done} />
        </Card>
      ) : (
        <Card>
          <Text style={type.eyebrow}>{GROUP_TYPE_LABEL[peek.groupType] ?? "Group"}</Text>
          <Text style={type.h2}>{peek.groupName}</Text>
          <Text style={[type.body, { marginTop: spacing.sm }]}>
            You&apos;re invited as <Text style={{ color: colors.accent }}>{ROLE_LABEL[peek.role] ?? peek.role}</Text>.
          </Text>
          {!canViewResults(peek.role, peek.groupType) ? (
            <Text style={[type.caption, { marginTop: 4 }]}>You&apos;ll see blinds, the slate you&apos;re on and the staff — not the group&apos;s harvest numbers.</Text>
          ) : null}
          <Text style={[type.caption, { marginTop: 4 }]}>Good till {new Date(peek.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.</Text>
          <ErrorLine msg={error} />
          {peek.alreadyMember ? (
            <>
              <Text style={[type.body, { marginVertical: spacing.sm }]}>You&apos;re already in this group — the invite won&apos;t change your role.</Text>
              <Button label="Done" onPress={done} />
            </>
          ) : peek.status !== "open" ? (
            <>
              <Text style={[type.body, { marginVertical: spacing.sm }]}>{STATUS_LINE[peek.status]}</Text>
              <Button label="Done" variant="ghost" onPress={done} />
            </>
          ) : (
            <View style={styles.btns}>
              <Button label="Decline" variant="ghost" onPress={done} style={styles.flex} disabled={busy} />
              <Button label={busy ? "Joining…" : "Join"} icon="people" onPress={accept} style={styles.flex} disabled={busy} />
            </View>
          )}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  code: { color: colors.accent, fontFamily: fonts.mono, fontSize: 22, letterSpacing: 3, marginTop: 2 },
  ok: { borderColor: colors.good, backgroundColor: colors.goodSoft },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  btns: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});
