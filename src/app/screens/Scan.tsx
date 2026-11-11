import { Camera, ImageUp, Info, Pill, Plus, Search, Utensils, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useClinicalData } from "../clinical-data";
import { foodVsMeds, searchMeds } from "../safety";
import { RecordCard } from "../RecordCard";
import { MAX_IMAGE_BYTES, confirmedIngredients, medicationCandidate, type ScanMode, type VisionResult } from "../scanner";
import { analyzePhoto } from "../scanner.functions";
import { useApp } from "../store";
import { Btn, TopBar } from "../ui";

export function Scan() {
  const { t, lang, go, setCandidate, meds } = useApp();
  const clinical = useClinicalData();
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
  const [foodUncertainty, setFoodUncertainty] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [confirmed, setConfirmed] = useState<ReturnType<typeof confirmedIngredients> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const field = "mt-1 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary";
  const [camReady, setCamReady] = useState(false);
  const [opening, setOpening] = useState(false);
  const [fromCamera, setFromCamera] = useState(false);
  const stopCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; setCameraOpen(false); setCamReady(false); };

  useEffect(() => () => { generation.current++; streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!cameraOpen || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => undefined);
  }, [cameraOpen]);

  const openCamera = async () => {
    if (opening || cameraOpen) return;
    const current = generation.current;
    setError(""); setCamOk(null);
    if (!navigator.mediaDevices?.getUserMedia) { setCamOk(false); return; }
    setOpening(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
      } catch (e) {
        if (e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")) throw e;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      if (current !== generation.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream; setCamOk(true); setCamReady(false); setCameraOpen(true); setImage(null);
    } catch { setCamOk(false); }
    finally { setOpening(false); }
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
      if (current === generation.current) { setImage(data); setFromCamera(false); }
    } catch { if (current === generation.current) setError(t("imageError")); }
  };
  const capture = () => {
    const video = videoRef.current;
    if (!camReady || !video?.videoWidth || !video.videoHeight) return;
    // Crop the same region the 4:3 preview shows (object-cover), so the photo matches what the user saw.
    const vw = video.videoWidth, vh = video.videoHeight, target = 4 / 3;
    let sw = vw, sh = vh;
    if (vw / vh > target) sw = vh * target; else sh = vw / target;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    const scale = Math.min(1, 1600 / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale); canvas.height = Math.round(sh * scale);
    const context = canvas.getContext("2d"); if (!context) return;
    context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL("image/jpeg", 0.9)); setFromCamera(true); setError(""); stopCamera();
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
      else { setFood(response.result.items); setFoodUncertainty(response.result.uncertainty); setDetails(""); setReviewed(false); setConfirmed(null); setImage(null); }
    } catch { if (current === generation.current) setError(t("aiFailed")); }
    finally { if (current === generation.current) setScanning(false); }
  };
  const changeMode = (next: ScanMode) => { generation.current++; stopCamera(); setMode(next); setImage(null); setFood(null); setConfirmed(null); setDetails(""); setFoodUncertainty(""); setError(""); setReviewed(false); setQ(""); };
  const results = clinical.status === "ready" ? searchMeds(clinical.db, q) : [];
  const foodHits = confirmed && clinical.status === "ready" ? foodVsMeds(clinical.db, confirmed.ingredients, meds) : [];
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
            {cameraOpen ? <>
              <video ref={videoRef} autoPlay playsInline muted onPlaying={() => setCamReady(true)} onLoadedData={(e) => { if (e.currentTarget.videoWidth) setCamReady(true); }} className="absolute inset-0 size-full object-cover" />
              <p role="status" className="absolute start-3 top-3 rounded-full bg-card/90 px-3 py-1 text-sm font-bold text-primary">{camReady ? t("cameraReady") : t("cameraStarting")}</p>
            </> : image ? <img src={image} alt={t("scanTitle")} className="size-full object-contain" /> : <div className="pattern-sadu absolute inset-0 grid place-items-center"><div className="text-center text-primary-foreground"><Camera className="mx-auto mb-3 size-16 opacity-70" /><p className="font-bold">{mode === "medication" ? t("pointCamera") : t("foodMode")}</p></div></div>}
            {scanning && <div className="absolute inset-0 grid place-items-center bg-foreground/60 text-primary-foreground" role="status"><p className="font-bold">{t("scanning")}</p></div>}
          </div>
          {camOk === false && <p className="rounded-2xl bg-info-soft p-4 text-sm">{t("cameraUnsupported")}</p>}
          {image && !cameraOpen ? <div className="space-y-3">
            <p className="rounded-2xl bg-info-soft p-4 text-sm">{t("reviewPhoto")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Btn variant="outline" disabled={scanning} onClick={() => { setImage(null); if (fromCamera) void openCamera(); }} className="px-2 text-base"><Camera className="size-5 shrink-0" />{t("retake")}</Btn>
              <Btn variant="outline" onClick={() => fileRef.current?.click()} disabled={scanning} className="px-2 text-base"><ImageUp className="size-5 shrink-0" />{t("upload")}</Btn>
            </div>
          </div> : <>
            <div className="grid grid-cols-2 gap-3">
              <Btn onClick={cameraOpen ? capture : openCamera} disabled={scanning || opening || (cameraOpen && !camReady)} className="px-2 text-base"><Camera className="size-5 shrink-0" />{cameraOpen ? t("takePhoto") : opening ? t("cameraStarting") : t("openCamera")}</Btn>
              <Btn variant="outline" onClick={() => { stopCamera(); fileRef.current?.click(); }} disabled={scanning} className="px-2 text-base"><ImageUp className="size-5 shrink-0" />{t("upload")}</Btn>
            </div>
            {cameraOpen
              ? <Btn variant="ghost" onClick={stopCamera} className="w-full text-base">{t("closeCamera")}</Btn>
              : <Btn variant="ghost" onClick={() => captureRef.current?.click()} disabled={scanning} className="w-full text-base">{t("systemCamera")}</Btn>}
          </>}
          <input ref={fileRef} aria-label={t("upload")} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={captureRef} aria-label={t("takePhoto")} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }} />
          <p className="text-sm text-muted-foreground">{t("imageFormats")}</p>
          <p className="flex gap-2 text-sm text-muted-foreground"><Info className="size-5 shrink-0" />{t("cameraNote")}</p>
          {image && !cameraOpen && <Btn className="w-full" disabled={scanning} onClick={run}>{scanning ? t("scanning") : t("usePhoto")}</Btn>}
        </>}
        {error && <p role="alert" className="rounded-2xl bg-warning-soft p-4 text-sm">{error}</p>}
        {mode === "medication" ? <div className="space-y-3">
          <Btn variant="outline" disabled={scanning} className="w-full" onClick={() => { stopCamera(); setCandidate({ name: "", ingredient: "", dose: "", source: "manual" }); go("identify"); }}>{t("manualEntry")}</Btn>
          <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4"><Search className="size-5 shrink-0 text-muted-foreground" /><input aria-label={t("search")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} dir="auto" className="min-w-0 w-full bg-transparent text-lg outline-none" /></label>
          {q.trim() && clinical.status !== "ready" && <p role="status" className="text-sm">{t(clinical.status === "loading" ? "dbLoading" : "dbError")}</p>}
          {results.map((m) => <Btn key={m.id} disabled={scanning} variant="outline" className="w-full justify-between text-start text-base" onClick={() => { setCandidate({ name: m.generic_name, ingredient: m.generic_name, genericName: m.generic_name, dose: "", source: "manual" }); go("identify"); }}><span dir="ltr">{m.generic_name}</span><span dir="rtl">{m.name_ar}</span></Btn>)}
        </div> : food ? <section className="space-y-4">
          <h2 className="text-xl font-bold text-primary">{t("foodReview")}</h2>
          <p className="rounded-2xl bg-warning-soft p-4 text-sm">{t("foodCaution")}</p>
          {foodUncertainty && <p dir="auto" className="text-sm text-muted-foreground">{foodUncertainty}</p>}
          {food.map((item, i) => <div key={i} className="flex items-end gap-2"><label className="min-w-0 flex-1 font-bold">{t("foodItem")} {i + 1}<input dir="auto" className={field} value={item.name} onChange={(e) => updateFood(food.map((entry, index) => index === i ? { ...entry, name: e.target.value } : entry))} /><span className="text-sm font-normal text-muted-foreground">{t(item.certainty)}</span></label><Btn variant="ghost" aria-label={`${t("remove")} ${i + 1}`} className="mb-6 size-14 shrink-0 px-0" onClick={() => updateFood(food.filter((_, index) => index !== i))}><X className="size-5" /></Btn></div>)}
          <Btn variant="outline" className="w-full" onClick={() => updateFood([...food, { name: "", certainty: "likely" }])}><Plus className="size-5" />{t("addIngredient")}</Btn>
          <label className="block font-bold">{t("preparation")}<textarea dir="auto" className={field + " min-h-28 py-3"} value={details} onChange={(e) => { setDetails(e.target.value); setReviewed(false); setConfirmed(null); }} /></label>
          <label className="flex min-h-14 items-center gap-3"><input type="checkbox" className="size-6 accent-primary" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />{t("reviewConfirmed")}</label>
          <Btn className="w-full" disabled={!reviewed || !food.some((item) => item.name.trim())} onClick={() => setConfirmed(confirmedIngredients(food.map((item) => item.name), details))}>{t("confirmFood")}</Btn>
          {confirmed && <div role="status" className="space-y-2 border-t border-border pt-4"><p className="font-bold text-primary">{t("foodConfirmed")}</p><p dir="auto">{confirmed.ingredients.join("، ")}</p><p dir="auto">{confirmed.preparation}</p>{clinical.status !== "ready" ? <p className="text-sm">{t(clinical.status === "loading" ? "dbLoading" : "dbError")}</p> : foodHits.length ? foodHits.map((h) => <div key={h.item.id + h.med.id} className="rounded-2xl border border-warning bg-warning-soft p-4"><p className="font-bold"><span dir="rtl">{h.item.name_ar}</span> + <span dir="ltr">{h.med.name}</span></p>{h.records.map((r) => <RecordCard key={r.id} r={r} />)}</div>) : <p className="font-bold">{t("cat_none")}</p>}<p className="text-sm">{t("noClinicalCheck")}</p><p className="text-xs font-bold">{t("demoData")}</p></div>}
          <Btn variant="outline" className="w-full" onClick={() => { setFood(null); setConfirmed(null); }}>{t("newPhoto")}</Btn>
        </section> : <Btn variant="outline" className="w-full" disabled={scanning} onClick={() => { stopCamera(); setFood([{ name: "", certainty: "likely" }]); setDetails(""); setReviewed(false); }}>{t("manualEntry")}</Btn>}
      </div>
    </div>
  );
}
