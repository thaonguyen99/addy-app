import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar, userDisplayName } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import type { PublicUser } from "@/types/api";

type PersonRowProps = {
  user: PublicUser;
  subtitle?: string;
  right?: ReactNode;
  /** Light-blue card, for people who asked to be your friend. */
  highlighted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityHint?: string;
};

/** A person as a white card: avatar, name, tech subtitle, one action. */
export function PersonRow({
  user,
  subtitle,
  right,
  highlighted = false,
  onPress,
  onLongPress,
  accessibilityHint,
}: PersonRowProps) {
  const name = userDisplayName(user);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={subtitle ? `${name}, ${subtitle}` : name}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.row,
        AddyShadow.soft,
        highlighted && styles.highlighted,
        pressed && styles.pressed,
      ]}
    >
      <UserAvatar user={user} size={44} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  highlighted: { backgroundColor: "#EEF8FF", borderColor: "#A9DDF8" },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: 1 },
  name: {
    fontFamily: AddyFonts.title,
    fontSize: 16,
    lineHeight: 22,
    color: AddyColors.ink,
  },
  subtitle: { fontFamily: AddyFonts.tech, fontSize: 16, color: AddyColors.inkMuted },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});
