import { KNOWN_INGREDIENTS, SAMPLE_INTERACTIONS, type Medication, type SampleInteraction } from "./data";

export type SafetyCategory = "interaction" | "timing" | "none" | "insufficient";

export type SafetyResult = {
  against: Medication;
  category: SafetyCategory;
  entry?: SampleInteraction;
};

const norm = (s: string) => s.trim().toLowerCase();

/** Compare one ingredient against each saved medication using the sample dataset. */
export function checkSafety(ingredient: string, saved: Medication[]): SafetyResult[] {
  const ing = norm(ingredient);
  return saved
    .filter((m) => norm(m.ingredient) !== ing)
    .map((m) => {
      const other = norm(m.ingredient);
      const entry = SAMPLE_INTERACTIONS.find(
        (e) => (e.a === ing && e.b === other) || (e.b === ing && e.a === other),
      );
      if (entry) return { against: m, category: entry.kind, entry };
      if (KNOWN_INGREDIENTS.has(ing) && KNOWN_INGREDIENTS.has(other)) return { against: m, category: "none" };
      return { against: m, category: "insufficient" };
    });
}

const RANK: Record<SafetyCategory, number> = { interaction: 0, timing: 1, insufficient: 2, none: 3 };
export function overall(results: SafetyResult[]): SafetyCategory {
  if (!results.length) return "insufficient";
  return results.reduce((a, r) => (RANK[r.category] < RANK[a] ? r.category : a), "none" as SafetyCategory);
}
