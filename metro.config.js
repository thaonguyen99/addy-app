const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Lets Metro bundle the on-device NSFW model as a binary asset
// (features/moderation/check-image-safety.ts loads it via require()).
config.resolver.assetExts.push("tflite");

module.exports = config;
