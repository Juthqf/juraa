// Loads the imported workbook dataset (public-read tables) once per session.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ClinicalData, DbRecord } from "./safety";

const COLS = "id, source_key, interaction_description, recommendation, action_level, action_level_ar, gap_text_ar, reference_text, evidence_status_ar, pharmacist_reviewed_ar, review_status";

async function fetchAll(): Promise<ClinicalData> {
  const [meds, brands, items, ddi, food] = await Promise.all([
    supabase.from("medications").select("id, generic_name, name_ar, timing_ar, meal_ar"),
    supabase.from("medication_brand_names").select("medication_id, brand_name"),
    supabase.from("interaction_items").select("id, source_key, name_en, name_ar, item_type"),
    supabase.from("drug_drug_interactions").select(`${COLS}, medication_1_id, medication_2_id, item_2_id`),
    supabase.from("drug_food_interactions").select(`${COLS}, medication_id, item_id`),
  ]);
  const err = meds.error || brands.error || items.error || ddi.error || food.error;
  if (err) throw err;
  const records: DbRecord[] = [
    ...(ddi.data ?? []).map(({ medication_1_id, medication_2_id, item_2_id, ...r }) => ({ ...r, kind: "ddi" as const, medId: medication_1_id, otherMedId: medication_2_id, itemId: item_2_id })),
    ...(food.data ?? []).map(({ medication_id, item_id, ...r }) => ({ ...r, kind: "food" as const, medId: medication_id, otherMedId: null, itemId: item_id })),
  ];
  return {
    meds: (meds.data ?? []).map((m) => ({ ...m, brands: (brands.data ?? []).filter((b) => b.medication_id === m.id).map((b) => b.brand_name) })),
    items: items.data ?? [],
    records,
  };
}

let cache: Promise<ClinicalData> | null = null;
export type ClinicalState = { status: "loading" } | { status: "error" } | { status: "ready"; db: ClinicalData };

export function useClinicalData(): ClinicalState {
  const [s, setS] = useState<ClinicalState>({ status: "loading" });
  useEffect(() => {
    let live = true;
    cache ??= fetchAll().catch((e) => { cache = null; throw e; });
    cache.then((db) => live && setS({ status: "ready", db }), () => live && setS({ status: "error" }));
    return () => { live = false; };
  }, []);
  return s;
}
