/** EXIF date-time: "2025:10:22 17:40:12". */
const EXIF_DATE = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;
/** EXIF offset tag: "+07:00". */
const EXIF_OFFSET = /^([+-])(\d{2}):?(\d{2})$/;
const EARLIEST = Date.UTC(1990, 0, 1);

/**
 * When a picked photo was taken, as an ISO string, from its EXIF
 * (DateTimeOriginal, then DateTimeDigitized / DateTime). EXIF times are local
 * wall-clock; the OffsetTime* tag pins the zone when present, otherwise the
 * phone's zone is assumed. Null when missing, malformed or implausible.
 */
export function exifTakenAt(
  exif: Record<string, unknown> | null | undefined,
): string | null {
  if (!exif) return null;
  // Android nests nothing; iOS puts the tags under "{Exif}".
  const tags = { ...exif, ...(exif["{Exif}"] as Record<string, unknown>) };
  const candidates: [unknown, unknown][] = [
    [tags.DateTimeOriginal, tags.OffsetTimeOriginal],
    [tags.DateTimeDigitized, tags.OffsetTimeDigitized],
    [tags.DateTime, tags.OffsetTime],
  ];

  for (const [raw, offset] of candidates) {
    if (typeof raw !== "string") continue;
    const m = EXIF_DATE.exec(raw.trim());
    if (!m) continue;
    const [y, mo, d, h, mi, s] = m.slice(1).map(Number);

    let time: number;
    const o = typeof offset === "string" ? EXIF_OFFSET.exec(offset.trim()) : null;
    if (o) {
      const sign = o[1] === "-" ? -1 : 1;
      const minutes = sign * (Number(o[2]) * 60 + Number(o[3]));
      time = Date.UTC(y, mo - 1, d, h, mi, s) - minutes * 60_000;
    } else {
      time = new Date(y, mo - 1, d, h, mi, s).getTime();
    }

    if (Number.isFinite(time) && time >= EARLIEST && time <= Date.now() + 60_000) {
      return new Date(time).toISOString();
    }
  }
  return null;
}
