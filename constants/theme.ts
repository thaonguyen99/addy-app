/**
 * App color tokens. The product is dark-only: light and dark palettes match
 * so ThemedText / useThemeColor cannot fall back to a white screen.
 */

import { Platform } from "react-native";

export const BrandColors = {
  white: "#FFFFFF",
  black: "#000000",

  // Green-tinted dark scale (derived from Garden Shadow), for backgrounds/surfaces/borders
  gray50: "#F3F6F1", // near-white, green tint — light text on dark, or rare light surfaces
  gray100: "#E0E7DC", // = sagePaper — primary light text/icon color
  gray200: "#C3D2C7", // secondary text, subtle icons
  gray300: "#8AA695", // disabled text, low-emphasis icons
  gray400: "#5A7A6A", // disabled controls, placeholder icons
  gray500: "#3D5F50", // mid-tone borders, dividers on elevated surfaces
  gray600: "#2A473C", // elevated surface (cards, sheets, modals)
  gray700: "#1F352C", // = gardenShadow — base app background
  gray800: "#16241D", // deeper nested surfaces
  gray900: "#0D1512", // base app background

  elevated: "#2A473C", // card/sheet surface, one step up from background
  placeHolder: "#243830", // input field background (between bg and elevated)

  link: "#6EA8FE", // brightened blue for legible links on dark bg

  stroke1: "rgba(224, 231, 220, 0.08)", // subtle divider
  stroke2: "rgba(224, 231, 220, 0.16)", // default border
  stroke3: "rgba(224, 231, 220, 0.32)", // emphasized border / focus ring base

  /** Primary actions, selected states, key CTAs. */
  primary: "#BB2649",
  /** Dark surfaces and app backgrounds. */
  secondary: "#1F352C",
  /** Text, icons, and light-on-dark contrast. */
  neutral: "#E0E7DC",
  /** Selected fills on dark surfaces. */
  primaryMuted: "rgba(187, 38, 73, 0.22)",
  /** Captions and placeholders — solid sage, readable on secondary. */
  neutralMuted: "#C3D2C7",
  /** Visible edge on garden-shadow surfaces. */
  neutralBorder: "#5A7A6A",
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
