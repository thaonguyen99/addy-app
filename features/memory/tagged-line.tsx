import { Pressable, StyleSheet, Text } from "react-native";

import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import type { PublicUser } from "@/services/users";

const PINK_TINT = "#FFE6F2";
const PINK_EDGE = "#FFB3D7";
const PINK_INK = "#B8236F";

/** Names shown before the rest collapse into "+N". */
const MAX_NAMES = 2;

function joinNames(names: string[]): string {
  if (names.length > MAX_NAMES) {
    const rest = names.length - MAX_NAMES;
    return `${names.slice(0, MAX_NAMES).join(", ")} +${rest}`;
  }
  return names.join(" and ");
}

/**
 * "✦ taetae99 tagged hanni and sekre_van", written for whoever is reading:
 * the owner sees "you tagged …", a tagged friend sees "… tagged you and …"
 * ("you" always first). Past two names: "tagged you, sekre_van +2".
 */
export function taggedSentence(
  author: PublicUser,
  tagged: readonly PublicUser[],
  viewerId: string | undefined,
): string {
  const tagger = author.id === viewerId ? "you" : author.username;
  const others = tagged.filter((user) => user.id !== viewerId).map((user) => user.username);
  const names = others.length < tagged.length ? ["you", ...others] : others;
  return `${tagger} tagged ${joinNames(names)}`;
}

export function TaggedLine({
  author,
  tagged,
  viewerId,
  onPress,
}: {
  author: PublicUser;
  tagged: readonly PublicUser[];
  viewerId: string | undefined;
  /** Opens the "with" sheet. */
  onPress?: () => void;
}) {
  if (tagged.length === 0) return null;
  const sentence = taggedSentence(author, tagged, viewerId);
  // Pink when it's about you, so a tagged friend spots themself.
  const mine = tagged.some((user) => user.id === viewerId);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={sentence}
      accessibilityHint={onPress ? "Shows who's tagged" : undefined}
      style={({ pressed }) => [
        styles.pill,
        mine && styles.pillMine,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, mine && styles.textMine]} numberOfLines={2}>
        ✦ {sentence}
        {onPress ? " ›" : ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "center",
    maxWidth: "88%",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: AddyRadius.chip,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  pillMine: { backgroundColor: PINK_TINT, borderColor: PINK_EDGE },
  pressed: { opacity: 0.7 },
  text: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
    color: AddyColors.inkMuted,
  },
  textMine: { color: PINK_INK },
});
