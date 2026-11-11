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

/** First-visit history: previous 7 local days of the starter schedule, with two unconfirmed doses. Built lazily (never at module scope). */
export function seedTaken(now: Date, dateKey: (d: Date) => string): Record<string, boolean> {
  const taken: Record<string, boolean> = {};
  const skip = new Set(["2|m3|14:00", "5|m2|21:00"]);
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12);
    for (const m of SEED_MEDS) for (const t of m.times) if (!skip.has(`${i}|${m.id}|${t}`)) taken[`${dateKey(d)}|${m.id}|${t}`] = true;
  }
  return taken;
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
