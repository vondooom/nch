import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing, type } from "@/constants/theme";
import { Button, Card, Screen, SectionLabel, Stat } from "@/components/ui";
import { BackHeader, ConnectGate, ErrorLine, HuntViewCard, Loading, useConnectState } from "@/components/Connect";
import { confirm } from "@/lib/confirm";
import { FeedItem, getHunter, HunterCard, hunterLog, hunterName, requestFollow, respondToFollow, unfollow, unfriend } from "@/lib/social";
import { typesLabel } from "@/lib/userTypes";

// Another hunter: who they are, how you're connected, and the entries of
// theirs you're allowed to see (redacted per lib/privacy.ts).

export default function HunterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useConnectState();
  const [card, setCard] = useState<HunterCard | null | undefined>(undefined);
  const [log, setLog] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const r = await getHunter({ userId: String(id) });
    if (!r.ok) return setError(r.message);
    setCard(r.data);
    if (r.data?.isMe) return;
    if (r.data) {
      const l = await hunterLog(r.data.userId);
      if (l.ok) setLog(l.data);
      else setError(l.message);
    }
  }, [id]);

  useEffect(() => {
    if (state === "ready") void load();
  }, [state, load]);

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    const r = await fn();
    if (!r.ok) setError(r.message ?? "That didn't work.");
    else setError(null);
    await load();
    setBusy(false);
  }

  const rel = card?.rel;
  const sharedGroups = rel?.groups.filter((g) => g.withAuthor).length ?? 0;

  return (
    <Screen>
      <BackHeader eyebrow="Hunter" title={card ? hunterName(card) : "Hunter"} />
      {state !== "ready" ? (
        <ConnectGate state={state} />
      ) : card === undefined ? (
        <>
          <ErrorLine msg={error} />
          {!error ? <Loading /> : null}
        </>
      ) : card === null ? (
        <Text style={type.body}>No hunter with that id.</Text>
      ) : (
        <>
          <Card>
            {card.handle ? <Text style={styles.handle}>@{card.handle}</Text> : null}
            {card.homeArea ? <Text style={type.body}>{card.homeArea}</Text> : null}
            <Text style={type.caption}>{card.userTypes.length ? typesLabel(card.userTypes) : "Hasn't said how they hunt"}</Text>
            <View style={styles.stats}>
              <Stat label="Followers" value={String(card.followers)} />
              <Stat label="Following" value={String(card.following)} />
              <Stat label="Shared groups" value={String(sharedGroups)} />
            </View>
            {card.isMe ? (
              <Button label="Edit my profile" icon="create-outline" onPress={() => router.push("/profile")} />
            ) : (
              <View style={{ gap: spacing.sm }}>
                {rel?.followsMe === "pending" ? (
                  <View style={styles.row}>
                    <Text style={[type.body, styles.flex]}>Wants to follow you.</Text>
                    <Button label="Decline" variant="ghost" onPress={() => void run(() => respondToFollow(card.userId, false))} disabled={busy} />
                    <Button label="Accept" onPress={() => void run(() => respondToFollow(card.userId, true))} disabled={busy} />
                  </View>
                ) : null}
                {rel?.isFriend ? (
                  <Button
                    label="Friends · unfriend"
                    icon="people"
                    variant="ghost"
                    disabled={busy}
                    onPress={async () => {
                      if (await confirm("Unfriend?", `You and ${hunterName(card)} stop following each other.`, "Unfriend")) void run(() => unfriend(card.userId));
                    }}
                  />
                ) : rel?.iFollow === "accepted" ? (
                  <Button label="Following · unfollow" icon="checkmark" variant="ghost" disabled={busy} onPress={() => void run(() => unfollow(card.userId))} />
                ) : rel?.iFollow === "pending" ? (
                  <Button label="Requested · cancel" icon="time-outline" variant="ghost" disabled={busy} onPress={() => void run(() => unfollow(card.userId))} />
                ) : (
                  <Button
                    label={rel?.followsMe === "accepted" ? "Follow back" : rel?.iFollow === "declined" ? "Ask again" : "Request to follow"}
                    icon="person-add"
                    disabled={busy}
                    onPress={() => void run(() => requestFollow(card.userId))}
                  />
                )}
              </View>
            )}
          </Card>
          <ErrorLine msg={error} />

          {!card.isMe ? (
            <>
              <SectionLabel>Their log</SectionLabel>
              <Text style={[type.caption, { marginBottom: spacing.sm }]}>
                {sharedGroups
                  ? "You share a group, so you see spots and notes on what they share with groups."
                  : "Area and birds only — spots, blinds and notes stay in their groups."}
              </Text>
              {!log ? <Loading /> : log.length ? log.map((it) => <HuntViewCard key={it.view.id} v={it.view} />) : <Text style={type.caption}>Nothing you can see yet.</Text>}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  handle: { color: colors.accent, fontSize: 15, marginBottom: 2 },
  stats: { flexDirection: "row", gap: spacing.md, marginVertical: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
