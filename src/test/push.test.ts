// @ts-nocheck -- test-only Web Crypto buffer typing
import { describe, expect, it } from "vitest";
import { dueDoses, foodNote, isTimedEligible, recordsFor, doseNote, type FoodRecord } from "@/app/push-messages";
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

describe("food reminder safeguards", () => {
  it("never uses an unverified record, even if the pharmacist column says yes", () => {
    expect(isTimedEligible({ ...coffee, review_status: "unverified" })).toBe(false);
    expect(foodNote({ ...coffee, review_status: "unverified" }, "Levothyroxine", "ar")).toBeNull();
  });
  it("needs an exact interval", () => {
    expect(isTimedEligible({ ...coffee, gap_minutes: null })).toBe(false);
  });
  it("uses the stored 60-minute coffee interval", () => {
    expect(foodNote(coffee, "Levothyroxine", "ar")?.body).toBe("جاء موعد Levothyroxine. بعد أخذ الجرعة، انتظر 60 دقيقة قبل شرب القهوة.");
  });
  it("uses the stored 4-hour calcium interval", () => {
    expect(foodNote({ ...coffee, food_or_beverage: "كالسيوم", gap_minutes: 240, gap_side: "both" }, "Levothyroxine", "ar")?.body).toContain("لا يقل عن 4 ساعات");
  });
  it("sends nothing for foods without a template, such as tea", () => {
    expect(foodNote({ ...coffee, food_or_beverage: "شاي" }, "Levothyroxine", "ar")).toBeNull();
  });
  it("matches records by brand name", () => {
    expect(recordsFor({ ...row, med_name: "Euthyrox", ingredient: "" }, [coffee])).toHaveLength(1);
  });
  it("uses the approved dose wording", () => {
    expect(doseNote("Warfarin", "ar").title).toBe("حان وقت علاجك 💚");
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
