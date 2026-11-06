import { Camera, ImageUp, Info, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CATALOG, type CatalogItem } from "../data";
import { useApp } from "../store";
import { Btn, DemoBadge, TopBar } from "../ui";

// Simulated recognition: rotates through demo products so jury can see different outcomes.
let demoIndex = 0;
const DEMO_ORDER = ["Aspirin", "Ferrous Sulfate (Iron)", "Paracetamol", "Simvastatin"];
function simulateRecognition(): CatalogItem {
  const name = DEMO_ORDER[demoIndex++ % DEMO_ORDER.length]!;
  return CATALOG.find((c) => c.name === name)!;
}

export function Scan() {
  const { t, go, setCandidate } = useApp();
  const [scanning, setScanning] = useState(false);
  const [camOk, setCamOk] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) { setCamOk(false); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; setCamOk(true); })
      .catch(() => setCamOk(false));
    return () => stream?.getTracks().forEach((tr) => tr.stop());
  }, []);

  const finish = (item: CatalogItem) => { setCandidate(item); go("identify"); };
  const run = () => { setScanning(true); setTimeout(() => { setScanning(false); finish(simulateRecognition()); }, 2200); };
  const results = q.trim() ? CATALOG.filter((c) => (c.name + c.ingredient).toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <div className="pb-32">
      <TopBar title={t("scanTitle")} subtitle={t("pointCamera")} onBack />
      <div className="space-y-5 px-5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-hero shadow-float">
          {camOk && <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />}
          {!camOk && <div className="pattern-sadu absolute inset-0 grid place-items-center"><Camera className="size-20 text-primary-foreground/40" /></div>}
          <div className="absolute inset-8 rounded-3xl border-4 border-dashed border-accent" />
          {scanning && <div className="scan-line absolute inset-x-8 h-1 rounded-full bg-accent shadow-float" />}
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <DemoBadge>{scanning ? t("scanning") : t("simulated")}</DemoBadge>
          </div>
        </div>

        {camOk === false && (
          <p className="flex gap-2 rounded-2xl bg-info-soft p-4 text-sm"><Info className="size-5 shrink-0 text-primary" />{t("cameraUnsupported")}</p>
        )}
        <p className="flex gap-2 text-sm text-muted-foreground"><Info className="size-5 shrink-0" />{t("cameraNote")}</p>

        <div className="grid grid-cols-2 gap-3">
          <Btn onClick={run} disabled={scanning}><Camera className="size-5" />{scanning ? t("scanning") : t("startScan")}</Btn>
          <Btn variant="outline" onClick={() => fileRef.current?.click()} disabled={scanning}><ImageUp className="size-5" />{t("upload")}</Btn>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.length && run()} />
        </div>

        <div>
          <p className="mb-2 font-bold text-primary">{t("manual")}</p>
          <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4">
            <Search className="size-5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} dir="auto" className="w-full bg-transparent text-lg outline-none" />
          </label>
          <div className="mt-2 space-y-2">
            {results.map((r) => (
              <button key={r.name} onClick={() => finish(r)} className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-border bg-card px-4 text-start">
                <span className="font-bold" dir="ltr">{r.name}</span>
                <span className="text-sm text-muted-foreground" dir="ltr">{r.dose}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
