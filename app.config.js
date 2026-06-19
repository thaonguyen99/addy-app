require("dotenv").config();

const googleClientIds = (process.env.GOOGLE_OAUTH_CLIENT_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const iosClientId = googleClientIds[0] ?? "";
const webClientId =
  googleClientIds.find((id) => id.includes("apps.googleusercontent.com")) ??
  iosClientId;

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: "addy-app",
  slug: "addy-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "addyapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.thaonguyen.addy",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
    ],
    package: "com.thaonguyen.addy",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-secure-store",
    [
      "expo-camera",
      {
        cameraPermission:
          "Addy uses your camera to capture quick place memories.",
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Addy needs photo library access to add gallery images to your pin.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Addy uses your location to tag memories to places.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    "@react-native-google-signin/google-signin",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: process.env.API_URL ?? "http://localhost:5001",
    googleIosClientId: iosClientId,
    googleWebClientId: webClientId,
    router: {},
    eas: {
      projectId: "eb53cb10-598d-456c-b2c3-15af9d2d3fee",
    },
  },
});
