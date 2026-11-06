import { describe, expect, it } from "vitest";
import { confirmedIngredients, medicationCandidate, scanInput, visionResult } from "./scanner";

const unreadable = { readable: false, brand_name: null, generic_name: null, active_ingredients: [], strength: null, dosage_form: null, items: [], uncertainty: "Unreadable label" };
describe("smart scanner safeguards", () => {
  it("never fills missing medication details", () => {
    expect(medicationCandidate(visionResult.parse(unreadable))).toMatchObject({ name: "", ingredient: "", dose: "", genericName: "", dosageForm: "" });
  });
  it("rejects unsupported files and remote image URLs", () => {
    for (const image of ["data:image/gif;base64,AAAA", "https://example.com/image.jpg", "data:text/plain;base64,AAAA"]) expect(scanInput.safeParse({ mode: "food", image, lang: "ar" }).success).toBe(false);
  });
  it("rejects an oversized image before inference", () => {
    expect(scanInput.safeParse({ mode: "food", image: "data:image/jpeg;base64," + "A".repeat(5600000), lang: "ar" }).success).toBe(false);
  });
  it("requires likely food ingredients to stay explicitly uncertain", () => {
    expect(visionResult.parse({ ...unreadable, items: [{ name: "milk", certainty: "likely" }] }).items[0]?.certainty).toBe("likely");
    expect(visionResult.safeParse({ ...unreadable, items: [{ name: "milk", certainty: "verified" }] }).success).toBe(false);
  });
  it("prepares only user confirmed ingredients and preparation, no clinical verdict", () => {
    expect(confirmedIngredients([" tomato ", "", "tomato", "yogurt"], " grilled ")).toEqual({ ingredients: ["tomato", "yogurt"], preparation: "grilled" });
  });
});