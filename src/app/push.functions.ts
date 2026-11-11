import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const sub = z.object({ endpoint: z.string().url().startsWith("https://").max(1000), p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) });
const med = z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(120), ingredient: z.string().max(120).default(""), genericName: z.string().max(120).optional(), times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).max(6) });
const syncInput = z.object({
  token, timeZone: z.string().min(1).max(64), lang: z.enum(["ar", "en"]), companion: z.enum(["kabsoul", "kabsoula"]),
  enabled: z.boolean(), subscription: sub.optional(), meds: z.array(med).max(50),
});

export const pushPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { keys } = await import("./push.server");
  const { b64u } = await import("./webpush");
  return { publicKey: b64u((await keys()).publicKey) };
});

/** Create/update this device's reminder copy. The device proves itself with its secret token (only its hash is stored). */
export const pushSync = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => syncInput.parse(i))
  .handler(async ({ data }) => {
    const { admin, hashToken } = await import("./push.server");
    const { isValidTimeZone } = await import("./push-messages");
    const db = await admin();
    const tz = isValidTimeZone(data.timeZone) ? data.timeZone : "Asia/Riyadh";
    const { data: dev, error } = await db.from("push_devices")
      .upsert({ token_hash: await hashToken(data.token), time_zone: tz, lang: data.lang, companion: data.companion, enabled: data.enabled, updated_at: new Date().toISOString() }, { onConflict: "token_hash" })
      .select("id").single();
    if (error || !dev) throw new Error("sync failed");
    if (data.subscription) {
      await db.from("push_subscriptions").upsert({ device_id: dev.id, ...data.subscription }, { onConflict: "endpoint" });
    }
    const rows = data.meds.flatMap((m) => [...new Set(m.times)].map((t) => ({ device_id: dev.id, med_id: m.id, med_name: m.name, ingredient: m.ingredient, generic_name: m.genericName ?? "", dose_time: t })));
    await db.from("push_schedule").delete().eq("device_id", dev.id);
    if (rows.length) { const { error: e } = await db.from("push_schedule").insert(rows); if (e) throw new Error("schedule sync failed"); }
    return { ok: true, doses: rows.length };
  });

export const pushTest = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token }).parse(i))
  .handler(async ({ data }) => {
    const { findDevice, sendToDevice, testNote } = await import("./push.server");
    const dev = await findDevice(data.token);
    if (!dev) return { delivered: 0, total: 0 };
    const r = await sendToDevice(dev.id, testNote(dev.companion as "kabsoul" | "kabsoula", dev.lang as "ar" | "en"), `test-${Date.now()}`);
    if (r.errors.length) console.error("push test errors", r.errors);
    return { delivered: r.delivered, total: r.total };
  });

/** Remove this device and everything stored for it (subscriptions, schedule copy, sent log). */
export const pushRemove = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token }).parse(i))
  .handler(async ({ data }) => {
    const { admin, hashToken } = await import("./push.server");
    const db = await admin();
    await db.from("push_devices").delete().eq("token_hash", await hashToken(data.token));
    return { ok: true };
  });
