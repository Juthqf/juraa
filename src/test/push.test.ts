// @ts-nocheck -- test-only Web Crypto buffer typing
import { describe, expect, it } from "vitest";
import { duePrep, prepNote, prepRecords, samplePrepNote, dueDoses, foodGroupNote, sampleFoodNote, isTimedEligible, recordsFor, doseNote, type FoodRecord } from "@/app/push-messages";
import { encryptPayload, fromB64u, b64u, vapidFromSeed } from "@/app/webpush";

const coffee: FoodRecord = { generic_name: "Levothyroxine", brands: ["Euthyrox"], food_or_beverage: "قهوة", gap_minutes: 60, gap_side: "drug_first", review_status: "verified", pharmacist_reviewed_ar: "نعم", evidence_status_code: "supported" };
const row = { med_id: "m1", med_name: "Levothyroxine", ingredient: "levothyroxine", generic_name: "", dose_time: "07:00" };

describe("dose timing", () => {
  it("is due at 07:00 Riyadh, which is 04:00 UTC", () => {
    expect(dueDoses([row], new Date("2026-11-12T04:00:00Z"), "Asia/Riyadh").due).toHaveLength(1);
  });
  it("is not due at 07:00 UTC in Riyadh", () => {
    expect(dueDoses([row], new Date("2026-11-12T07:00:00Z"), "Asia/Riyadh").due).toHaveLength(0);
  });
  it("uses the device-local date for the duplicate key", () => {
    expect(dueDoses([{ ...row, dose_time: "00:30" }], new Date("2026-11-11T21:31:00Z"), "Asia/Riyadh").date).toBe("2026-11-12");
  });
  it("stops sending 10 minutes after the dose time", () => {
    expect(dueDoses([row], new Date("2026-11-12T04:10:00Z"), "Asia/Riyadh").due).toHaveLength(0);
  });
});

describe("grouped food reminders", () => {
  const lev = (food: string, gap: number | null, side: string | null, ev = "supported"): FoodRecord => ({ ...coffee, review_status: "unverified", food_or_beverage: food, gap_minutes: gap, gap_side: side, evidence_status_code: ev });
  const levRecords = [lev("قهوة", 60, "drug_first"), lev("كالسيوم", 240, "both"), lev("حديد", 240, "both"), lev("شاي", null, null, "partial"), lev("ألبان", null, null, "partial"), lev("ماتشا", null, null, "needs_reference")];
  it("groups all Levothyroxine food records into one note with the stored timing", () => {
    expect(foodGroupNote(levRecords, "Levothyroxine", "kabsoula", "ar")?.body).toBe("مع Levothyroxine، خلّ القهوة بعد الجرعة بساعة، وافصل بين علاجك والكالسيوم والحديد 4 ساعات على الأقل. وتقدر تراجع تعليمات الشاي والألبان داخل جرعة. معلومة تجريبية، والصيدلي مرجعك.");
  });
  it("uses the selected companion and the food category", () => {
    const n = foodGroupNote(levRecords, "Levothyroxine", "kabsoula", "ar")!;
    expect(n.title).toBe("بس تذكير صغير من كبسولة 💚"); expect(n.kind).toBe("food");
  });
  it("gives no timing for records without an exact interval", () => {
    expect(foodGroupNote([lev("خضار ورقية", null, null)], "Warfarin", "kabsoul", "ar")?.body).toBe("مع Warfarin، تقدر تراجع تعليمات خضار ورقية داخل جرعة. معلومة تجريبية، والصيدلي مرجعك.");
  });
  it("leaves out records that still need a reference", () => {
    expect(foodGroupNote([lev("ماتشا", null, null, "needs_reference")], "Levothyroxine", "kabsoul", "ar")).toBeNull();
  });
  it("is null for a medicine with no food records", () => {
    expect(foodGroupNote(recordsFor({ ...row, med_name: "Brufen", ingredient: "ibuprofen" }, levRecords), "Brufen", "kabsoul", "ar")).toBeNull();
  });
  it("does not change the dose reminder", () => {
    expect(doseNote("Warfarin", "ar").title).toBe("حان وقت علاجك 💚");
  });
  it("matches records by brand name", () => {
    expect(recordsFor({ ...row, med_name: "Euthyrox", ingredient: "" }, [coffee])).toHaveLength(1);
  });
  it("test sample falls back to Levothyroxine", () => {
    expect(sampleFoodNote([], levRecords, "kabsoul", "ar")?.kind).toBe("test-food");
  });
  it("timing never comes from a record without pharmacist review", () => {
    expect(isTimedEligible({ ...levRecords[0], pharmacist_reviewed_ar: "لا" })).toBe(false);
  });
});

describe("web push encryption", () => {
  it("produces an aes128gcm body the browser can decrypt", async () => {
    const ua = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
    const uaPub = new Uint8Array(await crypto.subtle.exportKey("raw", ua.publicKey));
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const body = await encryptPayload(new TextEncoder().encode("hello"), b64u(uaPub), b64u(auth));
    const salt = body.slice(0, 16); const asPub = body.slice(21, 86); const ct = body.slice(86);
    const asKey = await crypto.subtle.importKey("raw", asPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asKey }, ua.privateKey, 256));
    const h = async (s: Uint8Array, k: Uint8Array, info: Uint8Array, n: number) => new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: s, info }, await crypto.subtle.importKey("raw", k, "HKDF", false, ["deriveBits"]), n * 8));
    const te = new TextEncoder();
    const ikm = await h(auth, shared, new Uint8Array([...te.encode("WebPush: info\0"), ...uaPub, ...asPub]), 32);
    const cek = await h(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
    const nonce = await h(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]), ct));
    expect(new TextDecoder().decode(plain.slice(0, -1))).toBe("hello");
  });
  it("derives the same VAPID key from the same seed", async () => {
    const a = await vapidFromSeed("seed"); const b = await vapidFromSeed("seed");
    expect(b64u(a.publicKey)).toBe(b64u(b.publicKey));
    expect(fromB64u(b64u(a.publicKey))).toHaveLength(65);
  });
});

describe("proactive Levothyroxine prep reminder", () => {
  const lev = (food: string, gap: number | null, side: string | null, ev = "supported"): FoodRecord => ({ ...coffee, review_status: "unverified", food_or_beverage: food, gap_minutes: gap, gap_side: side, evidence_status_code: ev });
  const foods = [lev("قهوة", 60, "drug_first"), lev("كالسيوم", 240, "both"), lev("حديد", 240, "both"), lev("شاي", null, null, "partial")];
  const r9 = { ...row, dose_time: "09:00" };
  it("uses only the stored calcium and iron records", () => {
    expect(prepRecords(r9, foods).map((f) => f.food_or_beverage)).toEqual(["كالسيوم", "حديد"]);
  });
  it("states the stored 4-hour gap without claiming anything was taken", () => {
    expect(prepNote(prepRecords(r9, foods), "Levothyroxine", "ar")?.body).toBe("باقي ساعة على Levothyroxine. إذا تستخدم الكالسيوم أو الحديد، تذكّر تخلّي بينه وبين علاجك 4 ساعات على الأقل. معلومة تجريبية، والصيدلي مرجعك.");
  });
  it("is due 60 minutes before a 09:00 Riyadh dose (05:00 UTC)", () => {
    expect(duePrep([r9], new Date("2026-11-12T05:00:00Z"), "Asia/Riyadh").due).toHaveLength(1);
  });
  it("is never sent late", () => {
    expect(duePrep([r9], new Date("2026-11-12T05:10:00Z"), "Asia/Riyadh").due).toHaveLength(0);
  });
  it("is skipped in quiet hours (07:00 dose -> 06:00 prep)", () => {
    expect(duePrep([row], new Date("2026-11-12T03:00:00Z"), "Asia/Riyadh").due).toHaveLength(0);
  });
  it("is skipped when the prep time is 22:00 or later", () => {
    expect(duePrep([{ ...row, dose_time: "23:00" }], new Date("2026-11-12T19:00:00Z"), "Asia/Riyadh").due).toHaveLength(0);
  });
  it("does not apply to other medicines", () => {
    expect(prepRecords({ ...r9, med_name: "Warfarin", ingredient: "warfarin" }, foods)).toEqual([]);
  });
  it("test sample falls back to stored Levothyroxine records", () => {
    expect(samplePrepNote([], foods, "ar")?.kind).toBe("test-prep");
  });
});
