import { describe, expect, it } from "vitest";
import { upgradeLegacySeed, SEED_MEDS, type Medication } from "@/app/data";
import { localDate } from "@/app/dose-time";
import { computeJourney } from "@/app/journey";

const legacy: Medication[] = [SEED_MEDS[0]!, SEED_MEDS[1]!, { id: "m3", name: "Metformin", ingredient: "metformin", dose: "500 mg", frequency: 2, times: ["08:00", "20:00"] }];

describe("legacy starter upgrade", () => {
  it("replaces unedited Metformin with Brufen and seeds history when none exists", () => {
    const up = upgradeLegacySeed(legacy, {}, new Date(2026, 10, 12, 0, 30), localDate)!;
    expect(up.meds.map((m) => m.name)).toEqual(["Levothyroxine", "Warfarin", "Brufen"]);
    expect(Object.keys(up.taken)).toHaveLength(19);
  });
  it("leaves edited medicine lists alone", () => {
    expect(upgradeLegacySeed(SEED_MEDS, {}, new Date(), localDate)).toBeNull();
  });
  it("journey counts the seeded week with local dates just after local midnight", () => {
    const now = new Date(2026, 10, 12, 0, 30);
    const up = upgradeLegacySeed(legacy, {}, now, localDate)!;
    const s = computeJourney(up.meds, up.taken, "week", now);
    expect(s.taken).toBe(16); // 6 full past days in a 7-day window incl. today
    expect(computeJourney(up.meds, up.taken, "all", now).taken).toBe(19);
    expect(computeJourney(up.meds, up.taken, "all", now).missed).toBe(2);
  });
});
