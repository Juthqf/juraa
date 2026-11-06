// Pure CSV parsing + validation for importing the clinical reference tables
// from Excel-exported CSV files. No database access here — see
// csv-import.functions.ts for the admin-only import step.

export type ImportTable = "references" | "medications" | "drug_food_interactions" | "drug_drug_interactions";
export const SEVERITIES = ["high", "moderate", "low", "unknown"] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Expected CSV header columns per table (medications / references are matched by name, not id). */
export const TEMPLATES: Record<ImportTable, string[]> = {
  references: ["title", "organization_or_authors", "publication_year", "url_or_doi", "verification_date"],
  medications: ["generic_name", "brand_names", "active_ingredients", "strength", "dosage_form"],
  drug_food_interactions: ["generic_name", "food_or_beverage", "interaction_description", "severity", "recommendation", "reference_title"],
  drug_drug_interactions: ["medication_1_generic_name", "medication_2_generic_name", "interaction_description", "severity", "recommendation", "reference_title"],
};

export const MAX_ROWS = 5000;

/** RFC-4180 style parser; handles Excel's UTF-8 BOM, quoted commas/newlines, CRLF and `;` delimiters. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

export type RowError = { row: number; message: string };
export type ValidationResult = { rows: Record<string, unknown>[]; errors: RowError[] };

const list = (s: string) => s.split(/[|;,]/).map((x) => x.trim()).filter(Boolean);
const opt = (s: string | undefined) => (s && s.trim() ? s.trim() : null);

export function validateCsv(table: ImportTable, text: string): ValidationResult {
  const all = parseCsv(text);
  const errors: RowError[] = [];
  if (!all.length) return { rows: [], errors: [{ row: 0, message: "File is empty" }] };
  const header = all[0]!.map((h) => h.trim().toLowerCase());
  const need = TEMPLATES[table];
  const missing = need.filter((c) => !header.includes(c));
  if (missing.length) return { rows: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(", ")}` }] };
  const data = all.slice(1);
  if (data.length > MAX_ROWS) return { rows: [], errors: [{ row: 0, message: `Too many rows (max ${MAX_ROWS})` }] };

  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  data.forEach((cells, i) => {
    const n = i + 2; // spreadsheet row number
    const get = (c: string) => (cells[header.indexOf(c)] ?? "").trim();
    const err = (m: string) => errors.push({ row: n, message: m });
    const req = (c: string, max: number) => {
      const v = get(c);
      if (!v) err(`${c} is required`); else if (v.length > max) err(`${c} is too long (max ${max})`);
      return v;
    };
    const sev = (): Severity => {
      const v = get("severity").toLowerCase();
      if (!v) return "unknown";
      if (!(SEVERITIES as readonly string[]).includes(v)) { err(`severity must be one of ${SEVERITIES.join(", ")}`); return "unknown"; }
      return v as Severity;
    };
    const before = errors.length;
    let out: Record<string, unknown>;
    let key: string;
    if (table === "references") {
      const year = get("publication_year");
      const date = get("verification_date");
      if (year && !(/^\d{4}$/.test(year) && +year >= 1800 && +year <= 2100)) err("publication_year must be a 4-digit year");
      if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))) err("verification_date must be YYYY-MM-DD");
      out = { title: req("title", 500), organization_or_authors: opt(get("organization_or_authors")), publication_year: year ? +year : null, url_or_doi: opt(get("url_or_doi")), verification_date: date || null };
      key = String(out.title).toLowerCase();
    } else if (table === "medications") {
      out = { generic_name: req("generic_name", 200), brand_names: list(get("brand_names")), active_ingredients: list(get("active_ingredients")), strength: opt(get("strength")), dosage_form: opt(get("dosage_form")) };
      key = String(out.generic_name).toLowerCase();
    } else if (table === "drug_food_interactions") {
      out = { generic_name: req("generic_name", 200), food_or_beverage: req("food_or_beverage", 200), interaction_description: req("interaction_description", 4000), severity: sev(), recommendation: opt(get("recommendation")), reference_title: opt(get("reference_title")), review_status: "unverified" };
      key = `${out.generic_name}|${out.food_or_beverage}`.toLowerCase();
    } else {
      const a = req("medication_1_generic_name", 200), b = req("medication_2_generic_name", 200);
      if (a && a.toLowerCase() === b.toLowerCase()) err("medication_1 and medication_2 must differ");
      out = { medication_1_generic_name: a, medication_2_generic_name: b, interaction_description: req("interaction_description", 4000), severity: sev(), recommendation: opt(get("recommendation")), reference_title: opt(get("reference_title")), review_status: "unverified" };
      key = [a, b].map((x) => x.toLowerCase()).sort().join("|");
    }
    if (seen.has(key)) err("Duplicate row in file");
    seen.add(key);
    if (errors.length === before) rows.push(out);
  });
  return { rows, errors };
}
