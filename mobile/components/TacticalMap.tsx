import { useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { colors } from "@/constants/theme";
import { fromLocalMeters, LatLon, toLocalMeters } from "@/lib/geo";
import { Schematic } from "@/lib/refuges";
import { TrackPoint } from "@/lib/track";
import { Waypoint, WAYPOINT_KINDS } from "@/lib/waypoints";

// The tactical blind map — pure SVG, so it renders the same on iOS, Android
// and web, works with no tiles and no signal, and stays dim enough not to wreck
// night vision. North-up; drag to pan, zoom with the buttons in the screen.

type Props = {
  center: LatLon;           // map center
  anchor: LatLon;           // grid origin (refuge HQ) so grid lines don't swim
  mpp: number;              // meters per pixel
  schematic: Schematic | null;
  track: TrackPoint[];
  waypoints: Waypoint[];
  me: TrackPoint | null;
  heading: number | null;
  windDir: number | null;
  windMph: number | null;
  targetId: string | null;
  onPan: (c: LatLon) => void;
  onPressWaypoint: (id: string) => void;
  height?: number;
};

const GRID_STEPS = [10, 25, 50, 100, 200, 250, 500, 1000, 2000];

export function TacticalMap(p: Props) {
  const [size, setSize] = useState({ w: 0, h: p.height ?? 360 });
  const grantCenter = useRef(p.center);
  const live = useRef(p);
  live.current = p;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          grantCenter.current = live.current.center;
        },
        onPanResponderMove: (_e, g) => {
          const { mpp, onPan } = live.current;
          onPan(fromLocalMeters(grantCenter.current, -g.dx * mpp, g.dy * mpp));
        },
      }),
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const { w, h } = size;
  const c = toLocalMeters(p.anchor, p.center);
  const px = (ll: LatLon) => {
    const m = toLocalMeters(p.anchor, ll);
    return { x: w / 2 + (m.x - c.x) / p.mpp, y: h / 2 - (m.y - c.y) / p.mpp };
  };

  const grid = GRID_STEPS.find((g) => g / p.mpp >= 60) ?? 2000;
  const gridLines: { x?: number; y?: number; major: boolean }[] = [];
  if (w > 0) {
    const halfW = (w / 2) * p.mpp;
    const halfH = (h / 2) * p.mpp;
    for (let gx = Math.floor((c.x - halfW) / grid) * grid; gx <= c.x + halfW; gx += grid) {
      gridLines.push({ x: w / 2 + (gx - c.x) / p.mpp, major: Math.round(gx / grid) % 5 === 0 });
    }
    for (let gy = Math.floor((c.y - halfH) / grid) * grid; gy <= c.y + halfH; gy += grid) {
      gridLines.push({ y: h / 2 - (gy - c.y) / p.mpp, major: Math.round(gy / grid) % 5 === 0 });
    }
  }

  const trackPts = p.track.map(px).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const me = p.me ? px(p.me) : null;
  const target = p.waypoints.find((x) => x.id === p.targetId) ?? null;
  const targetPx = target ? px(target) : null;
  const scalePx = grid / p.mpp;

  return (
    <View style={[styles.wrap, { height: p.height ?? 360 }]} onLayout={onLayout} {...responder.panHandlers}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Rect x={0} y={0} width={w} height={h} fill="#0b120e" />

          {gridLines.map((g, i) =>
            g.x != null ? (
              <Line key={`gx${i}`} x1={g.x} y1={0} x2={g.x} y2={h} stroke={g.major ? "#1f2d24" : "#16211a"} strokeWidth={1} />
            ) : (
              <Line key={`gy${i}`} x1={0} y1={g.y} x2={w} y2={g.y} stroke={g.major ? "#1f2d24" : "#16211a"} strokeWidth={1} />
            ),
          )}

          {p.schematic?.ponds.map((pond) => {
            const q = px(pond.center);
            return (
              <G key={pond.id}>
                <Ellipse
                  cx={q.x}
                  cy={q.y}
                  rx={pond.rx / p.mpp + 5}
                  ry={pond.ry / p.mpp + 5}
                  rotation={pond.rot}
                  origin={`${q.x}, ${q.y}`}
                  fill={colors.tule}
                  opacity={0.35}
                />
                <Ellipse
                  cx={q.x}
                  cy={q.y}
                  rx={pond.rx / p.mpp}
                  ry={pond.ry / p.mpp}
                  rotation={pond.rot}
                  origin={`${q.x}, ${q.y}`}
                  fill={colors.waterDeep}
                  stroke={colors.water}
                  strokeWidth={1.5}
                />
                <SvgText x={q.x} y={q.y + 4} fill="#6f9da1" fontSize={11} fontWeight="600" textAnchor="middle">
                  {pond.label}
                </SvgText>
              </G>
            );
          })}

          {p.schematic?.landmarks.map((l) => {
            const q = px(l.at);
            return (
              <G key={l.id}>
                <Rect x={q.x - 5} y={q.y - 5} width={10} height={10} fill="none" stroke={colors.inkMuted} strokeWidth={1.5} />
                <SvgText x={q.x + 9} y={q.y + 4} fill={colors.inkMuted} fontSize={10}>
                  {l.label}
                </SvgText>
              </G>
            );
          })}

          {p.track.length > 1 ? (
            <>
              <Polyline points={trackPts} fill="none" stroke={colors.trail} strokeOpacity={0.25} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
              <Polyline points={trackPts} fill="none" stroke={colors.trail} strokeWidth={2.5} strokeDasharray="6,4" strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : null}
          {p.track.length > 0 ? (() => {
            const s = px(p.track[0]);
            return <Circle cx={s.x} cy={s.y} r={4} fill={colors.bg} stroke={colors.trail} strokeWidth={2} />;
          })() : null}

          {me && targetPx ? (
            <Line x1={me.x} y1={me.y} x2={targetPx.x} y2={targetPx.y} stroke={WAYPOINT_KINDS[target!.kind].color} strokeWidth={1.5} strokeDasharray="3,5" />
          ) : null}

          {p.waypoints.map((wp) => {
            const q = px(wp);
            const k = WAYPOINT_KINDS[wp.kind];
            const sel = wp.id === p.targetId;
            return (
              <G key={wp.id} onPress={() => p.onPressWaypoint(wp.id)}>
                {sel ? <Circle cx={q.x} cy={q.y} r={15} fill="none" stroke={k.color} strokeWidth={1.5} strokeDasharray="3,3" /> : null}
                <Path d={`M ${q.x} ${q.y} l -7 -13 a 8 8 0 1 1 14 0 Z`} fill={k.color} stroke={colors.bg} strokeWidth={1.5} />
                <Circle cx={q.x} cy={q.y - 16} r={3} fill={colors.bg} />
                <SvgText x={q.x} y={q.y + 13} fill={k.color} fontSize={10} fontWeight="700" textAnchor="middle">
                  {k.short}
                </SvgText>
              </G>
            );
          })}

          {me ? (
            <G>
              {p.me?.acc ? <Circle cx={me.x} cy={me.y} r={Math.max(6, p.me.acc / p.mpp)} fill="#6fa8dc" opacity={0.14} stroke="#6fa8dc" strokeOpacity={0.4} /> : null}
              {p.heading != null ? (
                <Path
                  d={`M ${me.x} ${me.y} L ${me.x - 14} ${me.y - 34} A 36 36 0 0 1 ${me.x + 14} ${me.y - 34} Z`}
                  fill="#6fa8dc"
                  opacity={0.35}
                  rotation={p.heading}
                  origin={`${me.x}, ${me.y}`}
                />
              ) : null}
              <Circle cx={me.x} cy={me.y} r={7} fill="#6fa8dc" stroke="#f7f2e4" strokeWidth={2.5} />
            </G>
          ) : null}

          {/* compass rose, bottom-left */}
          <G>
            <Circle cx={36} cy={h - 40} r={24} fill={colors.bgOverlay} stroke={colors.borderStrong} />
            <Path d={`M 36 ${h - 61} L 31 ${h - 40} L 41 ${h - 40} Z`} fill={colors.danger} />
            <Path d={`M 36 ${h - 19} L 31 ${h - 40} L 41 ${h - 40} Z`} fill={colors.inkMuted} />
            <SvgText x={36} y={h - 66} fill={colors.ink} fontSize={10} fontWeight="700" textAnchor="middle">
              N
            </SvgText>
          </G>

          {/* wind overlay, top-right */}
          {p.windDir != null ? (
            <G>
              <Rect x={w - 92} y={8} width={84} height={30} rx={6} fill={colors.bgOverlay} stroke={colors.borderStrong} />
              <G rotation={p.windDir + 180} origin={`${w - 74}, 23`}>
                <Line x1={w - 74} y1={33} x2={w - 74} y2={15} stroke={colors.accent} strokeWidth={2.5} />
                <Path d={`M ${w - 74} 11 L ${w - 79} 19 L ${w - 69} 19 Z`} fill={colors.accent} />
              </G>
              <SvgText x={w - 58} y={27} fill={colors.ink} fontSize={11} fontWeight="700">
                {`${Math.round(p.windMph ?? 0)} mph`}
              </SvgText>
            </G>
          ) : null}

          {/* scale bar, bottom-right */}
          <G>
            <Line x1={w - 16 - scalePx} y1={h - 18} x2={w - 16} y2={h - 18} stroke={colors.ink} strokeWidth={2} />
            <Line x1={w - 16 - scalePx} y1={h - 23} x2={w - 16 - scalePx} y2={h - 13} stroke={colors.ink} strokeWidth={2} />
            <Line x1={w - 16} y1={h - 23} x2={w - 16} y2={h - 13} stroke={colors.ink} strokeWidth={2} />
            <SvgText x={w - 16 - scalePx / 2} y={h - 27} fill={colors.ink} fontSize={10} textAnchor="middle">
              {grid >= 1000 ? `${grid / 1000} km` : `${Math.round(grid * 1.0936)} yds`}
            </SvgText>
          </G>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: "#0b120e" },
});
