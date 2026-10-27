import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, Header, Screen, SectionLabel, Sheet } from "@/components/ui";
import { TacticalMap } from "@/components/TacticalMap";
import { NativeMap, nativeMapAvailable } from "@/components/NativeMap";
import {
  angleDiff,
  arrowFor,
  bearingMagnetic,
  bearingTrue,
  cardinal,
  destination,
  distanceMeters,
  formatCoord,
  formatDistance,
  LatLon,
  mpsToMph,
  norm360,
} from "@/lib/geo";
import { REFUGE_BY_ID, REFUGES, schematicFor } from "@/lib/refuges";
import {
  appendPoints,
  clearTrack,
  getTrack,
  loadTrack,
  setBackground,
  startTrack,
  stopTrack,
  subscribeTrack,
  trackDistance,
  trackElapsed,
  TrackPoint,
  TrackState,
} from "@/lib/track";
import { backgroundSupported, startBackgroundTracking, stopBackgroundTracking } from "@/lib/locationTask";
import { useGps } from "@/lib/useGps";
import { useWeather } from "@/lib/useWeather";
import { loadWaypoints, newId, saveWaypoints, Waypoint, WAYPOINT_KINDS, WAYPOINT_ORDER, WaypointKind } from "@/lib/waypoints";
import { formatElapsed } from "@/lib/sun";
import { confirm } from "@/lib/confirm";

const ZOOMS = [0.5, 1, 2, 4, 8, 16, 32];
const SIM_STEP_S = 4;          // simulated seconds per real second
const SIM_WALK_MPS = 1.45;     // ~3.2 mph, waders in mud

export default function MapScreen() {
  const params = useLocalSearchParams<{ refuge?: string }>();
  const [refugeId, setRefugeId] = useState(params.refuge && REFUGE_BY_ID[params.refuge] ? params.refuge : REFUGES[0].id);
  const refuge = REFUGE_BY_ID[refugeId];
  const schematic = useMemo(() => schematicFor(refuge), [refuge]);
  const { map: weather } = useWeather();
  const wx = weather[refugeId];

  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const [track, setTrack] = useState<TrackState>(getTrack());
  useEffect(() => {
    void loadTrack();
    return subscribeTrack(setTrack);
  }, []);

  const [simRunning, setSimRunning] = useState(false);
  const gpsWanted = !simRunning && (focused || (track.recording && track.source === "gps"));
  const { fix, heading, headingSource, permission, error: gpsError, injectFix } = useGps(gpsWanted);

  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  useEffect(() => {
    loadWaypoints().then(setWaypoints);
  }, []);
  const commitWaypoints = (next: Waypoint[]) => {
    setWaypoints(next);
    void saveWaypoints(next);
  };

  const [center, setCenter] = useState<LatLon>(refuge.coords);
  const [follow, setFollow] = useState(false);
  const [zoom, setZoom] = useState(3);
  const [view, setView] = useState<"tactical" | "satellite">("tactical");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Deep link from the Index ("Open on GPS map").
  useEffect(() => {
    if (params.refuge && REFUGE_BY_ID[params.refuge]) jumpTo(params.refuge);
  }, [params.refuge]);

  // First real fix near a refuge: snap the selector to it.
  const autoPicked = useRef(false);
  useEffect(() => {
    if (!fix || autoPicked.current || simRunning || params.refuge) return;
    autoPicked.current = true;
    const nearest = REFUGES.reduce((a, b) => (distanceMeters(fix, b.coords) < distanceMeters(fix, a.coords) ? b : a));
    if (distanceMeters(fix, nearest.coords) < 30000) {
      setRefugeId(nearest.id);
      setCenter(fix);
      setFollow(true);
    }
  }, [fix, simRunning, params.refuge]);

  useEffect(() => {
    if (follow && fix) setCenter({ lat: fix.lat, lon: fix.lon });
  }, [follow, fix]);

  // Tick the elapsed clock while a real trek is recording.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!track.recording) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [track.recording]);

  function jumpTo(id: string) {
    setRefugeId(id);
    setCenter(REFUGE_BY_ID[id].coords);
    setFollow(false);
    setZoom(3);
  }

  // ── waypoints & target ────────────────────────────────────────────────
  const origin: LatLon | null = fix ? { lat: fix.lat, lon: fix.lon } : null;
  const target =
    waypoints.find((w) => w.id === targetId) ??
    waypoints.find((w) => w.kind === "truck" && w.refugeId === refugeId) ??
    waypoints.find((w) => w.kind === "blind" && w.refugeId === refugeId) ??
    null;

  const sorted = useMemo(() => {
    const from = origin ?? center;
    return waypoints
      .map((w) => ({ w, d: distanceMeters(from, w) }))
      .sort((a, b) => a.d - b.d);
  }, [waypoints, origin, center]);

  // ── simulator ─────────────────────────────────────────────────────────
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopSim = useCallback(() => {
    if (simTimer.current) clearInterval(simTimer.current);
    simTimer.current = null;
    setSimRunning(false);
  }, []);
  useEffect(() => stopSim, [stopSim]);

  async function startSim() {
    stopSim();
    if (track.recording && track.source === "gps") {
      stopTrack();
      await stopBackgroundTracking();
    }
    const lot = schematic.landmarks.find((l) => l.kind === "parking")!.at;
    let truck = waypoints.find((w) => w.kind === "truck" && w.refugeId === refugeId);
    let blind = waypoints.find((w) => w.kind === "blind" && w.refugeId === refugeId);
    const start: LatLon = truck ?? lot;
    let goal: LatLon;
    if (blind) goal = blind;
    else {
      // A pond a real walk-in away (~650 m), not the one beside the lot.
      const walk = (c: LatLon) => Math.abs(distanceMeters(start, c) - 650);
      const pond = schematic.ponds.reduce((a, b) => (walk(b.center) < walk(a.center) ? b : a));
      goal = destination(pond.center, bearingTrue(pond.center, start), Math.min(pond.rx, pond.ry) * 0.9);
    }
    const added: Waypoint[] = [];
    const mk = (kind: WaypointKind, label: string, at: LatLon, notes: string): Waypoint => ({
      id: newId("wp"),
      kind,
      label,
      notes,
      lat: at.lat,
      lon: at.lon,
      acc: 4,
      createdAt: Date.now(),
      refugeId,
    });
    if (!truck) added.push((truck = mk("truck", `Truck · ${refuge.short} (sim)`, start, "Simulated parking spot")));
    if (!blind) added.push((blind = mk("blind", `Blind · ${refuge.short} (sim)`, goal, "Simulated blind on the pond edge")));
    if (added.length) commitWaypoints([...waypoints, ...added]);
    setTargetId(blind.id);

    await startTrack("sim");
    let pos: LatLon = start;
    let t = Date.now();
    let step = 0;
    const first: TrackPoint = { lat: pos.lat, lon: pos.lon, acc: 4, speed: 0, heading: null, t };
    injectFix(first, null);
    void appendPoints([first], "sim");
    setCenter(start);
    setFollow(true);
    setZoom(2);
    setSimRunning(true);
    setNotice(`Simulating a pre-dawn walk-in at ${refuge.short} — ${formatDistance(distanceMeters(start, goal))} to the blind at ${SIM_STEP_S}× speed.`);

    const truckId = truck.id;
    simTimer.current = setInterval(() => {
      step++;
      const left = distanceMeters(pos, goal);
      if (left < 5) {
        stopSim();
        stopTrack();
        const s = getTrack();
        setTargetId(truckId);
        setNotice(
          `In the blind: ${formatDistance(trackDistance(s))} in ${formatElapsed(trackElapsed(s))}. Return bearing to the truck is live below.`,
        );
        return;
      }
      // Wander like a real walk-in: levee bends, a detour around the tules.
      const brg = norm360(bearingTrue(pos, goal) + Math.sin(step / 5) * 24 + (Math.random() - 0.5) * 16);
      pos = destination(pos, brg, Math.min(left, SIM_WALK_MPS * SIM_STEP_S));
      t += SIM_STEP_S * 1000;
      const p: TrackPoint = { lat: pos.lat, lon: pos.lon, acc: 3 + Math.random() * 3, speed: SIM_WALK_MPS, heading: brg, t };
      injectFix(p, brg);
      void appendPoints([p], "sim");
    }, 1000);
  }

  // ── real GPS trek ─────────────────────────────────────────────────────
  async function startGpsTrek() {
    stopSim();
    if (permission === "denied") {
      setNotice("Location is off for NorCalHunt. Enable it in Settings, or use Simulate Walk-In Trek.");
      return;
    }
    await startTrack("gps");
    if (fix) {
      const nearTruck = waypoints.some((w) => w.kind === "truck" && distanceMeters(fix, w) < 200);
      if (!nearTruck) {
        const wp: Waypoint = {
          id: newId("wp"),
          kind: "truck",
          label: `Truck · ${refuge.short}`,
          notes: "Auto-marked at trek start",
          lat: fix.lat,
          lon: fix.lon,
          acc: fix.acc,
          createdAt: Date.now(),
          refugeId,
        };
        commitWaypoints([...waypoints, wp]);
      }
    }
    setFollow(true);
    setNotice(fix ? "Recording your walk-in. Truck marked where you started." : "Recording — waiting for the first GPS fix.");
  }

  async function stopTrek() {
    stopSim();
    stopTrack();
    await stopBackgroundTracking();
  }

  async function toggleBackground(on: boolean) {
    if (!on) {
      await stopBackgroundTracking();
      setBackground(false);
      return;
    }
    if (!track.recording || track.source !== "gps") await startGpsTrek();
    const err = await startBackgroundTracking();
    if (err) setNotice(err);
    else {
      setBackground(true);
      setNotice("Background tracking on — the trail keeps recording with the phone in your pocket.");
    }
  }

  async function clearTrail() {
    if (await confirm("Clear walk-in trail?", "The breadcrumb trail will be erased. Waypoints stay.", "Clear")) {
      await stopTrek();
      clearTrack();
      setNotice(null);
    }
  }

  // ── telemetry ─────────────────────────────────────────────────────────
  const dist = trackDistance(track);
  const elapsed = trackElapsed(track);
  const speedMph = fix?.speed != null && fix.speed >= 0 ? mpsToMph(fix.speed) : null;
  const windRel = heading != null && wx ? angleDiff(heading, wx.windDir) : null;
  const windVsMe =
    windRel == null ? null :
    (wx?.windMph ?? 0) < 2 ? "calm" :
    Math.abs(windRel) < 45 ? "in your face" :
    Math.abs(windRel) > 135 ? "at your back" :
    windRel > 0 ? "crosswind from your right" : "crosswind from your left";

  const mpp = ZOOMS[zoom];

  return (
    <Screen>
      <Header
        eyebrow={`GPS & Blind Map · ${refuge.short}`}
        title="Walk-In Nav"
        right={
          <View style={[styles.gpsPill, { borderColor: fix ? colors.good : colors.warn }]}>
            <View style={[styles.dot, { backgroundColor: simRunning ? colors.accent : fix ? colors.good : colors.warn }]} />
            <Text style={styles.gpsPillText}>{simRunning ? "SIM" : fix ? `±${Math.round(fix.acc ?? 0)} m` : permission === "denied" ? "NO GPS" : "SEARCHING"}</Text>
          </View>
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jumpRow}>
        {REFUGES.map((r) => (
          <Chip key={r.id} label={r.short} active={r.id === refugeId} onPress={() => jumpTo(r.id)} />
        ))}
      </ScrollView>

      <View>
        {view === "tactical" || !nativeMapAvailable ? (
          <TacticalMap
            center={center}
            anchor={refuge.coords}
            mpp={mpp}
            schematic={schematic}
            track={track.points}
            waypoints={waypoints}
            me={fix}
            heading={heading}
            windDir={wx?.windDir ?? null}
            windMph={wx?.windMph ?? null}
            targetId={target?.id ?? null}
            onPan={(c) => {
              setFollow(false);
              setCenter(c);
            }}
            onPressWaypoint={setTargetId}
          />
        ) : (
          <NativeMap center={center} mpp={mpp} track={track.points} waypoints={waypoints} me={fix} onPressWaypoint={setTargetId} />
        )}
        <View style={styles.mapControls}>
          <MapBtn icon="add" onPress={() => setZoom((z) => Math.max(0, z - 1))} label="Zoom in" />
          <MapBtn icon="remove" onPress={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} label="Zoom out" />
          <MapBtn icon="locate" active={follow} onPress={() => (fix ? setFollow(true) : setNotice("No GPS fix yet."))} label="Follow me" />
          <MapBtn icon="flag" onPress={() => jumpTo(refugeId)} label="Center refuge" />
        </View>
      </View>
      <View style={styles.viewRow}>
        <Chip label="Tactical" icon="grid" active={view === "tactical"} onPress={() => setView("tactical")} />
        {nativeMapAvailable ? <Chip label="Satellite" icon="earth" active={view === "satellite"} onPress={() => setView("satellite")} /> : null}
        <Text style={[type.caption, styles.flex, { textAlign: "right" }]}>Ponds are schematic · trail & pins are GPS</Text>
      </View>

      {notice ? (
        <Pressable onPress={() => setNotice(null)} style={styles.notice}>
          <Ionicons name="information-circle" size={18} color={colors.accent} />
          <Text style={[type.body, styles.flex, { fontSize: 14 }]}>{notice}</Text>
        </Pressable>
      ) : null}

      {/* Return bearing */}
      {target ? (
        <Card style={styles.returnCard}>
          <View style={styles.returnRow}>
            <ReturnArrow from={origin} to={target} heading={heading} color={WAYPOINT_KINDS[target.kind].color} />
            <View style={styles.flex}>
              <Text style={[type.eyebrow, { color: WAYPOINT_KINDS[target.kind].color }]}>Back to {WAYPOINT_KINDS[target.kind].label}</Text>
              <Text style={styles.returnDist}>{origin ? formatDistance(distanceMeters(origin, target)) : "—"}</Text>
              <Text style={type.body}>
                {origin
                  ? `${Math.round(bearingMagnetic(origin, target))}° mag ${cardinal(bearingMagnetic(origin, target), 16)} ${arrowFor(bearingMagnetic(origin, target))} · true ${Math.round(bearingTrue(origin, target))}°`
                  : "Waiting for a fix to compute bearing"}
              </Text>
              <Text style={type.caption} numberOfLines={1}>
                {target.label}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <SectionLabel>Live telemetry</SectionLabel>
      <Card>
        <View style={styles.hud}>
          <Hud label="Latitude" value={fix ? formatCoord(fix.lat, "N", "S") : "—"} />
          <Hud label="Longitude" value={fix ? formatCoord(fix.lon, "E", "W") : "—"} />
          <Hud label="Accuracy" value={fix?.acc != null ? `±${fix.acc.toFixed(1)} m` : "—"} />
          <Hud label="Speed" value={speedMph != null ? `${speedMph.toFixed(1)} mph` : "—"} />
          <Hud
            label={`Heading${headingSource ? ` · ${headingSource}` : ""}`}
            value={heading != null ? `${Math.round(heading)}° ${cardinal(heading, 16)}` : "—"}
          />
          <Hud label="Wind vs you" value={wx ? `${Math.round(wx.windMph)} mph ${cardinal(wx.windDir)}${windVsMe ? ` · ${windVsMe}` : ""}` : "—"} />
          <Hud label={track.source === "sim" ? "Trek time (sim)" : "Trek time"} value={track.startedAt ? formatElapsed(elapsed) : "00:00:00"} />
          <Hud label="Walked" value={dist > 0 ? `${formatDistance(dist)} · ${(dist / 1609.344).toFixed(2)} mi` : "0 yds"} />
        </View>
        {gpsError ? <Text style={[type.caption, { color: colors.warn, marginTop: 6 }]}>{gpsError}</Text> : null}
        {permission === "denied" ? (
          <Text style={[type.caption, { color: colors.warn, marginTop: 6 }]}>
            Location permission denied — use Simulate Walk-In Trek to try the map.
          </Text>
        ) : null}
      </Card>

      <SectionLabel>Walk-in track to blind / pond</SectionLabel>
      <Card>
        <Text style={type.caption}>
          {track.recording
            ? `Recording · ${track.points.length} points · ${track.source === "sim" ? "simulated" : track.background ? "foreground + background GPS" : "foreground GPS"}`
            : track.points.length
              ? `Saved trail · ${track.points.length} points · ${formatDistance(dist)}`
              : "BestForNavigation GPS · logs a point every 2 m / 2 s."}
        </Text>
        <View style={styles.btnRow}>
          {track.recording ? (
            <Button label="Stop trek" icon="stop" variant="danger" onPress={stopTrek} style={styles.flex} />
          ) : (
            <Button label="Start walk-in" icon="walk" onPress={startGpsTrek} style={styles.flex} />
          )}
          <Button label={simRunning ? "Simulating…" : "Simulate trek"} icon="play-forward" variant="ghost" onPress={startSim} style={styles.flex} disabled={simRunning} />
        </View>
        {backgroundSupported ? (
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={type.h3}>Background tracking</Text>
              <Text style={type.caption}>Keeps recording with the screen off — needs “Always” location.</Text>
            </View>
            <Switch
              value={track.background}
              onValueChange={toggleBackground}
              trackColor={{ true: colors.accentDeep, false: colors.borderStrong }}
              thumbColor={Platform.OS === "android" ? colors.ink : undefined}
            />
          </View>
        ) : (
          <Text style={[type.caption, { marginTop: spacing.sm }]}>Background tracking runs in the iOS/Android app; the browser records while this tab is open.</Text>
        )}
        {track.points.length > 0 && !track.recording ? (
          <Button label="Clear trail" icon="trash" variant="ghost" onPress={clearTrail} style={{ marginTop: spacing.sm }} />
        ) : null}
      </Card>

      <SectionLabel right={<Chip label="Drop pin" icon="pin" active onPress={() => setAdding(true)} />}>Precision waypoints</SectionLabel>
      {sorted.length === 0 ? (
        <Card>
          <Text style={type.body}>No waypoints yet. Drop your truck before you walk in, then your blind, spread and any downed birds.</Text>
        </Card>
      ) : null}
      {sorted.map(({ w, d }) => (
        <WaypointRow
          key={w.id}
          w={w}
          dist={d}
          from={origin ?? center}
          live={!!origin}
          heading={heading}
          selected={target?.id === w.id}
          onSelect={() => setTargetId(w.id)}
          onDelete={async () => {
            if (await confirm("Delete waypoint?", w.label)) {
              commitWaypoints(waypoints.filter((x) => x.id !== w.id));
              if (targetId === w.id) setTargetId(null);
            }
          }}
        />
      ))}

      <AddWaypointSheet
        visible={adding}
        onClose={() => setAdding(false)}
        at={origin ?? center}
        fromGps={!!origin}
        acc={fix?.acc ?? null}
        refugeShort={refuge.short}
        onSave={(kind, label, notes) => {
          const at = origin ?? center;
          const wp: Waypoint = {
            id: newId("wp"),
            kind,
            label,
            notes,
            lat: at.lat,
            lon: at.lon,
            acc: origin ? fix?.acc ?? null : null,
            createdAt: Date.now(),
            refugeId,
          };
          commitWaypoints([...waypoints, wp]);
          if (kind === "bird") setTargetId(wp.id);
          setAdding(false);
        }}
      />
    </Screen>
  );
}

function MapBtn({ icon, onPress, label, active }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; active?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={[styles.mapBtn, active && { borderColor: colors.accent }]} hitSlop={4}>
      <Ionicons name={icon} size={20} color={active ? colors.accent : colors.ink} />
    </Pressable>
  );
}

function Hud({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.hudCell}>
      <Text style={styles.hudLabel}>{label}</Text>
      <Text style={styles.hudValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

/** Arrow pointing at the target: relative to where you face if we know it, else north-up. */
function ReturnArrow({ from, to, heading, color }: { from: LatLon | null; to: LatLon; heading: number | null; color: string }) {
  const brg = from ? bearingTrue(from, to) : 0;
  const rot = heading != null ? brg - heading : brg;
  return (
    <View style={[styles.arrowWrap, { borderColor: color }]}>
      <View style={{ transform: [{ rotate: `${rot}deg` }] }}>
        <Ionicons name="arrow-up" size={44} color={from ? color : colors.inkFaint} />
      </View>
      <Text style={styles.arrowCaption}>{heading != null ? "FACING" : "N-UP"}</Text>
    </View>
  );
}

function WaypointRow({
  w,
  dist,
  from,
  live,
  heading,
  selected,
  onSelect,
  onDelete,
}: {
  w: Waypoint;
  dist: number;
  from: LatLon;
  live: boolean;
  heading: number | null;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const k = WAYPOINT_KINDS[w.kind];
  const mag = bearingMagnetic(from, w);
  const rel = heading != null ? bearingTrue(from, w) - heading : bearingTrue(from, w);
  return (
    <Pressable onPress={onSelect}>
      <Card style={[styles.wpCard, selected && { borderColor: k.color }]}>
        <View style={[styles.wpIcon, { backgroundColor: k.color }]}>
          <Ionicons name={k.icon} size={18} color={colors.onAccent} />
        </View>
        <View style={styles.flex}>
          <Text style={type.h3} numberOfLines={1}>
            {w.label}
          </Text>
          <Text style={type.caption} numberOfLines={1}>
            {k.label} · {w.lat.toFixed(6)}, {w.lon.toFixed(6)}
            {w.acc != null ? ` · ±${Math.round(w.acc)} m` : ""}
          </Text>
          <Text style={type.caption} numberOfLines={1}>
            {new Date(w.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            {w.notes ? ` · ${w.notes}` : ""}
          </Text>
        </View>
        <View style={styles.wpRight}>
          <Text style={styles.wpDist}>{formatDistance(dist)}</Text>
          <View style={styles.wpBearing}>
            <View style={{ transform: [{ rotate: `${rel}deg` }] }}>
              <Ionicons name="navigate" size={14} color={k.color} style={{ transform: [{ rotate: "-45deg" }] }} />
            </View>
            <Text style={styles.wpBearingText}>
              {Math.round(mag)}° {cardinal(mag)}
            </Text>
          </View>
          {!live ? <Text style={styles.wpFrom}>from map center</Text> : null}
        </View>
        <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel={`Delete ${w.label}`}>
          <Ionicons name="trash-outline" size={18} color={colors.inkFaint} />
        </Pressable>
      </Card>
    </Pressable>
  );
}

function AddWaypointSheet({
  visible,
  onClose,
  at,
  fromGps,
  acc,
  refugeShort,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  at: LatLon;
  fromGps: boolean;
  acc: number | null;
  refugeShort: string;
  onSave: (kind: WaypointKind, label: string, notes: string) => void;
}) {
  const [kind, setKind] = useState<WaypointKind>("blind");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (visible) {
      setLabel("");
      setNotes("");
    }
  }, [visible]);
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="Precision waypoint" title="Drop a pin">
      <Text style={type.caption}>
        {fromGps ? `GPS fix ${at.lat.toFixed(6)}, ${at.lon.toFixed(6)}${acc != null ? ` · ±${acc.toFixed(1)} m` : ""}` : `No GPS fix — pin drops at the map center (${at.lat.toFixed(6)}, ${at.lon.toFixed(6)}).`}
      </Text>
      <View style={[styles.kindGrid]}>
        {WAYPOINT_ORDER.map((k) => (
          <Pressable
            key={k}
            onPress={() => setKind(k)}
            style={[styles.kindBtn, kind === k && { borderColor: WAYPOINT_KINDS[k].color, backgroundColor: colors.bgElevated }]}
          >
            <Ionicons name={WAYPOINT_KINDS[k].icon} size={22} color={WAYPOINT_KINDS[k].color} />
            <Text style={styles.kindText}>{WAYPOINT_KINDS[k].label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.inputLabel}>Label</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder={`${WAYPOINT_KINDS[kind].label} · ${refugeShort}`}
        placeholderTextColor={colors.inkFaint}
        style={styles.input}
      />
      <Text style={styles.inputLabel}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Second tule gap past the culvert"
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
        multiline
      />
      <Button
        label="Save waypoint"
        icon="checkmark"
        onPress={() => onSave(kind, label.trim() || `${WAYPOINT_KINDS[kind].label} · ${refugeShort}`, notes.trim())}
        style={{ marginTop: spacing.lg }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gpsPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  gpsPillText: { color: colors.ink, fontFamily: fonts.headingSemi, fontSize: 13, letterSpacing: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  jumpRow: { gap: spacing.sm, paddingBottom: spacing.md },
  mapControls: { position: "absolute", right: 8, top: 48, gap: 8 },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgOverlay,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  viewRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm },
  notice: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDeep,
    marginBottom: spacing.md,
  },
  returnCard: { borderColor: colors.borderStrong },
  returnRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  returnDist: { ...type.numeral, fontSize: 40, lineHeight: 44 },
  arrowWrap: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgSunken },
  arrowCaption: { position: "absolute", bottom: 6, color: colors.inkFaint, fontSize: 8, letterSpacing: 1 },
  hud: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md },
  hudCell: { width: "50%", paddingRight: spacing.sm },
  hudLabel: { color: colors.inkFaint, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase" },
  hudValue: { color: colors.inkStrong, fontFamily: fonts.mono, fontSize: 15, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md },
  wpCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  wpIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  wpRight: { alignItems: "flex-end" },
  wpDist: { ...type.numeral, fontSize: 18 },
  wpBearing: { flexDirection: "row", alignItems: "center", gap: 4 },
  wpBearingText: { color: colors.inkMuted, fontSize: 12, fontVariant: ["tabular-nums"] },
  wpFrom: { color: colors.inkFaint, fontSize: 9 },
  kindGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.md },
  kindBtn: {
    width: "31%",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kindText: { color: colors.ink, fontSize: 12, textAlign: "center" },
  inputLabel: { ...type.caption, textTransform: "uppercase", letterSpacing: 1, marginTop: spacing.md, marginBottom: 4 },
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
});
