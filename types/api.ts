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
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  onboardingCompletedAt: string | null;
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

export type MemoryVisibility = "private" | "friends";

export type MemoryDetail = {
  id: string;
  images: MemoryImage[];
  moodScore: number | null;
  feeling: string | null;
  visibility: MemoryVisibility;
  /** True when the signed-in user owns this memory. */
  isOwner: boolean;
  reactionCount: number;
  hasReacted: boolean;
  capturedAt: string;
  createdAt: string;
  place: PlaceSummary;
  /** Who this memory belongs to — the real owner when viewing a friend's memory. */
  author: PublicUser;
};

/** Minimal public identity for another user (friend, requester, reactor). */
export type PublicUser = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type FriendRelationship =
  | "none"
  | "friend"
  | "request_sent"
  | "request_received";

export type Friend = {
  user: PublicUser;
  friendsSince: string;
};

export type FriendRequestDirection = "incoming" | "outgoing";

export type FriendRequest = {
  id: string;
  direction: FriendRequestDirection;
  user: PublicUser;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
};

export type UserSearchResult = PublicUser & {
  relationship: FriendRelationship;
};

export type InviteInfo = {
  token: string;
  /** Deep link (addyapp://add-friend?token=...) — encode this in the QR. */
  url: string;
  /** Landing page for people without the app. */
  webUrl: string;
};

export type ResolvedInvite = {
  user: PublicUser;
  relationship: FriendRelationship;
};

export type BlockedUser = {
  user: PublicUser;
  blockedAt: string;
};

export type Reactor = {
  user: PublicUser;
  reactedAt: string;
};

export type ToggleReactionResult = {
  reacted: boolean;
  count: number;
};

export type FriendMemoryPin = MemoryPin & {
  author: PublicUser;
};

export type NotificationPreferences = {
  friendRequestReceived: boolean;
  friendRequestAccepted: boolean;
  reactionReceived: boolean;
};

export type DevicePlatform = "ios" | "android";

/** Cursor-paginated list envelope used by the social endpoints. */
export type Paginated<T> = {
  items: T[];
  nextCursor?: string;
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
  visibility: MemoryVisibility;
  isOwner: boolean;
  reactionCount: number;
  hasReacted: boolean;
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
  visibility?: MemoryVisibility;
};

export type UpdateMemoryInput = {
  visibility: MemoryVisibility;
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

export type UpdateProfileInput = {
  /** Never null — a username can be changed but not cleared. */
  username?: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string;
  avatarPublicId?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type UsernameAvailableResult = {
  available: boolean;
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
