import { StyleSheet, Text, View } from "react-native";
import { colors, type } from "@/constants/theme";
import { LatLon } from "@/lib/geo";
import { TrackPoint } from "@/lib/track";
import { Waypoint } from "@/lib/waypoints";

// Web build of the satellite view. react-native-maps has no web renderer, so
// this file stands in for NativeMap.tsx in the web bundle and the map screen
// hides the Satellite toggle (nativeMapAvailable = false). Same props, so the
// screen type-checks against either file.

export const nativeMapAvailable = false;

type Props = {
  center: LatLon;
  mpp: number;
  track: TrackPoint[];
  waypoints: Waypoint[];
  me: TrackPoint | null;
  onPressWaypoint: (id: string) => void;
  height?: number;
};

export function NativeMap({ height = 360 }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Text style={type.body}>Satellite imagery is available in the iOS and Android app. The tactical map works everywhere.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
