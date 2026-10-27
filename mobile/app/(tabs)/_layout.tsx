import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { colors, fonts } from "@/constants/theme";

// Tab order follows a hunt day: read the Index the night before, walk in on
// the Map, log the birds, and keep the shoot-time clock and regs a tap away.
//
//   Index · Map · Logbook · Field Desk

function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={size} color={color} />
      <View style={[styles.activeDot, !focused && styles.activeDotHidden]} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.bgSunken,
          borderTopColor: colors.hairline,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.headingSemi,
          fontSize: 12,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Index",
          tabBarIcon: (p) => <TabIcon name={p.focused ? "speedometer" : "speedometer-outline"} {...p} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "GPS Map",
          tabBarIcon: (p) => <TabIcon name={p.focused ? "navigate" : "navigate-outline"} {...p} />,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Logbook",
          tabBarIcon: (p) => <TabIcon name={p.focused ? "journal" : "journal-outline"} {...p} />,
        }}
      />
      <Tabs.Screen
        name="intel"
        options={{
          title: "Field Desk",
          tabBarIcon: (p) => <TabIcon name={p.focused ? "time" : "time-outline"} {...p} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center" },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 3 },
  activeDotHidden: { backgroundColor: "transparent" },
});
