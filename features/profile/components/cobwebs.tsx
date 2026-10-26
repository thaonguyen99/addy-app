import { StyleProp, ViewStyle } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

// From the handoff's cobwebs-288x540.svg (stroke #A3A8B8 at ~0.9px).
const STROKE = "#A3A8B8";
const SPIDER = "#8E92A3";

const TOP_RIGHT_WEB =
  "M288 0L288.0 72.0M288 0L260.4 66.5M288 0L237.1 50.9M288 0L221.5 27.6M288 0L216.0 0.0M288.0 14.0Q285.7 11.8 282.6 12.9M282.6 12.9Q281.3 10.0 278.1 9.9M278.1 9.9Q278.0 6.7 275.1 5.4M275.1 5.4Q276.2 2.3 274.0 0.0M288.0 28.0Q283.3 23.6 277.3 25.9M277.3 25.9Q274.6 20.0 268.2 19.8M268.2 19.8Q268.0 13.4 262.1 10.7M262.1 10.7Q264.4 4.7 260.0 0.0M288.0 44.0Q280.6 37.1 271.2 40.7M271.2 40.7Q267.0 31.5 256.9 31.1M256.9 31.1Q256.5 21.0 247.3 16.8M247.3 16.8Q250.9 7.4 244.0 0.0M288.0 60.0Q277.9 50.6 265.0 55.4M265.0 55.4Q259.3 42.9 245.6 42.4M245.6 42.4Q245.1 28.7 232.6 23.0M232.6 23.0Q237.4 10.1 228.0 0.0";

const BOTTOM_LEFT_WEB =
  "M0 500.0L-0.0 418.0M0 500.0L31.4 424.2M0 500.0L58.0 442.0M0 500.0L75.8 468.6M0 500.0L82.0 500.0M-0.0 484.0Q2.7 486.5 6.1 485.2M6.1 485.2Q7.6 488.6 11.3 488.7M11.3 488.7Q11.4 492.4 14.8 493.9M14.8 493.9Q13.5 497.3 16.0 500.0M-0.0 468.0Q5.4 473.0 12.2 470.4M12.2 470.4Q15.3 477.1 22.6 477.4M22.6 477.4Q22.9 484.7 29.6 487.8M29.6 487.8Q27.0 494.6 32.0 500.0M-0.0 450.0Q8.4 457.8 19.1 453.8M19.1 453.8Q23.9 464.2 35.4 464.6M35.4 464.6Q35.8 476.1 46.2 480.9M46.2 480.9Q42.2 491.6 50.0 500.0M-0.0 432.0Q11.4 442.6 26.0 437.2M26.0 437.2Q32.5 451.4 48.1 451.9M48.1 451.9Q48.6 467.5 62.8 474.0M62.8 474.0Q57.4 488.6 68.0 500.0";

/** Scale from the 288-wide artboard to points on screen. */
const SCALE = 1.1;

/** A tiny spider: body, head and four legs a side. */
function Spider({ x, y }: { x: number; y: number }) {
  const legs = [-3, -1, 1, 3].map((dy) => (
    <G key={dy}>
      <Path d={`M${x} ${y + dy * 0.6}l-4.5 ${dy - 1.2}`} />
      <Path d={`M${x} ${y + dy * 0.6}l4.5 ${dy - 1.2}`} />
    </G>
  ));
  return (
    <G stroke={SPIDER} strokeWidth={0.8} fill={SPIDER}>
      {legs}
      <Circle cx={x} cy={y - 2.6} r={1.6} />
      <Circle cx={x} cy={y + 0.8} r={2.6} />
    </G>
  );
}

/** Corner web with a spider hanging just below it. Purely decorative. */
export function TopRightCobweb({ style }: { style?: StyleProp<ViewStyle> }) {
  const w = 74;
  const h = 100;
  return (
    <Svg
      width={w * SCALE}
      height={h * SCALE}
      viewBox={`${288 - w} 0 ${w} ${h}`}
      style={style}
      pointerEvents="none"
    >
      <G fill="none" stroke={STROKE} strokeWidth={0.9} strokeLinecap="round">
        <Path d={TOP_RIGHT_WEB} />
        <Path d="M262 6 L262 90" strokeWidth={0.7} />
      </G>
      <Spider x={262} y={93} />
    </Svg>
  );
}

/** Web tucked into the bottom-left corner. Purely decorative. */
export function BottomLeftCobweb({ style }: { style?: StyleProp<ViewStyle> }) {
  const w = 84;
  const h = 84;
  return (
    <Svg
      width={w * SCALE}
      height={h * SCALE}
      viewBox={`0 ${500 - h + 1} ${w} ${h}`}
      style={style}
      pointerEvents="none"
    >
      <G fill="none" stroke={STROKE} strokeWidth={0.9} strokeLinecap="round">
        <Path d={BOTTOM_LEFT_WEB} />
      </G>
    </Svg>
  );
}
