// Treatment-journey statistics over the existing device-local records.
// Pure and honest: only confirmed doses count as taken, unconfirmed past
// doses are never assumed taken or missed, and past eligibility is computed
// from the CURRENT schedule (schedule history is not recorded — the UI says so).

import type { Medication } from "./data";

export type JourneyRange = "today" | "week" | "month" | "all";

export type DayPoint = { date: string; taken: number; eligible: number };

export type JourneyStats = {
  /** Confirmed taken doses in range (matching the current schedule). */
  taken: number;
  /** Scheduled doses in range whose time has already passed. */
  eligible: number;
  /** Eligible doses with no confirmation — never labelled missed or taken. */
  unconfirmed: number;
  /** Same as unconfirmed: elapsed-window doses not marked taken. */
  missed: number;
  /** taken / eligible × 100, or null when nothing was eligible. */
  adherence: number | null;
  activeMeds: number;
  /** Consecutive fully recorded days, or null when there is none. */
  streak: number | null;
  /** Earliest confirmed-dose date (tracking start), or null. */
  since: string | null;
  /** Oldest → newest. */
  days: DayPoint[];
  hasHistory: boolean;
};

/** Minutes after the scheduled time during which a dose can still be confirmed; only then is it counted. */
export const CONFIRM_WINDOW_MIN = 60;

const RANGE_DAYS: Record<Exclude<JourneyRange, "all">, number> = { today: 1, week: 7, month: 30 };

const pad = (n: number) => String(n).padStart(2, "0");
/** Device-local calendar date, matching the doseKey format used by the store. */
export const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (date: string, n: number) => {
  const [y = 0, m = 1, day = 1] = date.split("-").map(Number);
  return dateStr(new Date(y, m - 1, day + n, 12));
};

export const parseDoseKey = (k: string) => {
  const [date, medId, time] = k.split("|");
  return date && medId && time ? { date, medId, time } : null;
};

export function computeJourney(meds: Medication[], taken: Record<string, boolean>, range: JourneyRange, now: Date = new Date()): JourneyStats {
  const today = dateStr(now);
  // Local time-of-day, matching how the rest of the app compares dose times.
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const records = Object.entries(taken)
    .filter(([, v]) => v)
    .map(([k]) => parseDoseKey(k))
    .filter((r): r is NonNullable<typeof r> => !!r);
  const since = records.length ? (records.map((r) => r.date).sort()[0] ?? null) : null;

  const rangeStart = range === "all" ? (since ?? today) : addDays(today, -(RANGE_DAYS[range] - 1));
  // Days before tracking began have no records and must never count as missed.
  const start = since && since > rangeStart ? since : rangeStart;

  const days: DayPoint[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const isToday = d === today;
    let eligible = 0;
    for (const m of meds)
      for (const time of m.times) {
        const [h = 0, mm = 0] = time.split(":").map(Number);
        if (!isToday || h * 60 + mm + CONFIRM_WINDOW_MIN <= nowMin) eligible++;
      }
    const confirmed = records.filter((r) => r.date === d && meds.some((m) => m.id === r.medId && m.times.includes(r.time))).length;
    days.push({ date: d, taken: Math.min(confirmed, eligible), eligible });
  }

  const takenCount = days.reduce((s, d) => s + d.taken, 0);
  const eligible = days.reduce((s, d) => s + d.eligible, 0);

  let run = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]!;
    // Today is still in progress — an incomplete or not-yet-due today neither counts nor breaks the run.
    if (i === days.length - 1 && (day.eligible === 0 || day.taken < day.eligible)) continue;
    if (day.eligible === 0) break;
    if (day.taken === day.eligible) run++;
    else break;
  }

  return {
    taken: takenCount,
    eligible,
    unconfirmed: eligible - takenCount,
    missed: eligible - takenCount,
    adherence: eligible > 0 ? Math.min(100, Math.round((takenCount / eligible) * 100)) : null,
    activeMeds: meds.length,
    streak: run > 0 ? run : null,
    since,
    days,
    hasHistory: records.length > 0,
  };
}

/** Bucket long day series into 7-day weeks for the chart. */
export function bucketWeekly(days: DayPoint[]): DayPoint[] {
  if (days.length <= 31) return days;
  const weeks: DayPoint[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7);
    weeks.push({
      date: slice[0]?.date ?? "",
      taken: slice.reduce((s, d) => s + d.taken, 0),
      eligible: slice.reduce((s, d) => s + d.eligible, 0),
    });
  }
  return weeks;
}

export type WeekCompare = { previous: { taken: number; eligible: number; adherence: number | null }; last: { taken: number; eligible: number; adherence: number | null }; overall: { taken: number; eligible: number; adherence: number | null } };

/** Compares the two most recent COMPLETED weeks (days 8–14 vs 1–7 before today) from the same records as computeJourney. */
export function compareWeeks(meds: Medication[], taken: Record<string, boolean>, now: Date = new Date()): WeekCompare {
  const today = dateStr(now);
  const days = computeJourney(meds, taken, "month", now).days;
  const sum = (from: number, to: number) => {
    const lo = addDays(today, -to), hi = addDays(today, -from);
    const sel = days.filter((d) => d.date >= lo && d.date <= hi);
    const t = sel.reduce((s, d) => s + d.taken, 0), e = sel.reduce((s, d) => s + d.eligible, 0);
    return { taken: t, eligible: e, adherence: e > 0 ? Math.round((t / e) * 100) : null };
  };
  return { previous: sum(8, 14), last: sum(1, 7), overall: sum(1, 14) };
}
