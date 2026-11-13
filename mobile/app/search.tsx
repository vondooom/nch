import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { colors, radius, spacing, type } from "@/constants/theme";
import { Card, Screen } from "@/components/ui";
import { BackHeader, ConnectGate, ErrorLine, HunterRow, Loading, useConnectState } from "@/components/Connect";
import { HunterProfile, searchHunters } from "@/lib/social";

// Find hunters by name or handle. Results come only from the server.

export default function SearchScreen() {
  const { state } = useConnectState();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<HunterProfile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "ready") return;
    const term = q.trim();
    if (term.replace(/^@/, "").length < 2) {
      setResults(null);
      return;
    }
    let live = true;
    // Small debounce so every keystroke isn't a query.
    const t = setTimeout(async () => {
      setBusy(true);
      const r = await searchHunters(term);
      if (!live) return;
      setBusy(false);
      if (r.ok) {
        setResults(r.data);
        setError(null);
      } else setError(r.message);
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, state]);

  return (
    <Screen>
      <BackHeader eyebrow="Connect" title="Find hunters" />
      {state !== "ready" ? (
        <ConnectGate state={state} />
      ) : (
        <>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Name or @handle"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
          />
          <ErrorLine msg={error} />
          {busy ? <Loading /> : null}
          {results && !busy ? (
            results.length ? (
              <Card style={{ paddingVertical: spacing.xs }}>
                {results.map((p) => (
                  <HunterRow key={p.userId} p={p} />
                ))}
              </Card>
            ) : (
              <Text style={type.caption}>No hunters match “{q.trim()}”.</Text>
            )
          ) : null}
          {!results && !busy ? <Text style={type.caption}>Type at least 2 letters.</Text> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.bgSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: spacing.md,
  },
});
