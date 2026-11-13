import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, SectionLabel } from "@/components/ui";
import { Input, panelStyles } from "@/components/DrawsPanel";
import { BlindPerfList } from "@/components/GroupSections";
import { Blind, BLIND_TYPES, BlindType, hasPin, parseRoute, routeText } from "@/lib/blinds";
import { GROUP_TYPE_LABEL, HuntGroup } from "@/lib/groups";
import { groupCan, RESULTS_HIDDEN_LINE } from "@/lib/permissions";
import { useGroupStore } from "@/lib/groupStore";
import { formatCoord } from "@/lib/geo";
import { HuntLog, Spot } from "@/lib/huntLog";
import { newId } from "@/lib/waypoints";
import { confirm } from "@/lib/confirm";

// Blinds: the pin, the way in, the seats, the water. Performance rolls up
// from hunts logged in the blind (or, for older logs, at its spot under the
// same blind name).

type Form = {
  name: string;
  type: BlindType;
  groupId?: string;
  lat: string;
  lng: string;
  accessRoute: string;
  route: string;
  seats: string;
  property: string;
  county: string;
  waterLevel: string;
  notes: string;
  spotKey?: string;
};

const blank = (groupId?: string): Form => ({
  name: "",
  type: "rice",
  groupId,
  lat: "",
  lng: "",
  accessRoute: "",
  route: "",
  seats: "",
  property: "",
  county: "",
  waterLevel: "",
  notes: "",
});

const toForm = (b: Blind): Form => ({
  name: b.name,
  type: b.type,
  groupId: b.groupId,
  lat: b.lat != null ? String(b.lat) : "",
  lng: b.lng != null ? String(b.lng) : "",
  accessRoute: b.accessRoute ?? "",
  route: routeText(b.routePoints),
  seats: b.seats ? String(b.seats) : "",
  property: b.property ?? "",
  county: b.county ?? "",
  waterLevel: b.waterLevel ?? "",
  notes: b.notes ?? "",
  spotKey: b.spotKey,
});

export function BlindsPanel({ hunts, spots, onNotice, emphasis }: { hunts: HuntLog[]; spots: Spot[]; onNotice: (s: string) => void; emphasis?: boolean }) {
  const { blinds, groups, setBlinds } = useGroupStore();
  const [form, setForm] = useState<Form>(blank());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [locating, setLocating] = useState(false);
  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const groupOf = (b: Blind): HuntGroup | undefined => groups.find((g) => g.id === b.groupId);
  const canEdit = (b: Blind) => {
    const g = groupOf(b);
    return !g || groupCan.editBlind(g);
  };
  const canSee = (b: Blind) => {
    const g = groupOf(b);
    return !g || groupCan.viewResults(g);
  };
  // Groups you can add a blind to.
  const editableGroups = groups.filter((g) => groupCan.editBlind(g));

  const sections = useMemo(() => {
    const by = new Map<string, Blind[]>();
    blinds.forEach((b) => {
      const k = b.groupId && groups.some((g) => g.id === b.groupId) ? b.groupId : "";
      by.set(k, [...(by.get(k) ?? []), b]);
    });
    return [...by.entries()].sort((a, b) => (a[0] === "" ? 1 : b[0] === "" ? -1 : 0));
  }, [blinds, groups]);

  async function useGps() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        onNotice("Location is off for NorCalHunt — type the pin, or turn location on in Settings.");
        return;
      }
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 2 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));
      patch({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
      onNotice(`Pinned at ${formatCoord(pos.coords.latitude, "N", "S")} ${formatCoord(pos.coords.longitude, "E", "W")}${pos.coords.accuracy ? ` (±${Math.round(pos.coords.accuracy)} m)` : ""}.`);
    } catch (e) {
      onNotice(`No GPS fix: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLocating(false);
    }
  }

  async function appendRoutePoint() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return onNotice("Location is off — type route points as lat, lng; lat, lng.");
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const pt = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      setForm((f) => ({ ...f, route: f.route.trim() ? `${f.route.trim()}; ${pt}` : pt }));
    } catch (e) {
      onNotice(`No GPS fix: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function save() {
    const name = form.name.trim();
    if (!name) return onNotice("Name the blind — e.g. Blind 3, North Pit, Timber Hole.");
    const lat = form.lat.trim() ? Number(form.lat) : undefined;
    const lng = form.lng.trim() ? Number(form.lng) : undefined;
    if ((lat != null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) || (lng != null && (!Number.isFinite(lng) || Math.abs(lng) > 180))) {
      return onNotice("Pin looks off — latitude like 39.4028, longitude like -122.1836.");
    }
    if ((lat == null) !== (lng == null)) return onNotice("Add both latitude and longitude, or neither.");
    const route = parseRoute(form.route);
    const prev = editingId ? blinds.find((b) => b.id === editingId) : undefined;
    const b: Blind = {
      id: prev?.id ?? newId("blind"),
      name,
      type: form.type,
      groupId: form.groupId,
      lat,
      lng,
      accessRoute: form.accessRoute.trim() || undefined,
      routePoints: route.length ? route : undefined,
      seats: Number(form.seats) > 0 ? Math.round(Number(form.seats)) : undefined,
      property: form.property.trim() || undefined,
      county: form.county.trim() || undefined,
      waterLevel: form.waterLevel.trim() || undefined,
      notes: form.notes.trim() || undefined,
      spotKey: form.spotKey,
      createdAt: prev?.createdAt ?? Date.now(),
      updatedAt: prev ? Date.now() : undefined,
    };
    setBlinds((list) => (prev ? list.map((x) => (x.id === b.id ? b : x)) : [b, ...list]));
    onNotice(`${prev ? "Updated" : "Added"} ${b.name}${hasPin(b) ? " · pinned — it's on the Map tab" : ""}. On this phone.`);
    setEditingId(null);
    setShowForm(false);
    setForm(blank(form.groupId));
  }

  function edit(b: Blind) {
    setEditingId(b.id);
    setForm(toForm(b));
    setShowForm(true);
  }

  async function remove(b: Blind) {
    if (await confirm("Delete this blind?", `${b.name} — hunts logged in it stay in your logbook.`, "Delete")) {
      setBlinds((list) => list.filter((x) => x.id !== b.id));
      if (editingId === b.id) {
        setEditingId(null);
        setShowForm(false);
      }
    }
  }

  const linkable = spots.filter((s) => s.kind !== "refuge" || s.refugeId);

  return (
    <View>
      {!showForm ? (
        <Button label="Add a blind" icon="add-circle" onPress={() => setShowForm(true)} style={{ marginBottom: spacing.md }} />
      ) : (
        <Card style={editingId ? styles.editing : emphasis ? { borderColor: colors.accentDeep } : undefined}>
          <Text style={type.eyebrow}>{editingId ? "Edit blind" : "New blind"}</Text>
          <Input label="Blind name" value={form.name} onChange={(v) => patch({ name: v })} placeholder="e.g. Blind 3, North Pit" autoCapitalize="words" />
          <View style={styles.wrap}>
            {BLIND_TYPES.map((t) => (
              <Chip key={t.id} label={t.label} active={form.type === t.id} onPress={() => patch({ type: t.id })} />
            ))}
          </View>

          <Text style={panelStyles.label}>Group</Text>
          <View style={styles.wrap}>
            <Chip label="Just me" active={!form.groupId} onPress={() => patch({ groupId: undefined })} />
            {editableGroups.map((g) => (
              <Chip key={g.id} label={g.name} icon="people" active={form.groupId === g.id} onPress={() => patch({ groupId: g.id })} />
            ))}
          </View>

          <View style={styles.twoCol}>
            <Input label="Property / club" value={form.property} onChange={(v) => patch({ property: v })} placeholder="Hastings ranch" autoCapitalize="words" />
            <Input label="County" value={form.county} onChange={(v) => patch({ county: v })} placeholder="Colusa" autoCapitalize="words" />
          </View>
          <View style={styles.twoCol}>
            <Input label="Seats" value={form.seats} onChange={(v) => patch({ seats: v })} placeholder="4" keyboard="numeric" />
            <Input label="Water level" value={form.waterLevel} onChange={(v) => patch({ waterLevel: v })} placeholder="18 in / boards in" />
          </View>

          <Text style={panelStyles.label}>GPS pin</Text>
          <View style={styles.twoCol}>
            <Input label="Latitude" value={form.lat} onChange={(v) => patch({ lat: v })} placeholder="39.4028" keyboard="numeric" />
            <Input label="Longitude" value={form.lng} onChange={(v) => patch({ lng: v })} placeholder="-122.1836" keyboard="numeric" />
          </View>
          <Button label={locating ? "Reading GPS…" : "Pin where I'm standing"} icon="locate" variant="ghost" onPress={useGps} disabled={locating} />

          <Input
            label="Access route"
            value={form.accessRoute}
            onChange={(v) => patch({ accessRoute: v })}
            placeholder="Gate 3, levee road north, park at the pump, walk the check"
            multiline
          />
          <Input label="Route points (optional · lat, lng; lat, lng)" value={form.route} onChange={(v) => patch({ route: v })} placeholder="39.40, -122.18; 39.41, -122.17" multiline />
          <Button label="Add my spot to the route" icon="git-commit" variant="ghost" onPress={appendRoutePoint} />

          {linkable.length ? (
            <>
              <Text style={[panelStyles.label, { marginTop: spacing.md }]}>Logbook spot (counts older hunts logged under this blind name)</Text>
              <View style={styles.wrap}>
                <Chip label="None" active={!form.spotKey} onPress={() => patch({ spotKey: undefined })} />
                {linkable.map((sp) => (
                  <Chip
                    key={sp.key}
                    label={sp.name}
                    icon="location"
                    active={form.spotKey === sp.key}
                    onPress={() => patch({ spotKey: sp.key, name: form.name || sp.blinds[0] || "" })}
                  />
                ))}
              </View>
              {form.spotKey ? (
                <View style={styles.wrap}>
                  {(spots.find((s) => s.key === form.spotKey)?.blinds ?? []).map((b) => (
                    <Chip key={b} label={b} icon="home" active={form.name.trim().toLowerCase() === b.toLowerCase()} onPress={() => patch({ name: b })} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          <Input label="Notes" value={form.notes} onChange={(v) => patch({ notes: v })} placeholder="Best on a north wind; pit floods past 24 in" multiline />
          <View style={styles.btnRow}>
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => {
                setEditingId(null);
                setShowForm(false);
                setForm(blank(form.groupId));
              }}
              style={styles.flex}
            />
            <Button label={editingId ? "Save blind" : "Add blind"} icon="checkmark" onPress={save} style={styles.flex} />
          </View>
        </Card>
      )}

      {blinds.length === 0 ? (
        <Card>
          <Text style={type.h3}>No blinds yet</Text>
          <Text style={[type.body, { color: colors.inkMuted, marginTop: 4 }]}>
            Add your lease blinds, guide blinds or club ponds — pin them, note the way in, and every hunt logged in a blind builds its season and multi-year numbers.
          </Text>
        </Card>
      ) : null}

      {sections.map(([gid, list]) => {
        const g = groups.find((x) => x.id === gid);
        return (
          <View key={gid || "mine"}>
            <SectionLabel>{g ? `${g.name} · ${GROUP_TYPE_LABEL[g.type]}` : "My blinds"}</SectionLabel>
            {list.map((b) => (
              <Card key={b.id} style={editingId === b.id ? styles.editing : undefined}>
                <View style={styles.head}>
                  <Ionicons name="home" size={18} color={colors.accent} />
                  <View style={styles.flex}>
                    <Text style={type.h3} numberOfLines={1}>
                      {b.name}
                    </Text>
                    <Text style={type.caption} numberOfLines={2}>
                      {BLIND_TYPES.find((t) => t.id === b.type)?.label}
                      {b.seats ? ` · ${b.seats} seats` : ""}
                      {b.property ? ` · ${b.property}` : ""}
                      {b.county ? ` · ${b.county} Co.` : ""}
                      {b.waterLevel ? ` · water ${b.waterLevel}` : ""}
                    </Text>
                  </View>
                  {hasPin(b) ? (
                    <Pressable onPress={() => router.push({ pathname: "/map", params: { blind: b.id } })} hitSlop={8} accessibilityLabel="Show on map">
                      <Ionicons name="map" size={19} color={colors.accent} />
                    </Pressable>
                  ) : null}
                  {canEdit(b) ? (
                    <>
                      <Pressable onPress={() => edit(b)} hitSlop={8} accessibilityLabel="Edit blind">
                        <Ionicons name="create-outline" size={19} color={colors.inkMuted} />
                      </Pressable>
                      <Pressable onPress={() => remove(b)} hitSlop={8} accessibilityLabel="Delete blind">
                        <Ionicons name="trash-outline" size={18} color={colors.inkFaint} />
                      </Pressable>
                    </>
                  ) : null}
                </View>
                {hasPin(b) ? (
                  <Text style={styles.coord}>
                    {formatCoord(b.lat, "N", "S")} {formatCoord(b.lng, "E", "W")}
                    {b.routePoints?.length ? ` · ${b.routePoints.length}-pt route` : ""}
                  </Text>
                ) : (
                  <Text style={type.caption}>No pin yet.</Text>
                )}
                {b.accessRoute ? <Text style={[type.caption, { color: colors.ink, marginTop: 2 }]}>Way in: {b.accessRoute}</Text> : null}
                {b.notes ? <Text style={[type.caption, { marginTop: 2 }]}>{b.notes}</Text> : null}
                <View style={{ marginTop: spacing.sm }}>
                  {canSee(b) ? <BlindPerfList blinds={[b]} hunts={hunts} /> : <Text style={type.caption}>{RESULTS_HIDDEN_LINE}</Text>}
                </View>
              </Card>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  editing: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  twoCol: { flexDirection: "row", gap: spacing.sm },
  btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  coord: { color: colors.inkMuted, fontFamily: fonts.mono, fontSize: 12, marginTop: 4, borderRadius: radius.sm },
});
