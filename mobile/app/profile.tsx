import { useEffect, useMemo, useState } from "react";
import { Share, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, type } from "@/constants/theme";
import { Button, Card, Chip, Screen, SectionLabel } from "@/components/ui";
import { BackHeader, ConnectGate, ErrorLine, HuntViewCard, useConnectState, VisibilityPicker } from "@/components/Connect";
import { TypePicker } from "@/components/HowIHunt";
import { useGroupStore } from "@/lib/groupStore";
import { HuntLog, isSeedHunt, loadHunts } from "@/lib/huntLog";
import { PreviewAs, previewContext, viewHunt } from "@/lib/privacy";
import {
  cleanHandle,
  DISPLAY_NAME_MAX,
  effectiveVisibility,
  handleProblem,
  HOME_AREA_MAX,
  useMyProfile,
  Visibility,
} from "@/lib/profile";
import { applyDefaultPrivacy, fetchMyServerProfile, saveServerProfile } from "@/lib/social";
import { UserTypeId, useUserTypes } from "@/lib/userTypes";

// Your own profile. Saves on this phone first (works with no server), then
// to your account when Connect is live.

export default function ProfileScreen() {
  const { state } = useConnectState();
  const { profile, loaded, save } = useMyProfile();
  const { types, setTypes } = useUserTypes();
  const { blinds } = useGroupStore();

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeArea, setHomeArea] = useState("");
  const [privacy, setPrivacy] = useState<Visibility>(profile.logbookPrivacy);
  const [pick, setPick] = useState<UserTypeId[]>(types);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hunts, setHunts] = useState<HuntLog[]>([]);
  const [previewAs, setPreviewAs] = useState<PreviewAs>("friend");

  useEffect(() => {
    if (!loaded) return;
    setHandle(profile.handle);
    setDisplayName(profile.displayName);
    setHomeArea(profile.homeArea);
    setPrivacy(profile.logbookPrivacy);
  }, [loaded]);

  useEffect(() => setPick(types), [types.join(",")]);

  useEffect(() => {
    void loadHunts().then(setHunts);
  }, []);

  // New phone, same account: fill an empty form from the server copy.
  useEffect(() => {
    if (state !== "ready" || !loaded || profile.handle || profile.displayName) return;
    let live = true;
    void fetchMyServerProfile().then((r) => {
      if (!live || !r.ok || !r.data) return;
      setHandle(r.data.handle);
      setDisplayName(r.data.displayName);
      setHomeArea(r.data.homeArea);
      setPrivacy(r.data.logbookPrivacy);
      if (r.data.userTypes.length && !types.length) setPick(r.data.userTypes);
    });
    return () => {
      live = false;
    };
  }, [state, loaded]);

  const problem = handleProblem(handle);

  async function onSave() {
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    setMsg(null);
    const privacyChanged = privacy !== profile.logbookPrivacy;
    const saved = await save({ handle, displayName, homeArea, logbookPrivacy: privacy });
    await setTypes(pick);
    if (state !== "ready") {
      setBusy(false);
      setMsg("Saved on this phone.");
      return;
    }
    const r = await saveServerProfile(saved, pick);
    if (!r.ok) {
      setBusy(false);
      setError(`Saved on this phone. Server said: ${r.message}`);
      return;
    }
    if (privacyChanged) {
      const p = await applyDefaultPrivacy(saved.logbookPrivacy);
      if (!p.ok) setError(`Profile saved. Older hunts didn't pick up the new default: ${p.message}`);
    }
    setBusy(false);
    setMsg("Saved — on this phone and your account.");
  }

  // "How others see your log", run through the same helper the server views use.
  const real = hunts.filter((h) => !isSeedHunt(h));
  const sample = real.length === 0;
  const preview = useMemo(() => {
    const ctx = previewContext(previewAs);
    const list = (sample ? hunts : real).slice(0, 30);
    const views = list
      .map((h) =>
        viewHunt(ctx, h, { visibility: effectiveVisibility(h, privacy), groupIds: h.groupId ? [h.groupId] : [] }, blinds.find((b) => b.id === h.blindId)),
      )
      .filter((v): v is NonNullable<typeof v> => !!v);
    return { shown: views.slice(0, 4), visible: views.length, total: list.length };
  }, [hunts, previewAs, privacy, blinds]);

  return (
    <Screen>
      <BackHeader eyebrow="Connect" title="My profile" />
      {state !== "ready" ? <ConnectGate state={state} /> : null}

      <Card>
        <Text style={styles.label}>Handle</Text>
        <View style={styles.handleRow}>
          <Text style={styles.at}>@</Text>
          <TextInput
            value={handle}
            onChangeText={(v) => setHandle(cleanHandle(v))}
            placeholder="ricefieldchris"
            placeholderTextColor={colors.inkFaint}
            style={[styles.input, styles.flex]}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>
        <Text style={[type.caption, problem ? { color: colors.danger } : null]}>{problem ?? "3–20 letters, numbers or _. How hunters find you."}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={displayName}
          onChangeText={(v) => setDisplayName(v.slice(0, DISPLAY_NAME_MAX))}
          placeholder="What your crew calls you"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Home area</Text>
        <TextInput
          value={homeArea}
          onChangeText={(v) => setHomeArea(v.slice(0, HOME_AREA_MAX))}
          placeholder="e.g. Butte County"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          autoCapitalize="words"
        />
        <Text style={type.caption}>Shows on your profile. Keep it county-level.</Text>
      </Card>

      <SectionLabel>How I hunt</SectionLabel>
      <TypePicker value={pick} onChange={setPick} compact />

      <SectionLabel>Who sees my logbook</SectionLabel>
      <Card>
        <VisibilityPicker value={privacy} onChange={(v) => v && setPrivacy(v)} />
        <Text style={[type.caption, { marginTop: spacing.sm }]}>
          Default for every hunt. Change any single hunt when you log it. GPS, blind names and notes never leave your groups — friends and the public get the area and the birds.
          Clients and guests never see group results.
        </Text>
      </Card>

      <ErrorLine msg={error} />
      {msg ? <Text style={[type.caption, { color: colors.good, marginBottom: spacing.sm }]}>{msg}</Text> : null}
      <Button label={busy ? "Saving…" : "Save profile"} icon="checkmark" onPress={onSave} disabled={busy || !loaded} />
      {profile.handle ? (
        <Button
          label="Share my handle"
          icon="share-outline"
          variant="ghost"
          onPress={() => void Share.share({ message: `I'm @${profile.handle} on NorCalHunt. Field Desk → Connect → Find hunters.` }).catch(() => {})}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}

      <SectionLabel>How others see your log</SectionLabel>
      <View style={styles.wrap}>
        <Chip label="Group-mate" active={previewAs === "group"} onPress={() => setPreviewAs("group")} />
        <Chip label="Friend" active={previewAs === "friend"} onPress={() => setPreviewAs("friend")} />
        <Chip label="Anyone" active={previewAs === "public"} onPress={() => setPreviewAs("public")} />
      </View>
      <Text style={[type.caption, { marginBottom: spacing.sm }]}>
        {preview.total === 0
          ? "Log a hunt to preview."
          : `${preview.visible} of ${preview.total}${sample ? " sample" : ""} hunts visible${preview.visible > preview.shown.length ? ` · showing ${preview.shown.length}` : ""}. Preview only — uses this phone's settings.`}
      </Text>
      {preview.shown.map((v) => (
        <HuntViewCard key={v.id} v={v} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, marginTop: spacing.md },
  input: {
    backgroundColor: colors.bgSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
  },
  handleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 4 },
  at: { color: colors.accent, fontSize: 20, fontWeight: "700" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
});
