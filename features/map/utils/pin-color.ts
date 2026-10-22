import { PIN_COLOR } from "@/constants/theme";

type PinColorSource = {
  id: string;
  /** Future user-chosen color — not a real field yet, overrides the
   *  default the moment it is. */
  pinColor?: string | null;
};

/** Every pin is the brand cyan unless a memory carries its own color. */
export function getPinColor(memory: PinColorSource): string {
  return memory.pinColor || PIN_COLOR;
}
