/**
 * App color tokens. The product is dark-only: light and dark palettes match
 * so ThemedText / useThemeColor cannot fall back to a white screen.
 */

import { Platform } from "react-native";

export const BrandColors = {
  white: "#FFFFFF",
  black: "#000000",

  // Warm plum-cocoa dark scale (derived from secondary #2b1c21), for backgrounds/surfaces/borders
  gray50: "#F4ECE9", // near-white, faint mauve warmth — light text on dark, or rare light surfaces
  gray100: "#E9DDD3", // = Sand Veil — primary light text/icon color
  gray200: "#C6B2AE", // secondary text, subtle icons
  gray300: "#9E8288", // disabled text, low-emphasis icons
  gray400: "#6F565E", // disabled controls, placeholder icons
  gray500: "#4C3841", // mid-tone borders, dividers on elevated surfaces
  gray600: "#3A2831", // elevated surface (cards, sheets, modals)
  gray700: "#2B1C21", // = secondary — dark surfaces
  gray800: "#241820", // deeper nested surfaces
  gray900: "#1C1218", // deepest app background

  elevated: "#3A2831", // card/sheet surface, one step up from background
  placeHolder: "#33222A", // input field background (between bg and elevated)

  link: "#A9AAD8", // light periwinkle — legible link on warm dark bg

  stroke1: "rgba(233, 221, 211, 0.08)", // subtle divider
  stroke2: "rgba(233, 221, 211, 0.16)", // default border
  stroke3: "rgba(233, 221, 211, 0.32)", // emphasized border / focus ring base

  /** Primary actions, selected states, key CTAs. */
  primary: "#6667AB",
  /** Dark surfaces and app backgrounds. */
  secondary: "#2b1c21",
  /** Text, icons, and light-on-dark contrast. */
  neutral: "#E9DDD3",
  /** Selected fills on dark surfaces. */
  primaryMuted: "rgba(102, 103, 171, 0.22)",
  /** Captions and placeholders — warm sand, readable on secondary. */
  neutralMuted: "#C6B2AE",
  /** Visible edge on plum-cocoa surfaces. */
  neutralBorder: "#6F565E",

  /** Ink for text on light paper / polaroid surfaces. */
  ink: "#2B1C21",
  /** Secondary ink on light surfaces (place name, date). */
  inkMuted: "#6A525A",
  /** Light paper surface for polaroid frames. */
  paper: "#F1E7DC",
};

export type BrandColorName = keyof typeof BrandColors;

const darkPalette = {
  background: BrandColors.gray900,
  text: BrandColors.neutral,
  primary: BrandColors.primary,
  white: BrandColors.white,
  black: BrandColors.black,
  gray50: BrandColors.gray50,
  gray100: BrandColors.gray100,
  gray200: BrandColors.gray200,
  gray300: BrandColors.gray300,
  gray400: BrandColors.gray400,
  gray500: BrandColors.gray500,
  gray600: BrandColors.gray600,
  gray700: BrandColors.gray700,
  gray800: BrandColors.gray800,
  gray900: BrandColors.gray900,
  elevated: BrandColors.elevated,
  placeHolder: BrandColors.placeHolder,
  link: BrandColors.link,
  stroke1: BrandColors.stroke1,
  stroke2: BrandColors.stroke2,
  stroke3: BrandColors.stroke3,
  ink: BrandColors.ink,
  inkMuted: BrandColors.inkMuted,
  paper: BrandColors.paper,
};

export const Colors = {
  light: { ...darkPalette },
  dark: { ...darkPalette },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
