const { withAndroidManifest } = require("expo/config-plugins");

const PORTRAIT_FEATURE = "android.hardware.screen.portrait";

module.exports = function withOptionalPortrait(config) {
  return withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    const features = (manifest["uses-feature"] ??= []);
    const portrait = features.find(
      (feature) => feature.$["android:name"] === PORTRAIT_FEATURE,
    );

    // A portrait activity otherwise implies a Play Store hardware requirement.
    if (portrait) {
      portrait.$["android:required"] = "false";
    } else {
      features.push({
        $: { "android:name": PORTRAIT_FEATURE, "android:required": "false" },
      });
    }
    return config;
  });
};
