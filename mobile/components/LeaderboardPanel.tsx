import { useMemo, useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, SectionLabel, Stat } from "@/components/ui";
import { BOARD_LOCAL_LINE, Board, boardShareText, buildBoard, huntShareText } from "@/lib/leaderboard";
import { HuntLog, isSeedHunt, locationLabel, seasonOf, total } from "@/lib/huntLog";
import { isoDay } from "@/lib/regs";

// Refuge-rat board: this phone's hunters, spots and species for a season, and
// a text share card for the group chat. No public board until the NorCalHunt
// database exists.

export function LeaderboardPanel({ hunts, onNotice }: { hunts: HuntLog[]; onNotice: (s: string) => void }) {
  const real = hunts.filter((h) => !isSeedHunt(h)).length;
  const [samples, setSamples] = useState<boolean | null>(null);
  const includeSamples = samples ?? real === 0;
  const seasons = useMemo(() => [...new Set(hunts.map((h) => seasonOf(h.date)))].sort().reverse(), [hunts]);
  const [picked, setPicked] = useState<string | null>(null);
  const season = picked && seasons.includes(picked) ? picked : seasons[0] ?? seasonOf(isoDay(new Date()));
  const board = useMemo(() => buildBoard(hunts, season, includeSamples), [hunts, season, includeSamples]);
  const latest = hunts.find((h) => includeSamples || !isSeedHunt(h));

  async function share(text: string) {
    try {
      await Share.share({ message: text });
    } catch (e) {
      onNotice(`Couldn't open the share sheet: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <View>
      <View style={styles.local}>
        <Ionicons name="phone-portrait-outline" size={13} color={colors.inkFaint} />
        <Text style={[type.caption, styles.flex]}>{BOARD_LOCAL_LINE}</Text>
      </View>
      <View style={styles.wrap}>
        {seasons.map((x) => (
          <Chip key={x} label={x} active={season === x} onPress={() => setPicked(x)} />
        ))}
        {hunts.some(isSeedHunt) ? <Chip label="Include samples" active={includeSamples} onPress={() => setSamples(!includeSamples)} /> : null}
      </View>

      <Card>
        <View style={styles.statsRow}>
          <Stat label="Birds" value={String(board.birds)} valueStyle={{ color: colors.accent }} />
          <Stat label="Hunts" value={String(board.hunts)} />
          <Stat label="Hunters" value={String(board.hunters.length)} />
          <Stat label="Spots" value={String(board.locations.length)} />
        </View>
      </Card>

      <SectionLabel>Hunters · birds credited</SectionLabel>
      <Card>
        {board.hunters.length === 0 ? <Text style={type.body}>No hunts this season yet.</Text> : null}
        <Rows rows={board.hunters.slice(0, 10).map((r) => ({ name: r.name, sub: `${r.hunts} hunts`, value: String(r.birds) }))} />
        <Text style={[type.caption, { marginTop: spacing.sm }]}>A hunt&apos;s birds split evenly across its party — the log doesn&apos;t record who shot what.</Text>
      </Card>

      <SectionLabel>Spots · birds per hunt</SectionLabel>
      <Card>
        <Rows rows={[...board.locations].sort((a, b) => b.perHunt - a.perHunt).slice(0, 10).map((r) => ({ name: r.name, sub: `${r.hunts} hunts · ${r.birds} birds`, value: r.perHunt.toFixed(1) }))} />
      </Card>

      <SectionLabel>Species</SectionLabel>
      <Card>
        <Rows rows={board.species.slice(0, 8).map((r) => ({ name: r.name, value: String(r.count) }))} />
      </Card>

      <SectionLabel>Share card</SectionLabel>
      <Card>
        <Text style={styles.preview}>{boardShareText(board)}</Text>
        <Button label="Share season card" icon="share-social" onPress={() => void share(boardShareText(board))} style={{ marginTop: spacing.sm }} />
        {latest ? (
          <>
            <Text style={[styles.preview, { marginTop: spacing.md }]}>{huntShareText(latest)}</Text>
            <Button
              label={`Share last hunt · ${locationLabel(latest)} · ${total(latest.counts)}`}
              icon="share-outline"
              variant="ghost"
              onPress={() => void share(huntShareText(latest))}
              style={{ marginTop: spacing.sm }}
            />
          </>
        ) : null}
        <Text style={[type.caption, { marginTop: spacing.sm }]}>Text only — photos stay on this phone. Any hunt can be shared from the Logbook too.</Text>
      </Card>
    </View>
  );
}

function Rows({ rows }: { rows: { name: string; sub?: string; value: string }[] }) {
  return (
    <View>
      {rows.map((r, i) => (
        <View key={r.name} style={styles.row}>
          <Text style={[styles.rank, i === 0 && { color: colors.accent }]}>{i + 1}</Text>
          <View style={styles.flex}>
            <Text style={{ color: colors.ink }} numberOfLines={1}>
              {r.name}
            </Text>
            {r.sub ? <Text style={type.caption}>{r.sub}</Text> : null}
          </View>
          <Text style={styles.val}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

export type { Board };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  local: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  rank: { ...type.numeral, fontSize: 20, width: 22, color: colors.inkMuted },
  val: { ...type.numeral, fontSize: 20, color: colors.inkStrong },
  preview: { color: colors.ink, fontSize: 13, lineHeight: 19, backgroundColor: colors.bgSunken, padding: spacing.md, borderRadius: 10 },
});
