import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";

import { EditMemoryScreen } from "@/features/edit-memory/components/edit-memory-screen";

export default function EditMemoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // A native modal sits above the root sheet host — give its sheets their own.
  return (
    <BottomSheetModalProvider>
      <EditMemoryScreen id={id} />
    </BottomSheetModalProvider>
  );
}
