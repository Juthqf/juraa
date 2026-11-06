import { Info } from "lucide-react";
import { useState } from "react";
import { useApp } from "../store";
import { Btn, DemoBadge, Mascot, TopBar } from "../ui";

export function Identify() {
  const { t, candidate, setCandidate, go } = useApp();
  const [reviewed, setReviewed] = useState(false);
  if (!candidate) { go("scan"); return null; }
  const field = "mt-1 min-h-14 w-full rounded-2xl border border-border bg-background px-4 text-lg outline-none focus:border-primary";
  return (
    <div className="pb-32">
      <TopBar title={t("identified")} onBack />
      <div className="space-y-5 px-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-sage p-6">
          <Mascot className="absolute -bottom-4 end-0 h-36 w-auto opacity-95" />
          <DemoBadge>{t(candidate.source === "vision" ? "aiObservation" : "manualEntry")}</DemoBadge>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-primary"><Info className="size-5" />{t("strength")}: <span dir="ltr">{candidate.dose}</span></p>
          <p className="mt-1 font-display text-4xl font-extrabold text-primary" dir="ltr">{candidate.name}</p>
          <p className="mt-1 text-muted-foreground" dir="ltr">{candidate.ingredient}</p>
        </div>
        <p className="rounded-2xl bg-warning-soft p-4 text-sm">{t("confirmHint")}{candidate.uncertainty && <span className="mt-2 block" dir="auto">{candidate.uncertainty}</span>}</p>
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <label className="block font-bold">{t("name")}<input dir="ltr" className={field} value={candidate.name} onChange={(e) => { setReviewed(false); setCandidate({ ...candidate, name: e.target.value }); }} /></label>
          <label className="block font-bold">{t("genericName")}<input dir="auto" className={field} value={candidate.genericName ?? ""} onChange={(e) => { setReviewed(false); setCandidate({ ...candidate, genericName: e.target.value }); }} /></label>
          <label className="block font-bold">{t("ingredient")}<input dir="ltr" className={field} value={candidate.ingredient} onChange={(e) => { setReviewed(false); setCandidate({ ...candidate, ingredient: e.target.value }); }} /></label>
          <label className="block font-bold">{t("strength")}<input dir="ltr" className={field} value={candidate.dose} onChange={(e) => { setReviewed(false); setCandidate({ ...candidate, dose: e.target.value }); }} /></label>
          <label className="block font-bold">{t("dosageForm")}<input dir="auto" className={field} value={candidate.dosageForm ?? ""} onChange={(e) => { setReviewed(false); setCandidate({ ...candidate, dosageForm: e.target.value }); }} /></label>
        </div>
        <label className="flex min-h-14 items-center gap-3"><input type="checkbox" className="size-6 accent-primary" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />{t("reviewConfirmed")}</label>
        <DemoBadge>{t("demoData")}</DemoBadge>
        <Btn className="w-full" disabled={!reviewed || !candidate.name.trim()} onClick={() => go("safety")}>{t("confirmMedication")}</Btn>
      </div>
    </div>
  );
}
