import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Bar, Button, Card, Chip, Header, Screen, SectionLabel, Sheet } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { REFUGE_BY_ID, REFUGES } from "@/lib/refuges";
import { LatLon } from "@/lib/geo";
import { formatClock, formatCountdown, shootWindow, ShootWindow } from "@/lib/sun";
import { fetchSunVerification } from "@/lib/weather";
import { BAG_REFERENCE, BOS_SEASONS, FIELD_RULES, isoDay, NE_SEASONS, SeasonRow, seasonStatus } from "@/lib/regs";
import { ALL_DISPATCHES, Dispatch } from "@/lib/dispatches";

type Place = { id: string; label: string; at: LatLon };
type Filter = "all" | "waterfowl" | "issue" | "story";
type Verify = { date: string; sunrise: number; sunset: number }[];

export default function FieldDeskScreen() {
  const [placeId, setPlaceId] = useState<string>("gray-lodge");
  const [gps, setGps] = useState<LatLon | null>(null);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [verify, setVerify] = useState<Verify | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [reading, setReading] = useState<Dispatch | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const place: Place =
    placeId === "gps" && gps
      ? { id: "gps", label: "My GPS", at: gps }
      : { id: placeId, label: REFUGE_BY_ID[placeId]?.short ?? "Gray Lodge", at: (REFUGE_BY_ID[placeId] ?? REFUGES[5]).coords };

  useEffect(() => {
    let alive = true;
    setVerify(null);
    fetchSunVerification(place.at.lat, place.at.lon)
      .then((v) => alive && setVerify(v))
      .catch(() => alive && setVerify(null));
    return () => {
      alive = false;
    };
  }, [place.at.lat, place.at.lon]);

  async function locateMe() {
    setGpsMsg("Getting a fix…");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsMsg("Location permission is off — pick a refuge instead.");
        return;
      }
      const p =
        (await Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));
      setGps({ lat: p.coords.latitude, lon: p.coords.longitude });
      setPlaceId("gps");
      setGpsMsg(null);
    } catch (e) {
      setGpsMsg(`No GPS fix: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const dayKey = now.toDateString();
  const today = useMemo(() => shootWindow(now, place.at.lat, place.at.lon), [dayKey, place.at.lat, place.at.lon]);
  const tomorrow = useMemo(
    () => shootWindow(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12), place.at.lat, place.at.lon),
    [dayKey, place.at.lat, place.at.lon],
  );

  const t = now.getTime();
  let headline: string;
  let countdown: string;
  let state: "before" | "open" | "after";
  if (t < today.open.getTime()) {
    state = "before";
    headline = "SHOOT LIGHT IN";
    countdown = formatCountdown(today.open.getTime() - t);
  } else if (t < today.close.getTime()) {
    state = "open";
    headline = "LEGAL SHOOT WINDOW OPEN — SUNSET IN";
    countdown = formatCountdown(today.close.getTime() - t);
  } else {
    state = "after";
    headline = "SHOOT LIGHT IN";
    countdown = formatCountdown(tomorrow.open.getTime() - t);
  }
  const dayProgress = (t - today.open.getTime()) / (today.close.getTime() - today.open.getTime());

  const todayIso = isoDay(now);
  const list = ALL_DISPATCHES.filter((d) =>
    filter === "all" ? true : filter === "waterfowl" ? d.waterfowl : d.kind === filter,
  );

  return (
    <Screen>
      <Header eyebrow="Shoot Times & Field Desk" title="Field Desk" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="My GPS" icon="locate" active={placeId === "gps"} onPress={locateMe} />
        {REFUGES.map((r) => (
          <Chip key={r.id} label={r.short} active={placeId === r.id} onPress={() => setPlaceId(r.id)} />
        ))}
      </ScrollView>
      {gpsMsg ? <Text style={[type.caption, { marginBottom: spacing.sm }]}>{gpsMsg}</Text> : null}

      <Card style={[styles.clock, state === "open" ? styles.clockOpen : styles.clockClosed]}>
        <Text style={[type.eyebrow, { color: state === "open" ? colors.good : colors.accent }]}>{headline}</Text>
        <Text style={styles.countdown}>{countdown}</Text>
        <Text style={type.caption}>
          {place.label} · {place.at.lat.toFixed(4)}, {place.at.lon.toFixed(4)} · now {formatClock(now)}
        </Text>
        <View style={styles.progress}>
          <Bar value={Math.max(0, Math.min(1, dayProgress))} max={1} color={state === "open" ? colors.good : colors.inkFaint} height={6} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={type.caption}>{formatClock(today.open)}</Text>
          <Text style={type.caption}>{formatClock(today.close)}</Text>
        </View>
      </Card>

      <View style={styles.twoCol}>
        <DayCard label="Today" w={today} verify={verify?.find((v) => v.date === isoDay(today.sunrise))} />
        <DayCard label="Tomorrow" w={tomorrow} verify={verify?.find((v) => v.date === isoDay(tomorrow.sunrise))} />
      </View>
      <Text style={[type.caption, { marginBottom: spacing.sm }]}>
        Legal: 30 min before sunrise to sunset. Times are computed astronomically on the phone and cross-checked against Open-Meteo when online.
      </Text>

      <SectionLabel>2026–27 season dates · Balance of State</SectionLabel>
      <Card>
        {BOS_SEASONS.map((s) => (
          <SeasonLine key={s.label} s={s} today={todayIso} />
        ))}
        <Text style={[type.eyebrow, { color: colors.inkMuted, fontSize: 11, marginTop: spacing.md }]}>Northeastern Zone</Text>
        {NE_SEASONS.map((s) => (
          <SeasonLine key={s.label} s={s} today={todayIso} />
        ))}
      </Card>

      <SectionLabel>Daily bag limits</SectionLabel>
      <Card>
        {BAG_REFERENCE.map((b) => (
          <View key={b.label} style={styles.refRow}>
            <Text style={styles.refLabel}>{b.label}</Text>
            <Text style={styles.refValue}>{b.value}</Text>
          </View>
        ))}
      </Card>

      <SectionLabel>Before the first decoy hits the water</SectionLabel>
      <Card>
        {FIELD_RULES.map((r) => (
          <View key={r} style={styles.ruleRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            <Text style={[type.body, styles.flex, { fontSize: 14 }]}>{r}</Text>
          </View>
        ))}
        <Text style={[type.caption, { marginTop: spacing.sm }]}>Field reference from the NorCalHunt desk — the CDFW Waterfowl Regulations booklet is the law.</Text>
      </Card>

      <SectionLabel>NorCalHunt dispatches</SectionLabel>
      <View style={[styles.chipRow, { flexWrap: "wrap" }]}>
        {(
          [
            ["all", `All (${ALL_DISPATCHES.length})`],
            ["waterfowl", "Waterfowl"],
            ["issue", "Newsletter"],
            ["story", "Field Stories"],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <Chip key={k} label={label} active={filter === k} onPress={() => setFilter(k)} />
        ))}
      </View>
      {list.map((d) => (
        <Pressable key={d.id} onPress={() => setReading(d)}>
          <Card style={styles.dispatch}>
            {d.image ? <Image source={{ uri: d.image }} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbBlank]}><Ionicons name={d.kind === "issue" ? "newspaper" : "book"} size={26} color={colors.accentDeep} /></View>}
            <View style={styles.flex}>
              <Text style={styles.dispatchMeta}>
                {d.kind === "issue" ? d.byline : "Field Story"} · {d.date}
              </Text>
              <Text style={type.h3} numberOfLines={2}>
                {d.title}
              </Text>
              <Text style={type.caption} numberOfLines={2}>
                {d.blurb}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <Sheet visible={!!reading} onClose={() => setReading(null)} eyebrow={reading ? `${reading.byline} · ${reading.date} · ${reading.read}` : undefined} title={reading?.title ?? ""}>
        {reading ? (
          <View>
            {reading.image ? <Image source={{ uri: reading.image }} style={styles.hero} resizeMode="cover" /> : null}
            {reading.kind === "story" ? <Text style={[type.caption, { marginBottom: spacing.md }]}>By {reading.byline}</Text> : null}
            <Markdown body={reading.body} />
            <Button label="Read on norcal-hunt.vercel.app" icon="open-outline" variant="ghost" onPress={() => Linking.openURL(reading.url)} style={{ marginTop: spacing.lg }} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function DayCard({ label, w, verify }: { label: string; w: ShootWindow; verify?: { sunrise: number; sunset: number } }) {
  const dRise = verify ? Math.round((verify.sunrise - w.sunrise.getTime()) / 60000) : null;
  return (
    <Card style={styles.flex}>
      <Text style={type.eyebrow}>{label}</Text>
      <Text style={styles.dayDate}>{w.sunrise.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</Text>
      <Text style={styles.dayLabel}>Shoot light</Text>
      <Text style={styles.dayBig}>{formatClock(w.open)}</Text>
      <Text style={styles.dayLabel}>Sunrise</Text>
      <Text style={styles.dayMid}>{formatClock(w.sunrise)}</Text>
      <Text style={styles.dayLabel}>Sunset · close</Text>
      <Text style={styles.dayBig}>{formatClock(w.close)}</Text>
      <Text style={[type.caption, { marginTop: 6 }]}>
        {verify
          ? `Open-Meteo ${formatClock(new Date(verify.sunrise))} / ${formatClock(new Date(verify.sunset))}${dRise === 0 ? " ✓" : ` (${dRise! > 0 ? "+" : ""}${dRise}m)`}`
          : "Open-Meteo check offline"}
      </Text>
    </Card>
  );
}

function SeasonLine({ s, today }: { s: SeasonRow; today: string }) {
  const st = seasonStatus(s, today);
  const color = st === "open" ? colors.good : st === "upcoming" ? colors.accent : colors.inkFaint;
  return (
    <View style={styles.seasonRow}>
      <View style={styles.flex}>
        <Text style={[styles.seasonLabel, st === "closed" && { color: colors.inkMuted }]}>{s.label}</Text>
        <Text style={type.caption}>
          {s.dates}
          {s.note ? ` · ${s.note}` : ""}
        </Text>
      </View>
      <View style={[styles.statusPill, { borderColor: color }]}>
        <Text style={[styles.statusText, { color }]}>{st === "open" ? "OPEN" : st === "upcoming" ? "UPCOMING" : "CLOSED"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chipRow: { flexDirection: "row", gap: spacing.sm, paddingBottom: spacing.md },
  clock: { alignItems: "center", paddingVertical: spacing.xl },
  clockOpen: { borderColor: colors.good, backgroundColor: colors.goodSoft },
  clockClosed: { borderColor: colors.accentDeep, backgroundColor: colors.accentSoft },
  countdown: { ...type.numeral, fontSize: 64, lineHeight: 70, letterSpacing: 2, marginVertical: spacing.xs },
  progress: { flexDirection: "row", width: "100%", marginTop: spacing.md },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 4 },
  twoCol: { flexDirection: "row", gap: spacing.md },
  dayDate: { ...type.caption, marginBottom: spacing.sm },
  dayLabel: { color: colors.inkFaint, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginTop: 6 },
  dayBig: { ...type.numeral, fontSize: 26, color: colors.inkStrong },
  dayMid: { ...type.numeral, fontSize: 18, color: colors.inkMuted },
  seasonRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  seasonLabel: { color: colors.inkStrong, fontFamily: fonts.headingSemi, fontSize: 16 },
  statusPill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontFamily: fonts.headingSemi, fontSize: 11, letterSpacing: 1 },
  refRow: { flexDirection: "row", gap: spacing.md, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  refLabel: { width: 130, color: colors.inkMuted, fontSize: 13 },
  refValue: { flex: 1, color: colors.ink, fontSize: 14 },
  ruleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm, alignItems: "flex-start" },
  dispatch: { flexDirection: "row", gap: spacing.md, padding: spacing.md },
  thumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.bgSunken },
  thumbBlank: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  dispatchMeta: { color: colors.accent, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 },
  hero: { width: "100%", aspectRatio: 3 / 2, borderRadius: 12, marginBottom: spacing.lg, backgroundColor: colors.bgElevated },
});
