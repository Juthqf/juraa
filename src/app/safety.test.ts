import { describe, expect, it } from "vitest";
import type { Medication } from "./data";
import { checkSafety, foodVsMeds, homeAlerts, overall, resolve, searchMeds, type ClinicalData, type DbRecord } from "./safety";

const rec = (o: Partial<DbRecord>): DbRecord => ({ id: o.source_key ?? "r", kind: "ddi", source_key: null, medId: "", otherMedId: null, itemId: null, interaction_description: "وصف", recommendation: "توصية", action_level: "caution", action_level_ar: "انتبه", gap_text_ar: null, reference_text: "[X] ref", evidence_status_ar: "مدعوم بمرجع", pharmacist_reviewed_ar: "نعم", review_status: "unverified", ...o });
const db: ClinicalData = {
  meds: [
    { id: "W", generic_name: "Warfarin", name_ar: "وارفارين", brands: ["Coumadin"], timing_ar: null, meal_ar: null },
    { id: "I", generic_name: "Ibuprofen", name_ar: "إيبوبروفين", brands: ["Brufen"], timing_ar: null, meal_ar: null },
    { id: "A", generic_name: "Aspirin", name_ar: "أسبرين", brands: [], timing_ar: null, meal_ar: null },
    { id: "L", generic_name: "Levothyroxine", name_ar: "ليفوثيروكسين", brands: [], timing_ar: null, meal_ar: null },
    { id: "M", generic_name: "Metformin", name_ar: "ميتفورمين", brands: [], timing_ar: null, meal_ar: null },
  ],
  items: [{ id: "D", source_key: "dairy", name_en: "Dairy", name_ar: "ألبان", item_type: "food" }],
  records: [
    rec({ source_key: "warfarin + ibuprofen", medId: "W", otherMedId: "I", action_level: "avoid", action_level_ar: "تجنب" }),
    rec({ source_key: "warfarin + aspirin", medId: "W", otherMedId: "A" }),
    rec({ source_key: "levothyroxine + dairy", kind: "food", medId: "L", itemId: "D", gap_text_ar: "٤ ساعات" }),
  ],
};
const med = (id: string, ingredient: string, extra: Partial<Medication> = {}): Medication => ({ id, name: ingredient, ingredient, dose: "", frequency: 1, times: ["08:00"], ...extra });

describe("safety check over imported database", () => {
  it("drug–drug avoid record matched via brand name, either order", () => {
    const r = checkSafety(db, ["Brufen"], [med("1", "warfarin")]);
    expect(r[0]?.category).toBe("avoid");
    expect(r[0]?.records[0]?.action_level_ar).toBe("تجنب");
  });
  it("caution record is returned verbatim", () => {
    const r = checkSafety(db, ["aspirin"], [med("1", "Warfarin Sodium")]);
    expect(r[0]?.category).toBe("caution");
    expect(r[0]?.records[0]?.recommendation).toBe("توصية");
  });
  it("known pair with no record is 'none' (shown as the no-record message, never safe)", () => {
    expect(overall(checkSafety(db, ["metformin"], [med("1", "warfarin")]))).toBe("none");
  });
  it("unmatched medicine is 'insufficient', not 'none'", () => {
    expect(overall(checkSafety(db, ["cholecalciferol"], [med("1", "warfarin")]))).toBe("insufficient");
  });
  it("nickname never affects matching", () => {
    expect(checkSafety(db, ["aspirin"], [med("1", "warfarin", { nickname: "Metformin" })])[0]?.category).toBe("caution");
  });
  it("drug–food record for dairy vs saved levothyroxine", () => {
    const h = foodVsMeds(db, ["ألبان"], [med("1", "levothyroxine")]);
    expect(h[0]?.records[0]?.gap_text_ar).toBe("٤ ساعات");
  });
  it("search matches generic, Arabic and brand names", () => {
    expect(searchMeds(db, "coum").map((m) => m.id)).toEqual(["W"]);
    expect(searchMeds(db, "وارف").map((m) => m.id)).toEqual(["W"]);
    expect(resolve(db, ["اسبرين"])?.kind).toBe("med");
  });
  it("home alerts list recorded pairs among saved meds", () => {
    expect(homeAlerts(db, [med("1", "warfarin"), med("2", "ibuprofen"), med("3", "metformin")])).toHaveLength(1);
  });
});
