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
};

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
  /** How many memories exist at this place. */
  memoryCount: number;
  /** Not yet sent by GET /memories/map or /memories/friends-map — the map's
   *  place-name label stays hidden until the backend populates this. */
  placeName?: string;
  /** Not yet sent by GET /memories/map or /memories/friends-map — the map's
   *  mood sticker stays hidden until the backend populates this. */
  moodScore?: number | null;
  /** Photos on this memory beyond its cover. Not yet sent by GET
   *  /memories/map or /memories/friends-map — the pin's "+N" tag stays
   *  hidden until the backend populates this. Distinct from `memoryCount`
   *  (memories sharing this place), which is already real, populated data. */
  extraPhotoCount?: number;
};

export type FriendMemoryPin = MemoryPin & {
  author: PublicUser;
};

/** A single memory shown in the "memories at this place" sheet. */
export type PlaceMemory = {
  id: string;
  imageUrl: string;
  feeling: string | null;
  capturedAt: string;
  author: PublicUser;
};

/** One memory as shown in a map cluster picker. */
export type ClusterMemory = { id: string; imageUrl: string; capturedAt: string };

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
