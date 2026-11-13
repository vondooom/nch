import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Sheet } from "@/components/ui";
import { USER_TYPES, UserTypeId, useUserTypes } from "@/lib/userTypes";

// "How I hunt" — multi-select hunter types. Used as a non-blocking card on the
// Index until the hunter picks (or says not now), and as a sheet from the
// Logbook header / account card any time after.

function TypeOption({ id, on, onPress, compact }: { id: UserTypeId; on: boolean; onPress: () => void; compact?: boolean }) {
  const t = USER_TYPES.find((x) => x.id === id)!;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={({ pressed }) => [styles.opt, on && styles.optOn, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={t.icon} size={20} color={on ? colors.accent : colors.inkMuted} />
      <View style={styles.flex}>
        <Text style={[type.h3, { fontSize: 16 }]}>{t.label}</Text>
        <Text style={type.caption}>{t.blurb}</Text>
        {!compact && on ? <Text style={[type.caption, { color: colors.ink, marginTop: 2 }]}>{t.gets.join(" · ")}</Text> : null}
      </View>
      <Ionicons name={on ? "checkbox" : "square-outline"} size={20} color={on ? colors.accent : colors.inkFaint} />
    </Pressable>
  );
}

export function TypePicker({ value, onChange, compact }: { value: UserTypeId[]; onChange: (v: UserTypeId[]) => void; compact?: boolean }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {USER_TYPES.map((t) => (
        <TypeOption
          key={t.id}
          id={t.id}
          compact={compact}
          on={value.includes(t.id)}
          onPress={() => onChange(value.includes(t.id) ? value.filter((x) => x !== t.id) : [...value, t.id])}
        />
      ))}
    </View>
  );
}

/** Index card shown until the hunter picks a type or taps Not now. Never blocks the screen. */
export function HowIHuntOnboarding() {
  const { types, promptDismissed, loaded, setTypes, dismissPrompt } = useUserTypes();
  const [pick, setPick] = useState<UserTypeId[]>([]);
  if (!loaded || types.length || promptDismissed) return null;
  return (
    <Card style={styles.onboard}>
      <Text style={type.eyebrow}>How do you hunt?</Text>
      <Text style={[type.body, { color: colors.inkMuted, marginBottom: spacing.sm, fontSize: 14 }]}>
        Pick any that fit — the app puts your tools up front. Everything else stays a tap away.
      </Text>
      <TypePicker value={pick} onChange={setPick} compact />
      <View style={styles.btnRow}>
        <Button label="Not now" variant="ghost" onPress={() => void dismissPrompt()} style={styles.flex} />
        <Button label="Save" icon="checkmark" onPress={() => void setTypes(pick)} disabled={!pick.length} style={styles.flex} />
      </View>
    </Card>
  );
}

/** Editable any time from the Logbook. */
export function HowIHuntSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { types, setTypes } = useUserTypes();
  const [pick, setPick] = useState<UserTypeId[]>(types);
  useEffect(() => {
    if (visible) setPick(types);
  }, [visible]);
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="Profile" title="How I hunt">
      <Text style={[type.body, { color: colors.inkMuted, marginBottom: spacing.md }]}>
        Pick one or more. Your Index and Logbook lead with what you use; nothing gets locked away. Saved on this phone.
      </Text>
      <TypePicker value={pick} onChange={setPick} />
      <Button
        label="Save"
        icon="checkmark"
        onPress={() => {
          void setTypes(pick);
          onClose();
        }}
        style={{ marginTop: spacing.lg }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  onboard: { borderColor: colors.accentDeep },
  btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  opt: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSunken,
  },
  optOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
});
