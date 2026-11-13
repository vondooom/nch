import { ReactNode, useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, type } from "@/constants/theme";
import { Card, Chip, Screen, SectionLabel } from "@/components/ui";
import { BackHeader, ConnectGate, ErrorLine, HunterRow, Loading, useConnectState } from "@/components/Connect";
import { confirm } from "@/lib/confirm";
import { FollowEntry, FollowLists, hunterName, myFollows, removeFollower, respondToFollow, unfollow } from "@/lib/social";

// Requests inbox, my outgoing asks, followers, following.

type View_ = "requests" | "followers" | "following";

export default function RequestsScreen() {
  const { state } = useConnectState();
  const [lists, setLists] = useState<FollowLists | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View_>("requests");

  const load = useCallback(async () => {
    const r = await myFollows();
    if (r.ok) {
      setLists(r.data);
      setError(null);
    } else setError(r.message);
  }, []);

  useEffect(() => {
    if (state === "ready") void load();
  }, [state, load]);

  async function act(fn: () => Promise<{ ok: boolean; message?: string }>) {
    const r = await fn();
    if (!r.ok) setError(r.message ?? "That didn't work.");
    await load();
  }

  const action = (icon: keyof typeof Ionicons.glyphMap, label: string, color: string, onPress: () => void) => (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel={label} style={styles.act}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );

  const followingIds = new Set(lists?.following.map((e) => e.profile.userId) ?? []);
  const rows = (list: FollowEntry[], right: (e: FollowEntry) => ReactNode, empty: string) =>
    list.length ? (
      <Card style={{ paddingVertical: spacing.xs }}>
        {list.map((e) => (
          <HunterRow key={e.profile.userId} p={e.profile} right={<View style={styles.acts}>{right(e)}</View>} />
        ))}
      </Card>
    ) : (
      <Text style={[type.caption, { marginBottom: spacing.sm }]}>{empty}</Text>
    );

  return (
    <Screen>
      <BackHeader eyebrow="Connect" title="Requests" />
      {state !== "ready" ? (
        <ConnectGate state={state} />
      ) : !lists ? (
        <>
          <ErrorLine msg={error} />
          {!error ? <Loading /> : null}
        </>
      ) : (
        <>
          <View style={styles.wrap}>
            <Chip label={`Requests${lists.incoming.length ? ` (${lists.incoming.length})` : ""}`} active={view === "requests"} onPress={() => setView("requests")} />
            <Chip label={`Followers (${lists.followers.length})`} active={view === "followers"} onPress={() => setView("followers")} />
            <Chip label={`Following (${lists.following.length})`} active={view === "following"} onPress={() => setView("following")} />
          </View>
          <ErrorLine msg={error} />

          {view === "requests" ? (
            <>
              <SectionLabel>Want to follow you</SectionLabel>
              {rows(
                lists.incoming,
                (e) => (
                  <>
                    {action("close-circle-outline", "Decline", colors.inkMuted, () => void act(() => respondToFollow(e.profile.userId, false)))}
                    {action("checkmark-circle", "Accept", colors.good, () => void act(() => respondToFollow(e.profile.userId, true)))}
                  </>
                ),
                "No requests.",
              )}
              <Text style={type.caption}>Accepting lets them see your Public hunts in their feed. Follow them back and you're friends — they see Friends hunts too.</Text>
              <SectionLabel>You asked</SectionLabel>
              {rows(
                lists.outgoing,
                (e) => action("close", "Cancel request", colors.inkMuted, () => void act(() => unfollow(e.profile.userId))),
                "Nothing pending.",
              )}
            </>
          ) : view === "followers" ? (
            rows(
              lists.followers,
              (e) => (
                <>
                  {followingIds.has(e.profile.userId) ? <Text style={styles.friend}>Friend</Text> : null}
                  {action("person-remove-outline", "Remove follower", colors.danger, async () => {
                    if (await confirm("Remove follower?", `${hunterName(e.profile)} stops seeing your Friends and Public hunts in their feed.`, "Remove")) {
                      void act(() => removeFollower(e.profile.userId));
                    }
                  })}
                </>
              ),
              "No followers yet.",
            )
          ) : (
            rows(
              lists.following,
              (e) =>
                action("person-remove-outline", "Unfollow", colors.danger, async () => {
                  if (await confirm("Unfollow?", hunterName(e.profile), "Unfollow")) void act(() => unfollow(e.profile.userId));
                }),
              "You're not following anyone yet.",
            )
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  acts: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  act: { padding: 4 },
  friend: { color: colors.good, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
});
