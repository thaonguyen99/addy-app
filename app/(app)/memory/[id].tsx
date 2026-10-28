import { useLocalSearchParams } from "expo-router";

import {
  MemoryDetailScreen,
  type MemoryReveal,
} from "@/features/memory/memory-detail-screen";

export default function MemoryDetailRoute() {
  const { id, reveal, messageId } = useLocalSearchParams<{
    id: string;
    reveal?: string;
    /** From a notification: scroll to this message. */
    messageId?: string;
  }>();
  return (
    <MemoryDetailScreen
      id={id ?? ""}
      reveal={reveal === "on-this-day" ? (reveal as MemoryReveal) : undefined}
      messageId={typeof messageId === "string" ? messageId : undefined}
    />
  );
}
