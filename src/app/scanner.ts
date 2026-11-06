import { z } from "zod";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const scanInput = z.object({
  mode: z.enum(["medication", "food"]),
  image: z.string().max(Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 80).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/),
  lang: z.enum(["ar", "en"]),
});
export type ScanMode = "medication" | "food";
const visibleText = z.string().max(500).nullable();
export const visionResult = z.object({
  readable: z.boolean(),
  brand_name: visibleText,
  generic_name: visibleText,
  active_ingredients: z.array(z.string().max(200)).max(20),
  strength: visibleText,
  dosage_form: visibleText,
  items: z.array(z.object({ name: z.string().max(200), certainty: z.enum(["visible", "likely"]) })).max(30),
  uncertainty: z.string().max(1500),
});
export type VisionResult = z.infer<typeof visionResult>;
export const visionJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    readable: { type: "boolean" },
    brand_name: { type: ["string", "null"] }, generic_name: { type: ["string", "null"] },
    active_ingredients: { type: "array", items: { type: "string" } },
    strength: { type: ["string", "null"] }, dosage_form: { type: ["string", "null"] },
    items: { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, certainty: { type: "string", enum: ["visible", "likely"] } }, required: ["name", "certainty"] } },
    uncertainty: { type: "string" },
  },
  required: ["readable", "brand_name", "generic_name", "active_ingredients", "strength", "dosage_form", "items", "uncertainty"],
};

export function medicationCandidate(result: VisionResult) {
  return { name: result.brand_name ?? result.generic_name ?? "", ingredient: result.active_ingredients.join(", "), dose: result.strength ?? "", genericName: result.generic_name ?? "", dosageForm: result.dosage_form ?? "", source: "vision" as const, uncertainty: result.uncertainty };
}

export function confirmedIngredients(items: string[], details: string) {
  return { ingredients: [...new Set(items.map((s) => s.trim()).filter(Boolean))], preparation: details.trim() };
}