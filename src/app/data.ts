// Seed data and ILLUSTRATIVE demo datasets.
// None of this is a verified clinical source. Replace `SAMPLE_INTERACTIONS`
// with a verified medication database before any real-world use.

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

// Products the simulated scanner / manual search can "recognise".
export type CatalogItem = { name: string; ingredient: string; dose: string };
export const CATALOG: CatalogItem[] = [
  { name: "Simvastatin", ingredient: "simvastatin", dose: "20 mg" },
  { name: "Ferrous Sulfate (Iron)", ingredient: "iron", dose: "200 mg" },
  { name: "Aspirin", ingredient: "aspirin", dose: "81 mg" },
  { name: "Paracetamol", ingredient: "paracetamol", dose: "500 mg" },
  { name: "Amlodipine", ingredient: "amlodipine", dose: "5 mg" },
  { name: "Vitamin D3", ingredient: "cholecalciferol", dose: "1000 IU" },
];

export type InteractionKind = "interaction" | "timing";
export type SampleInteraction = {
  a: string;
  b: string;
  kind: InteractionKind;
  severity?: "high" | "moderate" | "low";
  reason: { ar: string; en: string };
  reference: string;
};

// ILLUSTRATIVE DEMO DATA — not verified, for prototype demonstration only.
export const SAMPLE_INTERACTIONS: SampleInteraction[] = [
  {
    a: "warfarin",
    b: "aspirin",
    kind: "interaction",
    severity: "high",
    reason: {
      ar: "مثال توضيحي: الجمع بين مميّع الدم والأسبرين قد يزيد خطر النزيف.",
      en: "Illustrative example: combining a blood thinner with aspirin may raise bleeding risk.",
    },
    reference: "Illustrative demo entry — not a verified source",
  },
  {
    a: "levothyroxine",
    b: "iron",
    kind: "timing",
    severity: "moderate",
    reason: {
      ar: "مثال توضيحي: الحديد قد يقلل امتصاص Levothyroxine إذا أُخذا في وقت متقارب.",
      en: "Illustrative example: iron may reduce levothyroxine absorption when taken close together.",
    },
    reference: "Illustrative demo entry — not a verified source",
  },
  {
    a: "simvastatin",
    b: "amlodipine",
    kind: "interaction",
    severity: "moderate",
    reason: {
      ar: "مثال توضيحي: قد يرفع هذا الجمع تركيز Simvastatin في الدم.",
      en: "Illustrative example: this combination may raise simvastatin levels.",
    },
    reference: "Illustrative demo entry — not a verified source",
  },
];

// Ingredients the sample dataset "knows about" (used to tell "no interaction in
// sample data" apart from "insufficient information").
export const KNOWN_INGREDIENTS = new Set([
  "warfarin", "aspirin", "levothyroxine", "iron", "simvastatin", "amlodipine",
  "metformin", "paracetamol",
]);
