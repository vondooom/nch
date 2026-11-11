import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, SectionLabel } from "@/components/ui";
import { Draw, drawSummary, DRAWS_LOCAL_LINE, loadDraws, saveDraws, sortDraws } from "@/lib/draws";
import { REFUGE_BY_ID, REFUGES } from "@/lib/refuges";
import { isoDay } from "@/lib/regs";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";

type Form = { refugeId: string | null; customName: string; date: string; drawNumber: string; spot: string; notes: string };

const blank = (refugeId: string | null = "gray-lodge"): Form => ({
  refugeId,
  customName: "",
  date: isoDay(new Date()),
  drawNumber: "",
  spot: "",
  notes: "",
});

export function DrawsPanel({ userId, onNotice }: { userId: string | null; onNotice: (s: string) => void }) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [form, setForm] = useState<Form>(blank());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadDraws().then(setDraws);
  }, []);

  const commit = (list: Draw[]) => {
    const sorted = sortDraws(list);
    setDraws(sorted);
    void saveDraws(sorted);
  };
  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  function save() {
    const areaName = form.refugeId ? REFUGE_BY_ID[form.refugeId].name : form.customName.trim();
    if (!areaName) return onNotice("Name the area for a custom draw.");
    if (!form.drawNumber.trim()) return onNotice("Add the number you drew.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) return onNotice("Hunt date as YYYY-MM-DD.");
    const prev = editingId ? draws.find((d) => d.id === editingId) : undefined;
    const d: Draw = {
      id: prev?.id ?? newId("draw"),
      refugeId: form.refugeId,
      areaName,
      date: form.date.trim(),
      drawNumber: form.drawNumber.trim(),
      spot: form.spot.trim(),
      notes: form.notes.trim(),
      userId: prev?.userId ?? userId,
      createdAt: prev?.createdAt ?? Date.now(),
      updatedAt: prev ? Date.now() : undefined,
    };
    commit(prev ? draws.map((x) => (x.id === d.id ? d : x)) : [d, ...draws]);
    onNotice(`${prev ? "Updated" : "Logged"} draw #${d.drawNumber} at ${REFUGE_BY_ID[d.refugeId ?? ""]?.short ?? d.areaName}${d.spot ? ` · ${d.spot}` : ""}. On this phone.`);
    setEditingId(null);
    setForm(blank(form.refugeId));
  }

  function edit(d: Draw) {
    setEditingId(d.id);
    setForm({ refugeId: d.refugeId, customName: d.refugeId ? "" : d.areaName, date: d.date, drawNumber: d.drawNumber, spot: d.spot, notes: d.notes });
  }

  const summary = drawSummary(draws);

  return (
    <View>
      <Card style={editingId ? styles.editing : undefined}>
        <Text style={type.eyebrow}>{editingId ? "Edit draw" : "Sweat-line draw"}</Text>
        <Text style={[type.caption, { marginBottom: spacing.sm }]}>What you drew, where, and what it got you.</Text>

        <Text style={styles.label}>Area</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} keyboardShouldPersistTaps="handled">
          {REFUGES.map((r) => (
            <Chip key={r.id} label={r.short} active={form.refugeId === r.id} onPress={() => patch({ refugeId: r.id })} />
          ))}
          <Chip label="Other" icon="create-outline" active={form.refugeId == null} onPress={() => patch({ refugeId: null })} />
        </ScrollView>
        {form.refugeId == null ? (
          <Input label="Area name" value={form.customName} onChange={(v) => patch({ customName: v })} placeholder="e.g. Sutter NWR" />
        ) : null}

        <View style={styles.twoCol}>
          <Input label="Hunt date" value={form.date} onChange={(v) => patch({ date: v })} placeholder="YYYY-MM-DD" />
          <Input label="Draw # / line spot" value={form.drawNumber} onChange={(v) => patch({ drawNumber: v })} placeholder="14" keyboard="numeric" />
        </View>
        <Input label="Spot / blind you took (optional)" value={form.spot} onChange={(v) => patch({ spot: v })} placeholder="e.g. Pond 8 free roam" />
        <Input label="Notes (optional)" value={form.notes} onChange={(v) => patch({ notes: v })} placeholder="Line size, cards called, who got what" multiline />

        <View style={styles.btnRow}>
          {editingId ? (
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => {
                setEditingId(null);
                setForm(blank(form.refugeId));
              }}
              style={styles.flex}
            />
          ) : null}
          <Button label={editingId ? "Save changes" : "Log draw"} icon="checkmark" onPress={save} style={styles.flex} />
        </View>
        <View style={styles.localLine}>
          <Ionicons name="phone-portrait-outline" size={13} color={colors.inkFaint} />
          <Text style={[type.caption, styles.flex]}>{DRAWS_LOCAL_LINE}</Text>
        </View>
      </Card>

      {summary.length ? (
        <>
          <SectionLabel>Your draw luck</SectionLabel>
          <Card>
            {summary.map((s) => (
              <View key={s.areaName} style={styles.sumRow}>
                <Text style={[styles.flex, { color: colors.ink }]} numberOfLines={1}>
                  {s.areaName}
                </Text>
                <Text style={styles.sumVal}>
                  {s.count} draw{s.count === 1 ? "" : "s"}
                  {s.best != null ? ` · best #${s.best}` : ""}
                  {s.avg != null ? ` · avg #${s.avg.toFixed(1)}` : ""}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionLabel>Draw log</SectionLabel>
      {draws.length === 0 ? (
        <Card>
          <Text style={type.body}>No draws yet. Next time you stand in the sweat line, log your number here.</Text>
        </Card>
      ) : null}
      {draws.map((d) => (
        <Card key={d.id} style={[styles.row, editingId === d.id && styles.editing]}>
          <View style={styles.numBox}>
            <Text style={styles.numHash}>#</Text>
            <Text style={styles.num} numberOfLines={1} adjustsFontSizeToFit>
              {d.drawNumber}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text style={type.h3} numberOfLines={1}>
              {REFUGE_BY_ID[d.refugeId ?? ""]?.short ?? d.areaName}
            </Text>
            <Text style={type.caption}>
              {d.date}
              {d.spot ? ` · ${d.spot}` : ""}
            </Text>
            {d.notes ? (
              <Text style={[type.caption, { color: colors.inkMuted }]} numberOfLines={2}>
                {d.notes}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => edit(d)} hitSlop={10} accessibilityLabel="Edit draw">
            <Ionicons name="create-outline" size={19} color={colors.inkMuted} />
          </Pressable>
          <Pressable
            onPress={async () => {
              if (await confirm("Delete this draw?", `${d.date} · #${d.drawNumber} · ${d.areaName}`)) {
                if (editingId === d.id) {
                  setEditingId(null);
                  setForm(blank(form.refugeId));
                }
                commit(draws.filter((x) => x.id !== d.id));
              }
            }}
            hitSlop={10}
            accessibilityLabel="Delete draw"
          >
            <Ionicons name="trash-outline" size={18} color={colors.inkFaint} />
          </Pressable>
        </Card>
      ))}
    </View>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: "numeric";
  multiline?: boolean;
  autoCapitalize?: "characters" | "words" | "sentences";
}) {
  return (
    <View style={[styles.field, styles.flex]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={keyboard === "numeric" ? "numbers-and-punctuation" : "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 64, textAlignVertical: "top" }]}
      />
    </View>
  );
}

export const panelStyles = StyleSheet.create({
  label: { ...type.caption, textTransform: "uppercase", letterSpacing: 1, fontSize: 10, marginBottom: 4 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  editing: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  label: panelStyles.label,
  chipRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  twoCol: { flexDirection: "row", gap: spacing.sm },
  field: { marginBottom: spacing.sm },
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
  btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  localLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  sumRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  sumVal: { color: colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  numBox: { width: 54, flexDirection: "row", alignItems: "baseline", justifyContent: "center" },
  numHash: { color: colors.inkFaint, fontFamily: fonts.headingSemi, fontSize: 14 },
  num: { ...type.numeral, fontSize: 28, color: colors.accent },
});
