// Pure safety matching over the imported Juraa workbook dataset (see clinical-data.ts).
// Records are shown verbatim; nothing here generates clinical text.
import type { Medication } from "./data";

export type DbMed = { id: string; generic_name: string; name_ar: string | null; brands: string[]; timing_ar: string | null; meal_ar: string | null };
export type DbItem = { id: string; source_key: string; name_en: string; name_ar: string; item_type: string };
export type DbRecord = {
  id: string;
  kind: "ddi" | "food";
  source_key: string | null;
  medId: string;
  otherMedId: string | null;
  itemId: string | null;
  interaction_description: string;
  recommendation: string | null;
  action_level: string | null;
  action_level_ar: string | null;
  gap_text_ar: string | null;
  reference_text: string | null;
  evidence_status_ar: string | null;
  pharmacist_reviewed_ar: string | null;
  review_status: string;
};
export type ClinicalData = { meds: DbMed[]; items: DbItem[]; records: DbRecord[] };
export type Entity = { kind: "med"; med: DbMed } | { kind: "item"; item: DbItem };

export type SafetyCategory = "avoid" | "caution" | "none" | "insufficient";
export type SafetyResult = { against: Medication; category: SafetyCategory; records: DbRecord[] };

export const norm = (s: string) =>
  s.normalize("NFKC").toLowerCase().replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[_\s]+/g, " ").trim();

const word = (hay: string, needle: string) => needle.length >= 3 && new RegExp(`(^|[^\\p{L}])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "u").test(hay);

/** Match free text (generic, Arabic or brand name) to one database medication or item. */
export function resolve(db: ClinicalData, texts: (string | undefined)[]): Entity | null {
  const ts = texts.filter((t): t is string => !!t && !!t.trim()).map(norm);
  for (const t of ts) {
    const m = db.meds.find((m) => norm(m.generic_name) === t || (m.name_ar && norm(m.name_ar) === t) || m.brands.some((b) => norm(b) === t));
    if (m) return { kind: "med", med: m };
    const i = db.items.find((i) => norm(i.name_en) === t || norm(i.source_key) === t || norm(i.name_ar) === t);
    if (i) return { kind: "item", item: i };
  }
  for (const t of ts) {
    const m = db.meds.find((m) => word(t, norm(m.generic_name)) || (m.name_ar && word(norm(m.name_ar), t)) || (m.name_ar && word(t, norm(m.name_ar))));
    if (m) return { kind: "med", med: m };
  }
  return null;
}

/** Clinical identity of a saved medication — the nickname is never used. */
export const medTexts = (m: Pick<Medication, "ingredient" | "genericName" | "name">) => [m.ingredient, m.genericName, m.name];

const same = (a: Entity, b: Entity) => a.kind === b.kind && (a.kind === "med" ? a.med.id === (b as { med: DbMed }).med.id : a.item.id === (b as { item: DbItem }).item.id);

export function pairRecords(db: ClinicalData, x: Entity, y: Entity): DbRecord[] {
  if (x.kind === "item" && y.kind === "item") return [];
  if (x.kind === "med" && y.kind === "med")
    return db.records.filter((r) => r.otherMedId && ((r.medId === x.med.id && r.otherMedId === y.med.id) || (r.medId === y.med.id && r.otherMedId === x.med.id)));
  const med = x.kind === "med" ? x.med : (y as { med: DbMed }).med;
  const item = x.kind === "item" ? x.item : (y as { item: DbItem }).item;
  return db.records.filter((r) => r.medId === med.id && r.itemId === item.id);
}

const categoryOf = (records: DbRecord[]): SafetyCategory =>
  !records.length ? "none" : records.some((r) => r.action_level === "avoid") ? "avoid" : "caution";

export function checkSafety(db: ClinicalData, candidate: (string | undefined)[], saved: Medication[]): SafetyResult[] {
  const c = resolve(db, candidate);
  const out: SafetyResult[] = [];
  for (const m of saved) {
    const o = resolve(db, medTexts(m));
    if (c && o && same(c, o)) continue;
    if (!c && candidate.some((t) => t && medTexts(m).some((s) => s && norm(s) === norm(t)))) continue;
    if (!c || !o) { out.push({ against: m, category: "insufficient", records: [] }); continue; }
    const records = pairRecords(db, c, o);
    out.push({ against: m, category: categoryOf(records), records });
  }
  return out;
}

const RANK: Record<SafetyCategory, number> = { avoid: 0, caution: 1, insufficient: 2, none: 3 };
export function overall(results: SafetyResult[]): SafetyCategory {
  if (!results.length) return "insufficient";
  return results.reduce((a, r) => (RANK[r.category] < RANK[a] ? r.category : a), "none" as SafetyCategory);
}

/** Food / supplement / OTC records listed for one medication. */
export const itemRecordsForMed = (db: ClinicalData, medId: string) => db.records.filter((r) => r.medId === medId && r.itemId);

/** Records between named foods/items and the user's saved medications. */
export function foodVsMeds(db: ClinicalData, foodNames: string[], saved: Medication[]) {
  const out: { med: Medication; item: DbItem; records: DbRecord[] }[] = [];
  const seen = new Set<string>();
  for (const f of foodNames) {
    const e = resolve(db, [f]);
    if (!e || e.kind !== "item") continue;
    for (const m of saved) {
      const o = resolve(db, medTexts(m));
      const key = e.item.id + "|" + m.id;
      if (!o || o.kind !== "med" || seen.has(key)) continue;
      seen.add(key);
      const records = pairRecords(db, e, o);
      if (records.length) out.push({ med: m, item: e.item, records });
    }
  }
  return out;
}

export function searchMeds(db: ClinicalData, q: string): DbMed[] {
  const t = norm(q);
  if (!t) return [];
  return db.meds.filter((m) => norm(m.generic_name).includes(t) || (m.name_ar && norm(m.name_ar).includes(t)) || m.brands.some((b) => norm(b).includes(t)));
}

export function homeAlerts(db: ClinicalData, meds: Medication[]) {
  return meds.flatMap((m, i) =>
    checkSafety(db, medTexts(m), meds.slice(i + 1)).filter((r) => r.category === "avoid" || r.category === "caution").map((r) => ({ a: m, ...r })),
  );
}
