import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Ellipse } from "react-native-svg";

import { AddyColors, AddyFonts, AddyGradients } from "@/constants/theme";
import { MiniPinMap } from "@/features/invite/components/mini-pin-map";

/** Rendered size in points; captured at 1080×1920. */
export const STORY_WIDTH = 270;
export const STORY_HEIGHT = 480;

type InviteStoryCardProps = {
  username: string;
  placesCount: number;
  pinColors: readonly string[];
  link: string;
};

/**
 * The 9:16 invite image for Instagram/TikTok stories. Deliberately shows no
 * memory photos or place names — only pin colors and counts — so it's safe
 * to post even when every memory is private.
 */
export const InviteStoryCard = forwardRef<View, InviteStoryCardProps>(
  function InviteStoryCard({ username, placesCount, pinColors, link }, ref) {
    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <LinearGradient
          colors={AddyGradients.sky.colors}
          locations={AddyGradients.sky.locations}
          style={StyleSheet.absoluteFill}
        />
        <Svg style={styles.clouds} viewBox="0 0 270 120">
          <Ellipse cx="50" cy="40" rx="56" ry="15" fill="#FFFFFF" opacity={0.75} />
          <Ellipse cx="78" cy="30" rx="30" ry="13" fill="#FFFFFF" opacity={0.65} />
          <Ellipse cx="215" cy="78" rx="62" ry="14" fill="#FFFFFF" opacity={0.6} />
        </Svg>

        <View style={styles.content}>
          <Text style={styles.kicker}>✦ addy</Text>
          <Text style={styles.title}>come pin memories with me</Text>
          <View style={styles.mapFrame}>
            <MiniPinMap
              colors={pinColors}
              seed={username}
              width={STORY_WIDTH - 40}
              height={180}
            />
          </View>
          <Text style={styles.stats}>
            @{username} · {placesCount} {placesCount === 1 ? "place" : "places"}
          </Text>
          <View style={styles.linkPill}>
            <Text style={styles.link} numberOfLines={1}>
              {link.replace(/^https?:\/\//, "")}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    overflow: "hidden",
    backgroundColor: AddyColors.paper,
  },
  clouds: { position: "absolute", top: 0, left: 0, width: STORY_WIDTH, height: 120 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 96,
    alignItems: "center",
    gap: 14,
  },
  kicker: { fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.inkMuted },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 26,
    lineHeight: 34,
    color: AddyColors.ink,
    textAlign: "center",
  },
  mapFrame: {
    borderRadius: 16,
    borderWidth: 4,
    borderColor: AddyColors.white,
    overflow: "hidden",
  },
  stats: { fontFamily: AddyFonts.tech, fontSize: 20, color: AddyColors.ink },
  linkPill: {
    maxWidth: "100%",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AddyColors.lime,
    borderWidth: 1.5,
    borderColor: AddyColors.limeDeep,
  },
  link: { fontFamily: AddyFonts.bodySemiBold, fontSize: 12, color: AddyColors.ink },
});
