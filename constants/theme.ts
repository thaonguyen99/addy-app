/**
 * App color tokens — Y2K sticker rebrand. The app inverts from dark-first to
 * light-first: background is now `paper`, not the old plum-cocoa dark. Key
 * names are unchanged from the pre-rebrand palette so every existing
 * `BrandColors.xxx` call site keeps compiling; only values (and in several
 * cases the underlying *role* — see comments) changed.
 */

import { Platform } from "react-native";

export const BrandColors = {
  white: "#FFFFFF",
  black: "#000000",

  // Paper-forward light scale (replaces the plum-cocoa dark scale).
  // App background is now light — this ramps from paper down to ink,
  // instead of the old near-white-to-deepest-dark direction.
  gray50: "#FBFBF6", // = paper — app background (was deepest dark before)
  gray100: "#F1F1E8", // = paper dim — recessed surfaces: nav bar, dashed cards
  gray200: "#E4E4D8", // subtle dividers on paper
  gray300: "#B8B8AC", // disabled text / low-emphasis icons
  gray400: "#8B8B80", // secondary text on paper
  gray500: "#5C5C54", // stronger muted text, captions
  gray600: "#33333A", // dark surface, lighter step (rarely used now)
  gray700: "#22222A", // deeper dark surface
  gray800: "#1C1D21", // camera viewfinder background
  gray900: "#16171A", // = outline ink — deepest tone; ALL sticker outlines,
  // hard-shadows, and default text color use this

  elevated: "#FFFFFF", // card surface, one step up from paper background
  placeHolder: "#F1F1E8", // input field background — same as gray100/paper dim

  link: "#3AA8E0", // cyan-leaning link color, legible on paper

  // Subtle dividers only — the bold sticker outline is NOT this, it's a
  // solid 100%-opacity gray900 stroke at 2.5–4px. These three are for
  // quieter internal dividers (e.g. inside a list), not component borders.
  stroke1: "rgba(22, 23, 26, 0.08)",
  stroke2: "rgba(22, 23, 26, 0.16)",
  stroke3: "rgba(22, 23, 26, 0.32)",

  /** Primary actions, selected states, key CTAs. Was periwinkle #6667AB. */
  primary: "#9FE000", // Lime Deep — solid CTA color (buttons use a
  // primary → primaryLight gradient, see below, but flat UI elements like
  // toggles/selected chips use this solid value)
  /** Was the dark app-background color. Now repurposed: the ink/outline
   *  color used for borders, text, and the rare remaining dark surface
   *  (camera viewfinder). The app itself no longer has a dark background. */
  secondary: "#16171A",
  /** Text, icons, default foreground on the new light/paper base.
   *  Was light-on-dark (#E9DDD3); now dark-on-light since the base flipped. */
  neutral: "#16171A",
  /** Selected fills — now Slime Lime at low opacity instead of periwinkle. */
  primaryMuted: "rgba(199, 242, 58, 0.22)",
  /** Captions and placeholders on paper surfaces. */
  neutralMuted: "#5C5C54",
  /** Visible edge on sticker/paper surfaces — bold, not soft; same as ink
   *  since every component border in this system is a solid dark outline. */
  neutralBorder: "#16171A",

  /** Ink for text on light/paper surfaces — same role as before, now the
   *  dominant text color app-wide rather than a polaroid-only special case. */
  ink: "#16171A",
  /** Secondary ink — captions, place names, dates on light cards. */
  inkMuted: "#5C5C54",
  /** Light paper surface — now the app-wide background, not just polaroid
   *  frames. */
  paper: "#FBFBF6",

  // --- New tokens: the old single-accent (periwinkle) system becomes a
  // multi-accent sticker system. These didn't exist before; add them. ---
  /** Gradient partner for `primary` — used as the lighter stop in CTA
   *  button gradients (primaryLight → primary, top-left to bottom-right). */
  primaryLight: "#C7F23A", // "Slime Lime"
  /** Secondary sticker accent — default pin fill, info chips. */
  accentCyan: "#5FCBFF", // "Chatroom Cyan"
  /** Tertiary sticker accent — "favorite" tags, mood/reveal stickers. */
  accentPink: "#FF5CAE", // "Sticker Pink"
  /** Badge/sparkle accent — star stickers, highlight badges. */
  accentYellow: "#FFDD4A", // "Star Yellow"

  /** Danger/destructive state — delete actions, errors, decline buttons.
   *  Distinct from `accentPink` (a brand accent, not a semantic warning). */
  danger: "#FF5C5C",
  /** Gradient partner / light fill for `danger`. */
  dangerLight: "#FFC2C2",
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
