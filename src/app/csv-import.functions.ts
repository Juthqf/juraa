import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateCsv, type ImportTable } from "./csv-import";

const TABLES: ImportTable[] = ["references", "medications", "drug_food_interactions", "drug_drug_interactions"];

/**
 * Admin-only CSV import. `dryRun: true` (default) only validates and reports.
 * Rows are inserted as the signed-in user, so database security rules apply;
 * interactions always land as "unverified". Nothing is updated or deleted.
 */
export const importCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { table: ImportTable; csv: string; dryRun?: boolean }) => {
    if (!TABLES.includes(i.table)) throw new Error("Unknown table");
    if (typeof i.csv !== "string" || i.csv.length > 5_000_000) throw new Error("File too large");
    return { table: i.table, csv: i.csv, dryRun: i.dryRun !== false };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { rows, errors } = validateCsv(data.table, data.csv);
    if (data.table === "drug_food_interactions" || data.table === "drug_drug_interactions") {
      const { data: meds } = await supabase.from("medications").select("id, generic_name");
      const { data: refs } = await supabase.from("references").select("id, title");
      const medId = new Map((meds ?? []).map((m) => [m.generic_name.toLowerCase(), m.id]));
      const refId = new Map((refs ?? []).map((r) => [r.title.toLowerCase(), r.id]));
      const resolved: Record<string, unknown>[] = [];
      rows.forEach((r, i) => {
        const look = (k: string) => medId.get(String(r[k]).toLowerCase());
        const ref = r.reference_title ? refId.get(String(r.reference_title).toLowerCase()) : null;
        if (r.reference_title && !ref) { errors.push({ row: i + 2, message: `Unknown reference: ${r.reference_title}` }); return; }
        const base = { interaction_description: r.interaction_description, severity: r.severity, recommendation: r.recommendation, reference_id: ref, review_status: "unverified" };
        if (data.table === "drug_food_interactions") {
          const m = look("generic_name");
          if (!m) { errors.push({ row: i + 2, message: `Unknown medication: ${r.generic_name}` }); return; }
          resolved.push({ ...base, medication_id: m, food_or_beverage: r.food_or_beverage });
        } else {
          const a = look("medication_1_generic_name"), b = look("medication_2_generic_name");
          if (!a || !b) { errors.push({ row: i + 2, message: "Unknown medication in pair" }); return; }
          resolved.push({ ...base, medication_1_id: a, medication_2_id: b });
        }
      });
      rows.splice(0, rows.length, ...resolved);
    }

    if (errors.length || data.dryRun) return { inserted: 0, valid: rows.length, errors };
    // All-or-nothing: a single insert is one transaction.
    const { error } = await supabase.from(data.table).insert(rows as never);
    if (error) return { inserted: 0, valid: rows.length, errors: [{ row: 0, message: error.message }] };
    return { inserted: rows.length, valid: rows.length, errors };
  });
