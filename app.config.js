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

/** Meta app credentials for Facebook Login (developers.facebook.com → App settings). */
const facebookAppId = process.env.FACEBOOK_APP_ID ?? "";
const facebookClientToken = process.env.FACEBOOK_CLIENT_TOKEN ?? "";

/** Host of the share links (https://<host>/i/<token>, /u/<username>); matches the API's INVITE_WEB_BASE_URL. */
const inviteLinkHost = process.env.INVITE_LINK_HOST ?? "addy.app";

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: "addy-app",
  slug: "addy-app",
  version: "1.2.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "addyapp",
  // The app is a light-only design with no dark theme built — "automatic"
  // let native system UI (gallery picker, alerts, keyboard) go dark whenever
  // the device is in Dark Mode, clashing with every in-app screen.
  userInterfaceStyle: "light",
  newArchEnabled: true,
  // Over-the-air updates (EAS Update). On launch the app pulls the latest JS
  // bundle for its channel and applies it on the next start.
  updates: {
    url: "https://u.expo.dev/eb53cb10-598d-456c-b2c3-15af9d2d3fee",
  },
  // A build only accepts OTA updates whose native fingerprint matches — so a
  // JS-only change ships OTA, while anything touching native (new module,
  // plugin, permission, SDK bump) changes the fingerprint and forces a rebuild.
  runtimeVersion: {
    policy: "fingerprint",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.thaonguyen.addy",
    // Opens /i/<token> links in the app (served by the API's apple-app-site-association).
    associatedDomains: [`applinks:${inviteLinkHost}`],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#C7F23A",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    edgeToEdgeEnabled: true,
    // Opens /i/<token> and /u/<username> links in the app (verified via the API's assetlinks.json).
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: inviteLinkHost, pathPrefix: "/i/" },
          { scheme: "https", host: inviteLinkHost, pathPrefix: "/u/" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
    ],
    // expo-audio's manifest declares this for its lock-screen media controls
    // service; we only play the shutter sound, so Play shouldn't see it.
    // facebook-core declares AD_ID, but we don't use the advertising ID (no ads
    // yet, and FB advertiser ID collection is off). Unblock it when ads ship.
    blockedPermissions: [
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "com.google.android.gms.permission.AD_ID",
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
    [
      "expo-build-properties",
      {
        android: {
          // R8 shrinks and obfuscates release builds; Play flags apps whose
          // DEX obfuscation is under 25%. The AAB carries the mapping file,
          // so Play still de-obfuscates crash stack traces.
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          // Nitro (fast-tflite, the on-device moderation model) resolves
          // these classes from C++ by name.
          extraProguardRules: "-keep class com.margelo.nitro.** { *; }",
        },
      },
    ],
    "expo-secure-store",
    ["expo-audio", { microphonePermission: false, recordAudioAndroid: false }],
    [
      "expo-camera",
      {
        cameraPermission:
          "Addy uses your camera to capture quick place memories.",
        microphonePermission: false,
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
      "expo-media-library",
      {
        photosPermission:
          "Addy needs photo library access to add gallery images to your pin.",
        savePhotosPermission:
          "Addy saves your photos and invite story images to your library.",
        isAccessMediaLocationEnabled: false,
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
        imageWidth: 220,
        resizeMode: "contain",
        // Keep in sync with BrandColors.paper in constants/theme.ts — this
        // file can't import that (plain Node config, no RN/TS runtime).
        // No `dark` variant: it makes this plugin force UIUserInterfaceStyle to
        // Automatic, overriding the light-only `userInterfaceStyle` above.
        backgroundColor: "#FBFBF6",
      },
    ],
    iosUrlScheme
      ? ["@react-native-google-signin/google-signin", { iosUrlScheme }]
      : "@react-native-google-signin/google-signin",
    // Skipped without an app ID: the plugin writes it into the native config,
    // and a build with an empty ID crashes the SDK on launch.
    ...(facebookAppId
      ? [
          [
            "react-native-fbsdk-next",
            {
              appID: facebookAppId,
              clientToken: facebookClientToken,
              displayName: "Addy",
              scheme: `fb${facebookAppId}`,
              // Login only — no app-event or ad-ID collection.
              autoLogAppEventsEnabled: false,
              advertiserIDCollectionEnabled: false,
            },
          ],
        ]
      : []),
    "@maplibre/maplibre-react-native",
    [
      "expo-notifications",
      {
        color: "#C7F23A",
      },
    ],
    // CPU-only TFLite delegate for now — no CoreML/Android GPU flags, which
    // keeps this prebuild low-risk. Revisit if on-device inference is slow.
    "react-native-fast-tflite",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: process.env.API_URL ?? "http://localhost:5001",
    googleIosClientId: iosClientId,
    googleWebClientId: webClientId,
    facebookAppId,
    goongMapApiKey: process.env.GOONG_MAP_API_KEY ?? "",
    linkHost: inviteLinkHost,
    router: {},
    eas: {
      projectId: "eb53cb10-598d-456c-b2c3-15af9d2d3fee",
    },
  },
});
