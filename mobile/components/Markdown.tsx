import type { ReactNode } from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, type } from "@/constants/theme";

// Just enough Markdown for the newsletter archive: ## / ### headings, - and 1.
// lists, block images (![](…)) and inline links. Relative /media paths resolve
// against the live site.

const SITE = "https://norcal-hunt.vercel.app";
const abs = (u: string) => (u.startsWith("/") ? SITE + u : u);

function Inline({ text, style }: { text: string; style?: object }) {
  const parts: (string | { label: string; url: string })[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ label: m[1], url: abs(m[2]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <Text style={[styles.p, style]}>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          p
        ) : (
          <Text key={i} style={styles.link} onPress={() => Linking.openURL(p.url)}>
            {p.label}
          </Text>
        ),
      )}
    </Text>
  );
}

export function Markdown({ body }: { body: string }) {
  const lines = body.split("\n");
  const out: ReactNode[] = [];
  let n = 0;
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      n = 0;
      return;
    }
    const img = line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
    if (img) {
      out.push(<Image key={i} source={{ uri: abs(img[1]) }} style={styles.img} resizeMode="cover" accessibilityIgnoresInvertColors />);
      return;
    }
    if (line.startsWith("### ")) {
      out.push(
        <Text key={i} style={styles.h3}>
          {line.slice(4)}
        </Text>,
      );
      return;
    }
    if (line.startsWith("## ") || line.startsWith("# ")) {
      out.push(
        <Text key={i} style={styles.h2}>
          {line.replace(/^#+\s/, "")}
        </Text>,
      );
      return;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const num = line.match(/^\s*\d+\.\s+(.*)/);
    if (bullet || num) {
      if (num) n += 1;
      out.push(
        <View key={i} style={styles.li}>
          <Text style={styles.marker}>{num ? `${n}.` : "•"}</Text>
          <Inline text={(bullet ?? num)![1]} style={styles.flex} />
        </View>,
      );
      return;
    }
    n = 0;
    out.push(<Inline key={i} text={line} />);
  });
  return <View>{out}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  p: { ...type.body, fontSize: 16, lineHeight: 25, marginBottom: spacing.md },
  h2: { fontFamily: fonts.heading, fontSize: 22, color: colors.accent, textTransform: "uppercase", marginTop: spacing.lg, marginBottom: spacing.sm, letterSpacing: 0.4 },
  h3: { fontFamily: fonts.headingSemi, fontSize: 18, color: colors.inkStrong, marginTop: spacing.md, marginBottom: spacing.xs },
  li: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.sm },
  marker: { color: colors.accent, fontSize: 16, lineHeight: 25, minWidth: 16 },
  link: { color: colors.accent, textDecorationLine: "underline" },
  img: { width: "100%", aspectRatio: 4 / 3, borderRadius: 10, marginBottom: spacing.md, backgroundColor: colors.bgElevated },
});
