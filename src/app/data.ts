// Device-local medication types and the starter schedule for new users.
// Clinical/interaction information comes only from the imported Juraa database (see clinical-data.ts).

export type Medication = {
  id: string;
  name: string;
  /** User memory aid only; never a clinical matching identifier. */
  nickname?: string;
  ingredient: string;
  dose: string;
  frequency: 1 | 2 | 3;
  times: string[]; // "HH:MM" 24h
  notes?: string;
  genericName?: string;
  dosageForm?: string;
  /** Product strength as printed on the packaging — never the prescribed dose. */
  strength?: string;
};

export const SEED_MEDS: Medication[] = [
  { id: "m1", name: "Levothyroxine", ingredient: "levothyroxine", dose: "50 mcg", frequency: 1, times: ["07:00"], notes: "on_empty_stomach" },
  { id: "m2", name: "Warfarin", ingredient: "warfarin", dose: "5 mg", frequency: 1, times: ["21:00"] },
  { id: "m3", name: "Brufen", ingredient: "ibuprofen", genericName: "Ibuprofen", dose: "400 mg", frequency: 1, times: ["14:00"] },
];

/** Unconfirmed seed doses keyed "daysAgo|medId|time": week 2 (days 1–7) has 1, week 1 (days 8–14) has 5. */
const SEED_SKIPS = new Set(["3|m3|14:00", "8|m2|21:00", "9|m1|07:00", "11|m3|14:00", "12|m2|21:00", "13|m3|14:00"]);
export const SEED_DAYS = 14;

function seedDays(now: Date, dateKey: (d: Date) => string, from: number, to: number, skipDate?: (date: string) => boolean) {
  const taken: Record<string, boolean> = {};
  for (let i = from; i <= to; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12);
    const date = dateKey(d);
    if (skipDate?.(date)) continue;
    for (const m of SEED_MEDS) for (const t of m.times) if (!SEED_SKIPS.has(`${i}|${m.id}|${t}`)) taken[`${date}|${m.id}|${t}`] = true;
  }
  return taken;
}

/** First-visit history: previous 14 completed local days of the starter schedule. Built lazily (never at module scope). */
export function seedTaken(now: Date, dateKey: (d: Date) => string): Record<string, boolean> {
  return seedDays(now, dateKey, 1, SEED_DAYS);
}

/** Adds the older seed week (days 8–14) to browsers holding the earlier 7-day starter. Only fills dates with no records; never overwrites. */
export function extendSeedHistory(meds: Medication[], taken: Record<string, boolean>, now: Date, dateKey: (d: Date) => string) {
  if (!SEED_MEDS.every((s) => meds.some((m) => m.id === s.id))) return null;
  const used = new Set(Object.keys(taken).map((k) => k.split("|")[0]));
  if (!used.size) return null;
  const extra = seedDays(now, dateKey, 8, SEED_DAYS, (d) => used.has(d));
  return { ...extra, ...taken };
}

/** Untouched legacy starter entry from earlier prototype versions. */
const LEGACY_METFORMIN = { id: "m3", name: "Metformin", ingredient: "metformin", dose: "500 mg", frequency: 2, times: ["08:00", "20:00"] };

/** Upgrade saved data still holding the old unedited starter: swap Metformin for Brufen and add the starter history only when none was ever recorded. Edited/user medicines are kept. */
export function upgradeLegacySeed(meds: Medication[], taken: Record<string, boolean>, now: Date, dateKey: (d: Date) => string) {
  const isLegacy = (m: Medication) => JSON.stringify({ id: m.id, name: m.name, ingredient: m.ingredient, dose: m.dose, frequency: m.frequency, times: m.times }) === JSON.stringify(LEGACY_METFORMIN) && !m.nickname && !m.notes;
  if (!meds.some(isLegacy)) return null;
  const brufen = SEED_MEDS.find((m) => m.id === "m3")!;
  const next = meds.filter((m) => !isLegacy(m));
  if (!next.some((m) => m.ingredient === "ibuprofen")) next.push(brufen);
  const hasHistory = Object.values(taken).some(Boolean);
  return { meds: next, taken: hasHistory ? taken : seedTaken(now, dateKey) };
}
