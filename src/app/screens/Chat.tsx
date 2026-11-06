import { Mic, Send, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Lang } from "../i18n";
import { useApp } from "../store";
import { DemoBadge, Mascot, TopBar } from "../ui";

type Msg = { from: "me" | "bot"; text: string };

// Sample, pre-written replies. Swap `sampleReply` for a real assistant later.
const SUGGESTIONS: Record<Lang, string[]> = {
  ar: ["متى جرعتي القادمة؟", "هل أقدر آخذ دوائي مع القهوة؟", "نسيت جرعة، وش أسوي؟"],
  en: ["When is my next dose?", "Can I take my medicine with coffee?", "I missed a dose, what now?"],
};
function sampleReply(text: string, lang: Lang): string {
  const s = text.toLowerCase();
  const ar = lang === "ar";
  if (s.includes("قادم") || s.includes("next")) return ar ? "(رد تجريبي) تقدر تشوف جرعتك القادمة في الصفحة الرئيسية، وأنا أذكّرك قبلها." : "(Sample reply) Your next dose is shown on the Home screen — I'll remind you before it.";
  if (s.includes("قهوة") || s.includes("coffee")) return ar ? "(رد تجريبي) بعض الأدوية تتأثر بالمشروبات. اقرأ نشرة الدواء واسأل الصيدلي عن دوائك تحديداً." : "(Sample reply) Some medicines are affected by drinks. Check the leaflet and ask your pharmacist about yours.";
  if (s.includes("نسيت") || s.includes("miss")) return ar ? "(رد تجريبي) لا تضاعف الجرعة من نفسك. راجع نشرة الدواء أو تواصل مع الصيدلي." : "(Sample reply) Don't double up on your own. Check the leaflet or contact your pharmacist.";
  return ar ? "(رد تجريبي) سؤال ممتاز! في النسخة الكاملة سأجيبك بدقة. حالياً أنصحك بسؤال الصيدلي." : "(Sample reply) Great question! The full version will answer properly — for now, please ask your pharmacist.";
}

export function Chat() {
  const { t, lang, companion } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: lang === "ar" ? `هلا! أنا ${t(companion)}، كيف أقدر أساعدك اليوم؟` : `Hi! I'm ${t(companion)}. How can I help today?` }]);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<"idle" | "listening" | "speaking">("idle");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = (q: string, spoken = false) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { from: "me", text: q }]);
    setText("");
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "bot", text: sampleReply(q, lang) }]);
      if (spoken) { setVoice("speaking"); setTimeout(() => setVoice("idle"), 2500); }
    }, 700);
  };
  const mic = () => {
    if (voice !== "idle") return;
    setVoice("listening");
    setTimeout(() => { setVoice("idle"); send(SUGGESTIONS[lang][0] ?? "", true); }, 2200);
  };

  return (
    <div className="flex min-h-screen flex-col pb-28">
      <TopBar title={t("chatTitle")} right={<DemoBadge>{t("sampleReplies")}</DemoBadge>} />
      <div className="relative mx-5 flex items-center justify-center overflow-hidden rounded-[2rem] bg-sage py-4">
        <div className={cn("absolute size-44 rounded-full bg-secondary transition", voice !== "idle" && "animate-ping opacity-40")} />
        <Mascot className="relative h-44 w-auto" float />
        {voice !== "idle" && (
          <span className="absolute bottom-3 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold text-primary shadow-soft">
            {voice === "listening" ? <Mic className="size-4 text-destructive" /> : <Volume2 className="size-4" />}
            {voice === "listening" ? t("listening") : t("speaking")}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3 px-5 py-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "me" ? "justify-start" : "justify-end")}>
            <p className={cn("max-w-[82%] rounded-3xl px-5 py-3 text-lg leading-relaxed", m.from === "me" ? "rounded-ss-md bg-primary text-primary-foreground" : "rounded-se-md border border-border bg-card")}>{m.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="fixed inset-x-0 bottom-28 z-20 mx-auto max-w-md space-y-2 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS[lang].map((s) => (
            <button key={s} onClick={() => send(s)} className="min-h-11 shrink-0 rounded-full border border-primary/20 bg-card px-4 text-sm font-bold text-primary">{s}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-center gap-2 rounded-3xl border border-border bg-card p-2 shadow-soft">
          <button type="button" onClick={mic} aria-label="mic" className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", voice === "listening" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-primary")}>
            <Mic className="size-6" />
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("typeMsg")} dir="auto" className="min-h-12 w-full bg-transparent px-2 text-lg outline-none" />
          <button type="submit" aria-label="send" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Send className="size-5 rtl:-scale-x-100" />
          </button>
        </form>
      </div>
    </div>
  );
}
