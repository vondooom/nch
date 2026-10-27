import { Link } from "expo-router";
import { Text, View } from "react-native";
import { colors, type } from "@/constants/theme";

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={type.h2}>Off the levee</Text>
      <Link href="/" style={{ color: colors.accent, fontSize: 16 }}>
        Back to the Index
      </Link>
    </View>
  );
}
