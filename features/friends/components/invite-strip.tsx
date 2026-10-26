import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts } from "@/constants/theme";
import { ORB_COLORS, ShareOrb } from "@/features/friends/components/share-orb";
import { useInviteStory } from "@/hooks/use-invite-story";
import { shareInviteLink, shareInviteViaZalo } from "@/features/invite/share-invite";

/** The slim lime invite once you have at least one friend. */
export function InviteStrip({ link }: { link: string }) {
  const { storyElement, shareStory, busy } = useInviteStory(link);
  const disabled = !link || busy;

  return (
    <>
      <View style={styles.strip}>
        <LinearGradient
          colors={["#F4FFD0", "#E4F9A4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.text}>
          <Text style={styles.title}>Invite friends</Text>
          <Text style={styles.body}>Your link adds them straight away</Text>
        </View>
        <ShareOrb
          glyph="💬"
          color={ORB_COLORS.zalo}
          size={46}
          accessibilityLabel="Share invite on Zalo"
          disabled={disabled}
          onPress={() => shareInviteViaZalo(link)}
        />
        <ShareOrb
          glyph="📸"
          color={ORB_COLORS.story}
          size={46}
          accessibilityLabel="Share invite as a story"
          disabled={disabled}
          onPress={() => void shareStory()}
        />
        <ShareOrb
          glyph="⋯"
          color={ORB_COLORS.more}
          size={46}
          accessibilityLabel="More ways to share your invite"
          disabled={disabled}
          onPress={() => shareInviteLink(link)}
        />
      </View>
      {/* Outside the strip: its overflow clip would cut the capture. */}
      {storyElement}
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.limeDeep,
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: AddyFonts.title, fontSize: 17, lineHeight: 22, color: AddyColors.ink },
  body: { fontFamily: AddyFonts.body, fontSize: 14, lineHeight: 19, color: AddyColors.inkMuted },
});
