import { ReactNode } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { colors } from "@/constants/theme";

// Web-only presentation shell, as in Pear: on a desktop viewport the app sits
// in a phone-width column over a darker backdrop instead of stretching a
// thumb-sized UI across a monitor. Native and mobile-web get the plain app.
export function WebShell({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== "web") return <>{children}</>;
  const framed = width >= 720 && height >= 540;
  if (!framed) return <View style={styles.full}>{children}</View>;
  return (
    <View style={styles.stage}>
      <View style={styles.device}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050806", padding: 24 },
  device: {
    width: 430,
    maxHeight: 932,
    height: "100%",
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: "rgba(224,159,62,0.25)",
  },
});
