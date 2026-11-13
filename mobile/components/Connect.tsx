import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, Header } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { cardinal } from "@/lib/geo";
import { FIELD_CONDITIONS, WATER_CONDITIONS } from "@/lib/huntLog";
import { HuntView } from "@/lib/privacy";
import { VISIBILITIES, Visibility, VISIBILITY_LABEL } from "@/lib/profile";
import { CONNECT_OFF_LINE, CONNECT_OFF_SUB, CONNECT_SIGN_IN, connectState, ConnectState, HunterProfile, hunterName } from "@/lib/social";
import { typesLabel } from "@/lib/userTypes";

// Shared bits for the Connect screens (Field Desk → Connect, and the stack
// screens under app/): the coming-soon state, hunter rows, a redacted hunt
// card, the visibility picker.

export function useConnectState(): { state: ConnectState; userId: string | null; loading: boolean } {
  const { session, loading } = useAuth();
  return { state: connectState(session), userId: session?.user.id ?? null, loading };
}

/** Header for a pushed Connect screen, with a back button. */
export function BackHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const back = () => (router.canGoBack() ? router.back() : router.replace("/intel"));
  return (
    <Header
      eyebrow={eyebrow}
      title={title}
      right={
        <Pressable onPress={back} style={styles.back} accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.accent} />
        </Pressable>
      }
    />
  );
}

/** The no-server / signed-out state. Never fakes other hunters. */
export function ConnectGate({ state, children }: { state: ConnectState; children?: ReactNode }) {
  if (state === "off") {
    return (
      <Card style={styles.off}>
        <View style={styles.offHead}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.accent} />
          <Text style={[type.h3, styles.flex]}>{CONNECT_OFF_LINE}</Text>
        </View>
        <Text style={[type.body, { color: colors.inkMuted, fontSize: 14 }]}>{CONNECT_OFF_SUB}</Text>
        {children}
      </Card>
    );
  }
  if (state === "signed_out") {
    return (
      <Card>
        <Text style={[type.body, { marginBottom: spacing.md }]}>{CONNECT_SIGN_IN}</Text>
        <Button label="Sign in" icon="log-in-outline" onPress={() => router.push("/sign-in")} />
        {children}
      </Card>
    );
  }
  return null;
}

export function Loading() {
  return <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />;
}

export function ErrorLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <View style={styles.errRow}>
      <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
      <Text style={[type.caption, styles.flex, { color: colors.ink }]}>{msg}</Text>
    </View>
  );
}

export function HunterRow({ p, right, onPress }: { p: HunterProfile; right?: ReactNode; onPress?: () => void }) {
  const open = onPress ?? (() => router.push({ pathname: "/hunter/[id]", params: { id: p.userId } }));
  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.hunterRow, pressed && { opacity: 0.8 }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(p.displayName || p.handle || "?").slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={[type.h3, { fontSize: 16 }]} numberOfLines={1}>
          {hunterName(p)}
        </Text>
        <Text style={type.caption} numberOfLines={1}>
          {[p.handle ? `@${p.handle}` : "", p.homeArea, p.userTypes.length ? typesLabel(p.userTypes) : ""].filter(Boolean).join(" · ")}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

const WATER = Object.fromEntries(WATER_CONDITIONS.map((w) => [w.id, w.label]));
const FIELD = Object.fromEntries(FIELD_CONDITIONS.map((f) => [f.id, f.label]));

/** One entry as the viewer is allowed to see it. No detail → no spot, no names, no notes. */
export function HuntViewCard({ v, author }: { v: HuntView; author?: HunterProfile }) {
  const weather = [v.sky, v.windMph ? `${Math.round(v.windMph)} mph ${cardinal(v.windDir)}` : "", v.tempF ? `${Math.round(v.tempF)}°F` : ""]
    .filter(Boolean)
    .join(" · ");
  const conditions = [v.waterCondition ? `Water ${WATER[v.waterCondition]}` : "", v.fieldCondition ? `Field ${FIELD[v.fieldCondition]}` : ""]
    .filter(Boolean)
    .join(" · ");
  const d = v.detail;
  return (
    <Card style={styles.huntCard}>
      {author ? <HunterRow p={author} /> : null}
      <View style={styles.huntHead}>
        <View style={styles.flex}>
          <Text style={styles.huntDate}>{v.date}</Text>
          <Text style={type.h3} numberOfLines={1}>
            {d ? `${d.locationName}${d.blind ? ` · ${d.blind}` : ""}` : v.area}
          </Text>
        </View>
        <View style={styles.birds}>
          <Text style={styles.birdsNum}>{v.birds}</Text>
          <Text style={styles.birdsLabel}>birds</Text>
        </View>
      </View>
      <Text style={type.caption}>
        {v.partySize} hunter{v.partySize === 1 ? "" : "s"}
        {weather ? ` · ${weather}` : ""}
        {conditions ? ` · ${conditions}` : ""}
        {v.bandCount ? ` · ${v.bandCount} band${v.bandCount === 1 ? "" : "s"}` : ""}
      </Text>
      {d ? (
        <>
          {d.party.length ? <Text style={type.caption}>With {d.party.join(", ")}</Text> : null}
          {d.sightings ? <Text style={type.caption}>Saw: {d.sightings}</Text> : null}
          {d.notes ? <Text style={[type.body, { fontSize: 14, marginTop: 4 }]}>{d.notes}</Text> : null}
        </>
      ) : (
        <View style={styles.redacted}>
          <Ionicons name="eye-off-outline" size={12} color={colors.inkFaint} />
          <Text style={[type.caption, { fontSize: 11 }]}>Spot, blind and notes stay in their groups.</Text>
        </View>
      )}
      <VisibilityBadge v={v.visibility} />
    </Card>
  );
}

export function VisibilityBadge({ v }: { v: Visibility }) {
  const icon = VISIBILITIES.find((x) => x.id === v)?.icon ?? "lock-closed";
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={11} color={colors.inkMuted} />
      <Text style={styles.badgeText}>{VISIBILITY_LABEL[v]}</Text>
    </View>
  );
}

/** Pick a visibility. `inherit` adds a "Default (…)" chip that maps to undefined. */
export function VisibilityPicker({
  value,
  onChange,
  inherit,
}: {
  value: Visibility | undefined;
  onChange: (v: Visibility | undefined) => void;
  inherit?: Visibility;
}) {
  const shown = VISIBILITIES.find((x) => x.id === (value ?? inherit));
  return (
    <View>
      <View style={styles.wrap}>
        {inherit ? <Chip label={`Default · ${VISIBILITY_LABEL[inherit]}`} active={value === undefined} onPress={() => onChange(undefined)} /> : null}
        {VISIBILITIES.map((x) => (
          <Chip key={x.id} label={x.label} icon={x.icon} active={value === x.id} onPress={() => onChange(x.id)} />
        ))}
      </View>
      {shown ? <Text style={type.caption}>{shown.blurb}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { padding: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  off: { borderColor: colors.accentDeep, backgroundColor: colors.accentSoft },
  offHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  errRow: { flexDirection: "row", alignItems: "center", gap: 6, marginVertical: spacing.sm },
  hunterRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgSunken, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.accent, fontFamily: fonts.heading, fontSize: 18 },
  huntCard: { gap: 4 },
  huntHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  huntDate: { color: colors.accent, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
  birds: { alignItems: "center", minWidth: 48 },
  birdsNum: { ...type.numeral, fontSize: 28, color: colors.accent },
  birdsLabel: { ...type.caption, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  redacted: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: colors.inkMuted, fontSize: 11, fontFamily: fonts.headingSemi, letterSpacing: 0.5 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
});
