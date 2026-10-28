import Constants from "expo-constants";

type AppExtra = {
  apiUrl?: string;
  googleIosClientId?: string;
  googleWebClientId?: string;
  facebookAppId?: string;
  goongMapApiKey?: string;
  linkHost?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const API_BASE_URL = extra.apiUrl ?? "https://addy-be.onrender.com";
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId ?? "";
export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId ?? "";
export const FACEBOOK_APP_ID = extra.facebookAppId ?? "";
export const GOONG_MAP_API_KEY = extra.goongMapApiKey ?? "";
/** Host of the share links (https://<host>/i/<token>, /u/<username>). */
export const LINK_HOST = extra.linkHost ?? "addy.app";

console.log("[env] resolved config", {
  apiUrl: API_BASE_URL,
  apiUrlIsDefaultFallback: !extra.apiUrl,
  hasGoogleIosClientId: !!GOOGLE_IOS_CLIENT_ID,
  hasGoogleWebClientId: !!GOOGLE_WEB_CLIENT_ID,
  hasFacebookAppId: !!FACEBOOK_APP_ID,
  hasGoongMapApiKey: !!GOONG_MAP_API_KEY,
});

if (!extra.apiUrl) {
  console.warn(
    "[env] apiUrl missing from Constants.expoConfig.extra — .env was likely not loaded at build time, falling back to default API_BASE_URL",
  );
}
