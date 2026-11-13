import { ReactNode, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import { Card } from "@/components/ui";
import { HeatBadge } from "@/components/GroupSections";
import { HowIHuntOnboarding } from "@/components/HowIHunt";
import { blindPerformance, hotBlinds } from "@/lib/blinds";
import { latestDraw } from "@/lib/clubDraws";
import { Draw, drawNights, loadDraws } from "@/lib/draws";
import { groupHunts, HuntGroup, memberName, myRole } from "@/lib/groups";
import { DEFAULT_GUEST_LIMIT, guestDaysUsed } from "@/lib/guestDays";
import { useGroupStore } from "@/lib/groupStore";
import { INDEX_WEEK } from "@/lib/harvestWeeks";
import { HuntLog, normName, seasonOf } from "@/lib/huntLog";
import { groupCan } from "@/lib/permissions";
import { REFUGE_BY_ID, REFUGES } from "@/lib/refuges";
import { duckStatusForZone, isoDay } from "@/lib/regs";
import { USER_TYPE_BY_ID, UserTypeId, useUserTypes } from "@/lib/userTypes";

// The top of the Hunt Index, tailored to "How I hunt". A compact card per
// selected type with the one or two things that hunter checks first, each
// deep-linking into the Logbook tools. The Index below is unchanged for all.

type TrackerTab = "draws" | "groups" | "blinds" | "board" | "log";
const go = (tab: TrackerTab) => router.navigate({ pathname: "/tracker", params: { tab } });

function Link({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <Ionicons name={icon} size={13} color={colors.accent} />
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

function TypeCard({ id, children, links }: { id: UserTypeId; children: ReactNode; links: ReactNode }) {
  const t = USER_TYPE_BY_ID[id];
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Ionicons name={t.icon} size={15} color={colors.accent} />
        <Text style={[type.eyebrow, { fontSize: 12 }]}>{t.label}</Text>
      </View>
      {children}
      <View style={styles.links}>{links}</View>
    </Card>
  );
}

const Line = ({ children, strong }: { children: ReactNode; strong?: boolean }) => (
  <Text style={[type.caption, strong && { color: colors.ink, fontSize: 13 }]} numberOfLines={2}>
    {children}
  </Text>
);

export function TypeStrip({ hunts }: { hunts: HuntLog[] }) {
  const { types, loaded } = useUserTypes();
  const store = useGroupStore();
  const [draws, setDraws] = useState<Draw[]>([]);
  const today = isoDay(new Date());
  const season = seasonOf(today);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadDraws().then((d) => live && setDraws(d));
      return () => {
        live = false;
      };
    }, []),
  );

  const ofType = (t: HuntGroup["type"]) => store.groups.filter((g) => g.type === t);

  // ── leasee ──
  const lease = useMemo(() => {
    const gs = ofType("blind_lease");
    const ids = new Set(gs.map((g) => g.id));
    const bl = store.blinds.filter((b) => (b.groupId ? ids.has(b.groupId) : true));
    const visible = (gid?: string) => {
      const g = store.groups.find((x) => x.id === gid);
      return !g || groupCan.viewResults(g);
    };
    const perf = bl
      .filter((b) => visible(b.groupId))
      .map((b) => ({ b, cur: blindPerformance(b, hunts).seasons.find((s) => s.season === season) }))
      .sort((a, b) => (b.cur?.perHunter ?? -1) - (a.cur?.perHunter ?? -1));
    const next = store.assignments.find((a) => ids.has(a.groupId) && a.date >= today);
    return { gs, perf, next };
  }, [store.groups, store.blinds, store.assignments, hunts]);

  // ── guide ──
  const guide = useMemo(() => {
    const gs = ofType("guide_service");
    const lines = gs.flatMap((g) => {
      const me = g.members.find((m) => m.id === g.meId);
      const role = myRole(g);
      return store.assignments
        .filter((a) => a.groupId === g.id && a.date === today)
        .filter((a) => (role === "client" || role === "guest" ? !!me && a.hunters.some((h) => normName(h) === normName(me.name)) : true))
        .map((a) => ({ a, g }));
    });
    const tomorrow = isoDay(new Date(Date.now() + 864e5));
    const tomorrowCount = gs.reduce((n, g) => n + store.assignments.filter((a) => a.groupId === g.id && a.date === tomorrow).length, 0);
    return { gs, lines, tomorrowCount };
  }, [store.groups, store.assignments]);

  // ── refuge rat ──
  const rat = useMemo(() => {
    const night = drawNights(draws)[0] ?? null;
    const top = REFUGES.filter((r) => r.harvest?.isIndexWeek).sort((a, b) => b.harvest!.birdsPerHunter - a.harvest!.birdsPerHunter)[0] ?? null;
    const duck = duckStatusForZone("balance-of-state", today);
    return { night, top, duck };
  }, [draws]);

  // ── club ──
  const club = useMemo(
    () =>
      ofType("duck_club").map((g) => {
        const bl = store.blinds.filter((b) => b.groupId === g.id);
        const hot = groupCan.viewResults(g) ? hotBlinds(bl, groupHunts(g, hunts), today).filter((h) => h.heat === "hot").slice(0, 3) : [];
        const draw = latestDraw(store.clubDraws, g.id);
        const mine = draw?.picks.find((p) => p.memberId === g.meId);
        const limit = g.guestDayLimit ?? DEFAULT_GUEST_LIMIT;
        const used = g.meId ? guestDaysUsed(store.guestDays, g.id, g.meId, today) : 0;
        return { g, bl, hot, draw, mine, limit, used };
      }),
    [store.groups, store.blinds, store.clubDraws, store.guestDays, hunts],
  );

  if (!loaded) return null;
  if (!types.length) return <HowIHuntOnboarding />;

  return (
    <View style={{ marginBottom: spacing.sm }}>
      {types.includes("blind_lease") ? (
        <TypeCard
          id="blind_lease"
          links={
            <>
              <Link label="Blinds" icon="home" onPress={() => go("blinds")} />
              <Link label="Schedule & log" icon="people" onPress={() => go("groups")} />
              <Link label="Log a hunt" icon="add-circle" onPress={() => go("log")} />
            </>
          }
        >
          {lease.perf.length === 0 ? (
            <Line strong>No blinds yet — add your lease blinds with a GPS pin and seats.</Line>
          ) : (
            lease.perf.slice(0, 3).map(({ b, cur }) => (
              <Line key={b.id} strong>
                {b.name}: {cur ? `${cur.perHunter.toFixed(1)} birds/hunter · ${cur.birds} birds this season` : "not hunted this season"}
                {b.waterLevel ? ` · water ${b.waterLevel}` : ""}
              </Line>
            ))
          )}
          {lease.next ? (
            <Line>
              Next on the schedule: {lease.next.date === today ? "today" : lease.next.date}
              {lease.next.hunters.length ? ` · ${lease.next.hunters.join(", ")}` : ""}
            </Line>
          ) : lease.gs.length ? (
            <Line>Nothing on the blind schedule yet.</Line>
          ) : (
            <Line>Start a Blind lease group to share the log with your blindmates.</Line>
          )}
        </TypeCard>
      ) : null}

      {types.includes("guide_service") ? (
        <TypeCard
          id="guide_service"
          links={
            <>
              <Link label="Today's slate" icon="calendar" onPress={() => go("groups")} />
              <Link label="Blinds" icon="home" onPress={() => go("blinds")} />
              <Link label="Blind map" icon="map" onPress={() => router.navigate("/map")} />
            </>
          }
        >
          {guide.gs.length === 0 ? (
            <Line strong>Set up your service as a Guide service group — guides, clients, blinds.</Line>
          ) : guide.lines.length === 0 ? (
            <Line strong>Nothing on today&apos;s slate.{guide.tomorrowCount ? ` ${guide.tomorrowCount} line${guide.tomorrowCount === 1 ? "" : "s"} tomorrow.` : ""}</Line>
          ) : (
            guide.lines.slice(0, 4).map(({ a, g }) => (
              <Line key={a.id} strong>
                {store.blinds.find((b) => b.id === a.blindId)?.name ?? "Any blind"}
                {a.guideMemberId ? ` · ${memberName(g, a.guideMemberId)}` : ""}
                {a.hunters.length ? ` · ${a.hunters.join(", ")}` : ""}
              </Line>
            ))
          )}
          {guide.lines.length > 4 ? <Line>+{guide.lines.length - 4} more today</Line> : null}
        </TypeCard>
      ) : null}

      {types.includes("refuge_rat") ? (
        <TypeCard
          id="refuge_rat"
          links={
            <>
              <Link label="Draws" icon="ticket" onPress={() => go("draws")} />
              <Link label="Board & share" icon="trophy" onPress={() => go("board")} />
              <Link label="Regs & shoot days" icon="book" onPress={() => router.navigate("/intel")} />
            </>
          }
        >
          {rat.night ? (
            <Line strong>
              Last draw night {rat.night.date}: {rat.night.draws.map((d) => `#${d.drawNumber} ${REFUGE_BY_ID[d.refugeId ?? ""]?.short ?? d.areaName}`).join(" · ")}
            </Line>
          ) : (
            <Line strong>No draws logged — stand in more than one line? Log every number for the night.</Line>
          )}
          {rat.top ? (
            <Line>
              {INDEX_WEEK.range}: best CDFW week at {rat.top.short} — {rat.top.harvest!.birdsPerHunter.toFixed(1)} birds/hunter
            </Line>
          ) : null}
          <Line>Ducks (Balance of State): {rat.duck.label}</Line>
        </TypeCard>
      ) : null}

      {types.includes("duck_club") ? (
        <TypeCard
          id="duck_club"
          links={
            <>
              <Link label="Draw & guests" icon="dice" onPress={() => go("groups")} />
              <Link label="Blinds" icon="home" onPress={() => go("blinds")} />
            </>
          }
        >
          {club.length === 0 ? <Line strong>Add your club as a Duck club group — blinds, members, guest-day limit.</Line> : null}
          {club.map(({ g, hot, draw, mine, limit, used }) => (
            <View key={g.id} style={{ gap: 2 }}>
              <Line strong>
                {g.name}
                {draw ? ` · draw ${draw.date}` : " · no draw yet"}
                {mine ? ` · you pick #${mine.pick}${mine.blindId ? ` → ${store.blinds.find((b) => b.id === mine.blindId)?.name ?? ""}` : " (waitlist)"}` : ""}
              </Line>
              {hot.length ? (
                <View style={styles.hotRow}>
                  {hot.map((h) => (
                    <View key={h.blind.id} style={styles.hotItem}>
                      <Text style={[type.caption, { color: colors.ink }]}>{h.blind.name}</Text>
                      <HeatBadge heat="hot" />
                    </View>
                  ))}
                </View>
              ) : null}
              {g.meId ? (
                <Line>
                  Your guest days: {used} of {limit}
                  {used >= limit ? " — at the limit" : ""}
                </Line>
              ) : null}
            </View>
          ))}
        </TypeCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.md, gap: 3 },
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  link: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong },
  linkText: { color: colors.ink, fontFamily: fonts.headingSemi, fontSize: 13, letterSpacing: 0.4 },
  hotRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  hotItem: { flexDirection: "row", alignItems: "center", gap: 4 },
});
