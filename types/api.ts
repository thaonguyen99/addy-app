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

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type OtpPurpose = "register" | "password_reset";

export type MemoryImageType =
  | "cover"
  | "food"
  | "drink"
  | "ambience"
  | "menu"
  | "receipt"
  | "other";

export type MemoryImage = {
  type: MemoryImageType;
  url: string;
  publicId: string;
  sortOrder?: number;
};

export type PlaceSummary = {
  id: string;
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
};

/** Normalized place from GET /places/search (Goong place_id in `placeId`). */
export type PlaceSuggestion = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

/** Full place record from GET /places/resolve. */
export type PlaceRecord = {
  id: string;
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
};

export type ReverseGeocodeResult = {
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
};

export type MemoryDetail = {
  id: string;
  images: MemoryImage[];
  moodScore: number | null;
  feeling: string | null;
  capturedAt: string;
  createdAt: string;
  place: PlaceSummary;
};

export type MemoryPin = {
  id: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  imageUrl: string;
};

/** One row in the map feed drawer — same shape as MemoryDetail today, kept
 * separate so a lighter list payload can diverge without touching detail. */
export type MemoryListItem = {
  id: string;
  images: MemoryImage[];
  moodScore: number | null;
  feeling: string | null;
  capturedAt: string;
  createdAt: string;
  place: PlaceSummary;
};

export type MemoryListParams = {
  cursor?: string;
  limit?: number;
};

export type MemoryListResult = {
  items: MemoryListItem[];
  nextCursor?: string;
};

export type PlaceInput = {
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types?: string[];
};

export type CreateMemoryImageInput = {
  type: MemoryImageType;
  imageUrl: string;
  imagePublicId: string;
  sortOrder?: number;
};

export type CreateMemoryInput = {
  place: PlaceInput | { placeId: string } | { externalPlaceId: string };
  images: CreateMemoryImageInput[];
  moodScore?: number;
  feeling?: string;
  capturedAt?: string;
};

export type MediaUploadResult = {
  imageUrl: string;
  imagePublicId: string;
};

export type MediaUploadMultipleResult = {
  images: MediaUploadResult[];
};

export type UserProfile = AuthUser & {
  createdAt: string;
};

export type UserStats = {
  totalMemories: number;
  placesVisited: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
  limit?: number;
  cursor?: string;
};

export type MapPinsResult = {
  pins: MemoryPin[];
  cursor?: string;
};
