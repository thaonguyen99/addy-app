import Constants from "expo-constants";

type AppExtra = {
  apiUrl?: string;
  googleIosClientId?: string;
  googleWebClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const API_BASE_URL = extra.apiUrl ?? "http://localhost:5001";
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId ?? "";
export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId ?? "";
