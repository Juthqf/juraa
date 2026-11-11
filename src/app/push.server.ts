// Server-only push helpers: device-token verification, sending, and the per-minute reminder run.
import { sendPush, vapidFromSeed, type PushSub } from "./webpush";
import { duePrep, prepNote, prepRecords, samplePrepNote, dueDoses, doseNote, foodGroupNote, recordsFor, sampleFoodNote, testNote, type Companion, type FoodRecord, type Lang, type Note, type ScheduleRow } from "./push-messages";

const SUBJECT = "https://juraa.lovable.app";

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function keys() {
  const seed = process.env["VAPID_SEED"];
  if (!seed) throw new Error("VAPID_SEED is not configured");
  return vapidFromSeed(seed);
}

export async function hashToken(token: string) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function findDevice(token: string) {
  const db = await admin();
  const { data } = await db.from("push_devices").select("*").eq("token_hash", await hashToken(token)).maybeSingle();
  return data;
}

/** Send a note to every subscription of a device; drop subscriptions the push service reports gone. */
export async function sendToDevice(deviceId: string, note: Note, tag: string) {
  const db = await admin();
  const k = await keys();
  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("device_id", deviceId);
  let delivered = 0;
  const errors: string[] = [];
  for (const s of subs ?? []) {
    const r = await sendPush(s as PushSub, { title: note.title, body: note.body, tag, url: "/" }, k, SUBJECT);
    if (r.ok) delivered++;
    else {
      errors.push(`${r.status} ${r.text}`);
      if (r.status === 404 || r.status === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
    }
  }
  return { delivered, total: subs?.length ?? 0, errors };
}

export async function loadFoodRecords(): Promise<FoodRecord[]> {
  const db = await admin();
  const { data } = await db.from("drug_food_interactions")
    .select("food_or_beverage, gap_minutes, gap_side, review_status, pharmacist_reviewed_ar, evidence_status_code, medications!drug_food_interactions_medication_id_fkey(generic_name, medication_brand_names(brand_name))")
    ;
  return (data ?? []).map((r: any) => ({
    food_or_beverage: r.food_or_beverage, gap_minutes: r.gap_minutes == null ? null : Number(r.gap_minutes), gap_side: r.gap_side,
    review_status: r.review_status, pharmacist_reviewed_ar: r.pharmacist_reviewed_ar, evidence_status_code: r.evidence_status_code,
    generic_name: r.medications?.generic_name ?? "", brands: (r.medications?.medication_brand_names ?? []).map((b: any) => b.brand_name),
  }));
}

/** One scheduler run: send due dose reminders (and eligible food reminders) exactly once per dose. */
export async function runTick(now = new Date()) {
  const db = await admin();
  const { data: devices } = await db.from("push_devices").select("id, time_zone, lang, companion, enabled, push_schedule(med_id, med_name, ingredient, generic_name, dose_time)").eq("enabled", true);
  let foods: FoodRecord[] | null = null;
  const stats = { devices: devices?.length ?? 0, sent: 0, skippedDuplicate: 0 };
  for (const dev of devices ?? []) {
    const { date, due } = dueDoses((dev.push_schedule ?? []) as ScheduleRow[], now, dev.time_zone);
    for (const row of due) {
      const medicine = row.med_name;
      foods ??= await loadFoodRecords();
      const food = foodGroupNote(recordsFor(row, foods), medicine, (dev.companion ?? "kabsoul") as Companion, dev.lang as Lang);
      const notes: Note[] = food ? [doseNote(medicine, dev.lang as Lang), food] : [doseNote(medicine, dev.lang as Lang)];
      for (const note of notes) {
        const { data: claimed } = await db.from("push_sent")
          .upsert({ device_id: dev.id, dose_date: date, med_id: row.med_id, dose_time: row.dose_time, kind: note.kind }, { onConflict: "device_id,dose_date,med_id,dose_time,kind", ignoreDuplicates: true })
          .select("device_id");
        if (!claimed?.length) { stats.skippedDuplicate++; continue; }
        await sendToDevice(dev.id, note, `${date}|${row.med_id}|${row.dose_time}|${note.kind}`);
        stats.sent++;
      }
    }
  }
  // Proactive preparation reminders (Levothyroxine + calcium/iron only). A "prep" row already in push_sent
  // (sent, or the dose was marked taken on the device) blocks it.
  for (const dev of devices ?? []) {
    const { date, due } = duePrep((dev.push_schedule ?? []) as ScheduleRow[], now, dev.time_zone);
    for (const row of due) {
      foods ??= await loadFoodRecords();
      const note = prepNote(prepRecords(row, foods), row.med_name, dev.lang as Lang);
      if (!note) continue;
      const { data: claimed } = await db.from("push_sent")
        .upsert({ device_id: dev.id, dose_date: date, med_id: row.med_id, dose_time: row.dose_time, kind: "prep" }, { onConflict: "device_id,dose_date,med_id,dose_time,kind", ignoreDuplicates: true })
        .select("device_id");
      if (!claimed?.length) { stats.skippedDuplicate++; continue; }
      await sendToDevice(dev.id, note, `${date}|${row.med_id}|${row.dose_time}|prep`);
      stats.sent++;
    }
  }
  // Keep the duplicate-guard table small.
  await db.from("push_sent").delete().lt("sent_at", new Date(now.getTime() - 3 * 86400_000).toISOString());
  return stats;
}

export { testNote, sampleFoodNote, samplePrepNote };
