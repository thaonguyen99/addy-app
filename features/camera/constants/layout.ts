import { BrandColors } from "@/constants/theme";
import { cameraLayout } from "@/features/camera/styles/shared-styles";

/** Horizontal inset for the camera column and action bar. */
export const CAMERA_SCREEN_HORIZONTAL_PADDING =
  cameraLayout.screenPaddingHorizontal;

/** Step for programmatic zoom (`CameraView` zoom is 0–1). */
export const CAMERA_ZOOM_STEP = 0.08;

/** Minimum touch area for action bar controls (accessibility). */
export const ACTION_BAR_MIN_TOUCH = 48;

/** Visual size of the stacked preview thumbnails. */
export const CAPTURE_STACK_THUMB_SIZE = 40;

/** How far each stacked thumb is offset (creates the deck effect). */
export const CAPTURE_STACK_OFFSET = 6;

/** Max thumbnails visible in the stack preview. */
export const CAPTURE_STACK_VISIBLE_COUNT = 3;

/** Primary capture ring dimensions (snap button). */
export const SNAP_OUTER_DIAMETER = 76;
export const SNAP_INNER_DIAMETER = 62;

export const CameraUi = {
  screenBg: BrandColors.gray900,
  actionBarBg: BrandColors.black,
  captureRing: BrandColors.white,
  captureInner: BrandColors.white,
} as const;
