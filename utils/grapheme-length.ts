/**
 * Count text the way people see it: an emoji (even a ZWJ family, a flag or a
 * skin-toned hand) is one character. Matches the API's `graphemeLength`, so
 * the bio counter and the server agree.
 */

type Segmenter = {
  segment: (input: string) => Iterable<{ segment: string }>;
};

const IntlWithSegmenter = Intl as typeof Intl & {
  Segmenter?: new (
    locale: undefined,
    options: { granularity: "grapheme" },
  ) => Segmenter;
};

const segmenter: Segmenter | null = IntlWithSegmenter.Segmenter
  ? new IntlWithSegmenter.Segmenter(undefined, { granularity: "grapheme" })
  : null;

// Hermes has no Intl.Segmenter, so approximate grapheme clusters: a flag
// (two regional indicators), or a code point plus its combining marks,
// variation selectors, skin tones and tag characters, joined by ZWJ.
const EXTEND =
  "[\\u0300-\\u036F\\u1AB0-\\u1AFF\\u1DC0-\\u1DFF\\u20D0-\\u20FF\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\u{1F3FB}-\\u{1F3FF}\\u{E0020}-\\u{E007F}]";
const CLUSTER = new RegExp(
  `[\\u{1F1E6}-\\u{1F1FF}]{2}|[^]${EXTEND}*(?:\\u200D[^]${EXTEND}*)*`,
  "gu",
);

export function splitGraphemes(value: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(value), (s) => s.segment);
  return value.match(CLUSTER) ?? [];
}

export function graphemeLength(value: string): number {
  return splitGraphemes(value).length;
}
