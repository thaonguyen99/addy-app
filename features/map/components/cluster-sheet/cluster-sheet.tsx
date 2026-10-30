import { BottomSheetModal, BottomSheetSectionList } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TechChip } from "@/components/ui/tech-chip";
import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import { MemoryGridTile } from "@/features/feed/memory-grid-tile";
import { ChatAvatar } from "@/features/memory/chat-avatar";
import { openProfile } from "@/features/profile/open-profile";
import {
  useClusterMemories,
  type ClusterMemory,
  type ScopedPin,
} from "@/services/memories";
import { useAreaName } from "@/services/places";
import { useAuthStore } from "@/stores/auth.store";

import {
  formatMonthRange,
  formatTileDate,
  groupByPlace,
  groupByTime,
  limitSections,
  type MemorySection,
} from "./group-memories";
import { MemoryPeek } from "./memory-peek";

const COLUMNS = 3;
const GAP = 6;
const SIDE = 16;
const PAGE_SIZE = 30;
/** Fraction of the screen the half detent covers — the map pans by it. */
export const CLUSTER_SHEET_HALF = 0.6;
const SNAP_POINTS = [`${CLUSTER_SHEET_HALF * 100}%`, "100%"];
/** Map strip left visible above the sheet at full height. */
const FULL_MAP_STRIP = 36;
const TAB_KEY_PREFIX = "addy.clusterSheetTab.";
const DISMISS_FALLBACK_MS = 400;
const ME = "me";

type Tab = "place" | "time";
const TAB_OPTIONS = [
  { value: "place", label: "By place" },
  { value: "time", label: "By time" },
] as const;

export type ClusterSheetRequest = {
  /** A tapped cluster, or every memory in the viewport (the top chip). */
  kind: "cluster" | "inView";
  pins: ScopedPin[];
  center: { latitude: number; longitude: number };
};

export type ClusterSheetRef = {
  present: (request: ClusterSheetRequest) => void;
  dismiss: () => void;
};

type ClusterSheetProps = {
  onOpenMemory: (memoryId: string) => void;
  /** `map ›`: zoom the map in on a place. */
  onFocusPlace: (latitude: number, longitude: number) => void;
  /** Peek's "Show on map": centre the map on that pin. */
  onShowOnMap: (latitude: number, longitude: number) => void;
  /** The By place group nearest the top of the list (null when none). */
  onActivePlaceChange: (placeId: string | null) => void;
};

type Section = MemorySection & { data: ClusterMemory[][] };

function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function personKey(memory: ClusterMemory): string {
  return memory.isOwner ? ME : (memory.author?.id ?? "unknown");
}

/**
 * What tapping a cluster (or the "N memories" chip) opens: every memory in
 * it, grouped by place or by time, over a map that stays visible above.
 */
export const ClusterSheet = forwardRef<ClusterSheetRef, ClusterSheetProps>(
  function ClusterSheet(
    { onOpenMemory, onFocusPlace, onShowOnMap, onActivePlaceChange },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const sheetRef = useRef<BottomSheetModal>(null);
    const userId = useAuthStore((s) => s.user?.id);

    const [request, setRequest] = useState<ClusterSheetRequest | null>(null);
    const [tab, setTab] = useState<Tab>("place");
    const [person, setPerson] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [peek, setPeek] = useState<ClusterMemory | null>(null);

    const pins = useMemo(() => request?.pins ?? [], [request]);
    const { memories, isLoading } = useClusterMemories(pins);
    const tile = Math.floor((width - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

    // ── Remembered tab, per user ─────────────────────────────────────────
    useEffect(() => {
      if (!userId) return;
      let cancelled = false;
      AsyncStorage.getItem(`${TAB_KEY_PREFIX}${userId}`)
        .then((saved) => {
          if (!cancelled && (saved === "place" || saved === "time"))
            setTab(saved);
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }, [userId]);

    const changeTab = useCallback(
      (next: Tab) => {
        setTab(next);
        setVisibleCount(PAGE_SIZE);
        if (userId) {
          AsyncStorage.setItem(`${TAB_KEY_PREFIX}${userId}`, next).catch(
            () => undefined,
          );
        }
      },
      [userId],
    );

    useImperativeHandle(
      ref,
      () => ({
        present: (next) => {
          setRequest(next);
          setPerson(null);
          setVisibleCount(PAGE_SIZE);
          setActiveKey(null);
          sheetRef.current?.present();
        },
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    // ── Header facts: counts come from the pins, the same numbers the map
    // chip and pin badges show; the rest from the loaded memories. ──────
    const placeIds = useMemo(
      () => new Set(pins.map((p) => p.pin.placeId)),
      [pins],
    );
    const total = useMemo(
      () => pins.reduce((sum, p) => sum + Math.max(1, p.pin.memoryCount), 0),
      [pins],
    );
    const singlePlace = placeIds.size === 1;
    const hasFriends = pins.some((p) => p.scope === "friends");
    const effectiveTab: Tab = singlePlace ? "time" : tab;

    const area = useAreaName(
      request?.kind === "cluster" && !singlePlace
        ? request.center.latitude
        : null,
      request?.kind === "cluster" && !singlePlace
        ? request.center.longitude
        : null,
    );

    const title =
      request?.kind === "inView"
        ? "In view"
        : singlePlace
          ? pins[0]?.pin.placeName || memories[0]?.placeName || "This place"
          : `Around ${area ?? "here"}`;

    const people = useMemo(() => {
      if (!hasFriends) return [];
      const byKey = new Map<
        string,
        {
          key: string;
          label: string;
          user: ClusterMemory["author"];
          count: number;
        }
      >();
      for (const memory of memories) {
        const key = personKey(memory);
        const entry = byKey.get(key);
        if (entry) {
          entry.count += 1;
        } else {
          byKey.set(key, {
            key,
            label: key === ME ? "You" : (memory.author?.username ?? "friend"),
            user: memory.author,
            count: 1,
          });
        }
      }
      return [...byKey.values()].sort((a, b) =>
        a.key === ME ? -1 : b.key === ME ? 1 : b.count - a.count,
      );
    }, [hasFriends, memories]);

    const subtitle = useMemo(() => {
      const parts = [plural(total, "memory", "memories")];
      if (hasFriends) {
        const friends = people.filter((p) => p.key !== ME).length;
        if (friends > 0) parts.push(plural(friends, "friend"));
        if (!singlePlace) parts.push(plural(placeIds.size, "place"));
      } else {
        if (!singlePlace) parts.push(plural(placeIds.size, "place"));
        const range = formatMonthRange(memories);
        if (range) parts.push(range);
      }
      return parts.join(" · ");
    }, [total, hasFriends, people, singlePlace, placeIds.size, memories]);

    // ── Sections ─────────────────────────────────────────────────────────
    const filtered = useMemo(
      () =>
        person ? memories.filter((m) => personKey(m) === person) : memories,
      [memories, person],
    );
    const allSections = useMemo(
      () =>
        effectiveTab === "place"
          ? groupByPlace(filtered)
          : groupByTime(filtered),
      [effectiveTab, filtered],
    );
    const sections: Section[] = useMemo(
      () =>
        limitSections(allSections, visibleCount).map((section) => ({
          ...section,
          data: chunk(section.memories, COLUMNS),
        })),
      [allSections, visibleCount],
    );
    const hasMore = filtered.length > visibleCount;

    // ── Pin highlight: the By place group nearest the top ────────────────
    const placeTabRef = useRef(effectiveTab === "place");
    placeTabRef.current = effectiveTab === "place";
    const onActiveRef = useRef(onActivePlaceChange);
    onActiveRef.current = onActivePlaceChange;

    const onViewableItemsChanged = useRef(
      ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const top = viewableItems[0]?.section as Section | undefined;
        const key = placeTabRef.current ? (top?.key ?? null) : null;
        setActiveKey(key);
        onActiveRef.current(key);
      },
    ).current;

    useEffect(() => {
      if (effectiveTab !== "place") {
        setActiveKey(null);
        onActivePlaceChange(null);
      }
    }, [effectiveTab, onActivePlaceChange]);

    // ── Actions ──────────────────────────────────────────────────────────
    // The sheet lives in the root modal portal, above every screen. Leave
    // the map only once it has closed, or a push that interrupts the close
    // animation leaves it covering the next screen. The timer is a fallback
    // in case onDismiss never fires.
    const afterDismissRef = useRef<(() => void) | null>(null);
    const runAfterDismiss = useCallback(() => {
      const action = afterDismissRef.current;
      afterDismissRef.current = null;
      action?.();
    }, []);
    const dismissThen = useCallback(
      (action: () => void) => {
        setPeek(null);
        afterDismissRef.current = action;
        sheetRef.current?.dismiss();
        setTimeout(runAfterDismiss, DISMISS_FALLBACK_MS);
      },
      [runAfterDismiss],
    );

    const openMemory = useCallback(
      (id: string) => dismissThen(() => onOpenMemory(id)),
      [dismissThen, onOpenMemory],
    );

    const openPeek = useCallback(
      (id: string) => {
        const memory = memories.find((m) => m.id === id);
        if (!memory) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPeek(memory);
      },
      [memories],
    );

    const focusPlace = useCallback(
      (section: MemorySection) => {
        if (!section.place) return;
        onFocusPlace(section.place.latitude, section.place.longitude);
        sheetRef.current?.snapToIndex(0);
      },
      [onFocusPlace],
    );

    const onDismiss = useCallback(() => {
      setRequest(null);
      setPeek(null);
      setActiveKey(null);
      onActivePlaceChange(null);
      runAfterDismiss();
    }, [onActivePlaceChange, runAfterDismiss]);

    const renderRow = useCallback(
      ({ item: row }: { item: ClusterMemory[] }) => (
        <View style={styles.row}>
          {row.map((memory) => (
            <MemoryGridTile
              key={memory.id}
              memory={{
                id: memory.id,
                imageUrl: memory.imageUrl,
                moodScore: memory.moodScore,
                placeName: memory.placeName,
                locked: memory.isOwner && memory.visibility === "private",
              }}
              size={tile}
              onPress={openMemory}
              onLongPress={openPeek}
              chipLabel={
                effectiveTab === "place"
                  ? formatTileDate(memory.capturedAt)
                  : memory.placeName
              }
              author={!memory.isOwner ? memory.author : undefined}
              extraPhotoCount={memory.imageCount - 1}
            />
          ))}
        </View>
      ),
      [tile, openMemory, openPeek, effectiveTab],
    );

    const renderSectionHeader = useCallback(
      ({ section }: { section: Section }) => (
        <View style={styles.sectionHeader}>
          {section.place ? (
            <>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.pinGlyph}>📍</Text>
                <View
                  style={[
                    styles.sectionTitleWrap,
                    activeKey === section.key && styles.sectionTitleActive,
                  ]}
                >
                  <Text style={styles.sectionTitle} numberOfLines={1}>
                    {section.title}
                  </Text>
                </View>
                <Text style={styles.sectionCount}>
                  {allSections.find((s) => s.key === section.key)?.memories
                    .length ?? section.memories.length}
                </Text>
              </View>
              <Pressable
                onPress={() => focusPlace(section)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Show ${section.title} on the map`}
              >
                <Text style={styles.mapLink}>map ›</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
        </View>
      ),
      [activeKey, allSections, focusPlace],
    );

    return (
      <>
        <BottomSheetModal
          ref={sheetRef}
          snapPoints={SNAP_POINTS}
          enableDynamicSizing={false}
          enablePanDownToClose
          topInset={insets.top + FULL_MAP_STRIP}
          handleIndicatorStyle={styles.handleIndicator}
          backgroundStyle={styles.background}
          onDismiss={onDismiss}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleText}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              <IconCircleButton
                icon="close"
                size={36}
                accessibilityLabel="Close"
                onPress={() => sheetRef.current?.dismiss()}
              />
            </View>
            {singlePlace ? null : (
              <SegmentedControl
                options={TAB_OPTIONS}
                value={effectiveTab}
                onChange={changeTab}
              />
            )}
          </View>

          {people.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.people}
              style={styles.peopleScroll}
            >
              <Pressable
                onPress={() => {
                  setPerson(null);
                  setVisibleCount(PAGE_SIZE);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: person === null }}
              >
                <TechChip
                  label="All"
                  tone={person === null ? "dark" : "paper"}
                />
              </Pressable>
              {people.map((entry) => (
                <Pressable
                  key={entry.key}
                  onPress={() => {
                    setPerson(entry.key);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  onLongPress={() => {
                    const user = entry.user;
                    if (!user) return;
                    dismissThen(() => openProfile(user.username));
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: person === entry.key }}
                  accessibilityLabel={`${entry.label}, ${plural(entry.count, "memory", "memories")}`}
                  accessibilityHint={
                    entry.user ? "Long press to open their profile" : undefined
                  }
                >
                  <TechChip
                    label={`${entry.label} ${entry.count}`}
                    tone={person === entry.key ? "dark" : "paper"}
                    leading={
                      entry.user ? (
                        <ChatAvatar user={entry.user} size={18} />
                      ) : undefined
                    }
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <BottomSheetSectionList
            sections={sections}
            // SectionList also calls this with `undefined` for header rows
            // when reporting viewable items.
            keyExtractor={(row: ClusterMemory[], index) =>
              row?.[0]?.id ?? `row-${index}`
            }
            renderItem={renderRow}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={VIEWABILITY}
            onEndReached={() => {
              if (hasMore) setVisibleCount((n) => n + PAGE_SIZE);
            }}
            onEndReachedThreshold={0.6}
            contentContainerStyle={{
              paddingHorizontal: SIDE,
              paddingBottom: Math.max(24, insets.bottom + 12),
            }}
            ListFooterComponent={
              isLoading || hasMore ? (
                <ActivityIndicator
                  color={AddyColors.ink}
                  style={styles.loading}
                />
              ) : null
            }
          />
        </BottomSheetModal>
        <MemoryPeek
          memory={peek}
          onClose={() => setPeek(null)}
          onOpen={(memory) => openMemory(memory.id)}
          onShowOnMap={(memory) =>
            dismissThen(() => onShowOnMap(memory.latitude, memory.longitude))
          }
        />
      </>
    );
  },
);

const VIEWABILITY = { itemVisiblePercentThreshold: 30 };

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  header: { paddingHorizontal: SIDE, paddingTop: 4, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  titleText: { flex: 1 },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 24,
    color: AddyColors.ink,
  },
  subtitle: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    color: AddyColors.inkMuted,
  },
  peopleScroll: { flexGrow: 0, marginTop: 10 },
  people: { paddingHorizontal: SIDE, gap: 6, alignItems: "center" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: AddyColors.paper,
  },
  sectionTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinGlyph: { fontSize: 15 },
  sectionTitleWrap: {
    flexShrink: 1,
    paddingHorizontal: 2,
    borderRadius: AddyRadius.tile,
  },
  // Highlighter stroke on the group whose pin is lit on the map.
  sectionTitleActive: { backgroundColor: AddyColors.lime },
  sectionTitle: {
    fontFamily: AddyFonts.bodyBold,
    fontSize: 16,
    color: AddyColors.ink,
  },
  sectionCount: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    color: AddyColors.inkMuted,
  },
  mapLink: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    color: AddyColors.navy,
  },
  row: { flexDirection: "row", gap: GAP, marginBottom: GAP },
  loading: { paddingVertical: 16 },
});
