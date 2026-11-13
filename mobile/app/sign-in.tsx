import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Header, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, SYNC_OFF_LINE } from "@/lib/supabase";

// Email one-time code sign-in. Two steps: send the code, type the code.

const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function SignInScreen() {
  const { user, signInWithEmail, verifyOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/tracker"));

  async function send() {
    if (!looksLikeEmail(email)) {
      setMsg("That email doesn't look right — check for a typo.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await signInWithEmail(email);
      setCode("");
      setStep("code");
      setMsg(`Code sent to ${email.trim()}. Check spam if it's not there in a minute.`);
    } catch (e) {
      setMsg(`Couldn't send the code: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (code.trim().length < 6) {
      setMsg("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await verifyOtp(email, code);
      close();
    } catch (e) {
      setMsg(`${e instanceof Error ? e.message : String(e)} — codes expire, so send a fresh one if it's been a while.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Header
        eyebrow="Account"
        title="Sign in"
        right={
          <Pressable onPress={close} style={styles.close} accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.accent} />
          </Pressable>
        }
      />

      {user ? (
        <Card>
          <Text style={type.h3}>You&apos;re signed in</Text>
          <Text style={[type.body, { color: colors.inkMuted, marginVertical: spacing.sm }]}>{user.email}</Text>
          <Button label="Back to the logbook" icon="arrow-back" onPress={close} />
        </Card>
      ) : !isSupabaseConfigured ? (
        <Card>
          <Text style={type.h3}>Sign-in isn&apos;t on yet</Text>
          <Text style={[type.body, { color: colors.inkMuted, marginTop: spacing.sm }]}>{SYNC_OFF_LINE}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={[type.body, { color: colors.inkMuted, marginBottom: spacing.md }]}>
            No password. We email you a 6-digit code, you type it in, done. Logs stay on this phone until you sign in. After you sign in,
            your hunts sync to your account.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (step === "code") setStep("email");
            }}
            placeholder="you@example.com"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={send}
            editable={!busy}
          />

          {step === "code" ? (
            <>
              <Text style={styles.label}>6-digit code</Text>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                placeholderTextColor={colors.inkFaint}
                style={[styles.input, styles.code]}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={verify}
                editable={!busy}
                autoFocus
              />
              <Button label="Verify & sign in" icon="checkmark-circle" onPress={verify} disabled={busy} style={{ marginTop: spacing.md }} />
              <Button label="Send a new code" icon="refresh" variant="ghost" onPress={send} disabled={busy} style={{ marginTop: spacing.sm }} />
            </>
          ) : (
            <Button label="Send code" icon="mail" onPress={send} disabled={busy} style={{ marginTop: spacing.md }} />
          )}

          {busy ? <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} /> : null}
          {msg ? <Text style={[type.caption, { marginTop: spacing.md, fontSize: 13 }]}>{msg}</Text> : null}
        </Card>
      )}

      <View style={styles.privacy}>
        <Ionicons name="lock-closed" size={12} color={colors.inkFaint} />
        <Text style={[type.caption, { fontSize: 12 }]}>Your hunt data is yours. We don&apos;t share or sell it.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  close: { padding: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  label: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bgSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  code: { fontSize: 26, letterSpacing: 8, textAlign: "center", fontVariant: ["tabular-nums"] },
  privacy: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: spacing.lg },
});
