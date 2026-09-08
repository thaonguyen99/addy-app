import { ApiClientError } from "@/lib/api/errors";

const NETWORK_MESSAGE =
  "Can't reach the server. It may be waking up — wait a few seconds and try again.";

function isNetworkError(error: ApiClientError): boolean {
  if (error.code === "NETWORK_ERROR") return true;
  const msg = error.message.toLowerCase();
  return msg.includes("timeout") || msg.includes("network");
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return isNetworkError(error) ? NETWORK_MESSAGE : error.message;
  }
  return fallback;
}
