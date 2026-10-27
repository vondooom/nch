import MapView, { Circle, Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import { LatLon } from "@/lib/geo";
import { TrackPoint } from "@/lib/track";
import { Waypoint, WAYPOINT_KINDS } from "@/lib/waypoints";

// Satellite imagery via react-native-maps (Apple Maps on iOS). Native only —
// Metro resolves NativeMap.web.tsx for the web bundle, so react-native-maps is
// never pulled into `expo export --platform web`.

export const nativeMapAvailable = true;

type Props = {
  center: LatLon;
  mpp: number;
  track: TrackPoint[];
  waypoints: Waypoint[];
  me: TrackPoint | null;
  onPressWaypoint: (id: string) => void;
  height?: number;
};

export function NativeMap({ center, mpp, track, waypoints, me, onPressWaypoint, height = 360 }: Props) {
  // ~390 px across the card → span in degrees from meters-per-pixel.
  const latDelta = (mpp * 390) / 111320;
  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        mapType="hybrid"
        region={{ latitude: center.lat, longitude: center.lon, latitudeDelta: latDelta, longitudeDelta: latDelta }}
        showsCompass
        showsScale
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {track.length > 1 ? (
          <Polyline
            coordinates={track.map((p) => ({ latitude: p.lat, longitude: p.lon }))}
            strokeColor={colors.trail}
            strokeWidth={4}
          />
        ) : null}
        {waypoints.map((w) => (
          <Marker
            key={w.id}
            coordinate={{ latitude: w.lat, longitude: w.lon }}
            title={w.label}
            description={WAYPOINT_KINDS[w.kind].label}
            pinColor={WAYPOINT_KINDS[w.kind].color}
            onPress={() => onPressWaypoint(w.id)}
          />
        ))}
        {me ? (
          <>
            {me.acc ? (
              <Circle
                center={{ latitude: me.lat, longitude: me.lon }}
                radius={me.acc}
                strokeColor="rgba(111,168,220,0.6)"
                fillColor="rgba(111,168,220,0.15)"
              />
            ) : null}
            <Circle center={{ latitude: me.lat, longitude: me.lon }} radius={Math.max(2, mpp * 5)} strokeColor="#f7f2e4" fillColor="#6fa8dc" />
          </>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
});
