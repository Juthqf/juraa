import { useState } from "react";
import { Bell, BellOff, ShieldCheck, Smartphone } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useApp } from "./store";
import { Btn, Card } from "./ui";
import { pushPublicKey, pushRemove, pushSync, pushTest } from "./push.functions";
import { deviceTimeZone, isIOS, newDeviceToken, pushSupport, subscribe, unsubscribe } from "./push-client";

const TXT = {
  ar: {
    title: "تذكيرات الأدوية",
    on: "التذكيرات مفعّلة على هذا الجهاز.",
    off: "التذكيرات غير مفعّلة على هذا الجهاز.",
    enable: "تفعيل التذكيرات", disable: "إيقاف التذكيرات مؤقتًا", resume: "تشغيل التذكيرات", test: "إرسال تنبيه تجريبي", remove: "حذف الاشتراك وبيانات التذكير",
    sync: "لتصلك التذكيرات والتطبيق مقفل، نحفظ أسماء أدويتك ومواعيدها ومنطقتك الزمنية بشكل آمن على خادم جرعة، بدون اسم أو حساب. لا نحفظ حالتك الصحية أو الأسماء المختصرة. تقدر تحذفها في أي وقت.",
    safety: "التذكير بموعد الجرعة لا يغني عن تعليمات طبيبك أو الصيدلي. تذكيرات الأكل والمكمّلات المرتبطة بوقت محدد تصل فقط للسجلات التي اعتمدها الصيدلي سريريًا في قاعدة البيانات، ولا تُرسل للسجلات غير المعتمدة.",
    ios: "على الآيفون: افتح جرعة في سفاري، اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من الأيقونة ثم فعّل التذكيرات (iOS 16.4 أو أحدث).",
    iframe: "افتح التطبيق في نافذة مستقلة أو من الموقع المنشور لتفعيل التذكيرات.",
    unsupported: "هذا المتصفح لا يدعم التذكيرات الخارجية.",
    denied: "تم رفض إذن التنبيهات. فعّله من إعدادات المتصفح أو الجهاز لهذا الموقع ثم حاول مرة ثانية.",
    failed: "تعذّر الإكمال الآن. حاول مرة ثانية.",
    testSent: "أُرسل التنبيه التجريبي. إذا ما وصلك خلال دقيقة، تأكد من إعدادات التنبيهات في جهازك.",
    testNone: "لا يوجد اشتراك فعّال على هذا الجهاز. فعّل التذكيرات من جديد.",
    removed: "تم حذف الاشتراك وكل بيانات التذكير من الخادم.",
    busy: "لحظة…",
  },
  en: {
    title: "Medicine reminders",
    on: "Reminders are on for this device.", off: "Reminders are off for this device.",
    enable: "Turn on reminders", disable: "Pause reminders", resume: "Resume reminders", test: "Send a test notification", remove: "Remove subscription and reminder data",
    sync: "To remind you while the app is closed, your medicine names, times and time zone are stored securely on Juraa's server, without a name or account. Health conditions and nicknames are not stored. You can delete this at any time.",
    safety: "Dose reminders don't replace your doctor's or pharmacist's instructions. Food and supplement reminders are sent only for records clinically approved by a pharmacist in the database; unapproved records never trigger them.",
    ios: "On iPhone: open Juraa in Safari, tap Share then “Add to Home Screen”, open the app from its icon, then turn on reminders (iOS 16.4 or later).",
    iframe: "Open the app in its own tab or on the published site to turn on reminders.",
    unsupported: "This browser doesn't support background notifications.",
    denied: "Notification permission was declined. Allow it for this site in your browser or device settings, then try again.",
    failed: "Couldn't finish right now. Please try again.",
    testSent: "Test sent. If it doesn't arrive within a minute, check your device's notification settings.",
    testNone: "No active subscription on this device. Turn reminders on again.",
    removed: "Subscription and all reminder data were removed from the server.",
    busy: "One moment…",
  },
};

export function NotificationSettings() {
  const { lang, companion, meds, push, set } = useApp();
  const T = TXT[lang];
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const getKey = useServerFn(pushPublicKey);
  const sync = useServerFn(pushSync);
  const test = useServerFn(pushTest);
  const remove = useServerFn(pushRemove);
  const support = typeof window === "undefined" ? "ok" : pushSupport();

  const payload = (token: string, enabled: boolean) => ({ token, timeZone: deviceTimeZone(), lang, companion, enabled, meds: meds.map((m) => ({ id: m.id, name: m.name, ingredient: m.ingredient ?? "", genericName: m.genericName, times: m.times })) });
  const run = async (fn: () => Promise<void>) => { setBusy(true); setMsg(null); try { await fn(); } catch { setMsg(T.failed); } finally { setBusy(false); } };

  const enable = () => run(async () => {
    const { publicKey } = await getKey();
    const r = await subscribe(publicKey);
    if (r.status !== "ok") { setMsg(r.status === "denied" ? T.denied : r.status === "iframe" ? T.iframe : r.status === "ios-install" ? T.ios : T.unsupported); return; }
    const token = push?.token ?? newDeviceToken();
    await sync({ data: { ...payload(token, true), subscription: r.subscription } });
    set({ push: { token, enabled: true }, notifPref: "inapp" });
  });
  const toggle = () => run(async () => {
    if (!push) return;
    await sync({ data: payload(push.token, !push.enabled) });
    set({ push: { ...push, enabled: !push.enabled } });
  });
  const sendTest = () => run(async () => {
    if (!push) return;
    const r = await test({ data: { token: push.token } });
    setMsg(r.delivered > 0 ? T.testSent : T.testNone);
  });
  const removeAll = () => run(async () => {
    if (push) await remove({ data: { token: push.token } });
    await unsubscribe().catch(() => {});
    set({ push: undefined });
    setMsg(T.removed);
  });

  const active = !!push?.enabled;
  return (
    <Card>
      <p className="mb-3 flex items-center gap-2 font-bold text-primary">{active ? <Bell className="size-5" /> : <BellOff className="size-5" />}{T.title}</p>
      <p className="text-sm font-bold" role="status">{active ? T.on : T.off}</p>
      <div className="mt-3 space-y-3">
        {!push && <Btn className="w-full" disabled={busy} onClick={enable}>{busy ? T.busy : T.enable}</Btn>}
        {push && <Btn variant="outline" className="w-full" disabled={busy} onClick={toggle}>{push.enabled ? T.disable : T.resume}</Btn>}
        {push && <Btn variant="outline" className="w-full" disabled={busy} onClick={sendTest}>{T.test}</Btn>}
        {push && <Btn variant="ghost" className="w-full" disabled={busy} onClick={removeAll}>{T.remove}</Btn>}
      </div>
      {msg && <p className="mt-3 rounded-2xl bg-secondary p-3 text-sm" aria-live="polite">{msg}</p>}
      {!push && (support === "ios-install" || (typeof window !== "undefined" && isIOS())) && (
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"><Smartphone className="mt-0.5 size-4 shrink-0" />{T.ios}</p>
      )}
      {!push && support === "iframe" && <p className="mt-3 text-sm text-muted-foreground">{T.iframe}</p>}
      <p className="mt-3 text-sm text-muted-foreground">{T.sync}</p>
      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" />{T.safety}</p>
    </Card>
  );
}
