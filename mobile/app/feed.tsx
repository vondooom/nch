import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { spacing, type } from "@/constants/theme";
import { Button, Screen } from "@/components/ui";
import { BackHeader, ConnectGate, ErrorLine, HuntViewCard, Loading, useConnectState } from "@/components/Connect";
import { FeedItem, friendFeed } from "@/lib/social";

// Recent hunts from hunters you follow — only what each one lets you see,
// redacted through lib/privacy.ts.

export default function FeedScreen() {
  const { state } = useConnectState();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await friendFeed(50);
    if (r.ok) {
      setItems(r.data);
      setError(null);
    } else setError(r.message);
  }, []);

  useEffect(() => {
    if (state === "ready") void load();
  }, [state, load]);

  return (
    <Screen>
      <BackHeader eyebrow="Connect" title="Friends feed" />
      {state !== "ready" ? (
        <ConnectGate state={state} />
      ) : (
        <>
          <ErrorLine msg={error} />
          {!items && !error ? <Loading /> : null}
          {items && !items.length ? (
            <>
              <Text style={[type.body, { marginBottom: spacing.md }]}>Nothing yet. Follow a few hunters and their hunts show up here.</Text>
              <Button label="Find hunters" icon="search" onPress={() => router.push("/search")} />
            </>
          ) : null}
          {items?.map((it) => (
            <HuntViewCard key={`${it.author.userId}-${it.view.id}`} v={it.view} author={it.author} />
          ))}
          {items?.length ? <Button label="Refresh" icon="refresh" variant="ghost" onPress={() => void load()} style={{ marginTop: spacing.sm }} /> : null}
        </>
      )}
    </Screen>
  );
}
