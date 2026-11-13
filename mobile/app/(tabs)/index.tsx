import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Bar, Button, Card, Chip, Header, Screen, SectionLabel, Sheet } from "@/components/ui";
import { WindDial } from "@/components/WindDial";
import { AGENCY_LABEL, ENTRY_TYPE_SOURCE_URL, HARVEST_SOURCE_LABEL, HARVEST_SOURCE_URL, REFUGES, Refuge } from "@/lib/refuges";
import { INDEX_WEEK } from "@/lib/harvestWeeks";
import { mapsFor } from "@/lib/refugeMaps";
import { duckStatusForZone, GameStatus, gooseStatusForZone, isoDay, SEASON_YEAR, WaterfowlZoneId, ZONE_BY_ID } from "@/lib/regs";
import { computeIndex, IndexResult, NO_HARVEST, ratingColor } from "@/lib/huntIndex";
import { arrowFor, cardinal, distanceMeters, windArrowDeg } from "@/lib/geo";
import { formatClock, shootWindow } from "@/lib/sun";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { useWeather } from "@/lib/useWeather";
import { RefugeWeather } from "@/lib/weather";
import { HuntLog, huntSpotKey, loadHunts, loadSpots, mergeSpots, Spot, spotFavId, total } from "@/lib/huntLog";
import { TypeStrip } from "@/components/TypeStrip";

type Sort = "score" | "name" | "north" | "wind";
type AgencyFilter = "all" | Refuge["agency"];
type ZoneFilter = "all" | WaterfowlZoneId;

// Only zones with a mapped refuge get a chip.
const INDEX_ZONES = [...new Set(REFUGES.map((r) => r.zoneId))].map((id) => ZONE_BY_ID[id]);

type Row = { refuge: Refuge; weather: RefugeWeather; index: IndexResult };

/** A club or free-roam spot from the logbook, read against its nearest refuge. */
type SpotRow = { spot: Spot; hunts: number; birds: number; last: string | null; near: Row | null };

type Item = { favId: string; row: Row; spot?: undefined } | { favId: string; spot: SpotRow; row?: undefined };

// No-score areas (no harvest week) and spots without a nearest read sort after
// every scored item — they are not "0".
const itemScore = (i: Item) => (i.row ? i.row.index.total : i.spot.near?.index.total) ?? -1;
const itemName = (i: Item) => (i.row ? i.row.refuge.name : i.spot.spot.name);
const itemLat = (i: Item) => (i.row ? i.row.refuge.coords.lat : i.spot.spot.coords?.lat ?? -90);
const itemWind = (i: Item) => (i.row ? i.row.weather.windMph : i.spot.near?.weather.windMph ?? -1);
const itemText = (i: Item) =>
  i.row
    ? `${i.row.refuge.name} ${i.row.refuge.short} ${i.row.refuge.county} ${i.row.refuge.region} ${AGENCY_LABEL[i.row.refuge.agency]} ${ZONE_BY_ID[i.row.refuge.zoneId].name}`
    : `${i.spot.spot.name} ${i.spot.spot.kind === "club" ? "club" : "free roam"} ${i.spot.spot.blinds.join(" ")} ${i.spot.near?.refuge.short ?? ""}`;

export default function HuntIndexScreen() {
  const { map, loading, error, updatedAt, refresh } = useWeather();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("score");
  const [agency, setAgency] = useState<AgencyFilter>("all");
  const [zone, setZone] = useState<ZoneFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [hunts, setHunts] = useState<HuntLog[]>([]);
  const [storedSpots, setStoredSpots] = useState<Spot[]>([]);
  const [privacyHidden, setPrivacyHidden] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const searchY = useRef(0);

  useEffect(() => {
    readJSON<boolean>(KEYS.privacyDismissed, false).then((d) => setPrivacyHidden(d));
  }, []);

  // Re-read the logbook each time the tab comes into focus so spots logged a
  // minute ago show up here, and favorites starred elsewhere stay in step.
  useFocusEffect(
    useCallback(() => {
      let live = true;
      Promise.all([readJSON<string[]>(KEYS.favorites, []), loadHunts(), loadSpots()]).then(([f, h, sp]) => {
        if (!live) return;
        setFavorites(f);
        setHunts(h);
        setStoredSpots(sp);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      void writeJSON(KEYS.favorites, next);
      return next;
    });
  };

  const dismissPrivacy = () => {
    setPrivacyHidden(true);
    void writeJSON(KEYS.privacyDismissed, true);
  };

  const today = new Date();
  // The full data set. Search and the favorites chip only ever filter a copy
  // of this — nothing below writes back to it.
  const rows: Row[] = useMemo(
    () =>
      REFUGES.map((refuge) => {
        const weather = map[refuge.id];
        return { refuge, weather, index: computeIndex(refuge, weather, today) };
      }),
    [map],
  );

  const spotRows: SpotRow[] = useMemo(() => {
    const spots = mergeSpots(storedSpots, hunts).filter((s) => s.kind !== "refuge");
    return spots.map((spot) => {
      const mine = hunts.filter((h) => huntSpotKey(h) === spot.key);
      const c = spot.coords;
      const near = c ? rows.reduce((a, b) => (distanceMeters(c, b.refuge.coords) < distanceMeters(c, a.refuge.coords) ? b : a)) : null;
      return {
        spot,
        hunts: mine.length,
        birds: mine.reduce((a, h) => a + total(h.counts), 0),
        last: mine.reduce<string | null>((a, h) => (!a || h.date > a ? h.date : a), null),
        near,
      };
    });
  }, [storedSpots, hunts, rows]);

  const items: Item[] = useMemo(
    () => [
      ...rows.map((row) => ({ favId: row.refuge.id, row })),
      ...spotRows.map((spot) => ({ favId: spotFavId(spot.spot.key), spot })),
    ],
    [rows, spotRows],
  );

  const q = query.trim().toLowerCase();
  const narrowed = agency !== "all" || zone !== "all";
  const visible = useMemo(() => {
    const fav = new Set(favorites);
    // Agency / zone describe refuges — logbook spots drop out while either is set.
    const inFilter = (i: Item) =>
      !narrowed || (!!i.row && (agency === "all" || i.row.refuge.agency === agency) && (zone === "all" || i.row.refuge.zoneId === zone));
    const list = items.filter((i) => (!mine || fav.has(i.favId)) && inFilter(i) && (!q || itemText(i).toLowerCase().includes(q)));
    return list.sort((a, b) => {
      // Favorites first, then the chosen sort.
      const f = Number(fav.has(b.favId)) - Number(fav.has(a.favId));
      if (f) return f;
      switch (sort) {
        case "name": return itemName(a).localeCompare(itemName(b));
        case "north": return itemLat(b) - itemLat(a);
        case "wind": return itemWind(b) - itemWind(a);
        default: return itemScore(b) - itemScore(a);
      }
    });
  }, [items, mine, favorites, q, sort, agency, zone, narrowed]);

  const favCount = items.filter((i) => favorites.includes(i.favId)).length;

  // When a search shrinks the list, iOS can leave the scroll offset past the
  // end of the (now short) content — the screen looks blank and won't scroll.
  // Pull the search bar back into view instead.
  useEffect(() => {
    if (scrollY.current > searchY.current) scrollRef.current?.scrollTo({ y: Math.max(0, searchY.current - 8), animated: false });
  }, [q, mine, agency, zone]);

  const clearSearch = () => setQuery("");
  const clearFilters = () => {
    setAgency("all");
    setZone("all");
  };

  // Top pick only from areas with a real score.
  const best = rows.reduce<Row | null>((a, b) => (b.index.total != null && (a == null || b.index.total > a.index.total!) ? b : a), null);
  const live = Object.values(map).some((w) => w.source !== "baseline");
  const source = map[REFUGES[0].id]?.source;
  const open = rows.find((r) => r.refuge.id === openId) ?? null;

  return (
    <Screen scrollRef={scrollRef} onScroll={(e) => (scrollY.current = e.nativeEvent.contentOffset.y)}>
      <Header
        eyebrow={`NorCalHunt Index · ${today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`}
        title="Hunt Index"
        right={
          <Pressable onPress={refresh} style={styles.refresh} accessibilityLabel="Refresh live weather" hitSlop={8}>
            {loading ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="refresh" size={22} color={colors.accent} />}
          </Pressable>
        }
      />

      <TypeStrip hunts={hunts} />

      {!privacyHidden ? (
        <View style={styles.privacy} accessibilityRole="summary">
          <Ionicons name="shield-checkmark" size={18} color={colors.good} />
          <Text style={[type.body, styles.flex, { fontSize: 14 }]}>
            Your hunt data is yours. We don&apos;t share or sell it.
          </Text>
          <Pressable onPress={dismissPrivacy} hitSlop={10} accessibilityLabel="Dismiss privacy note">
            <Ionicons name="close" size={18} color={colors.inkMuted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.liveRow}>
        <View style={[styles.liveDot, { backgroundColor: live ? colors.good : colors.warn }]} />
        <Text style={type.caption}>
          {live
            ? `Live weather · ${source === "nws" ? "National Weather Service" : "Open-Meteo"}${updatedAt ? ` · updated ${formatClock(new Date(updatedAt))}` : ""}`
            : "Offline · desk baseline weather until a refresh gets through"}
          {error && live ? " · partial refresh" : ""}
        </Text>
      </View>
      <Pressable onPress={() => Linking.openURL(HARVEST_SOURCE_URL)} hitSlop={6} style={styles.liveRow}>
        <Ionicons name="document-text-outline" size={12} color={colors.inkFaint} />
        <Text style={[type.caption, styles.link]}>{INDEX_WEEK.label} · CDFW Doc {INDEX_WEEK.docId}</Text>
      </Pressable>

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

      <View style={styles.filters} onLayout={(e) => (searchY.current = e.nativeEvent.layout.y)}>
        <Chip label="All" active={!mine} onPress={() => setMine(false)} />
        <Chip label={`Favorites (${favCount})`} icon="star" active={mine} onPress={() => setMine(true)} />
      </View>
      <View style={styles.filters}>
        {(
          [
            ["all", "Federal + State"],
            ["USFWS", "Federal"],
            ["CDFW", "State"],
          ] as [AgencyFilter, string][]
        ).map(([k, label]) => (
          <Chip key={k} label={label} active={agency === k} onPress={() => setAgency(k)} />
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, { flexWrap: "nowrap" }]}>
        <Chip label="All zones" active={zone === "all"} onPress={() => setZone("all")} />
        {INDEX_ZONES.map((z) => (
          <Chip key={z.id} label={z.short} active={zone === z.id} onPress={() => setZone(z.id)} />
        ))}
      </ScrollView>
      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search refuge, county, your spots"
          placeholderTextColor={colors.inkFaint}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={clearSearch} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
          </Pressable>
        ) : null}
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
        <Card style={styles.empty}>
          <Ionicons name={q ? "search" : mine ? "star-outline" : "funnel-outline"} size={28} color={colors.inkFaint} />
          <Text style={[type.h3, { textAlign: "center" }]}>
            {q ? `Nothing matches “${query.trim()}”` : mine ? "No favorites here" : "No refuges in that combo"}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted, textAlign: "center" }]}>
            {q
              ? mine
                ? "None of your favorites match. Try another name, or search all refuges and spots."
                : narrowed
                  ? "Nothing matches inside these filters. Clear them or try another name."
                  : "Try a refuge name, county, region, or one of your logbook spots."
              : mine && !narrowed
                ? "Tap the ☆ on any refuge or logbook spot and it'll sit at the top of the Index."
                : mine
                  ? "None of your favorites fit these filters."
                  : "No federal refuges in that zone yet — the Northeastern areas are all state."}
          </Text>
          <View style={styles.emptyActions}>
            {q ? <Button label="Clear search" icon="close-circle" onPress={clearSearch} /> : null}
            {narrowed ? <Button label="Clear filters" icon="funnel" variant="ghost" onPress={clearFilters} /> : null}
            {mine ? <Button label="Show all" icon="list" variant="ghost" onPress={() => setMine(false)} /> : null}
          </View>
        </Card>
      ) : null}

      {visible.map((item) =>
        item.row ? (
          <RefugeCard
            key={item.favId}
            row={item.row}
            fav={favorites.includes(item.favId)}
            onFav={() => toggleFav(item.favId)}
            onPress={() => setOpenId(item.row.refuge.id)}
          />
        ) : (
          <SpotCard
            key={item.favId}
            row={item.spot}
            fav={favorites.includes(item.favId)}
            onFav={() => toggleFav(item.favId)}
            onNear={item.spot.near ? () => setOpenId(item.spot.near!.refuge.id) : undefined}
          />
        ),
      )}

      <Text style={[type.caption, styles.footnote]}>
        Index = Wind 20 + Weather Change 20 + Recent Hunter Reports 20 + Barometer 15 + Migration 15 + Temperature 10.
        Hunter reports = birds per hunter from the official {HARVEST_SOURCE_LABEL} week totals. An area missing from that report
        uses its latest older CDFW week, labeled with those dates; an area in no report shows no score until CDFW lists it.
      </Text>

      <Sheet
        visible={!!open}
        onClose={() => setOpenId(null)}
        eyebrow={open ? `${AGENCY_LABEL[open.refuge.agency]} · ${open.refuge.agency} · ${open.refuge.county} County` : undefined}
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

function SpotCard({ row, fav, onFav, onNear }: { row: SpotRow; fav: boolean; onFav: () => void; onNear?: () => void }) {
  const { spot, near } = row;
  return (
    <Card>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text style={type.eyebrow}>{spot.kind === "club" ? "Your club" : "Your spot"} · from the logbook</Text>
          <Text style={type.h3}>{spot.name}</Text>
          <Text style={type.caption}>
            {row.hunts ? `${row.hunts} hunt${row.hunts === 1 ? "" : "s"} · ${row.birds} birds` : "No hunts logged yet"}
            {row.last ? ` · last ${new Date(`${row.last}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
          </Text>
        </View>
        <Pressable onPress={onFav} hitSlop={10} accessibilityLabel={fav ? "Remove from favorites" : "Add to favorites"}>
          <Ionicons name={fav ? "star" : "star-outline"} size={22} color={fav ? colors.accent : colors.inkFaint} />
        </Pressable>
      </View>
      {spot.blinds.length ? (
        <View style={[styles.filters, { marginTop: spacing.sm, marginBottom: 0 }]}>
          {spot.blinds.map((b) => (
            <View key={b} style={styles.blindTag}>
              <Ionicons name="home" size={11} color={colors.inkMuted} />
              <Text style={styles.blindTagText}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {near ? (
        <Pressable onPress={onNear} style={styles.nearRow}>
          <Text style={[type.caption, styles.flex]}>
            Nearest refuge read · {near.refuge.short}: {Math.round(near.weather.windMph)} mph from {cardinal(near.weather.windDir)}
          </Text>
          <Text style={[styles.nearScore, { color: ratingColor(near.index.rating) }]}>{near.index.total ?? "—"}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function ScoreBlock({ index, big }: { index: IndexResult; big?: boolean }) {
  const c = ratingColor(index.rating);
  if (index.total == null) {
    return (
      <View style={styles.scoreBlock} accessibilityLabel={`${NO_HARVEST}, no Index score`}>
        <Text style={[styles.score, big && { fontSize: 52 }, { color: c }]}>—</Text>
        <View style={[styles.badge, { borderColor: c }]}>
          <Text style={[styles.badgeText, { color: c, textAlign: "center" }]}>No harvest{"\n"}data yet</Text>
        </View>
      </View>
    );
  }
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
              {AGENCY_LABEL[refuge.agency]} · {refuge.region} · {refuge.coords.lat.toFixed(4)}, {refuge.coords.lon.toFixed(4)}
            </Text>
            {refuge.harvest && !refuge.harvest.isIndexWeek ? (
              <Text style={[type.caption, { color: colors.warn }]}>Hunter reports: CDFW {refuge.harvest.range} (not in {INDEX_WEEK.range})</Text>
            ) : null}
          </View>
          <Pressable onPress={onFav} hitSlop={10} accessibilityLabel={fav ? "Remove from favorites" : "Add to favorites"}>
            <Ionicons name={fav ? "star" : "star-outline"} size={22} color={fav ? colors.accent : colors.inkFaint} />
          </Pressable>
        </View>
        <View style={styles.cardBody}>
          <ScoreBlock index={index} />
          <View style={styles.metrics}>
            <Metric icon="flag" label="Wind" value={`${Math.round(w.windMph)} mph from ${cardinal(w.windDir)} (${Math.round(w.windDir)}°) ${arrowFor(windArrowDeg(w.windDir))}`} />
            <Metric icon="speedometer" label="Baro" value={`${w.pressureInHg.toFixed(2)} ${index.trend === "Rising" ? "▲" : index.trend === "Falling" ? "▼" : "▬"}`} />
            <Metric icon="thermometer" label="Temp" value={`${Math.round(w.tempF)}°F · ${w.sky}`} />
            <Metric icon="sunny" label="Shoot" value={`${formatClock(sw.open)} – ${formatClock(sw.close)}`} />
          </View>
        </View>
        <View style={styles.miniBars}>
          {index.subs.map((s) => (
            <View key={s.key} style={styles.miniBar}>
              <Bar value={s.missing ? 0 : s.score} max={s.max} height={4} />
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
  const harvest = refuge.harvest;
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
            {index.total == null ? NO_HARVEST : `${index.total}/100 — ${index.rating}`}
          </Text>
          {index.total == null ? (
            <Text style={type.caption}>Not in the {HARVEST_SOURCE_LABEL} report, so there&apos;s no Index score. Weather below is still live.</Text>
          ) : harvest && !harvest.isIndexWeek ? (
            <Text style={type.caption}>Hunter reports from {harvest.range} — {refuge.short} isn&apos;t in the {INDEX_WEEK.range} report.</Text>
          ) : null}
          <Button label={fav ? "Favorite" : "Add to favorites"} icon={fav ? "star" : "star-outline"} variant="ghost" onPress={onFav} />
        </View>
      </View>

      <Card style={styles.callCard}>
        <Text style={type.eyebrow}>Tad&apos;s call</Text>
        <Text style={[type.body, { fontSize: 16 }]}>{index.call}</Text>
      </Card>

      <SectionLabel>{`Seasons · ${SEASON_YEAR} · CDFW`}</SectionLabel>
      <Card>
        <Text style={[type.caption, { marginBottom: spacing.xs }]}>{ZONE_BY_ID[refuge.zoneId].name}{refuge.svsma ? " · Sacramento Valley SMA" : ""}</Text>
        <SeasonStatusLine game="Ducks" st={duckStatusForZone(refuge.zoneId, isoDay(now))} />
        <SeasonStatusLine game="Geese" st={gooseStatusForZone(refuge.zoneId, isoDay(now))} />
        {refuge.svsma ? <Text style={[type.caption, { marginTop: spacing.xs }]}>White-fronts close here after Dec 21 · 3/day.</Text> : null}
        <Text style={[type.caption, { marginTop: spacing.xs }]}>Field reference, not law — the CDFW regs booklet is the final word.</Text>
      </Card>

      <SectionLabel>Index breakdown</SectionLabel>
      <Card>
        {index.subs.map((s) => (
          <View key={s.key} style={styles.subRow}>
            <View style={styles.subHead}>
              <Text style={styles.subLabel}>{s.label}</Text>
              <Text style={styles.subScore}>
                {s.missing ? "—" : s.score}
                <Text style={styles.subMax}> /{s.max}</Text>
              </Text>
            </View>
            {s.missing ? null : (
              <Bar value={s.score} max={s.max} height={7} color={s.score / s.max >= 0.7 ? colors.good : s.score / s.max >= 0.45 ? colors.accentDeep : colors.danger} />
            )}
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
              From {cardinal(w.windDir, 16)} ({Math.round(w.windDir)}°) · gusts {Math.round(w.gustMph)} mph
            </Text>
            <Text style={type.caption}>Arrow points the way the wind is blowing.</Text>
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

      <SectionLabel>How you get in</SectionLabel>
      <Card>
        <Text style={type.body}>{refuge.quota}</Text>
        <Pressable onPress={() => Linking.openURL(ENTRY_TYPE_SOURCE_URL)} hitSlop={6}>
          <Text style={[type.caption, styles.link, { marginTop: spacing.sm }]}>Entry types: Cal. Code Regs. tit. 14, § 551</Text>
        </Pressable>
      </Card>

      <SectionLabel>{harvest ? `CDFW harvest · ${harvest.range}` : "CDFW harvest"}</SectionLabel>
      <Card>
        {harvest ? (
          <>
            <View style={styles.statGrid}>
              <Cell label="Birds / hunter" value={harvest.birdsPerHunter.toFixed(2)} />
              <Cell label="Hunters checked" value={String(harvest.hunters)} />
              <Cell label="Waterfowl checked" value={String(harvest.waterfowl)} />
            </View>
            {harvest.species.length ? (
              harvest.species.every((s) => s.pct == null) ? (
                <Text style={[type.body, { marginTop: spacing.sm }]}>Top birds: {harvest.species.map((s) => s.species).join(", ")}</Text>
              ) : (
                harvest.species.map((s) => (
                  <View key={s.species} style={styles.speciesRow}>
                    <Text style={styles.speciesName}>{s.species}</Text>
                    {s.pct != null ? (
                      <>
                        <Bar value={s.pct} max={30} height={6} />
                        <Text style={styles.speciesPct}>{s.pct}%</Text>
                      </>
                    ) : null}
                  </View>
                ))
              )
            ) : null}
            {!harvest.isIndexWeek ? (
              <Text style={[type.caption, { color: colors.warn, marginTop: spacing.sm }]}>
                Older week: {refuge.short} isn&apos;t listed in the {INDEX_WEEK.range} report, so these are its {harvest.range} numbers.
              </Text>
            ) : null}
            {harvest.prior ? (
              <Text style={[type.caption, { marginTop: spacing.sm }]}>
                Week before ({harvest.prior.range}): {harvest.prior.birdsPerHunter.toFixed(2)} birds/hunter · {harvest.prior.hunters} hunters
              </Text>
            ) : null}
            <Text style={[type.caption, { marginTop: spacing.sm }]}>
              Week totals from CDFW&apos;s weekly hunt results (Doc {harvest.docId}). CDFW lists each day&apos;s top two species, not bag shares.
            </Text>
          </>
        ) : (
          <>
            <Text style={type.h3}>{NO_HARVEST}</Text>
            <Text style={[type.body, { color: colors.inkMuted, marginTop: spacing.xs }]}>
              {refuge.short} isn&apos;t listed in the {HARVEST_SOURCE_LABEL} report. The Index score stays hidden until CDFW reports it.
            </Text>
          </>
        )}
        <Pressable onPress={() => Linking.openURL(harvest?.sourceUrl ?? HARVEST_SOURCE_URL)} hitSlop={6}>
          <Text style={[type.caption, styles.link, { marginTop: spacing.sm }]}>Open the CDFW report{harvest ? ` · ${harvest.range}` : ""}</Text>
        </Pressable>
      </Card>

      <Text style={[type.body, { color: colors.inkMuted, fontStyle: "italic", marginVertical: spacing.md }]}>{refuge.character}</Text>

      <Button label="Open on GPS map" icon="navigate" onPress={onMap} />
      {mapsFor(refuge).map((m, _i, all) => (
        <Button
          key={m.url}
          label={all.length > 1 ? m.label.replace(/ \(PDF\)$/, "") : "Official hunt map"}
          icon={m.kind === "pdf" ? "map-outline" : "open-outline"}
          variant="ghost"
          onPress={() => Linking.openURL(m.url)}
          style={{ marginTop: spacing.sm }}
        />
      ))}
      {refuge.url && !mapsFor(refuge).some((m) => m.url === refuge.url) ? (
        <Button label={`${refuge.agency} area page`} icon="open-outline" variant="ghost" onPress={() => Linking.openURL(refuge.url!)} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}

function SeasonStatusLine({ game, st }: { game: string; st: GameStatus }) {
  const color = st.status === "open" ? colors.good : st.status === "upcoming" ? colors.accent : colors.inkFaint;
  return (
    <View style={styles.seasonLine}>
      <View style={[styles.seasonDot, { backgroundColor: color }]} />
      <Text style={styles.seasonGame}>{game}:</Text>
      <Text style={[styles.seasonText, { color }]}>{st.label}</Text>
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
  link: { color: colors.accent, textDecorationLine: "underline" },
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
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    marginTop: -8,
    marginBottom: spacing.md,
  },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap", justifyContent: "center" },
  blindTag: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  blindTagText: { color: colors.inkMuted, fontSize: 12 },
  nearRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  nearScore: { fontFamily: fonts.heading, fontSize: 22, fontVariant: ["tabular-nums"] },
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
  seasonLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  seasonDot: { width: 8, height: 8, borderRadius: 4 },
  seasonGame: { color: colors.ink, fontFamily: fonts.headingSemi, fontSize: 16, width: 56 },
  seasonText: { flex: 1, fontSize: 15 },
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
