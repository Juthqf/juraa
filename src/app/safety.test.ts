import { describe, expect, it } from "vitest";
import { SEED_MEDS } from "./data";
import { checkSafety, overall } from "./safety";

describe("safety check (sample data)", () => {
  it("flags an interaction for aspirin vs saved warfarin", () => {
    const r = checkSafety("aspirin", SEED_MEDS);
    expect(r.find((x) => x.against.ingredient === "warfarin")?.category).toBe("interaction");
    expect(overall(r)).toBe("interaction");
  });
  it("flags a timing consideration for iron vs levothyroxine", () => {
    const r = checkSafety("iron", SEED_MEDS);
    expect(r.find((x) => x.against.ingredient === "levothyroxine")?.category).toBe("timing");
  });
  it("reports no interaction in sample data for paracetamol", () => {
    expect(overall(checkSafety("paracetamol", SEED_MEDS))).toBe("none");
  });
  it("reports insufficient information for unknown ingredients", () => {
    expect(overall(checkSafety("cholecalciferol", SEED_MEDS))).toBe("insufficient");
  });
});
