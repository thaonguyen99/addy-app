/**
 * Pull the invite token out of a scanned or opened link. Accepts the share
 * URL (`https://addy.app/i/<token>`) and the old QR deep link
 * (`addyapp://add-friend?token=<token>`).
 */
export function parseInviteToken(raw: string): string | null {
  const value = raw.trim();
  const path = value.match(/^https?:\/\/[^/]+\/i\/([^/?#]+)/i);
  if (path?.[1]) return decodeURIComponent(path[1]);
  if (/^addyapp:\/\/add-friend\b/i.test(value)) {
    const query = value.match(/[?&]token=([^&#]+)/);
    if (query?.[1]) return decodeURIComponent(query[1]);
  }
  return null;
}
