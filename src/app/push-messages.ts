// Pure reminder rules: which doses are due, which food records may produce a timed reminder, and the wording.
export type Lang = "ar" | "en";
export type ScheduleRow = { med_id: string; med_name: string; ingredient: string; generic_name: string; dose_time: string };
export type FoodRecord = {
  generic_name: string; brands: string[]; food_or_beverage: string;
  gap_minutes: number | null; gap_side: string | null; review_status: string;
  pharmacist_reviewed_ar: string | null; evidence_status_code: string | null;
};
export type Note = { kind: string; title: string; body: string };

/** Window after the scheduled minute during which a dose may still be sent (covers scheduler spread/late runs). */
export const SEND_WINDOW_MIN = 10;

export function localParts(now: Date, timeZone: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p['year']}-${p['month']}-${p['day']}`, minutes: Number(p['hour']) * 60 + Number(p['minute']) };
}

export function isValidTimeZone(tz: string) {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; }
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Doses whose scheduled local minute has arrived within the send window. */
export function dueDoses(rows: ScheduleRow[], now: Date, timeZone: string) {
  const { date, minutes } = localParts(now, timeZone);
  return { date, due: rows.filter((r) => { const d = minutes - toMin(r.dose_time); return d >= 0 && d < SEND_WINDOW_MIN; }) };
}

/** Evidence levels usable in prototype food reminders; open-evidence rows (needs reference, insufficient, conflicting) are left out. */
const PROTOTYPE_EVIDENCE = ["supported", "partial"];
/** Prototype rule (approved): existing records may be used without changing review status. Timing only from an exact stored gap. */
export function isFoodUsable(f: FoodRecord) {
  return PROTOTYPE_EVIDENCE.includes(f.evidence_status_code ?? "") && f.food_or_beverage.trim().length > 0;
}
export function isTimedEligible(f: FoodRecord) {
  return isFoodUsable(f) && f.pharmacist_reviewed_ar?.trim() === "نعم" && f.evidence_status_code === "supported"
    && typeof f.gap_minutes === "number" && f.gap_minutes > 0 && ["drug_first", "food_first", "both"].includes(f.gap_side ?? "");
}

const norm = (s: string) => s.trim().toLowerCase();
export function recordsFor(row: ScheduleRow, foods: FoodRecord[]) {
  const names = [row.med_name, row.ingredient, row.generic_name].map(norm).filter(Boolean);
  return foods.filter((f) => [f.generic_name, ...f.brands].map(norm).some((n) => names.includes(n)));
}

export function durationText(mins: number, lang: Lang) {
  if (mins % 60 !== 0) return lang === "ar" ? `${mins} دقيقة` : `${mins} minutes`;
  const h = mins / 60;
  if (lang === "en") return h === 1 ? "1 hour" : `${h} hours`;
  return h === 1 ? "ساعة" : h === 2 ? "ساعتين" : h <= 10 ? `${h} ساعات` : `${h} ساعة`;
}
const joinAr = (xs: string[]) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join("، ")} و${xs[xs.length - 1]}`;
const joinEn = (xs: string[]) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export type Companion = "kabsoul" | "kabsoula";
const companionName = (c: Companion, lang: Lang) => lang === "ar" ? (c === "kabsoul" ? "كبسول" : "كبسولة") : c === "kabsoul" ? "Kabsoul" : "Kabsoula";

/** Arabic food name with the definite article for natural phrasing (single words only; database text otherwise untouched). */
export function withAl(name: string) {
  const n = name.trim();
  return /\s/.test(n) || n.startsWith("ال") ? n : `ال${n}`;
}
/** "بساعة", "بساعتين", "بـ4 ساعات", "بـ30 دقيقة". */
function byDurationAr(mins: number) {
  const d = durationText(mins, "ar");
  return d === "ساعة" || d === "ساعتين" ? `ب${d}` : `بـ${d}`;
}
const joinAlAr = (xs: string[]) => xs.map(withAl).join("، ").replace(/، ([^،]+)$/, " و$1");

/**
 * One grouped food note per dose, built only from stored records: exact gaps keep their stored direction,
 * records without an exact gap are mentioned without any timing. Returns null when nothing applies.
 * Food names are database text (Arabic); never phrased as if the user consumed anything.
 */
export function foodGroupNote(records: FoodRecord[], medicine: string, companion: Companion, lang: Lang): Note | null {
  const usable = records.filter(isFoodUsable);
  const seen = new Set<string>(); const uniq = usable.filter((f) => { const k = f.food_or_beverage.trim(); if (seen.has(k)) return false; seen.add(k); return true; });
  if (!uniq.length) return null;
  const timed = uniq.filter(isTimedEligible); const general = uniq.filter((f) => !isTimedEligible(f)).map((f) => f.food_or_beverage.trim());
  const groups = new Map<string, string[]>();
  for (const f of timed) { const k = `${f.gap_side}|${f.gap_minutes}`; groups.set(k, [...(groups.get(k) ?? []), f.food_or_beverage.trim()]); }
  const ar: string[] = []; const en: string[] = [];
  for (const [k, foods] of groups) {
    const [side, m] = k.split("|"); const mins = Number(m); const dEn = durationText(mins, "en");
    if (side === "drug_first") { ar.push(`خلّ ${joinAlAr(foods)} بعد الجرعة ${byDurationAr(mins)}`); en.push(`have ${joinEn(foods)} at least ${dEn} after your dose`); }
    else if (side === "food_first") { ar.push(`خلّ جرعتك بعد ${joinAlAr(foods)} ${byDurationAr(mins)}`); en.push(`take your dose at least ${dEn} after ${joinEn(foods)}`); }
    else { ar.push(`افصل بين علاجك و${joinAlAr(foods)} ${durationText(mins, "ar")} على الأقل`); en.push(`keep at least ${dEn} between your medicine and ${joinEn(foods)}`); }
  }
  const name = companionName(companion, lang);
  const gAr = `تقدر تراجع تعليمات ${joinAlAr(general)} داخل جرعة.`; const gEn = `you can check the notes on ${joinEn(general)} in Juraa.`;
  const arMain = ar.length ? `مع ${medicine}، ${ar.join("، و")}.` : `مع ${medicine}، ${gAr}`;
  const enMain = en.length ? `With ${medicine}, ${en.join("; and ")}.` : `With ${medicine}, ${gEn}`;
  const arGen = general.length && ar.length ? ` و${gAr}` : "";
  const enGen = general.length && en.length ? ` ${gEn[0]!.toUpperCase()}${gEn.slice(1)}` : "";
  return lang === "ar"
    ? { kind: "food", title: `بس تذكير صغير من ${name} 💚`, body: `${arMain}${arGen} معلومة تجريبية، والصيدلي مرجعك.` }
    : { kind: "food", title: `A quick reminder from ${name} 💚`, body: `${enMain}${enGen} Prototype info — your pharmacist knows best.` };
}

/** Proactive preparation reminder: this iteration only for Levothyroxine with its calcium and iron records. */
export const PREP_LEAD_MIN = 60; // notification preference, not a medical rule
export const QUIET_START_MIN = 22 * 60; export const QUIET_END_MIN = 7 * 60;
const PREP_MEDICINE = "levothyroxine"; const PREP_FOODS = ["كالسيوم", "حديد"];
export const inQuietHours = (min: number) => min >= QUIET_START_MIN || min < QUIET_END_MIN;

/** Records allowed to drive a prep reminder for this dose (exact stored gap, both directions). */
export function prepRecords(row: ScheduleRow, foods: FoodRecord[]) {
  return recordsFor(row, foods).filter((f) => norm(f.generic_name) === PREP_MEDICINE && PREP_FOODS.includes(f.food_or_beverage.trim())
    && isTimedEligible(f) && f.gap_side === "both");
}

/** Doses whose prep minute (dose − lead) is now, same local day, outside quiet hours. Never sent at or after the dose time. */
export function duePrep(rows: ScheduleRow[], now: Date, timeZone: string, lead = PREP_LEAD_MIN) {
  const { date, minutes } = localParts(now, timeZone);
  return { date, due: rows.filter((r) => {
    const at = toMin(r.dose_time) - lead; if (at < 0 || inQuietHours(at)) return false;
    const d = minutes - at; return d >= 0 && d < Math.min(SEND_WINDOW_MIN, lead);
  }) };
}

export function prepNote(records: FoodRecord[], medicine: string, lang: Lang, lead = PREP_LEAD_MIN): Note | null {
  if (!records.length) return null;
  const groups = new Map<number, string[]>();
  for (const f of records) groups.set(f.gap_minutes!, [...(groups.get(f.gap_minutes!) ?? []), f.food_or_beverage.trim()]);
  const ar = [...groups].map(([m, fs]) => `إذا تستخدم ${fs.map(withAl).join(" أو ")}، تذكّر تخلّي بينه وبين علاجك ${durationText(m, "ar")} على الأقل`);
  const en = [...groups].map(([m, fs]) => `if you use ${joinEn(fs).replace(" and ", " or ")}, remember to keep at least ${durationText(m, "en")} between it and your medicine`);
  return lang === "ar"
    ? { kind: "prep", title: "تذكير قبل موعد علاجك 💚", body: `باقي ${durationText(lead, "ar")} على ${medicine}. ${ar.join(". و")}. معلومة تجريبية، والصيدلي مرجعك.` }
    : { kind: "prep", title: "Before your medicine time 💚", body: `${durationText(lead, "en")} until ${medicine}. ${en.join(". And ")[0]!.toUpperCase()}${en.join(". And ").slice(1)}. Prototype info — your pharmacist knows best.` };
}

/** Prep sample for the test button (device's own Levothyroxine, else the stored Levothyroxine records). */
export function samplePrepNote(rows: ScheduleRow[], foods: FoodRecord[], lang: Lang): Note | null {
  for (const r of rows) { const n = prepNote(prepRecords(r, foods), r.med_name, lang); if (n) return { ...n, kind: "test-prep" }; }
  const base = { med_id: "", med_name: "Levothyroxine", ingredient: "levothyroxine", generic_name: "levothyroxine", dose_time: "08:00" };
  const n = prepNote(prepRecords(base, foods), "Levothyroxine", lang);
  return n && { ...n, kind: "test-prep" };
}

/** Representative grouped note for the test button (prefers the device's own medicines). */
export function sampleFoodNote(rows: ScheduleRow[], foods: FoodRecord[], companion: Companion, lang: Lang): Note | null {
  for (const r of rows) { const n = foodGroupNote(recordsFor(r, foods), r.med_name, companion, lang); if (n) return { ...n, kind: "test-food" }; }
  const lev = foods.filter((f) => norm(f.generic_name) === "levothyroxine");
  const n = foodGroupNote(lev, "Levothyroxine", companion, lang);
  return n && { ...n, kind: "test-food" };
}

export function doseNote(medicine: string, lang: Lang): Note {
  return lang === "ar"
    ? { kind: "dose", title: "حان وقت علاجك 💚", body: `جاء موعد ${medicine}. إذا أخذت جرعتك، لا تنسى تسجّلها عشان نتابع تقدمك سوا.` }
    : { kind: "dose", title: "Time for your medicine 💚", body: `It's time for ${medicine}. Once you've taken it, log it so we can follow your progress together.` };
}

export function testNote(companion: Companion, lang: Lang): Note {
  const name = lang === "ar" ? (companion === "kabsoul" ? "كبسول" : "كبسولة") : companion === "kabsoul" ? "Kabsoul" : "Kabsoula";
  return lang === "ar"
    ? { kind: "test", title: `أهلًا من ${name} 💚`, body: "التنبيهات شغّالة على هذا الجهاز. بنذكّرك بمواعيد أدويتك بإذن الله." }
    : { kind: "test", title: `Hello from ${name} 💚`, body: "Notifications are working on this device. We'll remind you of your medicine times." };
}
