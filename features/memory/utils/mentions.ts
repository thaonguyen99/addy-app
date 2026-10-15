import type { MessageMention } from "@/types/api";

/** Mirrors the server: `@handle` at the start or after a non-handle character. */
const MENTION_PATTERN = /(^|[^a-z0-9_.@])@([a-z0-9_.]+)/gi;

/** Handle being typed right before the cursor — `"an"` for `"hi @an|"`. */
const ACTIVE_MENTION_PATTERN = /(?:^|[^a-z0-9_.@])@([a-z0-9_.]*)$/i;

export type ActiveMention = {
  /** Text typed after the `@` so far (may be empty). */
  query: string;
  /** Index of the `@` in the text. */
  start: number;
};

/** The `@mention` the cursor is currently inside, if any. */
export function getActiveMention(
  text: string,
  cursor: number,
): ActiveMention | null {
  const match = ACTIVE_MENTION_PATTERN.exec(text.slice(0, cursor));
  if (!match) return null;
  const query = match[1]!;
  return { query, start: cursor - query.length - 1 };
}

/** Replace the active mention with `@username ` and return the new text + cursor. */
export function insertMention(
  text: string,
  mention: ActiveMention,
  cursor: number,
  username: string,
) {
  const before = text.slice(0, mention.start);
  const after = text.slice(cursor).replace(/^[a-z0-9_.]*/i, "");
  const inserted = `@${username} `;
  return {
    text: `${before}${inserted}${after.replace(/^ /, "")}`,
    cursor: before.length + inserted.length,
  };
}

export type MentionSegment = { text: string; mention: boolean };

/** Split message text so `@username`s that resolved to a tagged friend can be styled. */
export function splitMentions(
  text: string,
  mentions: MessageMention[],
): MentionSegment[] {
  if (mentions.length === 0) return [{ text, mention: false }];
  const tagged = new Set(mentions.map((m) => m.username.toLowerCase()));
  const segments: MentionSegment[] = [];
  let last = 0;

  for (const match of text.matchAll(MENTION_PATTERN)) {
    let handle = match[2]!;
    if (!tagged.has(handle.toLowerCase())) {
      // "@ana." at the end of a sentence tags "ana".
      handle = handle.replace(/\.+$/, "");
      if (!tagged.has(handle.toLowerCase())) continue;
    }
    const start = match.index! + match[1]!.length;
    if (start > last) segments.push({ text: text.slice(last, start), mention: false });
    segments.push({ text: `@${handle}`, mention: true });
    last = start + handle.length + 1;
  }

  if (last < text.length) segments.push({ text: text.slice(last), mention: false });
  return segments;
}
