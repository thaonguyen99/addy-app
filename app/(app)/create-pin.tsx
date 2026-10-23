import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { CreatePinScreen } from "@/features/create-pin/components/create-pin-screen";

export default function CreatePinRoute() {
  // A native modal sits above the root sheet host — give its sheets their own.
  return (
    <BottomSheetModalProvider>
      <CreatePinScreen />
    </BottomSheetModalProvider>
  );
}
