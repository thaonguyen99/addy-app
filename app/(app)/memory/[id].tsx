import { useLocalSearchParams } from "expo-router";

import {
  MemoryDetailScreen,
  type MemoryReveal,
} from "@/features/memory/memory-detail-screen";

export default function MemoryDetailRoute() {
  const { id, reveal } = useLocalSearchParams<{
    id: string;
    reveal?: string;
  }>();
  return (
    <MemoryDetailScreen
      id={id ?? ""}
      reveal={reveal === "on-this-day" ? (reveal as MemoryReveal) : undefined}
    />
  );
}
