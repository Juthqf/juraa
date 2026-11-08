import type { Medication } from "./data";

/** Calendar dates follow the device, not UTC. Never migrate ambiguous old keys. */
export function localDate(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function scheduledMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

export function todayDoses(meds: Medication[], taken: Record<string, boolean>, now: Date) {
  const date = localDate(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return meds.flatMap((med) => med.times.flatMap((time) => {
    const minutes = scheduledMinutes(time);
    if (minutes === null) return [];
    const status: "taken" | "missed" | "upcoming" = taken[`${date}|${med.id}|${time}`]
      ? "taken" : minutes <= nowMin ? "missed" : "upcoming";
    return [{ med, time, status, minutes }];
  })).sort((a, b) => a.minutes - b.minutes);
}