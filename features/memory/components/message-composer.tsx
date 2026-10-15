import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { MentionSuggestions } from "@/features/memory/components/mention-suggestions";
import { getActiveMention, insertMention } from "@/features/memory/utils/mentions";
import type { PublicUser } from "@/types/api";

export const MESSAGE_MAX_LENGTH = 500;
const COUNTER_THRESHOLD = 400;

type MessageComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending: boolean;
  /** Composer is editing an existing message — shows the banner. */
  editing?: boolean;
  onCancelEdit?: () => void;
  /** Friends who can be tagged with `@`; empty hides the tag button. */
  mentionable?: PublicUser[];
};

type Selection = { start: number; end: number };

/** Docked input + pink send button under the "Psst..." thread. */
export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending,
  editing = false,
  onCancelEdit,
  mentionable = [],
}: MessageComposerProps) {
  const canSend = value.trim().length > 0 && !sending;
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  // Cursor to apply after we rewrite the text; cleared once the input reports it.
  const [forcedSelection, setForcedSelection] = useState<Selection>();

  const cursor = Math.min(selection.end, value.length);
  const activeMention =
    selection.start === selection.end ? getActiveMention(value, cursor) : null;

  const applyText = (text: string, nextCursor: number) => {
    const next = { start: nextCursor, end: nextCursor };
    onChangeText(text);
    setSelection(next);
    setForcedSelection(next);
  };

  const pickMention = (user: PublicUser) => {
    if (!activeMention) return;
    const result = insertMention(value, activeMention, cursor, user.username);
    applyText(result.text, result.cursor);
  };

  const startMention = () => {
    const before = value.slice(0, cursor);
    const prefix = before.length > 0 && !/\s$/.test(before) ? " @" : "@";
    applyText(before + prefix + value.slice(cursor), cursor + prefix.length);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <View style={styles.container}>
      {editing ? (
        <View style={styles.banner}>
          <Ionicons name="pencil" size={14} color={BrandColors.ink} />
          <Text style={styles.bannerText}>Editing message</Text>
          <Text style={styles.bannerText}>·</Text>
          <Pressable
            onPress={onCancelEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
          >
            <Text style={[styles.bannerText, styles.bannerCancel]}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
      {activeMention ? (
        <MentionSuggestions
          friends={mentionable}
          query={activeMention.query}
          onPick={pickMention}
        />
      ) : null}
      <View style={styles.inputRow}>
        {mentionable.length > 0 ? (
          <Pressable
            onPress={startMention}
            style={styles.tag}
            accessibilityRole="button"
            accessibilityLabel="Tag a friend"
          >
            <Text style={styles.tagText}>@</Text>
          </Pressable>
        ) : null}
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            selection={forcedSelection}
            onSelectionChange={(e) => {
              setSelection(e.nativeEvent.selection);
              setForcedSelection(undefined);
            }}
            maxLength={MESSAGE_MAX_LENGTH}
            multiline
            placeholder="psst… say something"
            placeholderTextColor={BrandColors.inkMuted}
            style={styles.input}
            accessibilityLabel="Message"
          />
          {value.length > COUNTER_THRESHOLD ? (
            <Text style={styles.counter}>
              {value.length}/{MESSAGE_MAX_LENGTH}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={[styles.send, !canSend && styles.sendDisabled]}
          accessibilityRole="button"
          accessibilityLabel={editing ? "Save message" : "Send message"}
          accessibilityState={{ disabled: !canSend }}
        >
          <Ionicons
            name={editing ? "checkmark" : "arrow-up"}
            size={20}
            color={BrandColors.ink}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StickerBorderWidth.thin,
    borderTopColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  bannerText: {
    fontFamily: "Baloo2-SemiBold",
    fontSize: 13,
    color: BrandColors.ink,
  },
  bannerCancel: {
    color: BrandColors.accentPink,
    textDecorationLine: "underline",
  },
  inputWrap: {
    flex: 1,
    borderWidth: StickerBorderWidth.thin,
    borderColor: BrandColors.ink,
    borderRadius: StickerRadius.button,
    backgroundColor: BrandColors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    minHeight: 28,
    maxHeight: 110,
    fontFamily: "BeVietnam-Regular",
    fontSize: 15,
    color: BrandColors.ink,
    paddingVertical: 4,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    fontFamily: "VT323-Regular",
    fontSize: 13,
    color: BrandColors.inkMuted,
  },
  tag: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    fontFamily: "Baloo2-SemiBold",
    fontSize: 24,
    color: BrandColors.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StickerBorderWidth.thin,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.accentPink,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.4 },
});
