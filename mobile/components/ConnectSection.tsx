import { useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Card, SectionLabel } from "@/components/ui";
import { ConnectGate, useConnectState } from "@/components/Connect";
import { useMyProfile, VISIBILITY_LABEL } from "@/lib/profile";
import { myFollows } from "@/lib/social";

// Field Desk → Connect. The front door to the social side. No 5th tab: the
// screens it opens are stack screens under app/.

export function ConnectSection() {
  const { state } = useConnectState();
  const { profile } = useMyProfile();
  const [incoming, setIncoming] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "ready") return;
    let live = true;
    void myFollows().then((r) => live && r.ok && setIncoming(r.data.incoming.length));
    return () => {
      live = false;
    };
  }, [state]);

  async function shareHandle() {
    if (!profile.handle) {
      router.push("/profile");
      return;
    }
    setNote(null);
    try {
      await Share.share({ message: `I'm @${profile.handle} on NorCalHunt. Field Desk → Connect → Find hunters.` });
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    }
  }

  const ready = state === "ready";
  return (
    <View>
      <SectionLabel>Connect</SectionLabel>
      {!ready ? <ConnectGate state={state} /> : null}
      <Card style={styles.card}>
        <Row
          icon="person-circle-outline"
          label="My profile"
          sub={profile.handle ? `@${profile.handle} · log: ${VISIBILITY_LABEL[profile.logbookPrivacy]}` : `Pick a handle · log: ${VISIBILITY_LABEL[profile.logbookPrivacy]}`}
          to="/profile"
        />
        <Row icon="search" label="Find hunters" sub="By name or handle" to="/search" off={!ready} />
        <Row icon="mail-unread-outline" label="Requests & followers" sub={incoming ? `${incoming} waiting` : "Requests, followers, following"} to="/requests" off={!ready} badge={incoming} />
        <Row icon="newspaper-outline" label="Friends feed" sub="Recent hunts you're allowed to see" to="/feed" off={!ready} />
        <Row icon="key-outline" label="Have an invite code?" sub="Join a lease, club or guide service" to="/invite" off={!ready} />
        <Pressable onPress={shareHandle} style={({ pressed }) => [styles.row, styles.last, pressed && { opacity: 0.8 }]}>
          <Ionicons name="share-outline" size={20} color={colors.accent} />
          <View style={styles.flex}>
            <Text style={styles.label}>Share my handle</Text>
            <Text style={type.caption}>{profile.handle ? `@${profile.handle}` : "Set a handle first"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
        </Pressable>
        {note ? <Text style={type.caption}>{note}</Text> : null}
      </Card>
    </View>
  );
}

function Row({
  icon,
  label,
  sub,
  to,
  off,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  to: Href;
  off?: boolean;
  badge?: number;
}) {
  return (
    <Pressable onPress={() => router.push(to)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icon} size={20} color={off ? colors.inkFaint : colors.accent} />
      <View style={styles.flex}>
        <Text style={[styles.label, off && { color: colors.inkMuted }]}>{label}</Text>
        <Text style={type.caption}>{off ? "Needs the server" : sub}</Text>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { paddingVertical: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  last: { borderBottomWidth: 0 },
  label: { color: colors.inkStrong, fontFamily: fonts.headingSemi, fontSize: 17, letterSpacing: 0.3 },
  badge: { minWidth: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { color: colors.onAccent, fontFamily: fonts.heading, fontSize: 13 },
});
