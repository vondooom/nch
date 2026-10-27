import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { colors } from "@/constants/theme";

// Compact wind rose: the arrow flies the way the wind is blowing (from → to),
// which is the direction birds will be landing *from* the other side.
export function WindDial({ dir, size = 72, speed }: { dir: number; size?: number; speed?: number }) {
  const c = size / 2;
  const r = c - 6;
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={r} stroke={colors.borderStrong} strokeWidth={1.5} fill={colors.bgSunken} />
      {ticks.map((t) => {
        const a = (t * Math.PI) / 180;
        const inner = t % 90 === 0 ? r - 7 : r - 4;
        return (
          <Line
            key={t}
            x1={c + Math.sin(a) * inner}
            y1={c - Math.cos(a) * inner}
            x2={c + Math.sin(a) * r}
            y2={c - Math.cos(a) * r}
            stroke={t % 90 === 0 ? colors.ink : colors.inkFaint}
            strokeWidth={t % 90 === 0 ? 1.5 : 1}
          />
        );
      })}
      <SvgText x={c} y={13} fill={colors.accent} fontSize={9} fontWeight="700" textAnchor="middle">
        N
      </SvgText>
      {/* rotate so the arrow points downwind */}
      <G rotation={dir + 180} origin={`${c}, ${c}`}>
        <Line x1={c} y1={c + r * 0.62} x2={c} y2={c - r * 0.5} stroke={colors.accent} strokeWidth={3} strokeLinecap="round" />
        <Path d={`M ${c} ${c - r * 0.72} L ${c - 6} ${c - r * 0.4} L ${c + 6} ${c - r * 0.4} Z`} fill={colors.accent} />
        <Line x1={c - 5} y1={c + r * 0.62} x2={c + 5} y2={c + r * 0.62} stroke={colors.accent} strokeWidth={2} />
      </G>
      {speed != null ? (
        <SvgText x={c} y={size - 2} fill={colors.inkMuted} fontSize={8} textAnchor="middle">
          {Math.round(speed)} mph
        </SvgText>
      ) : null}
    </Svg>
  );
}
