import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";

import { MemoryZoomScreen } from "@/features/lane/memory-zoom-screen";
import type { CardRect } from "@/features/lane/zoom-transition";

/** The memory chat opened from a Memory Lane card, zooming out of it. */
export default function MemoryZoomRoute() {
  const { id, x, y, w, h } = useLocalSearchParams<{
    id: string;
    /** The tapped card's rect in window coordinates. */
    x?: string;
    y?: string;
    w?: string;
    h?: string;
  }>();
  const rect = [x, y, w, h].map(Number);
  const from: CardRect | null = rect.every(Number.isFinite)
    ? { x: rect[0], y: rect[1], width: rect[2], height: rect[3] }
    : null;
  // A native modal sits above the root sheet host — give its sheets their own.
  return (
    <BottomSheetModalProvider>
      <MemoryZoomScreen id={id ?? ""} from={from} />
    </BottomSheetModalProvider>
  );
}
