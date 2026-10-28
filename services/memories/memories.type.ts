import type { PlaceInput, PlaceSummary } from "@/services/places";
import type { PublicUser } from "@/services/users";

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

export type MemoryVisibility = "private" | "friends";

export type MemorySource = "quick_snap" | "uploaded";

/** Which map layer a pin belongs to: your own memories, or friends' shared ones. */
export type MapScope = "mine" | "friends";

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
  /** Number of chat messages visible to the viewer. */
  messageCount: number;
  /** In-app camera vs gallery pick; null on memories made before it was recorded. */
  source: MemorySource | null;
  capturedAt: string;
  createdAt: string;
  place: PlaceSummary;
  /** Who this memory belongs to — the real owner when viewing a friend's memory. */
  author: PublicUser;
  /** Friends the owner tagged. They can see and chat on the memory even when it's private. */
  taggedUsers: PublicUser[];
  /** True when the signed-in user is tagged on this memory. */
  isTagged: boolean;
  /** Whether the memory has a chat thread (shared with friends, or has tagged friends). */
  canComment: boolean;
  /** Bumped on every edit; realtime events older than this are ignored. */
  updatedAt: string;
};

/** `GET /memories/on-this-day`: a memory from this date, `yearsAgo` years back. */
export type OnThisDayMemory = MemoryDetail & { yearsAgo: number };

export type Reactor = {
  user: PublicUser;
  reactedAt: string;
};

export type ToggleReactionResult = {
  reacted: boolean;
  count: number;
};

export type MemoryPin = {
  /** The most recently captured memory's id at this place. */
  id: string;
  /** Groups pins by place: multiple memories at the same place collapse into one pin. */
  placeId: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  imageUrl: string;
  /** How many memories this map layer shows at this place — the same count
   *  POST /memories/by-places returns for it. */
  memoryCount: number;
  placeName?: string;
  moodScore?: number | null;
  /** Photos on the cover memory beyond its cover. Distinct from
   *  `memoryCount` (memories sharing this place). */
  extraPhotoCount?: number;
};

export type FriendMemoryPin = MemoryPin & {
  author: PublicUser;
};

/**
 * One memory in the map's cluster sheet, from POST /memories/by-places.
 * Before that loads, each place's cover pin stands in for it, without
 * `visibility`, `feeling` or (for your own pins) `author`.
 */
export type ClusterMemory = {
  id: string;
  placeId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  /** Every photo on the memory, cover included. */
  imageCount: number;
  moodScore: number | null;
  feeling?: string | null;
  visibility?: MemoryVisibility;
  isOwner: boolean;
  capturedAt: string;
  author?: PublicUser;
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
  messageCount: number;
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
  /** UUID v4 from the offline queue; a repeat create returns the stored memory. */
  clientId?: string;
  source?: MemorySource;
  taggedUserIds?: string[];
};

/** PATCH /memories/:id — send only what changed. `images` replaces the full set. */
export type UpdateMemoryInput = {
  visibility?: MemoryVisibility;
  place?: PlaceInput;
  images?: CreateMemoryImageInput[];
  moodScore?: number | null;
  feeling?: string | null;
  /** Replaces the full tag set. */
  taggedUserIds?: string[];
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
