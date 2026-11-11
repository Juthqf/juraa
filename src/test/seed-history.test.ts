import { describe, expect, it } from "vitest";
import { SEED_MEDS, seedTaken, extendSeedHistory } from "@/app/data";
import { localDate } from "@/app/dose-time";
import { compareWeeks } from "@/app/journey";

const now = new Date(2026, 10, 12, 10, 0);

describe("first-visit history", () => {
  it("covers the previous 14 days with six unconfirmed doses and nothing today", () => {
    const taken = seedTaken(now, localDate);
    const perDay = SEED_MEDS.reduce((s, m) => s + m.times.length, 0);
    expect(Object.keys(taken)).toHaveLength(14 * perDay - 6);
    expect(Object.keys(taken).some((k) => k.startsWith(localDate(now)))).toBe(false);
  });
  it("second week improves on the first: 16/21 then 20/21, 36/42 overall", () => {
    const w = compareWeeks(SEED_MEDS, seedTaken(now, localDate), now);
    expect(w.previous).toEqual({ taken: 16, eligible: 21, adherence: 76 });
    expect(w.last).toEqual({ taken: 20, eligible: 21, adherence: 95 });
    expect(w.overall).toEqual({ taken: 36, eligible: 42, adherence: 86 });
  });
  it("extending an older 7-day history only fills empty dates and never overwrites", () => {
    const recent = { [`${localDate(new Date(2026, 10, 11, 12))}|m1|07:00`]: true, [`${localDate(new Date(2026, 10, 3, 12))}|m1|07:00`]: false };
    const ext = extendSeedHistory(SEED_MEDS, recent, now, localDate)!;
    expect(ext[`${localDate(new Date(2026, 10, 3, 12))}|m1|07:00`]).toBe(false);
    expect(ext[`${localDate(new Date(2026, 10, 4, 12))}|m1|07:00`]).toBe(true);
    expect(extendSeedHistory(SEED_MEDS, {}, now, localDate)).toBeNull();
  });
  it("starter profile is warfarin, ibuprofen and levothyroxine", () => {
    expect(SEED_MEDS.map((m) => m.ingredient).sort()).toEqual(["ibuprofen", "levothyroxine", "warfarin"]);
  });
});
