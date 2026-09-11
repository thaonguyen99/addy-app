import { createTheme } from "@wrack/react-native-tour-guide";

import { BrandColors } from "@/constants/theme";

export const onboardingTourTheme = createTheme({
  tooltipStyles: {
    backgroundColor: BrandColors.paper,
    titleColor: BrandColors.secondary,
    descriptionColor: BrandColors.secondary,
    primaryButtonColor: BrandColors.primary,
    secondaryButtonColor: BrandColors.neutralBorder,
    skipButtonColor: BrandColors.neutralMuted,
    buttonTextColor: BrandColors.white,
    borderRadius: 14,
    titleStyle: { fontFamily: "BeVietnam-SemiBold" },
    descriptionStyle: { fontFamily: "BeVietnam-Regular" },
  },
  spotlightStyles: {
    overlayColor: BrandColors.gray900,
    overlayOpacity: 0.75,
    enablePulse: true,
    pulseColor: BrandColors.primary,
  },
});
