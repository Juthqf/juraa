import { Mic, Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { MAX_VOICE_BYTES, normalizeAudioMime, type ChatError, type ChatTurn } from "../chat";
import { chatReply, transcribeVoice } from "../chat.functions";
import type { Lang, TKey } from "../i18n";
import { useApp } from "../store";
import { Btn, DemoBadge, Mascot, TopBar } from "../ui";

type Msg = { from: "me" | "bot"; text: string };

const SUGGESTIONS: Record<Lang, string[]> = {
  ar: ["كيف أحفظ أدويتي بشكل صحيح؟", "هل أقدر آخذ دوائي مع القهوة؟", "نسيت جرعة، وش أسوي؟"],
  en: ["How should I store my medicines?", "Can I take my medicine with coffee?", "I missed a dose, what now?"],
};

const errorKey = (e: ChatError): TKey =>
  e === "credits" ? "aiCredits" : e === "permission" ? "aiPermission" : e === "busy" ? "aiBusy" : "chatFailed";

const MIME_CANDIDATES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];

export function Chat() {
  const { t, lang, companion } = useApp();
  const reply = useServerFn(chatReply);
  const transcribe = useServerFn(transcribeVoice);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: lang === "ar" ? `هلا! أنا ${t(companion)}، كيف أقدر أساعدك اليوم؟` : `Hi! I'm ${t(companion)}. How can I help today?` }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TKey | "">("");
  const [voice, setVoice] = useState<"idle" | "recording" | "processing">("idle");
  const [voiceNote, setVoiceNote] = useState(false);
  const lastQuestion = useRef<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const starting = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => () => {
    generation.current++;
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    lastQuestion.current = question;
    setError("");
    setText("");
    const history: ChatTurn[] = msgs.map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text }));
    setMsgs((m) => [...m, { from: "me", text: question }]);
    setBusy(true);
    const current = generation.current;
    try {
      const response = await reply({ data: { messages: [...history, { role: "user", content: question }].slice(-40), lang, companion } });
      if (current !== generation.current) return;
      if (!response.ok) { setError(errorKey(response.error)); return; }
      setMsgs((m) => [...m, { from: "bot", text: response.reply }]);
    } catch {
      if (current === generation.current) setError("chatFailed");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  };

  const stopStream = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; };

  const mic = async () => {
    if (busy) return;
    setError("");
    if (voice === "recording") { recorderRef.current?.stop(); return; }
    if (voice !== "idle" || starting.current) return;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) { setError("micUnsupported"); return; }
    const current = generation.current;
    starting.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current !== generation.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const mime = MIME_CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c)) ?? "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: normalizeAudioMime(recorder.mimeType || chunksRef.current[0]?.type || mime || "audio/webm") });
        chunksRef.current = [];
        if (blob.size === 0 || blob.size > MAX_VOICE_BYTES) { setVoice("idle"); setError(blob.size === 0 ? "voiceEmpty" : "voiceFailed"); return; }
        void sendVoice(blob, current);
      };
      recorder.start();
      setVoice("recording");
      setVoiceNote(false);
    } catch {
      stopStream();
      setError("micDenied");
    } finally {
      starting.current = false;
    }
  };

  const sendVoice = async (blob: Blob, current: number) => {
    setVoice("processing");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error()));
        reader.readAsDataURL(blob);
      });
      const response = await transcribe({ data: { audio: dataUrl, lang } });
      if (current !== generation.current) return;
      if (!response.ok) { setError(response.error === "empty" ? "voiceEmpty" : errorKey(response.error)); return; }
      setText(response.text);
      setVoiceNote(true);
    } catch {
      if (current === generation.current) setError("voiceFailed");
    } finally {
      if (current === generation.current) setVoice("idle");
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-28">
      <TopBar title={t("chatTitle")} onBack right={<DemoBadge>{t("aiEducation")}</DemoBadge>} />
      <div className="mx-5 flex items-center justify-center rounded-[2rem] bg-sage py-4">
        <Mascot className="h-36 w-auto" float />
      </div>

      <div className="flex-1 space-y-3 px-5 py-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "me" ? "justify-start" : "justify-end")}>
            <p className={cn("max-w-[82%] whitespace-pre-wrap break-words rounded-3xl px-5 py-3 text-lg leading-relaxed", m.from === "me" ? "rounded-ss-md bg-primary text-primary-foreground" : "rounded-se-md border border-border bg-card")} dir="auto">{m.text}</p>
          </div>
        ))}
        {busy && <p className="flex justify-end" role="status"><span className="animate-pulse rounded-3xl rounded-se-md border border-border bg-card px-5 py-3 text-lg text-muted-foreground">{t("thinking")}</span></p>}
        {error && (
          <div role="alert" className="space-y-2 rounded-2xl bg-warning-soft p-4 text-sm">
            <p>{t(error)}</p>
            {(error === "chatFailed" || error === "aiBusy") && lastQuestion.current && (
              <Btn variant="outline" className="min-h-11 px-4 text-base" onClick={() => void ask(lastQuestion.current)}>{t("retry")}</Btn>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed inset-x-0 bottom-28 z-20 mx-auto max-w-md space-y-2 px-4">
        {voice !== "idle" && (
          <p role="status" className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold text-primary shadow-soft">
            <span className={cn("size-2.5 rounded-full", voice === "recording" ? "animate-pulse bg-destructive" : "animate-ping bg-accent")} />
            {voice === "recording" ? t("listening") : t("transcribing")}
          </p>
        )}
        {voiceNote && <p className="rounded-2xl bg-info-soft px-4 py-2 text-sm">{t("voiceReviewHint")}</p>}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS[lang].map((s) => (
            <button key={s} disabled={busy} onClick={() => void ask(s)} className="min-h-11 shrink-0 rounded-full border border-primary/20 bg-card px-4 text-sm font-bold text-primary disabled:opacity-50">{s}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setVoiceNote(false); void ask(text); }} className="flex items-center gap-2 rounded-3xl border border-border bg-card p-2 shadow-soft">
          <button type="button" onClick={() => void mic()} disabled={busy || voice === "processing"} aria-label="mic" className={cn("grid size-12 shrink-0 place-items-center rounded-2xl disabled:opacity-50", voice === "recording" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-primary")}>
            {voice === "recording" ? <Square className="size-5" /> : <Mic className="size-6" />}
          </button>
          <input value={text} onChange={(e) => { setText(e.target.value); setVoiceNote(false); }} placeholder={t("typeMsg")} dir="auto" className="min-h-12 w-full min-w-0 bg-transparent px-2 text-lg outline-none" />
          <button type="submit" disabled={busy || !text.trim()} aria-label="send" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="size-5 rtl:-scale-x-100" />
          </button>
        </form>
      </div>
    </div>
  );
}
