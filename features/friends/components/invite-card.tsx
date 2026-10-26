import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { ORB_COLORS, ShareOrb } from "@/features/friends/components/share-orb";
import { useInviteStory } from "@/hooks/use-invite-story";
import {
  copyInviteLink,
  shareInviteLink,
  shareInviteViaMessenger,
  shareInviteViaSms,
  shareInviteViaZalo,
} from "@/features/invite/share-invite";
import type { PublicUser } from "@/services/users";

/** The big invite card for an empty friends list: you in the middle, two open slots. */
export function InviteCard({
  me,
  link,
  onShowQr,
}: {
  me: PublicUser | undefined;
  link: string;
  onShowQr: () => void;
}) {
  const { storyElement, shareStory, busy } = useInviteStory(link);
  const disabled = !link || busy;

  return (
    <View style={[styles.card, AddyShadow.soft]}>
      <View style={styles.avatars}>
        <EmptySlot />
        <View style={styles.meRing}>
          {me ? <UserAvatar user={me} size={92} /> : <View style={styles.mePlaceholder} />}
        </View>
        <EmptySlot />
      </View>

      <Text style={styles.title}>Your map is better with friends on it</Text>
      <Text style={styles.body}>
        Anyone who opens your link becomes your friend. They&apos;ll see the
        memories you share with friends.
      </Text>

      <View style={styles.orbs}>
        <ShareOrb
          glyph="💬"
          color={ORB_COLORS.zalo}
          label="Zalo"
          size={50}
          accessibilityLabel="Share invite on Zalo"
          disabled={disabled}
          onPress={() => shareInviteViaZalo(link)}
        />
        <ShareOrb
          glyph="✉️"
          color={ORB_COLORS.messenger}
          label="Messenger"
          size={50}
          accessibilityLabel="Share invite on Messenger"
          disabled={disabled}
          onPress={() => shareInviteViaMessenger(link)}
        />
        <ShareOrb
          glyph="📱"
          color={ORB_COLORS.sms}
          label="SMS"
          size={50}
          accessibilityLabel="Share invite by text message"
          disabled={disabled}
          onPress={() => shareInviteViaSms(link)}
        />
        <ShareOrb
          glyph="📸"
          color={ORB_COLORS.story}
          label="IG story"
          size={50}
          accessibilityLabel="Share invite as a story"
          disabled={disabled}
          onPress={() => void shareStory()}
        />
        <ShareOrb
          glyph="⋯"
          color={ORB_COLORS.more}
          label="More"
          size={50}
          accessibilityLabel="More ways to share your invite"
          disabled={disabled}
          onPress={() => shareInviteLink(link)}
        />
      </View>

      <View style={styles.linkRow}>
        <Text style={styles.link} numberOfLines={1}>
          {link.replace(/^https?:\/\//, "") || "loading your link…"}
        </Text>
        <Pressable
          onPress={() => void copyInviteLink(link)}
          disabled={!link}
          accessibilityRole="button"
          accessibilityLabel="Copy invite link"
          style={({ pressed }) => [styles.copy, pressed && styles.pressed]}
        >
          <Text style={styles.copyText}>Copy</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onShowQr}
        accessibilityRole="button"
        style={styles.qrLink}
        hitSlop={6}
      >
        <Text style={styles.qrText}>
          With them right now? <Text style={styles.qrAction}>Show your QR ›</Text>
        </Text>
      </Pressable>

      {storyElement}
    </View>
  );
}

function EmptySlot() {
  return (
    <View style={[styles.slot, styles.emptySlot]}>
      <Text style={styles.plus}>+</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 26,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  avatars: { flexDirection: "row", alignItems: "center", gap: 14 },
  slot: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  emptySlot: {
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#C9C9C9",
  },
  plus: { fontFamily: AddyFonts.title, fontSize: 22, color: AddyColors.inkMuted },
  meRing: {
    padding: 3,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: AddyColors.limeDeep,
  },
  mePlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: AddyColors.paperDim,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
    color: AddyColors.ink,
  },
  body: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: AddyColors.inkMuted,
  },
  orbs: { flexDirection: "row", alignSelf: "stretch", justifyContent: "space-around" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 10,
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: AddyRadius.input,
    backgroundColor: AddyColors.paperDim,
  },
  link: { flex: 1, fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.ink },
  copy: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: AddyRadius.input,
    backgroundColor: AddyColors.lime,
  },
  copyText: { fontFamily: AddyFonts.title, fontSize: 15, color: AddyColors.ink },
  qrLink: { minHeight: 44, justifyContent: "center" },
  qrText: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    color: AddyColors.inkMuted,
    textAlign: "center",
  },
  qrAction: { fontFamily: AddyFonts.bodySemiBold, color: "#2A9AD6" },
  pressed: { opacity: 0.75 },
});
