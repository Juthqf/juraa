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
  { id: "m3", name: "Metformin", ingredient: "metformin", dose: "500 mg", frequency: 2, times: ["08:00", "20:00"] },
];
