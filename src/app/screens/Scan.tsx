import { Camera, ImageUp, Info, Pill, Plus, Search, Utensils, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CATALOG } from "../data";
import { MAX_IMAGE_BYTES, confirmedIngredients, medicationCandidate, type ScanMode, type VisionResult } from "../scanner";
import { analyzePhoto } from "../scanner.functions";
import { useApp } from "../store";
import { Btn, TopBar } from "../ui";

export function Scan() {
  const { t, lang, go, setCandidate } = useApp();
  const analyze = useServerFn(analyzePhoto);
  const [mode, setMode] = useState<ScanMode>("medication");
  const [scanning, setScanning] = useState(false);
  const [camOk, setCamOk] = useState<boolean | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [food, setFood] = useState<VisionResult["items"] | null>(null);
  const [details, setDetails] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [confirmed, setConfirmed] = useState<ReturnType<typeof confirmedIngredients> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const field = "mt-1 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary";
  const stopCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCameraOpen(false); };

  useEffect(() => () => { generation.current++; streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);
  useEffect(() => { if (cameraOpen && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [cameraOpen]);

  const openCamera = async () => {
    const current = generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) { setCamOk(false); captureRef.current?.click(); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (current !== generation.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream; setCamOk(true); setCameraOpen(true); setImage(null); setError("");
    } catch { setCamOk(false); }
  };
  const loadFile = async (file?: File) => {
    if (!file) return;
    generation.current++;
    const current = generation.current;
    setError(""); setImage(null); setFood(null); setConfirmed(null); setReviewed(false); stopCamera();
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_IMAGE_BYTES || file.size === 0) { setError(t("imageError")); return; }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onerror = reject; reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error()); reader.readAsDataURL(file);
      });
      const picture = new Image(); picture.src = data; await picture.decode();
      if (current === generation.current) setImage(data);
    } catch { if (current === generation.current) setError(t("imageError")); }
  };
  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) { setError(t("cameraUnsupported")); return; }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d"); if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL("image/jpeg", 0.9)); setError(""); stopCamera();
  };
  const run = async () => {
    if (!image || scanning) return;
    const current = generation.current;
    setScanning(true); setError("");
    try {
      const response = await analyze({ data: { image, mode, lang } });
      if (current !== generation.current) return;
      if (!response.ok) { setError(t(response.error === "credits" ? "aiCredits" : response.error === "permission" ? "aiPermission" : response.error === "busy" ? "aiBusy" : response.error === "uncertain" ? "unreadable" : "aiFailed")); return; }
      if (!response.result.readable) { setError(t("unreadable")); return; }
      if (mode === "medication") { setCandidate(medicationCandidate(response.result)); setImage(null); go("identify"); }
      else { setFood(response.result.items); setDetails(""); setReviewed(false); setConfirmed(null); setImage(null); }
    } catch { if (current === generation.current) setError(t("aiFailed")); }
    finally { if (current === generation.current) setScanning(false); }
  };
  const changeMode = (next: ScanMode) => { generation.current++; stopCamera(); setMode(next); setImage(null); setFood(null); setConfirmed(null); setDetails(""); setError(""); setReviewed(false); setQ(""); };
  const results = q.trim() ? CATALOG.filter((c) => (c.name + c.ingredient).toLowerCase().includes(q.trim().toLowerCase())) : [];
  const updateFood = (next: VisionResult["items"]) => { setFood(next); setReviewed(false); setConfirmed(null); };

  return (
    <div className="pb-32">
      <TopBar title={t("scanTitle")} onBack />
      <div className="space-y-5 px-5">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("scanTitle")}>
          <Btn disabled={scanning} variant={mode === "medication" ? "primary" : "outline"} aria-pressed={mode === "medication"} onClick={() => changeMode("medication")} className="px-2 text-base"><Pill className="size-5 shrink-0" />{t("medicationMode")}</Btn>
          <Btn disabled={scanning} variant={mode === "food" ? "primary" : "outline"} aria-pressed={mode === "food"} onClick={() => changeMode("food")} className="px-2 text-base"><Utensils className="size-5 shrink-0" />{t("foodMode")}</Btn>
        </div>
        {!food && <>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-hero shadow-float">
            {cameraOpen ? <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" /> : image ? <img src={image} alt={t("scanTitle")} className="size-full object-contain" /> : <div className="pattern-sadu absolute inset-0 grid place-items-center"><div className="text-center text-primary-foreground"><Camera className="mx-auto mb-3 size-16 opacity-70" /><p className="font-bold">{mode === "medication" ? t("pointCamera") : t("foodMode")}</p></div></div>}
            {scanning && <div className="absolute inset-0 grid place-items-center bg-foreground/60 text-primary-foreground" role="status"><p className="font-bold">{t("scanning")}</p></div>}
          </div>
          {camOk === false && <p className="rounded-2xl bg-info-soft p-4 text-sm">{t("cameraUnsupported")}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Btn onClick={cameraOpen ? capture : openCamera} disabled={scanning} className="px-2 text-base"><Camera className="size-5 shrink-0" />{cameraOpen ? t("takePhoto") : t("openCamera")}</Btn>
            <Btn variant="outline" onClick={() => fileRef.current?.click()} disabled={scanning} className="px-2 text-base"><ImageUp className="size-5 shrink-0" />{t("upload")}</Btn>
          </div>
          <Btn variant="ghost" onClick={() => captureRef.current?.click()} disabled={scanning} className="w-full text-base">{t("takePhoto")}</Btn>
          <input ref={fileRef} aria-label={t("upload")} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={captureRef} aria-label={t("takePhoto")} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }} />
          <p className="text-sm text-muted-foreground">{t("imageFormats")}</p>
          <p className="flex gap-2 text-sm text-muted-foreground"><Info className="size-5 shrink-0" />{t("cameraNote")}</p>
          {image && <Btn className="w-full" disabled={scanning} onClick={run}>{scanning ? t("scanning") : t("startScan")}</Btn>}
        </>}
        {error && <p role="alert" className="rounded-2xl bg-warning-soft p-4 text-sm">{error}</p>}
        {mode === "medication" ? <div className="space-y-3">
          <Btn variant="outline" disabled={scanning} className="w-full" onClick={() => { stopCamera(); setCandidate({ name: "", ingredient: "", dose: "", source: "manual" }); go("identify"); }}>{t("manualEntry")}</Btn>
          <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4"><Search className="size-5 shrink-0 text-muted-foreground" /><input aria-label={t("search")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} dir="auto" className="min-w-0 w-full bg-transparent text-lg outline-none" /></label>
          {results.map((item) => <Btn key={item.name} disabled={scanning} variant="outline" className="w-full justify-between text-start text-base" onClick={() => { setCandidate({ ...item, source: "manual" }); go("identify"); }}><span dir="auto">{item.name}</span><span dir="ltr">{item.dose}</span></Btn>)}
        </div> : food ? <section className="space-y-4">
          <h2 className="text-xl font-bold text-primary">{t("foodReview")}</h2>
          <p className="rounded-2xl bg-warning-soft p-4 text-sm">{t("foodCaution")}</p>
          {food.map((item, i) => <div key={i} className="flex items-end gap-2"><label className="min-w-0 flex-1 font-bold">{t("foodItem")} {i + 1}<input dir="auto" className={field} value={item.name} onChange={(e) => updateFood(food.map((entry, index) => index === i ? { ...entry, name: e.target.value } : entry))} /><span className="text-sm font-normal text-muted-foreground">{t(item.certainty)}</span></label><Btn variant="ghost" aria-label={`${t("remove")} ${i + 1}`} className="mb-6 size-14 shrink-0 px-0" onClick={() => updateFood(food.filter((_, index) => index !== i))}><X className="size-5" /></Btn></div>)}
          <Btn variant="outline" className="w-full" onClick={() => updateFood([...food, { name: "", certainty: "likely" }])}><Plus className="size-5" />{t("addIngredient")}</Btn>
          <label className="block font-bold">{t("preparation")}<textarea dir="auto" className={field + " min-h-28 py-3"} value={details} onChange={(e) => { setDetails(e.target.value); setReviewed(false); setConfirmed(null); }} /></label>
          <label className="flex min-h-14 items-center gap-3"><input type="checkbox" className="size-6 accent-primary" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />{t("reviewConfirmed")}</label>
          <Btn className="w-full" disabled={!reviewed || !food.some((item) => item.name.trim())} onClick={() => setConfirmed(confirmedIngredients(food.map((item) => item.name), details))}>{t("confirmFood")}</Btn>
          {confirmed && <div role="status" className="space-y-2 border-t border-border pt-4"><p className="font-bold text-primary">{t("foodConfirmed")}</p><p dir="auto">{confirmed.ingredients.join("، ")}</p><p dir="auto">{confirmed.preparation}</p><p className="text-sm">{t("noClinicalCheck")}</p></div>}
          <Btn variant="outline" className="w-full" onClick={() => { setFood(null); setConfirmed(null); }}>{t("newPhoto")}</Btn>
        </section> : <Btn variant="outline" className="w-full" disabled={scanning} onClick={() => { stopCamera(); setFood([{ name: "", certainty: "likely" }]); setDetails(""); setReviewed(false); }}>{t("manualEntry")}</Btn>}
      </div>
    </div>
  );
}
