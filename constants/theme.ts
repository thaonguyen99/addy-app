/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

export const BrandColors = {
  primaryPink: "#F2619C",
  secondaryYellow: "#EDE986",
  softLilac: "#E7BEF8",
  blueberryMilk: "#93ABD9",
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  elevated: "#EEF2F6",
  placeHolder: "#F8FAFC",
  link: "#2970FF",
  stroke1: "#EEF2F6",
  stroke2: "#E3E8EF",
  stroke3: "#CDD5DF",
};

export type BrandColorName = keyof typeof BrandColors;

export const Colors = {
  light: {
    background: "#FFFFFF",
    text: "#111827",
    primaryPink: "#F2619C",
    secondaryYellow: "#EDE986",
    softLilac: "#E7BEF8",
    blueberryMilk: "#93ABD9",
    white: "#FFFFFF",
    black: "#000000",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
    elevated: "#EEF2F6",
    placeHolder: "#F8FAFC",
    link: "#2970FF",
    stroke1: "#EEF2F6",
    stroke2: "#E3E8EF",
    stroke3: "#CDD5DF",
  },
  dark: {
    background: "#FFFFFF",
    text: "#111827",
    primaryPink: "#F2619C",
    secondaryYellow: "#EDE986",
    softLilac: "#E7BEF8",
    blueberryMilk: "#93ABD9",
    white: "#FFFFFF",
    black: "#000000",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
    elevated: "#EEF2F6",
    placeHolder: "#F8FAFC",
    link: "#2970FF",
    stroke1: "#EEF2F6",
    stroke2: "#E3E8EF",
    stroke3: "#CDD5DF",
  },
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
