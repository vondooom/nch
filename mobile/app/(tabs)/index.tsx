import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Bar, Button, Card, Chip, Header, Screen, SectionLabel, Sheet } from "@/components/ui";
import { WindDial } from "@/components/WindDial";
import { REFUGES, Refuge } from "@/lib/refuges";
import { computeIndex, IndexResult, ratingColor } from "@/lib/huntIndex";
import { arrowFor, cardinal } from "@/lib/geo";
import { formatClock, shootWindow } from "@/lib/sun";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { useWeather } from "@/lib/useWeather";
import { RefugeWeather } from "@/lib/weather";

type Sort = "score" | "name" | "north" | "wind";

type Row = { refuge: Refuge; weather: RefugeWeather; index: IndexResult };

export default function HuntIndexScreen() {
  const { map, loading, error, updatedAt, refresh } = useWeather();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("score");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    readJSON<string[]>(KEYS.favorites, []).then(setFavorites);
  }, []);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      void writeJSON(KEYS.favorites, next);
      return next;
    });
  };

  const today = new Date();
  const rows: Row[] = useMemo(
    () =>
      REFUGES.map((refuge) => {
        const weather = map[refuge.id];
        return { refuge, weather, index: computeIndex(refuge, weather, today) };
      }),
    [map],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter(
      (r) =>
        (!mine || favorites.includes(r.refuge.id)) &&
        (!q || `${r.refuge.name} ${r.refuge.county} ${r.refuge.region}`.toLowerCase().includes(q)),
    );
    list = list.slice().sort((a, b) => {
      switch (sort) {
        case "name": return a.refuge.name.localeCompare(b.refuge.name);
        case "north": return b.refuge.coords.lat - a.refuge.coords.lat;
        case "wind": return b.weather.windMph - a.weather.windMph;
        default: return b.index.total - a.index.total;
      }
    });
    return list;
  }, [rows, mine, favorites, query, sort]);

  const best = rows.reduce((a, b) => (b.index.total > a.index.total ? b : a), rows[0]);
  const live = Object.values(map).some((w) => w.source !== "baseline");
  const source = map[REFUGES[0].id]?.source;
  const open = rows.find((r) => r.refuge.id === openId) ?? null;

  return (
    <Screen>
      <Header
        eyebrow={`NorCalHunt Index · ${today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`}
        title="Hunt Index"
        right={
          <Pressable onPress={refresh} style={styles.refresh} accessibilityLabel="Refresh live weather" hitSlop={8}>
            {loading ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="refresh" size={22} color={colors.accent} />}
          </Pressable>
        }
      />

      <View style={styles.liveRow}>
        <View style={[styles.liveDot, { backgroundColor: live ? colors.good : colors.warn }]} />
        <Text style={type.caption}>
          {live
            ? `Live weather · ${source === "nws" ? "National Weather Service" : "Open-Meteo"}${updatedAt ? ` · updated ${formatClock(new Date(updatedAt))}` : ""}`
            : "Offline · desk baseline weather until a refresh gets through"}
          {error && live ? " · partial refresh" : ""}
        </Text>
      </View>

      {best ? (
        <Pressable onPress={() => setOpenId(best.refuge.id)}>
          <Card style={styles.topPick}>
            <Text style={type.eyebrow}>Tad&apos;s top pick today</Text>
            <View style={styles.topRow}>
              <View style={styles.flex}>
                <Text style={type.h2}>{best.refuge.short}</Text>
                <Text style={[type.body, { color: colors.inkMuted }]}>{best.index.call}</Text>
              </View>
              <ScoreBlock index={best.index} big />
            </View>
          </Card>
        </Pressable>
      ) : null}

      <View style={styles.filters}>
        <Chip label="All Refuges" active={!mine} onPress={() => setMine(false)} />
        <Chip label={`My Refuges (${favorites.length})`} icon="star" active={mine} onPress={() => setMine(true)} />
      </View>
      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search refuge, county, region"
          placeholderTextColor={colors.inkFaint}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>
      <View style={styles.filters}>
        {(
          [
            ["score", "Top score"],
            ["north", "North → South"],
            ["wind", "Windiest"],
            ["name", "A–Z"],
          ] as [Sort, string][]
        ).map(([k, label]) => (
          <Chip key={k} label={label} active={sort === k} onPress={() => setSort(k)} />
        ))}
      </View>

      {visible.length === 0 ? (
        <Card>
          <Text style={type.body}>
            {mine ? "No starred refuges yet. Tap the ☆ on any refuge to add it to My Refuges." : "No refuge matches that search."}
          </Text>
        </Card>
      ) : null}

      {visible.map((row) => (
        <RefugeCard
          key={row.refuge.id}
          row={row}
          fav={favorites.includes(row.refuge.id)}
          onFav={() => toggleFav(row.refuge.id)}
          onPress={() => setOpenId(row.refuge.id)}
        />
      ))}

      <Text style={[type.caption, styles.footnote]}>
        Index = Wind 20 + Weather Change 20 + Recent Hunter Reports 20 + Barometer 15 + Migration 15 + Temperature 10.
        Harvest averages are desk-entered from the weekly CDFW/USFWS reports — confirm at wildlife.ca.gov.
      </Text>

      <Sheet
        visible={!!open}
        onClose={() => setOpenId(null)}
        eyebrow={open ? `${open.refuge.agency} · ${open.refuge.county} County` : undefined}
        title={open?.refuge.name ?? ""}
      >
        {open ? (
          <RefugeDetail
            row={open}
            fav={favorites.includes(open.refuge.id)}
            onFav={() => toggleFav(open.refuge.id)}
            onMap={() => {
              setOpenId(null);
              router.navigate({ pathname: "/map", params: { refuge: open.refuge.id } });
            }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}

function ScoreBlock({ index, big }: { index: IndexResult; big?: boolean }) {
  const c = ratingColor(index.rating);
  return (
    <View style={styles.scoreBlock}>
      <Text style={[styles.score, big && { fontSize: 52 }, { color: c }]}>{index.total}</Text>
      <Text style={styles.scoreOf}>/100</Text>
      <View style={[styles.badge, { borderColor: c }]}>
        <Text style={[styles.badgeText, { color: c }]}>{index.rating}</Text>
      </View>
    </View>
  );
}

function RefugeCard({ row, fav, onFav, onPress }: { row: Row; fav: boolean; onFav: () => void; onPress: () => void }) {
  const { refuge, weather: w, index } = row;
  const sw = shootWindow(new Date(), refuge.coords.lat, refuge.coords.lon);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <Card>
        <View style={styles.cardHead}>
          <View style={styles.flex}>
            <Text style={type.h3}>{refuge.name}</Text>
            <Text style={type.caption}>
              {refuge.region} · {refuge.coords.lat.toFixed(4)}, {refuge.coords.lon.toFixed(4)}
            </Text>
          </View>
          <Pressable onPress={onFav} hitSlop={10} accessibilityLabel={fav ? "Remove from My Refuges" : "Add to My Refuges"}>
            <Ionicons name={fav ? "star" : "star-outline"} size={22} color={fav ? colors.accent : colors.inkFaint} />
          </Pressable>
        </View>
        <View style={styles.cardBody}>
          <ScoreBlock index={index} />
          <View style={styles.metrics}>
            <Metric icon="flag" label="Wind" value={`${Math.round(w.windMph)} mph ${cardinal(w.windDir)} ${arrowFor(w.windDir + 180)}`} />
            <Metric icon="speedometer" label="Baro" value={`${w.pressureInHg.toFixed(2)} ${index.trend === "Rising" ? "▲" : index.trend === "Falling" ? "▼" : "▬"}`} />
            <Metric icon="thermometer" label="Temp" value={`${Math.round(w.tempF)}°F · ${w.sky}`} />
            <Metric icon="sunny" label="Shoot" value={`${formatClock(sw.open)} – ${formatClock(sw.close)}`} />
          </View>
        </View>
        <View style={styles.miniBars}>
          {index.subs.map((s) => (
            <View key={s.key} style={styles.miniBar}>
              <Bar value={s.score} max={s.max} height={4} />
            </View>
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={12} color={colors.inkFaint} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function RefugeDetail({ row, fav, onFav, onMap }: { row: Row; fav: boolean; onFav: () => void; onMap: () => void }) {
  const { refuge, weather: w, index } = row;
  const now = new Date();
  const today = shootWindow(now, refuge.coords.lat, refuge.coords.lon);
  const tomorrow = shootWindow(new Date(now.getTime() + 86400000), refuge.coords.lat, refuge.coords.lon);
  const apiDelta = w.sunrise ? Math.round((w.sunrise - today.sunrise.getTime()) / 60000) : null;

  return (
    <View>
      <View style={styles.detailHead}>
        <ScoreBlock index={index} big />
        <View style={[styles.flex, { gap: spacing.sm }]}>
          <Text style={[type.h3, { color: ratingColor(index.rating) }]}>
            {index.total}/100 — {index.rating}
          </Text>
          <Button label={fav ? "Starred" : "Add to My Refuges"} icon={fav ? "star" : "star-outline"} variant="ghost" onPress={onFav} />
        </View>
      </View>

      <Card style={styles.callCard}>
        <Text style={type.eyebrow}>Tad&apos;s call</Text>
        <Text style={[type.body, { fontSize: 16 }]}>{index.call}</Text>
      </Card>

      <SectionLabel>Index breakdown</SectionLabel>
      <Card>
        {index.subs.map((s) => (
          <View key={s.key} style={styles.subRow}>
            <View style={styles.subHead}>
              <Text style={styles.subLabel}>{s.label}</Text>
              <Text style={styles.subScore}>
                {s.score}
                <Text style={styles.subMax}> /{s.max}</Text>
              </Text>
            </View>
            <Bar value={s.score} max={s.max} height={7} color={s.score / s.max >= 0.7 ? colors.good : s.score / s.max >= 0.45 ? colors.accentDeep : colors.danger} />
            <Text style={[type.caption, { marginTop: 3 }]}>{s.note}</Text>
          </View>
        ))}
      </Card>

      <SectionLabel>Wind & decoys</SectionLabel>
      <Card>
        <View style={styles.windRow}>
          <WindDial dir={w.windDir} size={92} />
          <View style={styles.flex}>
            <Text style={styles.bigValue}>
              {Math.round(w.windMph)} mph {cardinal(w.windDir, 16)}
            </Text>
            <Text style={type.caption}>
              From {Math.round(w.windDir)}° · gusts {Math.round(w.gustMph)} mph
            </Text>
          </View>
        </View>
        <Text style={[type.body, { marginTop: spacing.md }]}>{index.decoyTip}</Text>
      </Card>

      <SectionLabel>Barometer & conditions</SectionLabel>
      <Card>
        <View style={styles.statGrid}>
          <Cell label="Pressure" value={`${w.pressureInHg.toFixed(2)} inHg`} sub={`${index.trend} · ${signed(w.pressureDelta3h)} in 3h`} />
          <Cell label="Surface" value={`${w.surfaceInHg.toFixed(2)} inHg`} sub={`24h ${signed(w.pressureDelta24h)}`} />
          <Cell label="Temp" value={`${Math.round(w.tempF)}°F`} sub={`24h ${w.tempDelta24h >= 0 ? "+" : ""}${Math.round(w.tempDelta24h)}°`} />
          <Cell label="Sky" value={w.sky} sub={`${Math.round(w.cloudPct)}% cloud${w.precipIn > 0 ? ` · ${w.precipIn.toFixed(2)}" rain` : ""}`} />
        </View>
      </Card>

      <SectionLabel>Legal shoot light</SectionLabel>
      <Card>
        <View style={styles.statGrid}>
          <Cell label="Today opens" value={formatClock(today.open)} sub={`Sunrise ${formatClock(today.sunrise)}`} />
          <Cell label="Today closes" value={formatClock(today.close)} sub="Sunset" />
          <Cell label="Tomorrow opens" value={formatClock(tomorrow.open)} sub={`Sunrise ${formatClock(tomorrow.sunrise)}`} />
          <Cell label="Tomorrow closes" value={formatClock(tomorrow.close)} sub="Sunset" />
        </View>
        <Text style={[type.caption, { marginTop: spacing.sm }]}>
          30 min before sunrise to sunset.{" "}
          {apiDelta != null ? `Open-Meteo sunrise ${formatClock(new Date(w.sunrise!))} (${apiDelta === 0 ? "matches" : `${apiDelta > 0 ? "+" : ""}${apiDelta} min`}).` : ""}
        </Text>
      </Card>

      <SectionLabel>CDFW harvest · {refuge.harvest.week}</SectionLabel>
      <Card>
        <View style={styles.statGrid}>
          <Cell label="Birds / hunter" value={refuge.harvest.birdsPerHunter.toFixed(1)} />
          <Cell label="Hunters checked" value={String(refuge.harvest.hunters)} />
        </View>
        <Text style={[type.caption, { marginVertical: spacing.sm }]}>{refuge.harvest.quota}</Text>
        {refuge.harvest.species.map((s) => (
          <View key={s.species} style={styles.speciesRow}>
            <Text style={styles.speciesName}>{s.species}</Text>
            <Bar value={s.pct} max={30} height={6} />
            <Text style={styles.speciesPct}>{s.pct}%</Text>
          </View>
        ))}
        <Text style={[type.caption, { marginTop: spacing.sm }]}>Desk figures from the weekly report — confirm at wildlife.ca.gov.</Text>
      </Card>

      <Text style={[type.body, { color: colors.inkMuted, fontStyle: "italic", marginVertical: spacing.md }]}>{refuge.character}</Text>

      <Button label="Open on GPS map" icon="navigate" onPress={onMap} />
    </View>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.cellValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text style={type.caption}>{sub}</Text> : null}
    </View>
  );
}

const signed = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  refresh: { padding: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -8, marginBottom: spacing.md },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  topPick: { borderColor: colors.accentDeep, backgroundColor: colors.accentSoft },
  topRow: { flexDirection: "row", gap: spacing.md, alignItems: "center", marginTop: 4 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.ink, paddingVertical: 10, fontSize: 15 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cardBody: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md, alignItems: "center" },
  scoreBlock: { alignItems: "center", minWidth: 78 },
  score: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 44, fontVariant: ["tabular-nums"] },
  scoreOf: { color: colors.inkFaint, fontSize: 11, marginTop: -4 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  badgeText: { fontFamily: fonts.headingSemi, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" },
  metrics: { flex: 1, gap: 5 },
  metric: { flexDirection: "row", alignItems: "center", gap: 6 },
  metricLabel: { color: colors.inkFaint, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", width: 40 },
  metricValue: { color: colors.ink, fontSize: 13, fontVariant: ["tabular-nums"], flex: 1 },
  miniBars: { flexDirection: "row", gap: 4, marginTop: spacing.md },
  miniBar: { flex: 1, flexDirection: "row" },
  footnote: { marginTop: spacing.md },
  detailHead: { flexDirection: "row", gap: spacing.lg, alignItems: "center", marginBottom: spacing.md },
  callCard: { backgroundColor: colors.accentSoft, borderColor: colors.accentDeep },
  subRow: { marginBottom: spacing.md },
  subHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  subLabel: { color: colors.ink, fontFamily: fonts.headingSemi, fontSize: 16 },
  subScore: { ...type.numeral, fontSize: 18, color: colors.accent },
  subMax: { color: colors.inkFaint, fontSize: 13 },
  windRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  bigValue: { ...type.numeral, fontSize: 26 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md },
  cell: { width: "50%", paddingRight: spacing.sm },
  cellValue: { ...type.numeral, fontSize: 22 },
  speciesRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 6 },
  speciesName: { color: colors.ink, fontSize: 13, width: 140 },
  speciesPct: { color: colors.inkMuted, fontSize: 12, width: 34, textAlign: "right", fontVariant: ["tabular-nums"] },
});
