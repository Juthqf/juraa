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

/** A food record may drive a timed reminder only when every safeguard holds; unverified records never qualify. */
export function isTimedEligible(f: FoodRecord) {
  return f.review_status === "verified" && f.pharmacist_reviewed_ar?.trim() === "نعم" && f.evidence_status_code === "supported"
    && typeof f.gap_minutes === "number" && f.gap_minutes > 0 && (f.gap_side === "drug_first" || f.gap_side === "both");
}

const norm = (s: string) => s.trim().toLowerCase();
export function recordsFor(row: ScheduleRow, foods: FoodRecord[]) {
  const names = [row.med_name, row.ingredient, row.generic_name].map(norm).filter(Boolean);
  return foods.filter((f) => [f.generic_name, ...f.brands].map(norm).some((n) => names.includes(n)));
}

const COFFEE = ["قهوة"]; const SUPPLEMENTS: Record<string, string> = { "كالسيوم": "calcium", "حديد": "iron" };

/** Wording only for record shapes we have an approved template for; anything else returns null (no reminder). */
export function foodNote(f: FoodRecord, medicine: string, lang: Lang): Note | null {
  if (!isTimedEligible(f)) return null;
  const mins = f.gap_minutes!;
  const food = f.food_or_beverage.trim();
  if (COFFEE.includes(food) && f.gap_side === "drug_first") {
    return lang === "ar"
      ? { kind: "food:coffee", title: "قهوتك تنتظر شوي ☕", body: `جاء موعد ${medicine}. بعد أخذ الجرعة، انتظر ${mins} دقيقة قبل شرب القهوة.` }
      : { kind: "food:coffee", title: "Your coffee can wait a little ☕", body: `It's time for ${medicine}. After your dose, wait ${mins} minutes before drinking coffee.` };
  }
  if (food in SUPPLEMENTS && f.gap_side === "both" && mins % 60 === 0) {
    const h = mins / 60;
    return lang === "ar"
      ? { kind: `food:${SUPPLEMENTS[food]}`, title: "خلّ بينهما وقت 💚", body: `مع ${medicine}، تذكّر ترك فاصل لا يقل عن ${h} ساعات بينه وبين ال${food}.` }
      : { kind: `food:${SUPPLEMENTS[food]}`, title: "Give them some time apart 💚", body: `With ${medicine}, remember to leave at least ${h} hours between it and ${SUPPLEMENTS[food]}.` };
  }
  return null;
}

export function doseNote(medicine: string, lang: Lang): Note {
  return lang === "ar"
    ? { kind: "dose", title: "حان وقت علاجك 💚", body: `جاء موعد ${medicine}. إذا أخذت جرعتك، لا تنسى تسجّلها عشان نتابع تقدمك سوا.` }
    : { kind: "dose", title: "Time for your medicine 💚", body: `It's time for ${medicine}. Once you've taken it, log it so we can follow your progress together.` };
}

export function testNote(companion: "kabsoul" | "kabsoula", lang: Lang): Note {
  const name = lang === "ar" ? (companion === "kabsoul" ? "كبسول" : "كبسولة") : companion === "kabsoul" ? "Kabsoul" : "Kabsoula";
  return lang === "ar"
    ? { kind: "test", title: `أهلًا من ${name} 💚`, body: "التنبيهات شغّالة على هذا الجهاز. بنذكّرك بمواعيد أدويتك بإذن الله." }
    : { kind: "test", title: `Hello from ${name} 💚`, body: "Notifications are working on this device. We'll remind you of your medicine times." };
}
