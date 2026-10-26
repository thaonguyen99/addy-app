import { StyleSheet } from "react-native";

import { BrandColors } from "@/constants/theme";

/** Layout tokens reused across camera feature screens. */
export const cameraLayout = {
  screenPaddingHorizontal: 20,
  cornerRadiusSm: 10,
  cornerRadiusMd: 14,
  cornerRadiusLg: 20,
  hitSlop: 12,
} as const;

/**
 * Cross-screen interaction and chrome. Keeps press feedback and outline colors consistent.
 */
export const sharedInteractionStyles = StyleSheet.create({
  pressedSubtle: { opacity: 0.92 },
  pressedMedium: { opacity: 0.85 },
  pressedStrong: { opacity: 0.7 },
  hairlineTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.neutralBorder,
  },
  hairlineBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.neutralBorder,
  },
  hairlineTopDark: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.neutralBorder,
  },
  hairlineBottomDark: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.neutralBorder,
  },
  primaryCta: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    borderRadius: cameraLayout.cornerRadiusMd,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: BrandColors.neutral,
    letterSpacing: 0.3,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: BrandColors.neutral,
  },
  captionMuted: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    lineHeight: 18,
  },
  flexFill: { flex: 1 },
  centerContent: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});
