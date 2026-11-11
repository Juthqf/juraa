// Browser side of real reminders: support checks, permission (only after a tap), subscription and removal.
import { fromB64u, b64u } from "./webpush";

export type PushSupport = "ok" | "unsupported" | "iframe" | "ios-install";

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
export function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function pushSupport(): PushSupport {
  if (window.top !== window.self) return "iframe";
  if (isIOS() && !isStandalone()) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return "ok";
}

export function newDeviceToken() {
  return b64u(crypto.getRandomValues(new Uint8Array(32)));
}

export type SubscribeResult = { status: "ok"; subscription: { endpoint: string; p256dh: string; auth: string } } | { status: "denied" | Exclude<PushSupport, "ok"> };

/** Must be called from a tap. Registers the notification worker and subscribes this browser. */
export async function subscribe(publicKey: string): Promise<SubscribeResult> {
  const support = pushSupport();
  if (support !== "ok") return { status: support };
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };
  const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64u(publicKey) as Uint8Array<ArrayBuffer> }));
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.['p256dh'] || !json.keys?.['auth']) return { status: "unsupported" };
  return { status: "ok", subscription: { endpoint: json.endpoint, p256dh: json.keys['p256dh'], auth: json.keys['auth'] } };
}

export async function unsubscribe() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
  const sub = await reg?.pushManager.getSubscription();
  await sub?.unsubscribe();
  await reg?.unregister();
}

export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Riyadh";
