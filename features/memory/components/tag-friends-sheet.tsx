import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
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

import { GlossyButton } from "@/components/ui/glossy-button";
import { UserRow } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  BrandColors,
} from "@/constants/theme";
import { matchesUserQuery } from "@/features/memory/components/mention-suggestions";
import { useFriendsQuery } from "@/lib/query/hooks-social";
import type { PublicUser } from "@/types/api";

/** Mirrors the server's MEMORY_TAGS_MAX. */
export const MEMORY_TAGS_MAX = 20;

export type TagFriendsSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type TagFriendsSheetProps = {
  selected: readonly PublicUser[];
  onDone: (users: PublicUser[]) => void;
};

/** Multi-select friend picker for tagging people on a memory. */
export const TagFriendsSheet = forwardRef<
  TagFriendsSheetRef,
  TagFriendsSheetProps
>(function TagFriendsSheet({ selected, onDone }, ref) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<PublicUser[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        setPicked([...selected]);
        setQuery("");
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [selected],
  );

  const friendsQuery = useFriendsQuery(active);
  const friends = useMemo(
    () => friendsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [friendsQuery.data],
  );

  // Already-tagged people who are no longer friends stay listed so they can be removed.
  const rows = useMemo(() => {
    const friendIds = new Set(friends.map((friend) => friend.user.id));
    const users = [
      ...selected.filter((user) => !friendIds.has(user.id)),
      ...friends.map((friend) => friend.user),
    ];
    return users.filter((user) => matchesUserQuery(user, query.trim()));
  }, [friends, selected, query]);

  const pickedIds = useMemo(
    () => new Set(picked.map((user) => user.id)),
    [picked],
  );
  const atLimit = picked.length >= MEMORY_TAGS_MAX;

  const toggle = (user: PublicUser) => {
    setPicked((current) =>
      current.some((u) => u.id === user.id)
        ? current.filter((u) => u.id !== user.id)
        : current.length >= MEMORY_TAGS_MAX
          ? current
          : [...current, user],
    );
  };

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
      snapPoints={["85%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      keyboardBlurBehavior="restore"
      onChange={(index) => setActive(index >= 0)}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Tag friends</Text>
        <Text style={styles.count}>
          {picked.length}/{MEMORY_TAGS_MAX}
        </Text>
      </View>
      <BottomSheetTextInput
        value={query}
        onChangeText={setQuery}
        placeholder="search friends…"
        placeholderTextColor={AddyColors.inkMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
        accessibilityLabel="Search friends"
      />
      {friendsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} />
        </View>
      ) : (
        <BottomSheetFlatList
          data={rows}
          keyExtractor={(user) => user.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const checked = pickedIds.has(item.id);
            return (
              <Pressable
                onPress={() => toggle(item)}
                disabled={!checked && atLimit}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={({ pressed }) => (pressed ? styles.pressed : undefined)}
              >
                <UserRow
                  user={item}
                  right={
                    <View style={[styles.check, checked && styles.checkOn]}>
                      {checked ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                  }
                />
              </Pressable>
            );
          }}
          onEndReached={() => {
            if (friendsQuery.hasNextPage && !friendsQuery.isFetchingNextPage) {
              void friendsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query ? "No friends match." : "Add friends to tag them here."}
            </Text>
          }
        />
      )}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <GlossyButton
          label="Done"
          onPress={() => {
            onDone(picked);
            sheetRef.current?.dismiss();
          }}
        />
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: { backgroundColor: BrandColors.paper },
  handleIndicator: { backgroundColor: BrandColors.neutralBorder, width: 40 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  title: { color: BrandColors.neutral, fontSize: 18, fontWeight: "700" },
  count: { fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.inkMuted },
  search: {
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
    fontFamily: AddyFonts.body,
    fontSize: 15,
    color: AddyColors.ink,
  },
  center: { padding: 40, alignItems: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  empty: {
    textAlign: "center",
    color: BrandColors.neutralMuted,
    paddingVertical: 32,
  },
  pressed: { opacity: 0.75 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: AddyColors.lime, borderColor: AddyColors.limeDeep },
  checkMark: { fontSize: 14, fontWeight: "700", color: AddyColors.ink },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.stroke2,
  },
});
