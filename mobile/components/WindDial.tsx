import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { colors } from "@/constants/theme";
import { cardinal, rotateAbout, windArrowDeg } from "@/lib/geo";

// Compact wind rose. `dir` is meteorological: degrees the wind blows FROM.
// The arrow flies the way the wind is blowing (tail upwind, head downwind),
// the usual weather-app convention — see windArrowDeg in lib/geo.
export function WindDial({ dir, size = 72, speed }: { dir: number; size?: number; speed?: number }) {
  const c = size / 2;
  const r = c - 6;
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const rot = windArrowDeg(dir);
  // Arrow geometry drawn pointing up, then rotated point by point.
  const pt = (dx: number, dy: number) => rotateAbout(c, c, dx, dy, rot);
  const tail = pt(0, r * 0.62);
  const shaftEnd = pt(0, -r * 0.5);
  const tip = pt(0, -r * 0.72);
  const wingL = pt(-6, -r * 0.4);
  const wingR = pt(6, -r * 0.4);
  const barbL = pt(-5, r * 0.62);
  const barbR = pt(5, r * 0.62);
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      accessibilityLabel={`Wind from ${cardinal(dir, 16)}, ${Math.round(dir)} degrees`}
    >
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
      <Line x1={tail.x} y1={tail.y} x2={shaftEnd.x} y2={shaftEnd.y} stroke={colors.accent} strokeWidth={3} strokeLinecap="round" />
      <Path d={`M ${tip.x} ${tip.y} L ${wingL.x} ${wingL.y} L ${wingR.x} ${wingR.y} Z`} fill={colors.accent} />
      <Line x1={barbL.x} y1={barbL.y} x2={barbR.x} y2={barbR.y} stroke={colors.accent} strokeWidth={2} />
      {speed != null ? (
        <SvgText x={c} y={size - 2} fill={colors.inkMuted} fontSize={8} textAnchor="middle">
          {Math.round(speed)} mph
        </SvgText>
      ) : null}
    </Svg>
  );
}
