import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserRow } from "@/components/ui/user-row";
import { BrandColors } from "@/constants/theme";
import { openProfile } from "@/features/profile/open-profile";
import type { Reactor } from "@/services/memories";
import { useReactorsQuery } from "@/services/memories";
import { PublicUser } from "@/services/users";

export type ReactorsSheetRef = {
  present: () => void;
  dismiss: () => void;
};

interface ReactionUserProps {
  user?: PublicUser;
  onClose?: () => void;
}

const ReactionUser = ({ user, onClose }: ReactionUserProps) => {
  const press = (username?: string) => {
    if (!username) {
      return null;
    }
    openProfile(username);
    onClose?.();
  };

  if (!user) {
    return null;
  }

  return (
    <Pressable onPress={() => press(user.username)}>
      <UserRow user={user} />
    </Pressable>
  );
};

export const ReactorsSheet = forwardRef<ReactorsSheetRef, { memoryId: string }>(
  function ReactorsSheet({ memoryId }, ref) {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [active, setActive] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const query = useReactorsQuery(active ? memoryId : undefined);
    const reactors: Reactor[] =
      query.data?.pages.flatMap((page) => page.items) ?? [];

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["50%", "85%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        onChange={(index) => setActive(index >= 0)}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Reactions</Text>
        </View>
        {query.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BrandColors.primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={reactors}
            keyExtractor={(item) => item.user.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ReactionUser
                onClose={() => sheetRef.current?.dismiss()}
                user={item.user}
              />
            )}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) {
                void query.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <Text style={styles.empty}>No reactions yet.</Text>
            }
          />
        )}
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  background: { backgroundColor: BrandColors.paper },
  handleIndicator: { backgroundColor: BrandColors.neutralBorder, width: 40 },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
  },
  title: { color: BrandColors.neutral, fontSize: 18, fontWeight: "700" },
  center: { padding: 40, alignItems: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: {
    textAlign: "center",
    color: BrandColors.neutralMuted,
    paddingVertical: 32,
  },
});
