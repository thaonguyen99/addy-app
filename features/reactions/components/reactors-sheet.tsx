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
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { UserRow } from "@/components/ui/user-row";
import { useReactorsQuery } from "@/lib/query/hooks";
import type { Reactor } from "@/types/api";

export type ReactorsSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const ReactorsSheet = forwardRef<
  ReactorsSheetRef,
  { memoryId: string }
>(function ReactorsSheet({ memoryId }, ref) {
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
          renderItem={({ item }) => <UserRow user={item.user} />}
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
});

const styles = StyleSheet.create({
  background: { backgroundColor: BrandColors.gray900 },
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
