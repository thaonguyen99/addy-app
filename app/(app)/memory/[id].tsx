import { useLocalSearchParams } from "expo-router";

import { MemoryDetailScreen } from "@/features/memory/components/memory-detail-screen";

export default function MemoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MemoryDetailScreen id={id ?? ""} />;
}
