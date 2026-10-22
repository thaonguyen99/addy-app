import { AddyColors, BrandColors } from "@/constants/theme";

/** Step for programmatic zoom (`CameraView` zoom is 0–1). */
export const CAMERA_ZOOM_STEP = 0.08;

export const CameraUi = {
  screenBg: AddyColors.captureBg,
  actionBarBg: BrandColors.black,
  captureRing: BrandColors.white,
  captureInner: BrandColors.white,
} as const;
