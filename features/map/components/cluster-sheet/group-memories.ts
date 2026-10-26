import type { ClusterMemory } from "@/services/memories";

// All date maths below uses local Date getters on the parsed `capturedAt`
// instant — never a UTC slice of the ISO string — so a memory shot at 23:30
// lands on the day the user saw on their phone.

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Monday 00:00 of the week `date` falls in. */
function startOfWeek(date: Date): number {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - daysSinceMonday,
  ).getTime();
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function clockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * The tile's one date format: today → `15:20`, this week → `Thu`,
 * this year → `Oct 19`, older → `Sep 2025`.
 */
export function formatTileDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.getTime();
  if (time >= startOfDay(now)) return clockTime(date);
  if (time >= startOfWeek(now)) return WEEKDAYS[date.getDay()];
  if (date.getFullYear() === now.getFullYear()) {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Longer form for the peek card: `today 15:20`, `Thu 15:20`, `Oct 19 15:20`, `Sep 9, 2025`. */
export function formatPeekDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.getTime();
  if (time >= startOfDay(now)) return `today ${clockTime(date)}`;
  if (date.getFullYear() !== now.getFullYear()) {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return `${formatTileDate(iso, now)} ${clockTime(date)}`;
}

/** `Aug – Oct`, `Oct`, or `Sep 2025 – Oct` across years. Memories newest first. */
export function formatMonthRange(
  memories: readonly ClusterMemory[],
  now = new Date(),
): string | null {
  if (memories.length === 0) return null;
  const newest = new Date(memories[0].capturedAt);
  const oldest = new Date(memories[memories.length - 1].capturedAt);
  const label = (date: Date) =>
    date.getFullYear() === now.getFullYear()
      ? MONTHS[date.getMonth()]
      : `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  const from = label(oldest);
  const to = label(newest);
  return from === to ? to : `${from} – ${to}`;
}

export type MemorySection = {
  key: string;
  title: string;
  /** Set on By place sections: where `map ›` flies to. */
  place?: { latitude: number; longitude: number };
  memories: ClusterMemory[];
};

/** By place: biggest group first, newest first inside. Input newest first. */
export function groupByPlace(memories: readonly ClusterMemory[]): MemorySection[] {
  const groups = new Map<string, MemorySection>();
  for (const memory of memories) {
    let group = groups.get(memory.placeId);
    if (!group) {
      group = {
        key: memory.placeId,
        title: memory.placeName,
        place: { latitude: memory.latitude, longitude: memory.longitude },
        memories: [],
      };
      groups.set(memory.placeId, group);
    }
    group.memories.push(memory);
  }
  // Stable sort: equal-sized groups keep newest-first order.
  return [...groups.values()].sort(
    (a, b) => b.memories.length - a.memories.length,
  );
}

/**
 * By time: `This week`, then one section per month this year, then one per
 * older year. Input newest first, so sections come out newest first too.
 */
export function groupByTime(
  memories: readonly ClusterMemory[],
  now = new Date(),
): MemorySection[] {
  const weekStart = startOfWeek(now);
  const sections: MemorySection[] = [];

  for (const memory of memories) {
    let current = sections.at(-1);
    const date = new Date(memory.capturedAt);
    let key: string;
    let title: string;
    if (date.getTime() >= weekStart) {
      key = "week";
      title = "This week";
    } else if (date.getFullYear() === now.getFullYear()) {
      key = `month-${date.getMonth()}`;
      title = MONTHS_LONG[date.getMonth()];
    } else {
      key = `year-${date.getFullYear()}`;
      title = String(date.getFullYear());
    }
    if (current?.key !== key) {
      current = { key, title, memories: [] };
      sections.push(current);
    }
    current.memories.push(memory);
  }
  return sections;
}

/** Keeps sections whole until `limit` memories are used, then cuts. */
export function limitSections(
  sections: readonly MemorySection[],
  limit: number,
): MemorySection[] {
  const out: MemorySection[] = [];
  let left = limit;
  for (const section of sections) {
    if (left <= 0) break;
    out.push(
      section.memories.length <= left
        ? section
        : { ...section, memories: section.memories.slice(0, left) },
    );
    left -= section.memories.length;
  }
  return out;
}
