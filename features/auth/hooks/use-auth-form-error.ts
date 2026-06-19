import { ApiClientError } from "@/lib/api/errors";

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return fallback;
}
