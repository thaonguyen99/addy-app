import { useLocalSearchParams } from "expo-router";

import { EditMemoryScreen } from "@/features/edit-memory/components/edit-memory-screen";

export default function EditMemoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditMemoryScreen id={id} />;
}
