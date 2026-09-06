require("dotenv").config();

const googleClientIds = (process.env.GOOGLE_OAUTH_CLIENT_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// Expected order: iOS client ID, Web client ID (see .env.example)
const iosClientId = googleClientIds[0] ?? "";
const webClientId = googleClientIds[1] ?? "";

/** Reversed iOS client ID — required URL scheme for Google Sign-In on iOS */
function toIosUrlScheme(clientId) {
  const suffix = ".apps.googleusercontent.com";
  if (!clientId.endsWith(suffix)) return "";
  return `com.googleusercontent.apps.${clientId.slice(0, -suffix.length)}`;
}

const iosUrlScheme = toIosUrlScheme(iosClientId);

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
    iosUrlScheme
      ? [
          "@react-native-google-signin/google-signin",
          { iosUrlScheme },
        ]
      : "@react-native-google-signin/google-signin",
    "@maplibre/maplibre-react-native",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: process.env.API_URL ?? "http://localhost:5001",
    googleIosClientId: iosClientId,
    googleWebClientId: webClientId,
    goongMapApiKey: process.env.GOONG_MAP_API_KEY ?? "",
    router: {},
    eas: {
      projectId: "eb53cb10-598d-456c-b2c3-15af9d2d3fee",
    },
  },
});
