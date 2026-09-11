import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { MemoryFeedList } from "@/features/feed/components/memory-feed-list";
import { ScreenHeader } from "@/features/friends/components/screen-header";

export function MemoriesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Your memories" fallback="/(app)/(tabs)/explore" />
      <View style={styles.body}>
        <MemoryFeedList />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  body: { flex: 1 },
});
