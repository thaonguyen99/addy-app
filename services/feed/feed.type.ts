export type FeedUserRef = {
  id: string;
  username: string;
};

/** One card on Memory Lane, from `GET /feed`. */
export type FeedItem = {
  id: string;
  photoUrl: string;
  /** Every photo, cover first. Optional until every API deploy sends it. */
  photoUrls?: string[];
  caption: string | null;
  moodScore: number | null;
  visibility: "private" | "friends";
  place: { name: string; lat: number; lng: number };
  createdAt: string;
  /** Newest of created / commented / tagged. The feed is ordered by createdAt. */
  activityAt: string;
  isMine: boolean;
  owner: { id: string; username: string; avatarUrl: string | null };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  /** `author` is null when the viewer (as owner) blocked the commenter. */
  latestComment: {
    id: string;
    text: string;
    createdAt: string;
    author: FeedUserRef | null;
  } | null;
  firstTag: FeedUserRef | null;
  tagCount: number;
};

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};
