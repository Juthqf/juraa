// Standard Web Push (VAPID + aes128gcm, RFC 8291/8292) using only Web Crypto, so it runs on the server runtime.
import { p256 } from "@noble/curves/nist.js";

const enc = new TextEncoder();
export const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromB64u = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(t + "===".slice((t.length + 3) % 4)), (c) => c.charCodeAt(0));
};
const cat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

export type VapidKeys = { publicKey: Uint8Array; d: Uint8Array };

/** Derive a stable VAPID key pair from a stored random seed (the private key never leaves the server). */
export async function vapidFromSeed(seed: string): Promise<VapidKeys> {
  let d = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(seed)));
  while (!p256.utils.isValidSecretKey(d)) d = new Uint8Array(await crypto.subtle.digest("SHA-256", d));
  return { d, publicKey: p256.getPublicKey(d, false) };
}

async function vapidJwt(keys: VapidKeys, audience: string, subject: string) {
  const pub = keys.publicKey;
  const key = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d: b64u(keys.d), x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)) }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${body}`)));
  return `${head}.${body}.${b64u(sig)}`;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const k = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(info) }, k, len * 8));
}

/** Encrypt a payload for one subscription (aes128gcm content coding). */
export async function encryptPayload(plaintext: Uint8Array, p256dh: string, authSecret: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const ua = fromB64u(p256dh);
  const auth = fromB64u(authSecret);
  const eph = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", buf(ua), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(enc.encode("WebPush: info\0"), ua, asPub), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", buf(cek), "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(nonce) }, aes, buf(cat(plaintext, new Uint8Array([2])))));
  const rs = new Uint8Array([0, 0, 16, 0]);
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

export type PushSub = { endpoint: string; p256dh: string; auth: string };

/** Send one push. Returns the push service HTTP status (404/410 means the subscription is gone). */
export async function sendPush(sub: PushSub, payload: unknown, keys: VapidKeys, subject: string, ttl = 3600) {
  const url = new URL(sub.endpoint);
  const jwt = await vapidJwt(keys, url.origin, subject);
  const body = await encryptPayload(enc.encode(JSON.stringify(payload)), sub.p256dh, sub.auth);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: { Authorization: `vapid t=${jwt}, k=${b64u(keys.publicKey)}`, "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(ttl), Urgency: "high" },
    body: buf(body),
  });
  return { status: res.status, ok: res.ok, text: res.ok ? "" : (await res.text()).slice(0, 300) };
}
