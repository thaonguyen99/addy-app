import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddyColors, AddyFonts } from "@/constants/theme";
import { PersonRow } from "@/features/friends/components/person-row";
import { openProfile } from "@/features/profile/open-profile";
import type { PublicUser } from "@/services/users";

export type TaggedPeopleSheetRef = { present: () => void };

/** The "with" sheet: everyone tagged on a memory; tap one for their profile. */
export const TaggedPeopleSheet = forwardRef<
  TaggedPeopleSheetRef,
  { users: readonly PublicUser[] }
>(function TaggedPeopleSheet({ users }, ref) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
  }));

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

  const open = (user: PublicUser) => {
    sheetRef.current?.dismiss();
    openProfile(user.username);
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%", "85%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>With</Text>
        <Text style={styles.count}>{users.length}</Text>
      </View>
      <BottomSheetFlatList
        data={users}
        keyExtractor={(user: PublicUser) => user.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 16 },
        ]}
        renderItem={({ item }: { item: PublicUser }) => (
          <PersonRow
            user={item}
            subtitle={`@${item.username}`}
            onPress={() => open(item)}
            accessibilityHint="Opens their profile"
          />
        )}
      />
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 28,
    color: AddyColors.ink,
  },
  count: { fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.inkMuted },
  list: { paddingHorizontal: 16 },
});
