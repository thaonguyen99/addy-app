import type { ApiErrorBody, ApiResponse } from "@/types/api";
import type { AxiosError } from "axios";

export class ApiClientError extends Error {
  readonly code: string;
  readonly details?: ApiErrorBody["details"];
  readonly status?: number;

  constructor(
    message: string,
    code: string,
    options?: { details?: ApiErrorBody["details"]; status?: number }
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = options?.details;
    this.status = options?.status;
  }
}

export function parseApiResponse<T>(payload: unknown): T {
  const body = payload as ApiResponse<T>;
  if (body && typeof body === "object" && "success" in body) {
    if (body.success) {
      return body.data;
    }
    throw new ApiClientError(body.error.message, body.error.code, {
      details: body.error.details,
    });
  }
  throw new ApiClientError("Unexpected API response", "INTERNAL_ERROR");
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  const responseData = axiosError.response?.data;
  if (
    responseData &&
    typeof responseData === "object" &&
    "success" in responseData &&
    !responseData.success
  ) {
    return new ApiClientError(responseData.error.message, responseData.error.code, {
      details: responseData.error.details,
      status: axiosError.response?.status,
    });
  }

  return new ApiClientError(
    axiosError.message || "Network request failed",
    "NETWORK_ERROR",
    { status: axiosError.response?.status }
  );
}
