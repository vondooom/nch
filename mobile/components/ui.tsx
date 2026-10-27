import { ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Header({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text style={type.eyebrow}>{eyebrow}</Text>
        <Text style={type.h1}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionTick} />
      <Text style={[type.eyebrow, styles.flex]}>{children}</Text>
      {right}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  tone = "accent",
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: "accent" | "danger" | "good";
}) {
  const fill = tone === "danger" ? colors.danger : tone === "good" ? colors.good : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: fill, borderColor: fill },
        pressed && { opacity: 0.75 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? colors.onAccent : colors.inkMuted} /> : null}
      <Text style={[styles.chipText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "ghost" | "danger";
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const fg = variant === "primary" ? colors.onAccent : variant === "danger" ? colors.danger : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "danger" && styles.btnDanger,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Bar({ value, max, color = colors.accentDeep, height = 6 }: { value: number; max: number; color?: string; height?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View style={[styles.barTrack, { height, borderRadius: height }]}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function Stat({ label, value, sub, valueStyle }: { label: string; value: string; sub?: string; valueStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  eyebrow,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
      onRequestClose={onClose}
      transparent={Platform.OS !== "ios"}
    >
      <View style={styles.sheetBackdrop}>
        <SafeAreaView style={styles.sheet} edges={["top", "bottom"]}>
          <View style={styles.sheetHead}>
            <View style={styles.flex}>
              {eyebrow ? <Text style={type.eyebrow}>{eyebrow}</Text> : null}
              <Text style={type.h2} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "flex-end", marginBottom: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTick: { width: 3, height: 14, backgroundColor: colors.rust, borderRadius: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgSunken,
  },
  chipText: { color: colors.ink, fontFamily: fonts.headingSemi, fontSize: 14, letterSpacing: 0.5 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnDanger: { borderColor: colors.danger },
  btnText: { fontFamily: fonts.heading, fontSize: 16, letterSpacing: 1, textTransform: "uppercase" },
  barTrack: { backgroundColor: colors.bgSunken, overflow: "hidden", flex: 1 },
  stat: { flex: 1, minWidth: 0 },
  statLabel: { ...type.caption, textTransform: "uppercase", letterSpacing: 1, fontSize: 10 },
  statValue: { ...type.numeral, fontSize: 22, marginTop: 2 },
  statSub: { ...type.caption, fontSize: 11 },
  sheetBackdrop: { flex: 1, backgroundColor: Platform.OS === "ios" ? colors.bg : colors.bgOverlay },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    ...(Platform.OS === "web" ? { maxWidth: 560, width: "100%", alignSelf: "center" as const } : null),
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  closeBtn: { padding: 6, borderRadius: radius.pill, backgroundColor: colors.bgElevated },
  sheetBody: { padding: spacing.lg, paddingBottom: 64 },
});
