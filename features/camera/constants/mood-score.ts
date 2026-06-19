/** 1 = lowest mood, 5 = highest — matches API `moodScore`. */
export const MOOD_SCORE_OPTIONS = [
  { score: 1, emoji: "🫠", label: "Lowest" },
  { score: 2, emoji: "🥹", label: "Low" },
  { score: 3, emoji: "👀", label: "Neutral" },
  { score: 4, emoji: "☺️", label: "Good" },
  { score: 5, emoji: "🥳", label: "Highest" },
] as const;

export type MoodScore = (typeof MOOD_SCORE_OPTIONS)[number]["score"];
