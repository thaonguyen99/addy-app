/** A friend tagged in a message's text as `@username`. */
export type MessageMention = {
  id: string;
  username: string;
};

/** One message in a memory's chat thread. */
export type MemoryMessage = {
  id: string;
  /** Null only when the author has blocked the viewer — render unnamed. */
  author: { id: string; username: string; avatarUrl: string | null } | null;
  text: string;
  createdAt: string;
  editedAt: string | null;
  /** The author owns the memory. */
  isOwnerOfMemory: boolean;
  likeCount: number;
  likedByMe: boolean;
  /** The viewer wrote this message. */
  canEdit: boolean;
  /** The viewer owns the memory. */
  canDelete: boolean;
  /** Friends tagged in `text` (each appears there as `@username`). */
  mentions: MessageMention[];
};

export type MessageLikeResult = {
  likeCount: number;
  likedByMe: boolean;
};
