import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AddyColors, AddyFonts } from "@/constants/theme";

/** Section title with an optional tech note, count, or close button. */
export function SectionHeader({
  title,
  note,
  count,
  onClose,
  closeLabel,
}: {
  title: string;
  note?: string;
  count?: number;
  onClose?: () => void;
  closeLabel?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {note ? (
        <Text style={styles.note} numberOfLines={1}>
          {note}
        </Text>
      ) : null}
      {count !== undefined ? <Text style={styles.count}>{count}</Text> : null}
      {onClose ? (
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={closeLabel ?? `Hide ${title}`}
          style={styles.close}
        >
          <Ionicons name="close" size={16} color={AddyColors.inkMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 19,
    lineHeight: 26,
    color: AddyColors.ink,
  },
  note: {
    flexShrink: 1,
    fontFamily: AddyFonts.tech,
    fontSize: 17,
    color: AddyColors.inkMuted,
  },
  close: {
    alignSelf: "center",
    marginLeft: "auto",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    marginLeft: "auto",
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    color: AddyColors.inkMuted,
  },
});
