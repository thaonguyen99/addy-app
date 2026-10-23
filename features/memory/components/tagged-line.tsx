import { StyleSheet, Text, View } from "react-native";

import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import type { PublicUser } from "@/types/api";

/** Past this many names the rest collapse into "N others". */
const MAX_NAMES = 3;

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length > MAX_NAMES) {
    const rest = names.length - (MAX_NAMES - 1);
    return `${names.slice(0, MAX_NAMES - 1).join(", ")} and ${rest} others`;
  }
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * "✦ taetae99 tagged hanni and sekre_van", written for whoever is reading:
 * the owner sees "you tagged …", a tagged friend sees "… tagged you and …".
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
}: {
  author: PublicUser;
  tagged: readonly PublicUser[];
  viewerId: string | undefined;
}) {
  if (tagged.length === 0) return null;
  return (
    <View style={styles.pill}>
      <Text style={styles.text} numberOfLines={2}>
        ✦ {taggedSentence(author, tagged, viewerId)}
      </Text>
    </View>
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
  text: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
    color: AddyColors.inkMuted,
  },
});
