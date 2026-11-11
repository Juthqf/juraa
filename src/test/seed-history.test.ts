import { describe, expect, it } from "vitest";
import { SEED_MEDS, seedTaken } from "@/app/data";
import { localDate } from "@/app/dose-time";

describe("first-visit history", () => {
  it("covers the previous 7 days with exactly two unconfirmed doses and nothing today", () => {
    const now = new Date(2026, 10, 12, 10, 0);
    const taken = seedTaken(now, localDate);
    const perDay = SEED_MEDS.reduce((s, m) => s + m.times.length, 0);
    expect(Object.keys(taken)).toHaveLength(7 * perDay - 2);
    expect(Object.keys(taken).some((k) => k.startsWith(localDate(now)))).toBe(false);
  });
  it("starter profile is warfarin, ibuprofen and levothyroxine", () => {
    expect(SEED_MEDS.map((m) => m.ingredient).sort()).toEqual(["ibuprofen", "levothyroxine", "warfarin"]);
  });
});
