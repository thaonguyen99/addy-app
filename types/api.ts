export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, string[] | string>;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Cursor-paginated list envelope used by the social endpoints. */
export type Paginated<T> = {
  items: T[];
  nextCursor?: string;
};
