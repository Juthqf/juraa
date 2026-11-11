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
    const [side, m] = k.split("|"); const dAr = durationText(Number(m), "ar"); const dEn = durationText(Number(m), "en");
    if (side === "drug_first") { ar.push(`انتظر ${dAr} بعد الجرعة قبل ${joinAr(foods)}`); en.push(`wait ${dEn} after your dose before ${joinEn(foods)}`); }
    else if (side === "food_first") { ar.push(`بعد ${joinAr(foods)} انتظر ${dAr} قبل الجرعة`); en.push(`after ${joinEn(foods)}, wait ${dEn} before your dose`); }
    else { ar.push(`خلّ ${dAr} على الأقل بينه وبين ${joinAr(foods)}`); en.push(`keep at least ${dEn} between it and ${joinEn(foods)}`); }
  }
  if (general.length) { ar.push(`وانتبه لـ${joinAr(general)}`); en.push(`and take care with ${joinEn(general)}`); }
  const name = companionName(companion, lang);
  return lang === "ar"
    ? { kind: "food", title: `تذكير غذائي من ${name} 🍽️`, body: `مع ${medicine}: ${ar.join("، ")}. معلومة تجريبية، والصيدلي مرجعك.` }
    : { kind: "food", title: `Food tip from ${name} 🍽️`, body: `With ${medicine}: ${en.join("; ")}. Prototype info — your pharmacist knows best.` };
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
