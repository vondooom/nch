import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, SectionLabel } from "@/components/ui";
import {
  Draw,
  DRAW_KIND_LABEL,
  DRAW_RESULT_LABEL,
  DrawKind,
  drawNights,
  DrawResult,
  drawSummary,
  DRAWS_LOCAL_LINE,
  loadDraws,
  saveDraws,
  sortDraws,
} from "@/lib/draws";
import { REFUGE_BY_ID, REFUGES } from "@/lib/refuges";
import { isoDay } from "@/lib/regs";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";

const CUSTOM = "__custom";

type Line = { drawNumber: string; spot: string };
type Form = {
  /** Selected areas: refuge ids, or CUSTOM. Several on a new night; one when editing. */
  areas: string[];
  customName: string;
  date: string;
  kind: DrawKind;
  result: DrawResult | null;
  lines: Record<string, Line>;
  notes: string;
};

const blank = (areas: string[] = ["gray-lodge"], date = isoDay(new Date()), kind: DrawKind = "sweat"): Form => ({
  areas,
  customName: "",
  date,
  kind,
  result: null,
  lines: {},
  notes: "",
});

const areaLabel = (key: string, custom: string) => (key === CUSTOM ? custom.trim() || "Other area" : REFUGE_BY_ID[key]?.short ?? key);

export function DrawsPanel({ userId, onNotice, emphasis }: { userId: string | null; onNotice: (s: string) => void; emphasis?: boolean }) {
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
  const line = (key: string): Line => form.lines[key] ?? { drawNumber: "", spot: "" };
  const patchLine = (key: string, p: Partial<Line>) => setForm((f) => ({ ...f, lines: { ...f.lines, [key]: { ...line(key), ...p } } }));

  function toggleArea(key: string) {
    if (editingId) return patch({ areas: [key] });
    setForm((f) => {
      const on = f.areas.includes(key);
      const areas = on ? f.areas.filter((a) => a !== key) : [...f.areas, key];
      return { ...f, areas: areas.length ? areas : [key] };
    });
  }

  function save() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) return onNotice("Hunt date as YYYY-MM-DD.");
    if (form.areas.includes(CUSTOM) && !form.customName.trim()) return onNotice("Name the area for a custom draw.");
    const filled = form.areas.filter((k) => line(k).drawNumber.trim());
    if (!filled.length) return onNotice(form.areas.length > 1 ? "Add the number you drew in at least one line." : "Add the number you drew.");
    const prev = editingId ? draws.find((d) => d.id === editingId) : undefined;
    const nightId = prev?.nightId ?? (filled.length > 1 ? newId("night") : undefined);
    const made: Draw[] = filled.map((k, i) => ({
      id: i === 0 && prev ? prev.id : newId("draw"),
      refugeId: k === CUSTOM ? null : k,
      areaName: k === CUSTOM ? form.customName.trim() : REFUGE_BY_ID[k].name,
      date: form.date.trim(),
      drawNumber: line(k).drawNumber.trim(),
      spot: line(k).spot.trim(),
      notes: form.notes.trim(),
      userId: prev?.userId ?? userId,
      createdAt: prev?.createdAt ?? Date.now() + i,
      updatedAt: prev ? Date.now() : undefined,
      kind: form.kind,
      result: form.result ?? undefined,
      nightId,
    }));
    commit(prev ? draws.map((x) => (x.id === prev.id ? made[0] : x)) : [...made, ...draws]);
    onNotice(
      made.length > 1
        ? `Logged ${made.length} lines for ${form.date}: ${made.map((d) => `#${d.drawNumber} ${REFUGE_BY_ID[d.refugeId ?? ""]?.short ?? d.areaName}`).join(", ")}. On this phone.`
        : `${prev ? "Updated" : "Logged"} draw #${made[0].drawNumber} at ${REFUGE_BY_ID[made[0].refugeId ?? ""]?.short ?? made[0].areaName}${made[0].spot ? ` · ${made[0].spot}` : ""}. On this phone.`,
    );
    setEditingId(null);
    // Keep the night and the areas — the next line is usually the same refuges.
    setForm(blank(form.areas, form.date, form.kind));
  }

  function edit(d: Draw) {
    const key = d.refugeId ?? CUSTOM;
    setEditingId(d.id);
    setForm({
      areas: [key],
      customName: d.refugeId ? "" : d.areaName,
      date: d.date,
      kind: d.kind ?? "sweat",
      result: d.result ?? null,
      lines: { [key]: { drawNumber: d.drawNumber, spot: d.spot } },
      notes: d.notes,
    });
  }

  function addToNight(date: string) {
    setEditingId(null);
    setForm(blank([], date, form.kind));
    onNotice(`Pick the areas you stood in on ${date} and add each number.`);
  }

  async function remove(d: Draw) {
    if (await confirm("Delete this draw?", `${d.date} · #${d.drawNumber} · ${d.areaName}`)) {
      if (editingId === d.id) {
        setEditingId(null);
        setForm(blank(form.areas));
      }
      commit(draws.filter((x) => x.id !== d.id));
    }
  }

  const summary = drawSummary(draws);
  const nights = drawNights(draws);
  const multi = form.areas.length > 1;
  const resultCounts = draws.reduce(
    (a, d) => (d.result === "in" ? { ...a, in: a.in + 1 } : d.result === "out" ? { ...a, out: a.out + 1 } : a),
    { in: 0, out: 0 },
  );

  return (
    <View>
      <Card style={[editingId ? styles.editing : undefined, emphasis && !editingId ? styles.emph : undefined]}>
        <Text style={type.eyebrow}>{editingId ? "Edit draw" : "Draw night"}</Text>
        <Text style={[type.caption, { marginBottom: spacing.sm }]}>
          {editingId ? "What you drew, where, and what it got you." : "Stood in more than one line? Pick every area — each gets its own number."}
        </Text>

        <View style={styles.chipRowWrap}>
          {(["sweat", "reservation"] as DrawKind[]).map((k) => (
            <Chip key={k} label={DRAW_KIND_LABEL[k]} icon={k === "sweat" ? "people" : "calendar"} active={form.kind === k} onPress={() => patch({ kind: k })} />
          ))}
        </View>

        <Text style={styles.label}>Area{editingId ? "" : "s · tap several"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} keyboardShouldPersistTaps="handled">
          {REFUGES.map((r) => (
            <Chip key={r.id} label={r.short} icon={form.areas.includes(r.id) && multi ? "checkmark" : undefined} active={form.areas.includes(r.id)} onPress={() => toggleArea(r.id)} />
          ))}
          <Chip label="Other" icon="create-outline" active={form.areas.includes(CUSTOM)} onPress={() => toggleArea(CUSTOM)} />
        </ScrollView>
        {form.areas.includes(CUSTOM) ? (
          <Input label="Other area name" value={form.customName} onChange={(v) => patch({ customName: v })} placeholder="e.g. Sutter NWR" />
        ) : null}

        <Input label="Hunt date" value={form.date} onChange={(v) => patch({ date: v })} placeholder="YYYY-MM-DD" />
        {form.areas.map((k) => (
          <View key={k} style={multi ? styles.lineBox : undefined}>
            {multi ? <Text style={[type.h3, { fontSize: 15, marginBottom: 4 }]}>{areaLabel(k, form.customName)}</Text> : null}
            <View style={styles.twoCol}>
              <Input
                label={form.kind === "reservation" ? "Res. # / priority" : "Draw # / line spot"}
                value={line(k).drawNumber}
                onChange={(v) => patchLine(k, { drawNumber: v })}
                placeholder="14"
                keyboard="numeric"
              />
              <Input label="Spot / blind (optional)" value={line(k).spot} onChange={(v) => patchLine(k, { spot: v })} placeholder="Pond 8" />
            </View>
          </View>
        ))}

        <Text style={styles.label}>Result (optional)</Text>
        <View style={styles.chipRowWrap}>
          {(["in", "out", "pending"] as DrawResult[]).map((r) => (
            <Chip
              key={r}
              label={DRAW_RESULT_LABEL[r]}
              tone={r === "in" ? "good" : r === "out" ? "danger" : "accent"}
              active={form.result === r}
              onPress={() => patch({ result: form.result === r ? null : r })}
            />
          ))}
        </View>
        <Input label="Notes (optional)" value={form.notes} onChange={(v) => patch({ notes: v })} placeholder="Line size, cards called, who got what" multiline />

        <View style={styles.btnRow}>
          {editingId ? (
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => {
                setEditingId(null);
                setForm(blank(form.areas));
              }}
              style={styles.flex}
            />
          ) : null}
          <Button label={editingId ? "Save changes" : multi ? `Log ${form.areas.length} lines` : "Log draw"} icon="checkmark" onPress={save} style={styles.flex} />
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
            {resultCounts.in + resultCounts.out > 0 ? (
              <Text style={[type.caption, { marginBottom: 6 }]}>
                Got in {resultCounts.in} of {resultCounts.in + resultCounts.out} draws with a result logged.
              </Text>
            ) : null}
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

      <SectionLabel>Draw log · by night</SectionLabel>
      {nights.length === 0 ? (
        <Card>
          <Text style={type.body}>No draws yet. Next time you stand in the sweat line, log your number here.</Text>
        </Card>
      ) : null}
      {nights.map((n) => (
        <Card key={n.date} style={n.draws.some((d) => d.id === editingId) ? styles.editing : undefined}>
          <View style={styles.nightHead}>
            <View style={styles.flex}>
              <Text style={type.h3}>
                {new Date(`${n.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </Text>
              <Text style={type.caption}>
                {n.draws.length} line{n.draws.length === 1 ? "" : "s"}
                {n.best && n.draws.length > 1 ? ` · best #${n.best.drawNumber} at ${REFUGE_BY_ID[n.best.refugeId ?? ""]?.short ?? n.best.areaName}` : ""}
              </Text>
            </View>
            <Pressable onPress={() => addToNight(n.date)} hitSlop={10} accessibilityLabel="Add another line this night">
              <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
            </Pressable>
          </View>
          {n.draws.map((d) => (
            <View key={d.id} style={styles.row}>
              <View style={styles.numBox}>
                <Text style={styles.numHash}>#</Text>
                <Text style={[styles.num, n.best?.id === d.id && n.draws.length > 1 ? { color: colors.good } : null]} numberOfLines={1} adjustsFontSizeToFit>
                  {d.drawNumber}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={[type.body, { color: colors.inkStrong }]} numberOfLines={1}>
                  {REFUGE_BY_ID[d.refugeId ?? ""]?.short ?? d.areaName}
                  {d.spot ? ` · ${d.spot}` : ""}
                </Text>
                <Text style={type.caption} numberOfLines={1}>
                  {DRAW_KIND_LABEL[d.kind ?? "sweat"]}
                  {d.result ? ` · ${DRAW_RESULT_LABEL[d.result]}` : ""}
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
              <Pressable onPress={() => remove(d)} hitSlop={10} accessibilityLabel="Delete draw">
                <Ionicons name="trash-outline" size={18} color={colors.inkFaint} />
              </Pressable>
            </View>
          ))}
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
  emph: { borderColor: colors.accentDeep },
  chipRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  lineBox: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline, paddingTop: spacing.sm },
  nightHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 4 },
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
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  numBox: { width: 54, flexDirection: "row", alignItems: "baseline", justifyContent: "center" },
  numHash: { color: colors.inkFaint, fontFamily: fonts.headingSemi, fontSize: 14 },
  num: { ...type.numeral, fontSize: 28, color: colors.accent },
});
