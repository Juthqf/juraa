import { describe, expect, it } from "vitest";
import { parseCsv, validateCsv } from "./csv-import";

describe("csv import", () => {
  it("parses Excel BOM, quotes and semicolons", () => {
    expect(parseCsv('\uFEFFa;b\r\n"x;1";"say ""hi"""\r\n')).toEqual([["a", "b"], ["x;1", 'say "hi"']]);
  });

  it("forces imported interactions to unverified even if the file says verified", () => {
    const csv = "medication_1_generic_name,medication_2_generic_name,interaction_description,severity,recommendation,reference_title,review_status\nA,B,desc,high,,,verified";
    const r = validateCsv("drug_drug_interactions", csv);
    expect(r.errors).toEqual([]);
    expect(r.rows[0]?.["review_status"]).toBe("unverified");
  });

  it("rejects a drug paired with itself", () => {
    const csv = "medication_1_generic_name,medication_2_generic_name,interaction_description,severity,recommendation,reference_title\nA,a,desc,,,";
    expect(validateCsv("drug_drug_interactions", csv).errors[0]?.message).toMatch(/must differ/);
  });

  it("rejects unknown severity and missing columns", () => {
    const bad = "generic_name,food_or_beverage,interaction_description,severity,recommendation,reference_title\nA,milk,desc,severe,,";
    expect(validateCsv("drug_food_interactions", bad).errors).toHaveLength(1);
    expect(validateCsv("medications", "generic_name\nA").errors[0]?.message).toMatch(/Missing columns/);
  });

  it("rejects duplicate pairs regardless of order", () => {
    const csv = "medication_1_generic_name,medication_2_generic_name,interaction_description,severity,recommendation,reference_title\nA,B,d,,,\nB,A,d,,,";
    expect(validateCsv("drug_drug_interactions", csv).errors[0]?.row).toBe(3);
  });
});
