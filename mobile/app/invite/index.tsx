import { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { colors, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Screen } from "@/components/ui";
import { BackHeader, ConnectGate, ErrorLine, useConnectState } from "@/components/Connect";
import { cleanInviteInput, parseInviteInput } from "@/lib/social";

// For when the norcalhunt://invite link didn't open the app (texted to a
// phone without it, opened on a desktop): paste the link or type the code.

export default function EnterInviteScreen() {
  const { state } = useConnectState();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go() {
    const code = parseInviteInput(text);
    if (!code) return setError("Invite codes look like ABCDE-FGH23. Paste the whole link if you have it.");
    setError(null);
    router.push({ pathname: "/invite/[code]", params: { code } });
  }

  return (
    <Screen>
      <BackHeader eyebrow="Groups" title="Invite code" />
      {state !== "ready" ? <ConnectGate state={state} /> : null}
      <Card>
        <Text style={[type.body, { marginBottom: spacing.md }]}>Paste the invite link or type the code.</Text>
        <TextInput
          value={text}
          onChangeText={(v) => setText(v.includes("/") ? v : cleanInviteInput(v))}
          placeholder="ABCDE-FGH23"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={go}
        />
        <ErrorLine msg={error} />
        <Button label="Look it up" icon="arrow-forward" onPress={go} disabled={!text.trim()} style={{ marginTop: spacing.sm }} />
      </Card>
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
    fontSize: 20,
    letterSpacing: 3,
    textAlign: "center",
  },
});
