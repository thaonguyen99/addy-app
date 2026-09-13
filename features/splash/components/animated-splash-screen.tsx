import { Fredoka_600SemiBold } from "@expo-google-fonts/fredoka";
import { VT323_400Regular } from "@expo-google-fonts/vt323";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { BrandColors } from "@/constants/theme";

type AnimatedSplashScreenProps = {
  /** 0-1, real load progress (fonts loaded, auth status resolved). */
  progress: number;
  /** Shown once real stats are available — never fabricated placeholders. */
  counts?: { places: number; memories: number };
};

const PIN_SIZE = 150;

/**
 * JS-rendered splash shown during the fonts/auth loading window, right
 * after the native static splash hands off. The app's other custom fonts
 * (BeVietnam/PatrickHand/Fredoka-Bold) are still loading while this is on
 * screen, so this component loads its own tiny two-font subset (the only
 * ones it needs) independently — it does not wait on the full app font
 * batch in app/_layout.tsx, and falls back to the system font for the
 * brief window before even that finishes.
 */
export function AnimatedSplashScreen({
  progress,
  counts,
}: AnimatedSplashScreenProps) {
  const [splashFontsLoaded] = useFonts({
    "Fredoka-SemiBold": Fredoka_600SemiBold,
    "VT323-Regular": VT323_400Regular,
  });

  const bounce = useSharedValue(0);
  const caret = useSharedValue(1);
  const stripes = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300 }),
        withTiming(0, { duration: 1300 }),
      ),
      -1,
      false,
    );
    caret.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 1 }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      false,
    );
    stripes.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.linear }),
      -1,
      false,
    );
  }, [bounce, caret, stripes]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bounce.value * 14 },
      { rotate: `${42 + bounce.value * 6}deg` },
    ],
  }));
  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }));
  const stripesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -stripes.value * STRIPE_PERIOD }],
  }));

  const clampedProgress = Math.max(0.08, Math.min(1, progress));
  const wordmarkFont = splashFontsLoaded ? "Fredoka-SemiBold" : undefined;
  const pixelFont = splashFontsLoaded ? "VT323-Regular" : undefined;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[BrandColors.accentCyan, "#BEEBB8", BrandColors.primaryLight]}
        locations={[0, 0.46, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.stage}>
        <Animated.View style={[styles.pin, pinStyle]}>
          <LinearGradient
            colors={["#FF8FCB", BrandColors.accentPink, "#E93A8E"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pinFill}
          />
          <View style={styles.pinGloss} />
          <View style={styles.pinHole} />
        </Animated.View>
        <Text
          style={[
            styles.wordmark,
            wordmarkFont ? { fontFamily: wordmarkFont } : styles.wordmarkFallback,
          ]}
        >
          addy
        </Text>
        <Text style={[styles.tagline, pixelFont ? { fontFamily: pixelFont } : null]}>
          your places, saved
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${clampedProgress * 100}%` }]}>
            <Animated.View style={[styles.stripesWrap, stripesStyle]}>
              <LinearGradient
                colors={STRIPE_COLORS}
                locations={STRIPE_LOCATIONS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stripesGradient}
              />
            </Animated.View>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, pixelFont ? { fontFamily: pixelFont } : null]}>
            loading your map
            <Animated.Text style={caretStyle}>_</Animated.Text>
          </Text>
          <Text style={[styles.metaText, pixelFont ? { fontFamily: pixelFont } : null]}>
            {counts ? `${counts.places} places · ${counts.memories} memories` : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Hard-edged diagonal stripes: pairs of stops placed almost on top of each
// other fake a sharp color change instead of a smooth blend.
const STRIPE_PERIOD = 56;
const STRIPE_REPEATS = 6;
const STRIPE_COLORS = Array.from({ length: STRIPE_REPEATS * 2 }, (_, i) =>
  i % 2 === 0 ? BrandColors.accentYellow : BrandColors.primary,
) as [string, string, ...string[]];
const STRIPE_LOCATIONS = Array.from({ length: STRIPE_REPEATS * 2 }, (_, i) => {
  const step = 1 / STRIPE_REPEATS;
  const pairIndex = Math.floor(i / 2);
  return i % 2 === 0 ? pairIndex * step : (pairIndex + 1) * step - 0.001;
}) as [number, number, ...number[]];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
    paddingHorizontal: 40,
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderTopLeftRadius: PIN_SIZE / 2,
    borderTopRightRadius: PIN_SIZE / 2,
    borderBottomLeftRadius: PIN_SIZE / 2,
    borderBottomRightRadius: 5,
    borderWidth: 10,
    borderColor: BrandColors.ink,
    overflow: "hidden",
  },
  pinFill: {
    ...StyleSheet.absoluteFillObject,
  },
  pinGloss: {
    position: "absolute",
    top: 5,
    left: 40,
    width: 39,
    height: 19,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    transform: [{ rotate: "-11deg" }],
  },
  pinHole: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 9,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
  },
  wordmark: {
    fontSize: 68,
    lineHeight: 68,
    color: BrandColors.ink,
    textShadowColor: BrandColors.paper,
    textShadowOffset: { width: 5, height: 5 },
    textShadowRadius: 0,
  },
  wordmarkFallback: {
    fontWeight: "700",
  },
  tagline: {
    fontSize: 22,
    letterSpacing: 2,
    color: BrandColors.ink,
  },
  footer: {
    paddingHorizontal: 36,
    paddingBottom: 54,
    gap: 14,
  },
  bar: {
    height: 34,
    borderWidth: 6,
    borderColor: BrandColors.ink,
    borderRadius: 999,
    backgroundColor: BrandColors.paper,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    overflow: "hidden",
  },
  stripesWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "200%",
  },
  stripesGradient: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 18,
    color: BrandColors.ink,
  },
});
